-- Migration: Access Logging and Multiple Passwords System
-- This adds visitor tracking, access logs, and multiple password support

-- ============================================
-- 1. CREATE ACCESS LOGS TABLE
-- ============================================
-- Tracks every time someone views the festival dashboard
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  access_method TEXT NOT NULL, -- 'password_modal' or 'direct_link'
  password_used TEXT, -- which password was used (for multiple passwords feature)
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  session_id TEXT -- to track unique sessions
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_access_logs_festival ON access_logs(festival_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_visitor ON access_logs(festival_id, visitor_name);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON access_logs(accessed_at DESC);

-- ============================================
-- 2. CREATE FESTIVAL PASSWORDS TABLE
-- ============================================
-- Supports multiple passwords per festival
CREATE TABLE IF NOT EXISTS festival_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  password TEXT NOT NULL,
  password_label TEXT, -- e.g., "Main Password", "Guest Password", "VIP Password"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT, -- admin who created it
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_festival_passwords_festival ON festival_passwords(festival_id);
CREATE INDEX IF NOT EXISTS idx_festival_passwords_active ON festival_passwords(festival_id, is_active);

-- Unique constraint: same password can't exist twice for same festival
CREATE UNIQUE INDEX IF NOT EXISTS idx_festival_passwords_unique 
ON festival_passwords(festival_id, password) WHERE is_active = TRUE;

-- ============================================
-- 3. MIGRATE EXISTING PASSWORDS
-- ============================================
-- Move existing user_password from festivals table to festival_passwords table
INSERT INTO festival_passwords (festival_id, password, password_label, is_active, created_at)
SELECT 
  id as festival_id,
  user_password as password,
  'Main Password' as password_label,
  TRUE as is_active,
  created_at
FROM festivals
WHERE user_password IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. ADD COLUMNS TO FESTIVALS TABLE
-- ============================================
-- Add tracking for total visitors
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS total_visitors INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_visitor_name TEXT,
ADD COLUMN IF NOT EXISTS last_visitor_at TIMESTAMPTZ;

-- ============================================
-- 5. CREATE VIEW FOR VISITOR STATS
-- ============================================
-- Convenient view to see visitor statistics per festival
CREATE OR REPLACE VIEW festival_visitor_stats AS
SELECT 
  f.id as festival_id,
  f.code as festival_code,
  f.event_name,
  COUNT(DISTINCT al.visitor_name) as unique_visitors,
  COUNT(al.id) as total_visits,
  MAX(al.accessed_at) as last_visit,
  f.total_visitors,
  f.last_visitor_name,
  f.last_visitor_at
FROM festivals f
LEFT JOIN access_logs al ON f.id = al.festival_id
GROUP BY f.id, f.code, f.event_name, f.total_visitors, f.last_visitor_name, f.last_visitor_at;

-- ============================================
-- 6. CREATE FUNCTION TO LOG ACCESS
-- ============================================
-- Function to log visitor access and update festival stats
CREATE OR REPLACE FUNCTION log_festival_access(
  p_festival_id UUID,
  p_visitor_name TEXT,
  p_access_method TEXT,
  p_password_used TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Insert access log
  INSERT INTO access_logs (
    festival_id,
    visitor_name,
    access_method,
    password_used,
    accessed_at,
    user_agent,
    ip_address,
    session_id
  ) VALUES (
    p_festival_id,
    p_visitor_name,
    p_access_method,
    p_password_used,
    NOW(),
    p_user_agent,
    p_ip_address,
    p_session_id
  ) RETURNING id INTO v_log_id;
  
  -- Update festival visitor stats
  UPDATE festivals
  SET 
    total_visitors = total_visitors + 1,
    last_visitor_name = p_visitor_name,
    last_visitor_at = NOW()
  WHERE id = p_festival_id;
  
  -- Update password usage stats if password was used
  IF p_password_used IS NOT NULL THEN
    UPDATE festival_passwords
    SET 
      usage_count = usage_count + 1,
      last_used_at = NOW()
    WHERE festival_id = p_festival_id 
      AND password = p_password_used
      AND is_active = TRUE;
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. CREATE FUNCTION TO VERIFY PASSWORD
-- ============================================
-- Function to check if password is valid for a festival
CREATE OR REPLACE FUNCTION verify_festival_password(
  p_festival_id UUID,
  p_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if password exists and is active
  SELECT EXISTS(
    SELECT 1 
    FROM festival_passwords 
    WHERE festival_id = p_festival_id 
      AND password = p_password 
      AND is_active = TRUE
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. CREATE FUNCTION TO GET ACTIVE PASSWORDS
-- ============================================
-- Function to get all active passwords for a festival (admin use)
CREATE OR REPLACE FUNCTION get_festival_passwords(
  p_festival_id UUID
) RETURNS TABLE (
  id UUID,
  password TEXT,
  password_label TEXT,
  created_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.password,
    fp.password_label,
    fp.created_at,
    fp.last_used_at,
    fp.usage_count
  FROM festival_passwords fp
  WHERE fp.festival_id = p_festival_id
    AND fp.is_active = TRUE
  ORDER BY fp.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. RLS POLICIES
-- ============================================
-- Enable RLS on new tables
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_passwords ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "access_logs_public_select" ON access_logs;
DROP POLICY IF EXISTS "access_logs_public_insert" ON access_logs;
DROP POLICY IF EXISTS "festival_passwords_public_select" ON festival_passwords;
DROP POLICY IF EXISTS "festival_passwords_public_insert" ON festival_passwords;
DROP POLICY IF EXISTS "festival_passwords_public_update" ON festival_passwords;
DROP POLICY IF EXISTS "festival_passwords_public_delete" ON festival_passwords;

-- Access logs policies (public read for now, adjust as needed)
CREATE POLICY "access_logs_public_select" 
ON access_logs FOR SELECT USING (true);

CREATE POLICY "access_logs_public_insert" 
ON access_logs FOR INSERT WITH CHECK (true);

-- Festival passwords policies (public read for verification)
CREATE POLICY "festival_passwords_public_select" 
ON festival_passwords FOR SELECT USING (true);

CREATE POLICY "festival_passwords_public_insert" 
ON festival_passwords FOR INSERT WITH CHECK (true);

CREATE POLICY "festival_passwords_public_update" 
ON festival_passwords FOR UPDATE USING (true);

CREATE POLICY "festival_passwords_public_delete" 
ON festival_passwords FOR DELETE USING (true);

-- ============================================
-- 10. SAMPLE DATA (OPTIONAL)
-- ============================================
-- Uncomment to add sample passwords for testing
-- INSERT INTO festival_passwords (festival_id, password, password_label, is_active)
-- SELECT id, 'guest123', 'Guest Password', TRUE FROM festivals LIMIT 1;

-- ============================================
-- 11. HELPER VIEWS
-- ============================================

-- View: Recent visitors per festival
CREATE OR REPLACE VIEW recent_festival_visitors AS
SELECT 
  f.code as festival_code,
  f.event_name,
  al.visitor_name,
  al.access_method,
  al.accessed_at,
  al.password_used
FROM access_logs al
JOIN festivals f ON al.festival_id = f.id
ORDER BY al.accessed_at DESC
LIMIT 100;

-- View: Password usage statistics
CREATE OR REPLACE VIEW password_usage_stats AS
SELECT 
  f.code as festival_code,
  f.event_name,
  fp.password_label,
  fp.password,
  fp.usage_count,
  fp.last_used_at,
  fp.created_at
FROM festival_passwords fp
JOIN festivals f ON fp.festival_id = f.id
WHERE fp.is_active = TRUE
ORDER BY fp.usage_count DESC;

-- ============================================
-- 12. CLEANUP (OPTIONAL)
-- ============================================
-- After migration is complete and tested, you can optionally remove
-- the old user_password column from festivals table:
-- ALTER TABLE festivals DROP COLUMN IF EXISTS user_password;
-- ALTER TABLE festivals DROP COLUMN IF EXISTS user_password_updated_at;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration worked:

-- Check if tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('access_logs', 'festival_passwords');

-- Check if functions were created
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('log_festival_access', 'verify_festival_password', 'get_festival_passwords');

-- Check if views were created
-- SELECT table_name FROM information_schema.views 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('festival_visitor_stats', 'recent_festival_visitors', 'password_usage_stats');

-- Test password verification
-- SELECT verify_festival_password(
--   (SELECT id FROM festivals LIMIT 1),
--   'Festive@123'
-- );

-- ============================================
-- NOTES
-- ============================================
-- 1. This migration is backward compatible - existing festivals will continue to work
-- 2. Old user_password is migrated to festival_passwords table as "Main Password"
-- 3. Access logging happens automatically when log_festival_access() is called
-- 4. Multiple passwords can be added per festival
-- 5. Each password can have a label (e.g., "VIP", "Guest", "Staff")
-- 6. Password usage is tracked (count and last used time)
-- 7. Visitor stats are updated in real-time
-- 8. All new tables have RLS enabled with public policies (adjust for production)

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Log a visitor access
-- SELECT log_festival_access(
--   (SELECT id FROM festivals WHERE code = 'ABCD1234'),
--   'John Doe',
--   'password_modal',
--   'Festive@123',
--   'Mozilla/5.0...',
--   '192.168.1.1',
--   'session-uuid-here'
-- );

-- Example 2: Verify a password
-- SELECT verify_festival_password(
--   (SELECT id FROM festivals WHERE code = 'ABCD1234'),
--   'guest123'
-- );

-- Example 3: Get all passwords for a festival
-- SELECT * FROM get_festival_passwords(
--   (SELECT id FROM festivals WHERE code = 'ABCD1234')
-- );

-- Example 4: Add a new password
-- INSERT INTO festival_passwords (festival_id, password, password_label)
-- VALUES (
--   (SELECT id FROM festivals WHERE code = 'ABCD1234'),
--   'vip2024',
--   'VIP Access'
-- );

-- Example 5: Deactivate a password
-- UPDATE festival_passwords 
-- SET is_active = FALSE 
-- WHERE festival_id = (SELECT id FROM festivals WHERE code = 'ABCD1234')
--   AND password = 'oldpassword';

-- Example 6: View visitor stats
-- SELECT * FROM festival_visitor_stats 
-- WHERE festival_code = 'ABCD1234';

-- Example 7: View recent visitors
-- SELECT * FROM recent_festival_visitors 
-- WHERE festival_code = 'ABCD1234'
-- LIMIT 20;

-- Example 8: View password usage
-- SELECT * FROM password_usage_stats 
-- WHERE festival_code = 'ABCD1234';

-- ============================================
-- END OF MIGRATION
-- ============================================

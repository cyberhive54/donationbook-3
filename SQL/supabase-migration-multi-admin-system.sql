-- ============================================
-- DONATION BOOK - MULTI-ADMIN SYSTEM MIGRATION
-- ============================================
-- This migration transforms the single-admin system into a multi-admin system
-- Run this AFTER all previous migrations
-- Date: January 7, 2026
-- ============================================

-- ============================================
-- STEP 1: CREATE NEW TABLES
-- ============================================

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
  admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  admin_code TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  admin_password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_user_passwords INTEGER DEFAULT 3,
  created_by TEXT, -- Super admin who created this admin (nullable for migration)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(festival_id, admin_code),
  UNIQUE(festival_id, admin_name)
);

-- User Passwords Table (replaces single user_password in festivals)
CREATE TABLE IF NOT EXISTS user_passwords (
  password_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  password TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id, label)
);

-- Add usage tracking columns if they don't exist (for compatibility with existing tables)
ALTER TABLE user_passwords
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
  admin_name TEXT,
  action_type TEXT NOT NULL,
  action_details JSONB,
  target_type TEXT,
  target_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: ADD COLUMNS TO EXISTING TABLES
-- ============================================

-- Add tracking columns to collections
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Add tracking columns to expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Add tracking columns to albums
ALTER TABLE albums
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL;

-- Add banner visibility settings to festivals
ALTER TABLE festivals
ADD COLUMN IF NOT EXISTS multi_admin_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS banner_show_organiser BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS banner_show_guide BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS banner_show_mentor BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS banner_show_location BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS banner_show_dates BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS banner_show_duration BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS admin_display_preference TEXT DEFAULT 'code';

-- Add admin tracking to access_logs
ALTER TABLE access_logs
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS user_password_id UUID REFERENCES user_passwords(password_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS auth_method TEXT;

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admins_festival_id ON admins(festival_id);
CREATE INDEX IF NOT EXISTS idx_admins_admin_code ON admins(admin_code);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

CREATE INDEX IF NOT EXISTS idx_user_passwords_admin_id ON user_passwords(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_passwords_festival_id ON user_passwords(festival_id);
CREATE INDEX IF NOT EXISTS idx_user_passwords_is_active ON user_passwords(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_festival_id ON admin_activity_log(festival_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_timestamp ON admin_activity_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON admin_activity_log(action_type);

CREATE INDEX IF NOT EXISTS idx_collections_created_by ON collections(created_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_admin_id ON access_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_password_id ON access_logs(user_password_id);

-- ============================================
-- STEP 4: CREATE RPC FUNCTIONS
-- ============================================

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_festival_id UUID,
  p_admin_id UUID,
  p_action_type TEXT,
  p_action_details JSONB DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_name TEXT;
BEGIN
  -- Get admin name if admin_id is provided
  IF p_admin_id IS NOT NULL THEN
    SELECT admin_name INTO v_admin_name
    FROM admins
    WHERE admin_id = p_admin_id;
  END IF;

  -- Insert activity log
  INSERT INTO admin_activity_log (
    festival_id,
    admin_id,
    admin_name,
    action_type,
    action_details,
    target_type,
    target_id
  ) VALUES (
    p_festival_id,
    p_admin_id,
    v_admin_name,
    p_action_type,
    p_action_details,
    p_target_type,
    p_target_id
  ) RETURNING log_id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify admin credentials
CREATE OR REPLACE FUNCTION verify_admin_credentials(
  p_festival_id UUID,
  p_admin_code TEXT,
  p_password TEXT
) RETURNS TABLE (
  admin_id UUID,
  admin_code TEXT,
  admin_name TEXT,
  is_active BOOLEAN,
  max_user_passwords INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.admin_id,
    a.admin_code,
    a.admin_name,
    a.is_active,
    a.max_user_passwords
  FROM admins a
  WHERE a.festival_id = p_festival_id
    AND (a.admin_code = p_admin_code OR LOWER(a.admin_name) = LOWER(p_admin_code))
    AND a.admin_password_hash = p_password
    AND a.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin by code or name
CREATE OR REPLACE FUNCTION get_admin_by_code_or_name(
  p_festival_id UUID,
  p_identifier TEXT
) RETURNS TABLE (
  admin_id UUID,
  admin_code TEXT,
  admin_name TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.admin_id,
    a.admin_code,
    a.admin_name,
    a.is_active
  FROM admins a
  WHERE a.festival_id = p_festival_id
    AND (a.admin_code = p_identifier OR LOWER(a.admin_name) = LOWER(p_identifier));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: DATA MIGRATION
-- ============================================

-- Create default admin for each existing festival
DO $$
DECLARE
  fest RECORD;
  default_admin_id UUID;
BEGIN
  FOR fest IN SELECT * FROM festivals WHERE multi_admin_enabled = FALSE OR multi_admin_enabled IS NULL
  LOOP
    -- Create default admin
    INSERT INTO admins (
      festival_id,
      admin_code,
      admin_name,
      admin_password_hash,
      is_active,
      max_user_passwords,
      created_by
    ) VALUES (
      fest.id,
      'ADMIN1',
      'Primary Admin',
      fest.admin_password, -- Use existing admin password (plain text for now)
      TRUE,
      3,
      NULL
    ) RETURNING admin_id INTO default_admin_id;

    -- Migrate existing user_password to user_passwords table (if exists)
    IF fest.user_password IS NOT NULL AND fest.user_password != '' THEN
      INSERT INTO user_passwords (
        admin_id,
        festival_id,
        password,
        label,
        is_active,
        created_by
      ) VALUES (
        default_admin_id,
        fest.id,
        fest.user_password,
        'Password 1',
        TRUE,
        NULL
      );
    END IF;

    -- Mark festival as migrated
    UPDATE festivals
    SET multi_admin_enabled = TRUE
    WHERE id = fest.id;

    RAISE NOTICE 'Migrated festival: % (Code: %)', fest.event_name, fest.code;
  END LOOP;
END $$;

-- ============================================
-- STEP 6: CREATE VIEWS FOR ANALYTICS
-- ============================================

-- Admin stats view
CREATE OR REPLACE VIEW admin_stats_view AS
SELECT 
  a.admin_id,
  a.festival_id,
  a.admin_code,
  a.admin_name,
  a.is_active,
  a.max_user_passwords,
  a.created_at,
  a.updated_at,
  COUNT(DISTINCT up.password_id) as current_password_count,
  COUNT(DISTINCT c.id) as collections_created,
  COUNT(DISTINCT e.id) as expenses_created,
  COUNT(DISTINCT aal.log_id) as total_actions,
  MAX(aal.timestamp) as last_action_at
FROM admins a
LEFT JOIN user_passwords up ON a.admin_id = up.admin_id
LEFT JOIN collections c ON a.admin_id = c.created_by_admin_id
LEFT JOIN expenses e ON a.admin_id = e.created_by_admin_id
LEFT JOIN admin_activity_log aal ON a.admin_id = aal.admin_id
GROUP BY a.admin_id, a.festival_id, a.admin_code, a.admin_name, a.is_active, a.max_user_passwords, a.created_at, a.updated_at;

-- Admin activity summary view
CREATE OR REPLACE VIEW admin_activity_summary AS
SELECT 
  aal.festival_id,
  aal.admin_id,
  aal.admin_name,
  aal.action_type,
  COUNT(*) as action_count,
  MAX(aal.timestamp) as last_occurrence
FROM admin_activity_log aal
GROUP BY aal.festival_id, aal.admin_id, aal.admin_name, aal.action_type;

-- ============================================
-- STEP 7: UPDATE RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Public read access for admins (needed for client-side queries)
CREATE POLICY "Public read access for admins" ON admins
  FOR SELECT USING (true);

-- Public insert/update/delete for admins (client-side admin management)
CREATE POLICY "Public write access for admins" ON admins
  FOR ALL USING (true);

-- Public read access for user_passwords
CREATE POLICY "Public read access for user_passwords" ON user_passwords
  FOR SELECT USING (true);

-- Public write access for user_passwords
CREATE POLICY "Public write access for user_passwords" ON user_passwords
  FOR ALL USING (true);

-- Public read access for admin_activity_log
CREATE POLICY "Public read access for admin_activity_log" ON admin_activity_log
  FOR SELECT USING (true);

-- Public insert access for admin_activity_log
CREATE POLICY "Public insert access for admin_activity_log" ON admin_activity_log
  FOR INSERT WITH CHECK (true);

-- ============================================
-- STEP 8: ADD CONSTRAINTS
-- ============================================

-- Ensure admin_code is uppercase and 6 characters
ALTER TABLE admins
ADD CONSTRAINT admin_code_format CHECK (admin_code ~ '^[A-Z0-9]{6}$');

-- Ensure max_user_passwords is between 1 and 10
ALTER TABLE admins
ADD CONSTRAINT max_user_passwords_range CHECK (max_user_passwords >= 1 AND max_user_passwords <= 10);

-- Ensure password labels are not empty
ALTER TABLE user_passwords
ADD CONSTRAINT label_not_empty CHECK (label IS NOT NULL AND label != '');

-- Ensure passwords are not empty
ALTER TABLE user_passwords
ADD CONSTRAINT password_not_empty CHECK (password IS NOT NULL AND password != '');

-- ============================================
-- STEP 9: CREATE TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp on admins
CREATE OR REPLACE FUNCTION update_admin_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_timestamp
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_admin_timestamp();

-- Trigger to update updated_at timestamp on user_passwords
CREATE OR REPLACE FUNCTION update_user_password_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_password_timestamp
BEFORE UPDATE ON user_passwords
FOR EACH ROW
EXECUTE FUNCTION update_user_password_timestamp();

-- ============================================
-- STEP 10: GRANT PERMISSIONS
-- ============================================

-- Grant permissions to anon role (for client-side access)
GRANT SELECT, INSERT, UPDATE, DELETE ON admins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_passwords TO anon;
GRANT SELECT, INSERT ON admin_activity_log TO anon;
GRANT SELECT ON admin_stats_view TO anon;
GRANT SELECT ON admin_activity_summary TO anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries after migration to verify:

-- 1. Check if tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('admins', 'user_passwords', 'admin_activity_log');

-- 2. Check if columns were added
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'collections' AND column_name LIKE '%admin%';

-- 3. Check if default admins were created
-- SELECT f.code, f.event_name, a.admin_code, a.admin_name FROM festivals f JOIN admins a ON f.id = a.festival_id;

-- 4. Check if user passwords were migrated
-- SELECT a.admin_code, up.label, up.password FROM admins a JOIN user_passwords up ON a.admin_id = up.admin_id;

-- 5. Check if indexes were created
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('admins', 'user_passwords', 'admin_activity_log');

-- ============================================
-- ROLLBACK (USE WITH CAUTION)
-- ============================================

-- To rollback this migration (WARNING: This will delete all multi-admin data):
/*
DROP TABLE IF EXISTS admin_activity_log CASCADE;
DROP TABLE IF EXISTS user_passwords CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

ALTER TABLE collections DROP COLUMN IF EXISTS created_by_admin_id;
ALTER TABLE collections DROP COLUMN IF EXISTS updated_by_admin_id;
ALTER TABLE collections DROP COLUMN IF EXISTS updated_at;

ALTER TABLE expenses DROP COLUMN IF EXISTS created_by_admin_id;
ALTER TABLE expenses DROP COLUMN IF EXISTS updated_by_admin_id;
ALTER TABLE expenses DROP COLUMN IF EXISTS updated_at;

ALTER TABLE albums DROP COLUMN IF EXISTS created_by_admin_id;
ALTER TABLE albums DROP COLUMN IF EXISTS updated_by_admin_id;

ALTER TABLE festivals DROP COLUMN IF EXISTS multi_admin_enabled;
ALTER TABLE festivals DROP COLUMN IF EXISTS banner_show_organiser;
ALTER TABLE festivals DROP COLUMN IF EXISTS banner_show_guide;
ALTER TABLE festivals DROP COLUMN IF EXISTS banner_show_mentor;
ALTER TABLE festivals DROP COLUMN IF EXISTS banner_show_location;
ALTER TABLE festivals DROP COLUMN IF EXISTS banner_show_dates;
ALTER TABLE festivals DROP COLUMN IF EXISTS banner_show_duration;
ALTER TABLE festivals DROP COLUMN IF EXISTS admin_display_preference;

ALTER TABLE access_logs DROP COLUMN IF EXISTS admin_id;
ALTER TABLE access_logs DROP COLUMN IF EXISTS user_password_id;
ALTER TABLE access_logs DROP COLUMN IF EXISTS auth_method;

DROP VIEW IF EXISTS admin_stats_view;
DROP VIEW IF EXISTS admin_activity_summary;
DROP FUNCTION IF EXISTS log_admin_activity;
DROP FUNCTION IF EXISTS verify_admin_credentials;
DROP FUNCTION IF EXISTS get_admin_by_code_or_name;
DROP FUNCTION IF EXISTS update_admin_timestamp;
DROP FUNCTION IF EXISTS update_user_password_timestamp;
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- After running this migration:
-- 1. Each existing festival will have a "Primary Admin" (code: ADMIN1)
-- 2. Existing admin_password becomes Primary Admin's password
-- 3. Existing user_password becomes Primary Admin's "Password 1"
-- 4. Super admin can now create additional admins
-- 5. Each admin can create up to 3 user passwords (configurable)
-- 6. All actions are tracked in admin_activity_log
-- 7. Banner visibility can be controlled per festival
-- 8. Collections and expenses track which admin created them

-- Next steps:
-- 1. Test super admin login
-- 2. Create a new admin
-- 3. Test admin login
-- 4. Create user passwords
-- 5. Test visitor login with user password
-- 6. Verify activity logging
-- 7. Test banner visibility controls

-- ============================================

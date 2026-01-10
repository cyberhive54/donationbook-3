-- Migration: Add Download Control and Visitor Logout Tracking
-- Date: 2026-01-10
-- Purpose: Add download control for media and track visitor logout activity

-- ===============================================
-- PART 1: Add Download Control Fields
-- ===============================================

-- Add download control fields to festivals table
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS allow_media_download BOOLEAN DEFAULT TRUE;

-- Add download control fields to albums table  
ALTER TABLE albums
ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT TRUE;

-- Add external link support to media_items table
ALTER TABLE media_items
ADD COLUMN IF NOT EXISTS is_external_link BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Update existing media items to set is_external_link based on url pattern
UPDATE media_items 
SET is_external_link = TRUE 
WHERE url LIKE 'http%' AND url NOT LIKE '%supabase%';

COMMENT ON COLUMN festivals.allow_media_download IS 'Per-festival control: If FALSE, visitors cannot download any media from showcase';
COMMENT ON COLUMN albums.allow_download IS 'Per-album control: If FALSE, visitors cannot download media from this album (overridden by festival setting)';
COMMENT ON COLUMN media_items.is_external_link IS 'TRUE if media is hosted externally (Google Drive, etc.)';
COMMENT ON COLUMN media_items.external_link IS 'Original external link for media (for display purposes)';

-- ===============================================
-- PART 2: Add Visitor Logout Tracking
-- ===============================================

-- Add logout tracking fields to access_logs table
ALTER TABLE access_logs
ADD COLUMN IF NOT EXISTS logout_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS session_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS logout_method TEXT;

COMMENT ON COLUMN access_logs.logout_at IS 'Timestamp when visitor logged out';
COMMENT ON COLUMN access_logs.session_duration_seconds IS 'Total session duration in seconds';
COMMENT ON COLUMN access_logs.logout_method IS 'How user logged out: manual, session_expired, force_logout';

-- Create index for logout queries
CREATE INDEX IF NOT EXISTS idx_access_logs_logout ON access_logs(logout_at) WHERE logout_at IS NOT NULL;

-- ===============================================
-- PART 3: Create RPC Function for Logout Tracking
-- ===============================================

-- Function to log visitor logout
CREATE OR REPLACE FUNCTION log_visitor_logout(
  p_festival_id UUID,
  p_visitor_name TEXT,
  p_session_id TEXT,
  p_logout_method TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_login_time TIMESTAMPTZ;
  v_logout_time TIMESTAMPTZ := NOW();
  v_duration_seconds INTEGER;
BEGIN
  -- Find the most recent login for this visitor and session
  SELECT id, accessed_at INTO v_log_id, v_login_time
  FROM access_logs
  WHERE festival_id = p_festival_id
    AND visitor_name = LOWER(TRIM(p_visitor_name))
    AND session_id = p_session_id
    AND logout_at IS NULL
  ORDER BY accessed_at DESC
  LIMIT 1;

  -- If no matching login found, return NULL
  IF v_log_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate session duration
  v_duration_seconds := EXTRACT(EPOCH FROM (v_logout_time - v_login_time))::INTEGER;

  -- Update the access log with logout info
  UPDATE access_logs
  SET 
    logout_at = v_logout_time,
    session_duration_seconds = v_duration_seconds,
    logout_method = p_logout_method
  WHERE id = v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_visitor_logout(UUID, TEXT, TEXT, TEXT) TO authenticated, anon;

-- ===============================================
-- PART 4: Create View for Active Sessions
-- ===============================================

-- View to show currently active visitor sessions (not logged out)
CREATE OR REPLACE VIEW active_visitor_sessions AS
SELECT 
  al.id,
  al.festival_id,
  f.code AS festival_code,
  f.event_name,
  al.visitor_name,
  al.session_id,
  al.accessed_at AS login_time,
  al.password_used,
  al.admin_id,
  a.admin_code,
  a.admin_name,
  EXTRACT(EPOCH FROM (NOW() - al.accessed_at))::INTEGER AS session_age_seconds,
  ROUND(EXTRACT(EPOCH FROM (NOW() - al.accessed_at))::NUMERIC / 60, 1) AS session_age_minutes
FROM access_logs al
JOIN festivals f ON al.festival_id = f.id
LEFT JOIN admins a ON al.admin_id = a.admin_id
WHERE al.logout_at IS NULL
ORDER BY al.accessed_at DESC;

COMMENT ON VIEW active_visitor_sessions IS 'Shows all currently active visitor sessions (not logged out yet)';

-- ===============================================
-- PART 5: Create View for Session Statistics
-- ===============================================

-- View to show session statistics per festival
CREATE OR REPLACE VIEW festival_session_stats AS
SELECT 
  f.id AS festival_id,
  f.code AS festival_code,
  f.event_name,
  COUNT(DISTINCT al.visitor_name) AS total_unique_visitors,
  COUNT(al.id) AS total_login_count,
  COUNT(al.logout_at) AS total_logout_count,
  COUNT(CASE WHEN al.logout_at IS NULL THEN 1 END) AS currently_active_sessions,
  AVG(al.session_duration_seconds)::INTEGER AS avg_session_duration_seconds,
  MAX(al.accessed_at) AS last_login_time,
  MAX(al.logout_at) AS last_logout_time
FROM festivals f
LEFT JOIN access_logs al ON f.id = al.festival_id
GROUP BY f.id, f.code, f.event_name;

COMMENT ON VIEW festival_session_stats IS 'Session statistics for each festival';

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Verify columns were added
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'festivals' AND column_name = 'allow_media_download';

-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'albums' AND column_name = 'allow_download';

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'media_items' AND column_name IN ('is_external_link', 'external_link');

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'access_logs' AND column_name IN ('logout_at', 'session_duration_seconds', 'logout_method');

-- Test logout tracking function
-- SELECT log_visitor_logout(
--   'your-festival-id'::UUID,
--   'test-visitor',
--   'session-id-here',
--   'manual'
-- );

-- View active sessions
-- SELECT * FROM active_visitor_sessions LIMIT 10;

-- View festival session stats
-- SELECT * FROM festival_session_stats;

-- Fix: Visitor Activity Logging Issues
-- Date: 2026-01-11
-- Issue: Visitor login/logout not properly logged due to case-sensitivity mismatch

-- ===============================================
-- ISSUE: log_visitor_logout function uses LOWER() to match visitor_name,
-- but visitor_name is stored with original case from login.
-- This causes logout to fail to find the matching login record.
-- ===============================================

-- FIX: Remove LOWER() from visitor_name comparison
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
  -- FIXED: Removed LOWER() to match exact case of stored visitor_name
  SELECT id, accessed_at INTO v_log_id, v_login_time
  FROM access_logs
  WHERE festival_id = p_festival_id
    AND visitor_name = TRIM(p_visitor_name)  -- Changed from: LOWER(TRIM(p_visitor_name))
    AND session_id = p_session_id
    AND logout_at IS NULL
  ORDER BY accessed_at DESC
  LIMIT 1;

  -- If no matching login found, return NULL
  IF v_log_id IS NULL THEN
    -- Log warning for debugging
    RAISE NOTICE 'No matching login found for visitor: %, session: %', p_visitor_name, p_session_id;
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

-- Ensure permissions are correct
GRANT EXECUTE ON FUNCTION log_visitor_logout(UUID, TEXT, TEXT, TEXT) TO authenticated, anon;

-- ===============================================
-- PART 2: Update log_festival_access to also support admin_id and user_password_id
-- These fields should be set when visitor logs in
-- ===============================================

CREATE OR REPLACE FUNCTION log_festival_access(
  p_festival_id UUID,
  p_visitor_name TEXT,
  p_access_method TEXT,
  p_password_used TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_admin_id TEXT DEFAULT NULL,
  p_user_password_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Insert access log with all fields
  INSERT INTO access_logs (
    festival_id,
    visitor_name,
    access_method,
    password_used,
    accessed_at,
    user_agent,
    ip_address,
    session_id,
    admin_id,
    user_password_id
  ) VALUES (
    p_festival_id,
    TRIM(p_visitor_name),  -- Ensure consistent trimming
    p_access_method,
    p_password_used,
    NOW(),
    p_user_agent,
    p_ip_address,
    p_session_id,
    p_admin_id,
    p_user_password_id
  ) RETURNING id INTO v_log_id;
  
  -- Update festival visitor stats
  UPDATE festivals
  SET 
    total_visitors = total_visitors + 1,
    last_visitor_name = TRIM(p_visitor_name),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_festival_access(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;

-- ===============================================
-- PART 3: Diagnostic Queries
-- ===============================================

-- Check if visitor logout is working
-- Run this AFTER a visitor logs out
COMMENT ON FUNCTION log_visitor_logout IS 'Logs visitor logout with exact case matching';

-- To verify: Check access_logs for a specific visitor
-- SELECT visitor_name, accessed_at, logout_at, session_duration_seconds
-- FROM access_logs
-- WHERE festival_id = 'YOUR_FESTIVAL_ID'
-- AND visitor_name = 'Exact Name As Stored'
-- ORDER BY accessed_at DESC
-- LIMIT 10;

-- To check for orphaned sessions (logged in but not logged out)
-- SELECT visitor_name, accessed_at, session_id
-- FROM access_logs
-- WHERE festival_id = 'YOUR_FESTIVAL_ID'
-- AND logout_at IS NULL
-- ORDER BY accessed_at DESC;

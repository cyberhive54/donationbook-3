-- ============================================
-- IMMEDIATE FIX: Update log_festival_access Function
-- ============================================
-- Run this entire file in Supabase SQL Editor NOW
-- This will make visitor login logging work immediately
-- ============================================

-- Update log_festival_access to accept admin_id and user_password_id
CREATE OR REPLACE FUNCTION log_festival_access(
  p_festival_id UUID,
  p_visitor_name TEXT,
  p_access_method TEXT,
  p_password_used TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL,
  p_user_password_id UUID DEFAULT NULL
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
    TRIM(p_visitor_name),
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
  
  -- Update password usage stats if password was used (legacy festival_passwords table)
  IF p_password_used IS NOT NULL THEN
    UPDATE festival_passwords
    SET 
      usage_count = usage_count + 1,
      last_used_at = NOW()
    WHERE festival_id = p_festival_id 
      AND password = p_password_used
      AND is_active = TRUE;
  END IF;
  
  -- Update user_passwords usage stats if user_password_id is provided
  IF p_user_password_id IS NOT NULL THEN
    UPDATE user_passwords
    SET 
      usage_count = COALESCE(usage_count, 0) + 1,
      last_used_at = NOW()
    WHERE password_id = p_user_password_id;
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION log_festival_access(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated, anon;

-- ============================================
-- Update log_visitor_logout function (fix case-sensitivity bug)
-- ============================================

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
  -- Use TRIM only (not LOWER) to match exact case
  SELECT id, accessed_at INTO v_log_id, v_login_time
  FROM access_logs
  WHERE festival_id = p_festival_id
    AND visitor_name = TRIM(p_visitor_name)
    AND session_id = p_session_id
    AND logout_at IS NULL
  ORDER BY accessed_at DESC
  LIMIT 1;

  -- If no matching login found, return NULL
  IF v_log_id IS NULL THEN
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION log_visitor_logout(UUID, TEXT, TEXT, TEXT) TO authenticated, anon;

-- ============================================
-- VERIFICATION
-- ============================================

-- After running this, check:
SELECT routine_name, specific_name
FROM information_schema.routines
WHERE routine_name IN ('log_festival_access', 'log_visitor_logout');

-- Should show both functions exist

-- ============================================
-- TEST IT
-- ============================================

-- Now try logging in as a visitor in the app
-- Check browser console for:
-- [PasswordGate] log_festival_access result: { data: <UUID>, error: null }

-- Then check if data was saved:
-- SELECT * FROM access_logs ORDER BY accessed_at DESC LIMIT 5;

-- You should see your login record!

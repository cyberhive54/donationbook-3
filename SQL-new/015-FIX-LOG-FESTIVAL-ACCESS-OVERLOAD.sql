-- Fix: Remove duplicate log_festival_access function with TEXT parameters
-- Date: 2026-01-12
-- Issue: Function overload conflict causing PGRST203 error

-- ===============================================
-- ISSUE: Two versions of log_festival_access exist:
-- 1. With p_admin_id TEXT and p_user_password_id TEXT (old version)
-- 2. With p_admin_id UUID and p_user_password_id UUID (correct version)
-- 
-- This causes Supabase to be unable to choose which function to call
-- ===============================================

-- STEP 1: Check existing functions
-- Run this first to see what we have:
/*
SELECT 
  routine_name,
  routine_schema,
  data_type,
  pg_get_function_arguments(p.oid) as arguments
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_name = 'log_festival_access'
  AND routine_schema = 'public';
*/

-- STEP 2: Drop the old TEXT version (keep the UUID version)
-- Drop function with TEXT parameters (9 parameters with TEXT for admin_id and user_password_id)
DROP FUNCTION IF EXISTS public.log_festival_access(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
);

-- STEP 3: Ensure the correct UUID version exists
-- If this function doesn't exist, create it
CREATE OR REPLACE FUNCTION public.log_festival_access(
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
    total_visitors = COALESCE(total_visitors, 0) + 1,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.log_festival_access(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated, anon;

-- STEP 4: Verify only one version exists now
-- Run this to confirm:
/*
SELECT 
  routine_name,
  pg_get_function_arguments(p.oid) as arguments
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_name = 'log_festival_access'
  AND routine_schema = 'public';
*/

-- Expected result: Only ONE function with UUID parameters for admin_id and user_password_id

-- Fix log_admin_activity function to handle NULL admin_id (for super admin)
-- This allows logging activities when admin_id is NULL
-- Note: PostgreSQL allows NULL for UUID parameters, we just need to handle it in the function body
-- First, DROP all existing versions to avoid function overloading conflicts

-- Drop all existing versions of the function (handles both TEXT and VARCHAR)
-- PostgreSQL stores TEXT and VARCHAR differently, so we need to drop both
DROP FUNCTION IF EXISTS public.log_admin_activity(UUID, UUID, TEXT, JSONB, TEXT, UUID);
DROP FUNCTION IF EXISTS public.log_admin_activity(UUID, UUID, VARCHAR, JSONB, VARCHAR, UUID);
DROP FUNCTION IF EXISTS public.log_admin_activity(UUID, UUID, CHARACTER VARYING, JSONB, CHARACTER VARYING, UUID);
DROP FUNCTION IF EXISTS public.log_admin_activity(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.log_admin_activity(UUID, UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.log_admin_activity(UUID, UUID, CHARACTER VARYING);

-- Now create the single, correct version
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_festival_id UUID,
  p_admin_id UUID,  -- Can be NULL for super admin activities
  p_action_type TEXT,
  p_action_details JSONB DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_name TEXT;
BEGIN
  -- Get admin name only if admin_id is provided and not NULL
  IF p_admin_id IS NOT NULL THEN
    SELECT admin_name INTO v_admin_name
    FROM admins
    WHERE admin_id = p_admin_id;
  END IF;
  
  -- v_admin_name will be NULL if admin_id is NULL, which is correct for super admin

  -- Insert log (admin_id can be NULL for super admin activities)
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

-- Grant execute permission (match the function signature)
GRANT EXECUTE ON FUNCTION log_admin_activity(UUID, UUID, TEXT, JSONB, TEXT, UUID) TO authenticated, anon;

-- Note: This function now properly handles NULL admin_id for super admin activities
-- When p_admin_id is NULL, v_admin_name will be NULL, which is correct

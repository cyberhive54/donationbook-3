-- RPC Functions for Multi-Admin System
-- Run this after the main multi-admin schema

-- Function to verify admin credentials
CREATE OR REPLACE FUNCTION verify_admin_credentials(
  p_festival_code TEXT,
  p_admin_code_or_name TEXT,
  p_password TEXT
)
RETURNS JSON AS $
DECLARE
  v_admin RECORD;
  v_festival_id UUID;
  v_password_hash TEXT;
BEGIN
  -- Get festival ID
  SELECT id INTO v_festival_id
  FROM festivals
  WHERE code = p_festival_code;

  IF v_festival_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Festival not found');
  END IF;

  -- Find admin by code or name and get password hash
  SELECT a.admin_id, a.admin_code, a.admin_name, a.festival_id, a.admin_password_hash
  INTO v_admin
  FROM admins a
  WHERE a.festival_id = v_festival_id
    AND a.is_active = TRUE
    AND (a.admin_code = p_admin_code_or_name OR a.admin_name = p_admin_code_or_name);

  IF v_admin.admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Verify password using crypt
  IF crypt(p_password, v_admin.admin_password_hash) = v_admin.admin_password_hash THEN
    RETURN json_build_object(
      'success', true,
      'admin_id', v_admin.admin_id,
      'admin_code', v_admin.admin_code,
      'admin_name', v_admin.admin_name,
      'festival_id', v_admin.festival_id
    );
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid password');
  END IF;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_admin_credentials(TEXT, TEXT, TEXT) TO authenticated, anon;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_festival_id UUID,
  p_admin_id UUID,
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
  -- Get admin name
  SELECT admin_name INTO v_admin_name
  FROM admins
  WHERE admin_id = p_admin_id;

  -- Insert log
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

GRANT EXECUTE ON FUNCTION log_admin_activity(UUID, UUID, TEXT, JSONB, TEXT, UUID) TO authenticated, anon;

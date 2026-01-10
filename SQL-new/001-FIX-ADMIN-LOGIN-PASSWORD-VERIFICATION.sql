-- Migration: Fix Admin Login Password Verification Bug
-- Date: 2026-01-09
-- Issue: verify_admin_credentials function was using bcrypt incorrectly on plain text passwords
-- Solution: Changed to direct plain text password comparison

-- Drop the broken function first
DROP FUNCTION IF EXISTS verify_admin_credentials(TEXT, TEXT, TEXT);

-- Recreate with correct plain text password comparison
CREATE OR REPLACE FUNCTION verify_admin_credentials(
  p_festival_code TEXT,
  p_admin_code_or_name TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_admin RECORD;
  v_festival_id UUID;
BEGIN
  -- Get festival ID
  SELECT id INTO v_festival_id
  FROM festivals
  WHERE code = p_festival_code;

  IF v_festival_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Festival not found');
  END IF;

  -- Find admin by code or name and get password
  SELECT a.admin_id, a.admin_code, a.admin_name, a.festival_id, a.admin_password_hash
  INTO v_admin
  FROM admins a
  WHERE a.festival_id = v_festival_id
    AND a.is_active = TRUE
    AND (a.admin_code = p_admin_code_or_name OR a.admin_name = p_admin_code_or_name);

  IF v_admin.admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Fixed password verification: Direct plain text comparison instead of bcrypt
  -- Passwords are stored as plain text in admin_password_hash field, so direct comparison is correct
  IF v_admin.admin_password_hash = p_password THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_admin_credentials(TEXT, TEXT, TEXT) TO authenticated, anon;

-- Verification query to confirm fix
-- SELECT verify_admin_credentials('YOUR_FESTIVAL_CODE', 'admin_name_or_code', 'password');

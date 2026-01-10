CREATE OR REPLACE FUNCTION verify_admin_credentials(
  p_festival_code TEXT,
  p_admin_code_or_name TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_admin RECORD;
  v_festival_id UUID;
  v_password_hash TEXT;
  v_crypt_result TEXT;
BEGIN
  -- Get festival ID
  SELECT id INTO v_festival_id
  FROM festivals
  WHERE code = p_festival_code;

  IF v_festival_id IS NULL THEN
    RAISE NOTICE '[verify_admin] Festival not found: %', p_festival_code;
    RETURN json_build_object('success', false, 'error', 'Festival not found');
  END IF;

  RAISE NOTICE '[verify_admin] Festival found: %', v_festival_id;

  -- Find admin by code or name and get password hash
  SELECT a.admin_id, a.admin_code, a.admin_name, a.festival_id, a.admin_password_hash
  INTO v_admin
  FROM admins a
  WHERE a.festival_id = v_festival_id
    AND a.is_active = TRUE
    AND (a.admin_code = p_admin_code_or_name OR a.admin_name = p_admin_code_or_name);

  IF v_admin.admin_id IS NULL THEN
    RAISE NOTICE '[verify_admin] Admin not found: %', p_admin_code_or_name;
    RETURN json_build_object('success', false, 'error', 'Admin not found');
  END IF;

  RAISE NOTICE '[verify_admin] Admin found: % (%), hash: %', v_admin.admin_code, v_admin.admin_name, v_admin.admin_password_hash;
  RAISE NOTICE '[verify_admin] Input password length: %', length(p_password);

  -- Verify password using crypt
  v_crypt_result := crypt(p_password, v_admin.admin_password_hash);
  RAISE NOTICE '[verify_admin] Crypt result: %', v_crypt_result;
  RAISE NOTICE '[verify_admin] Hash match: %', (v_crypt_result = v_admin.admin_password_hash);

  IF v_crypt_result = v_admin.admin_password_hash THEN
    RAISE NOTICE '[verify_admin] Password verified successfully';
    RETURN json_build_object(
      'success', true,
      'admin_id', v_admin.admin_id,
      'admin_code', v_admin.admin_code,
      'admin_name', v_admin.admin_name,
      'festival_id', v_admin.festival_id
    );
  ELSE
    RAISE NOTICE '[verify_admin] Password verification failed';
    RETURN json_build_object('success', false, 'error', 'Invalid password');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_admin_credentials(TEXT, TEXT, TEXT) TO authenticated, anon;

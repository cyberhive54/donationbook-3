-- Test the password verification directly
DO $$
DECLARE
  v_admin RECORD;
  v_festival_id UUID;
  v_password_hash TEXT;
  v_test_password TEXT := '123456';
  v_crypt_result TEXT;
BEGIN
  -- Get festival ID
  SELECT id INTO v_festival_id
  FROM festivals
  WHERE code = 'EAXNKJXD';
  
  RAISE NOTICE 'Festival ID: %', v_festival_id;
  
  -- Get admin record
  SELECT admin_id, admin_code, admin_name, admin_password_hash
  INTO v_admin
  FROM admins
  WHERE festival_id = v_festival_id
    AND admin_code = 'QWERTY';
  
  RAISE NOTICE 'Admin found: %', v_admin.admin_code;
  RAISE NOTICE 'Admin name: %', v_admin.admin_name;
  RAISE NOTICE 'Password hash: %', v_admin.admin_password_hash;
  
  -- Test crypt function
  v_crypt_result := crypt(v_test_password, v_admin.admin_password_hash);
  RAISE NOTICE 'Crypt result: %', v_crypt_result;
  RAISE NOTICE 'Hash matches: %', (v_crypt_result = v_admin.admin_password_hash);
  
END $$;

-- Also check if pgcrypto extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

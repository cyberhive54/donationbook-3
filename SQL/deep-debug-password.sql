-- Deep debugging of password verification
DO $$
DECLARE
  v_festival_id UUID;
  v_admin RECORD;
  v_test_password TEXT := 'admin123';
  v_crypt_result TEXT;
  v_new_hash TEXT;
BEGIN
  -- Get festival ID
  SELECT id INTO v_festival_id FROM festivals WHERE code = 'EAXNKJXD';
  RAISE NOTICE '=== FESTIVAL ===';
  RAISE NOTICE 'Festival ID: %', v_festival_id;
  
  -- Get admin record
  SELECT * INTO v_admin
  FROM admins
  WHERE festival_id = v_festival_id AND admin_code = 'QWERTY';
  
  RAISE NOTICE '=== ADMIN RECORD ===';
  RAISE NOTICE 'Admin ID: %', v_admin.admin_id;
  RAISE NOTICE 'Admin Code: %', v_admin.admin_code;
  RAISE NOTICE 'Admin Name: %', v_admin.admin_name;
  RAISE NOTICE 'Is Active: %', v_admin.is_active;
  RAISE NOTICE 'Hash: %', v_admin.admin_password_hash;
  RAISE NOTICE 'Hash Length: %', length(v_admin.admin_password_hash);
  RAISE NOTICE 'Hash starts with: %', substring(v_admin.admin_password_hash, 1, 10);
  
  RAISE NOTICE '=== PASSWORD TEST ===';
  RAISE NOTICE 'Test password: %', v_test_password;
  RAISE NOTICE 'Test password length: %', length(v_test_password);
  
  -- Try crypt
  v_crypt_result := crypt(v_test_password, v_admin.admin_password_hash);
  RAISE NOTICE 'Crypt result: %', v_crypt_result;
  RAISE NOTICE 'Crypt result length: %', length(v_crypt_result);
  
  RAISE NOTICE '=== COMPARISON ===';
  RAISE NOTICE 'Hash:   %', v_admin.admin_password_hash;
  RAISE NOTICE 'Result: %', v_crypt_result;
  RAISE NOTICE 'Equal: %', (v_crypt_result = v_admin.admin_password_hash);
  RAISE NOTICE 'Equal (trimmed): %', (trim(v_crypt_result) = trim(v_admin.admin_password_hash));
  
  -- Create a brand new hash and test it immediately
  RAISE NOTICE '=== FRESH HASH TEST ===';
  v_new_hash := crypt('testpass', gen_salt('bf', 10));
  RAISE NOTICE 'New hash: %', v_new_hash;
  v_crypt_result := crypt('testpass', v_new_hash);
  RAISE NOTICE 'Verify new hash: %', (v_crypt_result = v_new_hash);
  
  -- Test with wrong password
  v_crypt_result := crypt('wrongpass', v_admin.admin_password_hash);
  RAISE NOTICE '=== WRONG PASSWORD TEST ===';
  RAISE NOTICE 'Wrong password result: %', (v_crypt_result = v_admin.admin_password_hash);
  
END $$;

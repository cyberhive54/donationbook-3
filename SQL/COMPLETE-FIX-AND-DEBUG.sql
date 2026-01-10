-- ============================================
-- COMPLETE ADMIN LOGIN FIX AND DEBUG SCRIPT
-- ============================================
-- This script will:
-- 1. Check your current setup
-- 2. Fix the verify_admin_credentials function
-- 3. Reset your admin password
-- 4. Test everything
-- ============================================

-- STEP 1: Check if pgcrypto extension is enabled
SELECT '=== STEP 1: Checking pgcrypto extension ===' as step;
SELECT extname, extversion FROM pg_extension WHERE extname = 'pgcrypto';

-- STEP 2: Check current admin data
SELECT '=== STEP 2: Current admin data ===' as step;
SELECT 
    a.admin_id,
    a.admin_code,
    a.admin_name,
    a.is_active,
    f.code as festival_code,
    f.event_name,
    length(a.admin_password_hash) as hash_length
FROM admins a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'EAXNKJXD';

-- STEP 3: Delete old admin and create fresh one
SELECT '=== STEP 3: Creating fresh admin with password: admin123 ===' as step;

DO $$
DECLARE
  v_festival_id UUID;
  v_admin_id UUID;
  v_new_hash TEXT;
  v_test_result TEXT;
BEGIN
  -- Get festival ID
  SELECT id INTO v_festival_id FROM festivals WHERE code = 'EAXNKJXD';
  
  IF v_festival_id IS NULL THEN
    RAISE EXCEPTION 'Festival with code EAXNKJXD not found!';
  END IF;
  
  -- Delete existing admin with code QWERTY
  DELETE FROM admins WHERE admin_code = 'QWERTY' AND festival_id = v_festival_id;
  RAISE NOTICE 'Deleted old admin';
  
  -- Create new hash for password "admin123"
  v_new_hash := crypt('admin123', gen_salt('bf', 10));
  RAISE NOTICE 'Created new hash: %', v_new_hash;
  
  -- Test the hash immediately
  v_test_result := crypt('admin123', v_new_hash);
  IF v_test_result = v_new_hash THEN
    RAISE NOTICE 'Hash test PASSED - hash is working correctly';
  ELSE
    RAISE EXCEPTION 'Hash test FAILED - something is wrong with crypt()';
  END IF;
  
  -- Insert new admin
  INSERT INTO admins (
    festival_id,
    admin_code,
    admin_name,
    admin_password_hash,
    is_active,
    max_user_passwords
  ) VALUES (
    v_festival_id,
    'QWERTY',
    'Test Admin',
    v_new_hash,
    TRUE,
    3
  ) RETURNING admin_id INTO v_admin_id;
  
  RAISE NOTICE 'Created new admin with ID: %', v_admin_id;
  RAISE NOTICE 'Admin Code: QWERTY';
  RAISE NOTICE 'Admin Name: Test Admin';
  RAISE NOTICE 'Password: admin123';
END $$;

-- STEP 4: Verify admin was created
SELECT '=== STEP 4: Verify admin was created ===' as step;
SELECT 
  admin_code,
  admin_name,
  is_active,
  length(admin_password_hash) as hash_length,
  substring(admin_password_hash, 1, 10) as hash_preview
FROM admins a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'EAXNKJXD' AND a.admin_code = 'QWERTY';

-- STEP 5: Create/Update the verify_admin_credentials function
SELECT '=== STEP 5: Creating verify_admin_credentials function ===' as step;

CREATE OR REPLACE FUNCTION verify_admin_credentials(
  p_festival_code TEXT,
  p_admin_code_or_name TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_admin RECORD;
  v_festival_id UUID;
  v_crypt_result TEXT;
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
  v_crypt_result := crypt(p_password, v_admin.admin_password_hash);

  IF v_crypt_result = v_admin.admin_password_hash THEN
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

GRANT EXECUTE ON FUNCTION verify_admin_credentials(TEXT, TEXT, TEXT) TO authenticated, anon;

SELECT 'Function created successfully' as result;

-- STEP 6: Test the function directly
SELECT '=== STEP 6: Testing verify_admin_credentials function ===' as step;
SELECT verify_admin_credentials('EAXNKJXD', 'QWERTY', 'admin123') as test_result;

-- STEP 7: Test with wrong password (should fail)
SELECT '=== STEP 7: Testing with wrong password (should fail) ===' as step;
SELECT verify_admin_credentials('EAXNKJXD', 'QWERTY', 'wrongpassword') as test_result;

-- STEP 8: Final summary
SELECT '=== STEP 8: FINAL SUMMARY ===' as step;
SELECT 
  '✓ Admin created successfully' as status,
  'QWERTY' as admin_code,
  'Test Admin' as admin_name,
  'admin123' as password,
  'Try logging in now!' as action;

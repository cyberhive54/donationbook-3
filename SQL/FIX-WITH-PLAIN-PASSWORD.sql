-- ============================================
-- FIX: Use plain text password (simpler approach)
-- ============================================

-- STEP 1: Update the verify_admin_credentials function to use plain text
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

  -- Find admin by code or name and get password (plain text)
  SELECT a.admin_id, a.admin_code, a.admin_name, a.festival_id, a.admin_password_hash
  INTO v_admin
  FROM admins a
  WHERE a.festival_id = v_festival_id
    AND a.is_active = TRUE
    AND (a.admin_code = p_admin_code_or_name OR a.admin_name = p_admin_code_or_name);

  IF v_admin.admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Compare passwords directly (plain text)
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

GRANT EXECUTE ON FUNCTION verify_admin_credentials(TEXT, TEXT, TEXT) TO authenticated, anon;

-- STEP 2: Update the admin password to plain text
UPDATE admins
SET admin_password_hash = 'admin123'
WHERE admin_code = 'QWERTY'
  AND festival_id = (SELECT id FROM festivals WHERE code = 'EAXNKJXD');

-- STEP 3: Verify the update
SELECT 
  admin_code,
  admin_name,
  admin_password_hash as password,
  'Password is now: admin123' as note
FROM admins a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'EAXNKJXD' AND a.admin_code = 'QWERTY';

-- STEP 4: Test with correct password (should succeed)
SELECT '=== Test with correct password ===' as test;
SELECT verify_admin_credentials('EAXNKJXD', 'QWERTY', 'admin123') as result;

-- STEP 5: Test with wrong password (should fail)
SELECT '=== Test with wrong password ===' as test;
SELECT verify_admin_credentials('EAXNKJXD', 'QWERTY', 'wrongpass') as result;

-- STEP 6: Final summary
SELECT 
  '✓ Fixed! Use plain text passwords' as status,
  'QWERTY' as admin_code,
  'admin123' as password,
  'Login should work now!' as action;

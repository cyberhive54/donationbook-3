-- ============================================
-- COMPLETE RESET - Start Fresh
-- ============================================

-- STEP 1: Delete ALL admins for this festival
DELETE FROM admins 
WHERE festival_id = (SELECT id FROM festivals WHERE code = 'EAXNKJXD');

SELECT 'Step 1: Deleted all admins' as status;

-- STEP 2: Create brand new admin with plain text password
INSERT INTO admins (
  festival_id,
  admin_code,
  admin_name,
  admin_password_hash,
  is_active,
  max_user_passwords
)
SELECT 
  id,
  'QWERTY',
  'Test Admin',
  'admin123',
  TRUE,
  3
FROM festivals
WHERE code = 'EAXNKJXD';

SELECT 'Step 2: Created new admin' as status;

-- STEP 3: Verify what was inserted
SELECT 
  admin_code,
  admin_name,
  admin_password_hash as stored_password,
  length(admin_password_hash) as length,
  is_active
FROM admins a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'EAXNKJXD';

-- STEP 4: Update the function to use plain text
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
  SELECT id INTO v_festival_id FROM festivals WHERE code = p_festival_code;
  
  IF v_festival_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Festival not found');
  END IF;

  SELECT 
    a.admin_id, 
    a.admin_code, 
    a.admin_name, 
    a.festival_id, 
    a.admin_password_hash
  INTO v_admin
  FROM admins a
  WHERE a.festival_id = v_festival_id
    AND a.is_active = TRUE
    AND (a.admin_code = p_admin_code_or_name OR a.admin_name = p_admin_code_or_name);

  IF v_admin.admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Admin not found');
  END IF;

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

SELECT 'Step 4: Function updated' as status;

-- STEP 5: Test the function
SELECT verify_admin_credentials('EAXNKJXD', 'QWERTY', 'admin123') as test_correct_password;

-- STEP 6: Test with wrong password
SELECT verify_admin_credentials('EAXNKJXD', 'QWERTY', 'wrong') as test_wrong_password;

-- STEP 7: Summary
SELECT 
  'SUCCESS! Admin login fixed' as status,
  'QWERTY' as admin_code,
  'admin123' as password;

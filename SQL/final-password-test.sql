-- Step 1: Delete the old admin and create a fresh one with a known password
DO $$
DECLARE
  v_festival_id UUID;
  v_admin_id UUID;
  v_new_hash TEXT;
BEGIN
  -- Get festival ID
  SELECT id INTO v_festival_id FROM festivals WHERE code = 'EAXNKJXD';
  
  -- Delete existing admin with code QWERTY
  DELETE FROM admins WHERE admin_code = 'QWERTY' AND festival_id = v_festival_id;
  
  -- Create new hash for password "admin123"
  v_new_hash := crypt('admin123', gen_salt('bf', 10));
  
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
  RAISE NOTICE 'Password is: admin123';
  RAISE NOTICE 'Hash: %', v_new_hash;
END $$;

-- Step 2: Verify the admin was created correctly
SELECT 
  admin_code,
  admin_name,
  is_active,
  length(admin_password_hash) as hash_length,
  'Password: admin123' as note
FROM admins a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'EAXNKJXD' AND a.admin_code = 'QWERTY';

-- Step 3: Test the verify function
SELECT verify_admin_credentials('EAXNKJXD', 'QWERTY', 'admin123') as result;

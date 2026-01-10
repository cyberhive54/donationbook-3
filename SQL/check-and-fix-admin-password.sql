-- Step 1: Check current admin data
SELECT 
  a.admin_id,
  a.admin_code,
  a.admin_name,
  a.admin_password_hash,
  a.is_active,
  f.code as festival_code,
  f.event_name
FROM admins a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'EAXNKJXD' AND a.admin_code = 'QWERTY';

-- Step 2: Update the password for admin QWERTY to a known password
-- This will hash the password "123456" using bcrypt
-- Replace '123456' with your desired password
UPDATE admins
SET admin_password_hash = crypt('123456', gen_salt('bf', 10)),
    updated_at = NOW()
WHERE admin_code = 'QWERTY'
  AND festival_id = (SELECT id FROM festivals WHERE code = 'EAXNKJXD');

-- Step 3: Verify the update
SELECT 
  a.admin_code,
  a.admin_name,
  'Password updated successfully' as status,
  'Use password: 123456' as note
FROM admins a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'EAXNKJXD' AND a.admin_code = 'QWERTY';

-- Test 1: Check if pgcrypto extension is enabled
SELECT extname, extversion FROM pg_extension WHERE extname = 'pgcrypto';

-- Test 2: Get the current admin data
SELECT 
  admin_code,
  admin_name,
  admin_password_hash,
  length(admin_password_hash) as hash_length,
  substring(admin_password_hash, 1, 4) as hash_prefix
FROM admins a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'EAXNKJXD' AND a.admin_code = 'QWERTY';

-- Test 3: Create a fresh hash and test it
DO $$
DECLARE
  test_password TEXT := '123456';
  new_hash TEXT;
  verify_result TEXT;
BEGIN
  -- Create a new hash
  new_hash := crypt(test_password, gen_salt('bf', 10));
  RAISE NOTICE 'New hash created: %', new_hash;
  
  -- Verify it immediately
  verify_result := crypt(test_password, new_hash);
  RAISE NOTICE 'Verification result: %', verify_result;
  RAISE NOTICE 'Match: %', (verify_result = new_hash);
END $$;

-- Test 4: Try to verify with the actual stored hash
DO $$
DECLARE
  stored_hash TEXT;
  test_password TEXT := '123456';
  verify_result TEXT;
BEGIN
  -- Get the stored hash
  SELECT admin_password_hash INTO stored_hash
  FROM admins a
  JOIN festivals f ON a.festival_id = f.id
  WHERE f.code = 'EAXNKJXD' AND a.admin_code = 'QWERTY';
  
  RAISE NOTICE 'Stored hash: %', stored_hash;
  RAISE NOTICE 'Hash length: %', length(stored_hash);
  
  -- Try to verify
  verify_result := crypt(test_password, stored_hash);
  RAISE NOTICE 'Verify result: %', verify_result;
  RAISE NOTICE 'Match: %', (verify_result = stored_hash);
END $$;

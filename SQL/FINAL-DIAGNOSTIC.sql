-- ============================================
-- FINAL DIAGNOSTIC - Check exact values
-- ============================================

-- Check what's actually stored in the database
SELECT 
  admin_code,
  admin_name,
  admin_password_hash,
  length(admin_password_hash) as password_length,
  admin_password_hash = 'admin123' as direct_comparison,
  trim(admin_password_hash) = 'admin123' as trimmed_comparison,
  encode(admin_password_hash::bytea, 'hex') as hex_value
FROM admins a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'EAXNKJXD' AND a.admin_code = 'QWERTY';

-- Test the function step by step
DO $$
DECLARE
  v_festival_id UUID;
  v_admin RECORD;
BEGIN
  -- Get festival
  SELECT id INTO v_festival_id FROM festivals WHERE code = 'EAXNKJXD';
  RAISE NOTICE 'Festival ID: %', v_festival_id;
  
  -- Get admin
  SELECT * INTO v_admin FROM admins 
  WHERE festival_id = v_festival_id AND admin_code = 'QWERTY';
  
  RAISE NOTICE 'Admin Code: %', v_admin.admin_code;
  RAISE NOTICE 'Admin Name: %', v_admin.admin_name;
  RAISE NOTICE 'Stored Password: [%]', v_admin.admin_password_hash;
  RAISE NOTICE 'Password Length: %', length(v_admin.admin_password_hash);
  RAISE NOTICE 'Test Password: [admin123]';
  RAISE NOTICE 'Direct Match: %', (v_admin.admin_password_hash = 'admin123');
  RAISE NOTICE 'Trimmed Match: %', (trim(v_admin.admin_password_hash) = 'admin123');
END $$;

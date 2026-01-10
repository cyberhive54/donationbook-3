-- Data Migration Script for Existing Festivals
-- This script migrates existing festivals to use the new multi-admin system
-- It creates a "Primary Admin" for each festival and migrates existing passwords

-- ============================================
-- MIGRATION LOGIC
-- ============================================

DO $$
DECLARE
  festival_record RECORD;
  new_admin_id UUID;
  new_admin_code VARCHAR(6);
  password_hash TEXT;
BEGIN
  -- Loop through all festivals that have passwords and haven't been migrated yet
  FOR festival_record IN 
    SELECT id, code, event_name, admin_password, user_password, requires_password
    FROM festivals
    WHERE requires_password = TRUE 
      AND multi_admin_enabled = FALSE
      AND admin_password IS NOT NULL
  LOOP
    -- Generate unique admin code
    new_admin_code := generate_admin_code();
    
    -- Hash the existing admin password using crypt
    password_hash := crypt(festival_record.admin_password, gen_salt('bf', 10));
    
    -- Create the primary admin for this festival
    INSERT INTO admins (
      festival_id,
      admin_code,
      admin_name,
      admin_password_hash,
      is_active,
      max_user_passwords,
      created_by,
      created_at
    ) VALUES (
      festival_record.id,
      new_admin_code,
      'Primary Admin', -- Default name for migrated admin
      password_hash,
      TRUE,
      3, -- Default: can create up to 3 user passwords
      NULL, -- No creator (system migration)
      NOW()
    ) RETURNING admin_id INTO new_admin_id;
    
    -- Migrate the existing user_password to user_passwords table
    IF festival_record.user_password IS NOT NULL THEN
      INSERT INTO user_passwords (
        festival_id,
        admin_id,
        password,
        label,
        is_active,
        created_by,
        created_at
      ) VALUES (
        festival_record.id,
        new_admin_id,
        festival_record.user_password,
        'Legacy User Password', -- Label for migrated password
        TRUE,
        new_admin_id,
        NOW()
      );
    END IF;
    
    -- Mark festival as migrated to multi-admin system
    UPDATE festivals 
    SET multi_admin_enabled = TRUE,
        updated_at = NOW()
    WHERE id = festival_record.id;
    
    -- Log the migration
    RAISE NOTICE 'Migrated festival % (%) - Created admin % with code %', 
      festival_record.event_name, 
      festival_record.code, 
      new_admin_id, 
      new_admin_code;
      
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully!';
  
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show migration summary
DO $$
DECLARE
  total_festivals INTEGER;
  migrated_festivals INTEGER;
  total_admins INTEGER;
  total_passwords INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_festivals FROM festivals WHERE requires_password = TRUE;
  SELECT COUNT(*) INTO migrated_festivals FROM festivals WHERE multi_admin_enabled = TRUE;
  SELECT COUNT(*) INTO total_admins FROM admins;
  SELECT COUNT(*) INTO total_passwords FROM user_passwords;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total festivals with passwords: %', total_festivals;
  RAISE NOTICE 'Festivals migrated to multi-admin: %', migrated_festivals;
  RAISE NOTICE 'Total admins created: %', total_admins;
  RAISE NOTICE 'Total user passwords migrated: %', total_passwords;
  RAISE NOTICE '==============================================';
END $$;

-- Display all migrated admins with their codes
SELECT 
  f.event_name as festival,
  f.code as festival_code,
  a.admin_name,
  a.admin_code,
  a.max_user_passwords,
  (SELECT COUNT(*) FROM user_passwords WHERE admin_id = a.admin_id) as current_passwords
FROM admins a
JOIN festivals f ON a.festival_id = f.id
ORDER BY f.event_name, a.created_at;

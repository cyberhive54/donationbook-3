-- ============================================
-- MIGRATION STATUS CHECKER
-- ============================================
-- Run this script to check if multi-admin migrations have been applied
-- This is SAFE to run - it only reads data, makes no changes
-- ============================================

-- ============================================
-- CHECK 1: Do the tables exist?
-- ============================================
SELECT 
  'Tables Check' as check_type,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admins') as admins_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_passwords') as user_passwords_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_activity_log') as activity_log_table,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('admins', 'user_passwords', 'admin_activity_log')) = 3 
    THEN '✅ All tables exist'
    ELSE '❌ Tables missing - need to run migration'
  END as status;

-- ============================================
-- CHECK 2: Do the columns exist?
-- ============================================
SELECT 
  'Columns Check' as check_type,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'created_by_admin_id') as collections_tracking,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'created_by_admin_id') as expenses_tracking,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'festivals' AND column_name = 'multi_admin_enabled') as multi_admin_flag,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'festivals' AND column_name = 'banner_show_organiser') as banner_fields,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'access_logs' AND column_name = 'admin_id') as access_log_tracking,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'created_by_admin_id') = 1 
    THEN '✅ Columns added'
    ELSE '❌ Columns missing - need to run migration'
  END as status;

-- ============================================
-- CHECK 3: Do the RPC functions exist?
-- ============================================
SELECT 
  'Functions Check' as check_type,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'log_admin_activity') as log_activity_fn,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'verify_admin_credentials') as verify_credentials_fn,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('log_admin_activity', 'verify_admin_credentials')) >= 1
    THEN '✅ RPC functions exist'
    ELSE '❌ Functions missing - need to run migration'
  END as status;

-- ============================================
-- CHECK 4: Have festivals been migrated?
-- ============================================
SELECT 
  'Data Migration Check' as check_type,
  (SELECT COUNT(*) FROM festivals WHERE multi_admin_enabled = TRUE) as migrated_festivals,
  (SELECT COUNT(*) FROM festivals WHERE multi_admin_enabled = FALSE OR multi_admin_enabled IS NULL) as pending_festivals,
  (SELECT COUNT(*) FROM admins) as total_admins,
  (SELECT COUNT(*) FROM user_passwords) as total_user_passwords,
  CASE 
    WHEN (SELECT COUNT(*) FROM admins) > 0 
    THEN '✅ Data migrated'
    ELSE '❌ No admins created - need to run migration'
  END as status;

-- ============================================
-- CHECK 5: Show existing admins (if any)
-- ============================================
SELECT 
  f.code as festival_code,
  f.event_name as festival_name,
  a.admin_code,
  a.admin_name,
  a.is_active,
  a.max_user_passwords,
  (SELECT COUNT(*) FROM user_passwords WHERE admin_id = a.admin_id) as current_passwords,
  a.created_at
FROM festivals f
LEFT JOIN admins a ON f.id = a.festival_id
ORDER BY f.code, a.created_at;

-- ============================================
-- CHECK 6: Show existing user passwords (if any)
-- ============================================
SELECT 
  f.code as festival_code,
  a.admin_code,
  a.admin_name,
  up.label,
  up.is_active,
  up.created_at
FROM user_passwords up
JOIN admins a ON up.admin_id = a.admin_id
JOIN festivals f ON up.festival_id = f.id
ORDER BY f.code, a.admin_code, up.created_at;

-- ============================================
-- SUMMARY & RECOMMENDATION
-- ============================================

DO $$
DECLARE
  tables_exist INTEGER;
  columns_exist INTEGER;
  functions_exist INTEGER;
  admins_exist INTEGER;
BEGIN
  -- Count existing components
  SELECT COUNT(*) INTO tables_exist 
  FROM information_schema.tables 
  WHERE table_name IN ('admins', 'user_passwords', 'admin_activity_log');
  
  SELECT COUNT(*) INTO columns_exist 
  FROM information_schema.columns 
  WHERE table_name = 'collections' AND column_name = 'created_by_admin_id';
  
  SELECT COUNT(*) INTO functions_exist 
  FROM information_schema.routines 
  WHERE routine_name = 'log_admin_activity';
  
  SELECT COUNT(*) INTO admins_exist FROM admins;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION STATUS SUMMARY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables exist: % / 3', tables_exist;
  RAISE NOTICE 'Columns added: %', CASE WHEN columns_exist > 0 THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE 'Functions exist: %', CASE WHEN functions_exist > 0 THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE 'Admins created: %', admins_exist;
  RAISE NOTICE '============================================';
  
  IF tables_exist = 3 AND columns_exist > 0 AND functions_exist > 0 AND admins_exist > 0 THEN
    RAISE NOTICE '✅ MIGRATION COMPLETE - No action needed!';
    RAISE NOTICE 'Your database is already set up for multi-admin system.';
  ELSIF tables_exist = 3 AND columns_exist > 0 AND functions_exist > 0 THEN
    RAISE NOTICE '⚠️ PARTIAL MIGRATION - Tables exist but no admins created';
    RAISE NOTICE 'Run the data migration part (multi-admin-002.sql or my new file)';
  ELSE
    RAISE NOTICE '❌ MIGRATION NEEDED - Run migration files';
    RAISE NOTICE 'Option 1: Run existing files (multi-admin-001, 002, 003, rpc)';
    RAISE NOTICE 'Option 2: Run my consolidated file (supabase-migration-multi-admin-system.sql)';
  END IF;
  
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- PHASE 3: VERIFY DATABASE COMPATIBILITY
-- ============================================
-- This script verifies that the database schema is compatible with Phase 3 changes
-- Date: 2026-01-10
-- ============================================
--
-- IMPORTANT: Phase 3 is UI/Logic only - no database schema changes required
-- This script only VERIFIES that required fields/tables exist
-- ============================================

-- ============================================
-- STEP 1: Verify Admins Table Structure for Phase 3.1 & 3.2
-- ============================================
-- Phase 3.1: Show default admin badge (uses created_by field)
-- Phase 3.2: Show current password (uses admin_password_hash field)

SELECT
  'Phase 3.1 & 3.2 - Admins table verification:' as check_type,
  CASE
    WHEN COUNT(*) >= 7 THEN '✓ OK - Has all required columns'
    ELSE '⚠ WARNING - Missing some columns'
  END as status,
  string_agg(column_name, ', ' ORDER BY column_name) as existing_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admins'
  AND column_name IN ('admin_id', 'festival_id', 'admin_code', 'admin_name', 'admin_password_hash', 'created_by', 'is_active', 'max_user_passwords', 'created_at', 'updated_at');

-- Check specifically for created_by column (for Phase 3.1)
DO $$
DECLARE
  v_has_created_by BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admins'
      AND column_name = 'created_by'
  ) INTO v_has_created_by;

  IF v_has_created_by THEN
    RAISE NOTICE '✓ created_by column exists (required for Phase 3.1 - default admin badge)';
  ELSE
    RAISE WARNING '⚠ created_by column MISSING - Phase 3.1 will not work correctly';
  END IF;
END $$;

-- Check specifically for admin_password_hash column (for Phase 3.2)
DO $$
DECLARE
  v_has_password_hash BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admins'
      AND column_name = 'admin_password_hash'
  ) INTO v_has_password_hash;

  IF v_has_password_hash THEN
    RAISE NOTICE '✓ admin_password_hash column exists (required for Phase 3.2 - show current password)';
  ELSE
    RAISE WARNING '⚠ admin_password_hash column MISSING - Phase 3.2 will not work correctly';
  END IF;
END $$;

-- ============================================
-- STEP 2: Verify Festival Code History Table for Phase 3.3
-- ============================================
-- Phase 3.3: Fix festival code change handling (uses festival_code_history table)

SELECT
  'Phase 3.3 - festival_code_history table verification:' as check_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'festival_code_history'
    ) THEN '✓ OK - Table exists'
    ELSE '⚠ WARNING - Table does not exist'
  END as status;

-- Check festival_code_history table structure
SELECT
  'festival_code_history table columns:' as check_type,
  CASE
    WHEN COUNT(*) >= 5 THEN '✓ OK - Has all required columns'
    ELSE '⚠ WARNING - Missing some columns'
  END as status,
  string_agg(column_name, ', ' ORDER BY column_name) as existing_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'festival_code_history'
  AND column_name IN ('id', 'festival_id', 'old_code', 'new_code', 'changed_at');

-- Check festivals table has code tracking columns
SELECT
  'festivals table code tracking columns:' as check_type,
  CASE
    WHEN COUNT(*) >= 3 THEN '✓ OK - Has all required columns'
    WHEN COUNT(*) = 1 THEN '⚠ WARNING - Missing old_code or code_updated_at'
    ELSE '⚠ WARNING - Missing code tracking columns'
  END as status,
  string_agg(column_name, ', ' ORDER BY column_name) as existing_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'festivals'
  AND column_name IN ('code', 'old_code', 'code_updated_at');

-- ============================================
-- STEP 3: Verify Default Admins Exist (from Phase 2)
-- ============================================
-- Check if there are any admins with created_by = null (default admins)

SELECT
  'Default admins count (created_by IS NULL):' as check_type,
  COUNT(*) as default_admin_count,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ OK - Default admins exist'
    ELSE 'ℹ INFO - No default admins found yet (will be created when festivals are created)'
  END as status
FROM admins
WHERE created_by IS NULL;

-- ============================================
-- STEP 4: Check Data Type Compatibility
-- ============================================
-- Verify created_by can accept NULL (for default admins)

SELECT
  'created_by column nullability:' as check_type,
  CASE
    WHEN is_nullable = 'YES' THEN '✓ OK - Can be NULL (compatible with default admins)'
    ELSE '⚠ WARNING - Cannot be NULL (may cause issues for default admins)'
  END as status,
  data_type as column_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admins'
  AND column_name = 'created_by';

-- ============================================
-- SUMMARY
-- ============================================

SELECT
  'PHASE 3 DATABASE COMPATIBILITY VERIFICATION COMPLETE' as status,
  'All required fields and tables should exist from Phase 2' as note,
  'If all checks show ✓, Phase 3 is ready to use' as conclusion,
  'If warnings (⚠) appear, review the schema and ensure Phase 2 migrations were applied' as action_required;

-- ============================================
-- NOTES
-- ============================================
-- Phase 3 does NOT require any new SQL migrations because:
-- 1. Phase 3.1 (default admin badge): Uses existing created_by field from admins table
-- 2. Phase 3.2 (show current password): Uses existing admin_password_hash field from admins table
-- 3. Phase 3.3 (code change handling): Uses existing festival_code_history table and festivals.code columns
-- 4. Phase 3.4 (remove duplicate settings): UI-only change, no database impact
--
-- All required database structures were created in:
-- - Phase 2: admins table with created_by field
-- - Previous migrations: festival_code_history table
-- - Previous migrations: festivals table with code tracking columns

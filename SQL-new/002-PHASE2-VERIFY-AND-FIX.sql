-- ============================================
-- PHASE 2: VERIFY AND FIX SQL ISSUES
-- ============================================
-- This script verifies and fixes potential issues for Phase 2 implementation
-- Date: 2026-01-10
-- ============================================
-- 
-- IMPORTANT: Run this script in your Supabase SQL Editor to verify your database
-- is ready for Phase 2 implementation (default admin creation during festival creation)
-- ============================================

-- ============================================
-- STEP 1: Verify Admin Code Format Constraint
-- ============================================
-- The constraint requires: admin_code ~ '^[A-Z0-9]{6}$' (exactly 6 uppercase alphanumeric)
-- Our code generation already handles this, but if constraint doesn't exist, add it

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'admin_code_format' 
    AND conrelid = 'admins'::regclass
  ) THEN
    -- Add constraint if it doesn't exist (optional - for consistency)
    ALTER TABLE admins
    ADD CONSTRAINT admin_code_format CHECK (admin_code ~ '^[A-Z0-9]{6}$');
    RAISE NOTICE '✓ Created admin_code_format constraint';
  ELSE
    RAISE NOTICE '✓ admin_code_format constraint already exists';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE '✓ admin_code_format constraint already exists (different name)';
  WHEN others THEN
    RAISE NOTICE '⚠ Could not create admin_code_format constraint: %', SQLERRM;
END $$;

-- ============================================
-- STEP 2: Ensure Per-Festival Unique Constraint on admin_code
-- ============================================
-- Our code checks: UNIQUE(festival_id, admin_code) - admin codes unique per festival
-- If global unique exists instead, it will cause issues

-- Note: If your database has global unique (UNIQUE(admin_code)), you'll need to:
-- 1. Drop the global unique: ALTER TABLE admins DROP CONSTRAINT admins_admin_code_key;
-- 2. Add per-festival unique: ALTER TABLE admins ADD CONSTRAINT admins_festival_code_unique UNIQUE(festival_id, admin_code);

-- Check current constraints (informational only)
SELECT 
  'Current constraints on admin_code:' as info,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admins'
  AND tc.constraint_type = 'UNIQUE'
  AND kcu.column_name IN ('admin_code', 'festival_id')
GROUP BY tc.constraint_name, tc.constraint_type;

-- ============================================
-- STEP 3: Ensure User Passwords Constraints
-- ============================================
-- Need both:
--   1. UNIQUE(festival_id, password) - password unique per festival
--   2. UNIQUE(admin_id, label) - label unique per admin

-- Check if UNIQUE(festival_id, password) exists
DO $$
DECLARE
  v_constraint_exists BOOLEAN;
  v_festival_id_attnum INTEGER;
  v_password_attnum INTEGER;
BEGIN
  -- Get attribute numbers for festival_id and password
  SELECT attnum INTO v_festival_id_attnum FROM pg_attribute WHERE attrelid = 'user_passwords'::regclass AND attname = 'festival_id';
  SELECT attnum INTO v_password_attnum FROM pg_attribute WHERE attrelid = 'user_passwords'::regclass AND attname = 'password';
  
  -- Check if a unique constraint exists with both columns
  SELECT EXISTS (
    SELECT 1 
    FROM pg_constraint c
    WHERE c.conrelid = 'user_passwords'::regclass
      AND c.contype = 'u'
      AND array_length(c.conkey, 1) = 2
      AND v_festival_id_attnum = ANY(c.conkey)
      AND v_password_attnum = ANY(c.conkey)
  ) INTO v_constraint_exists;
  
  IF NOT v_constraint_exists THEN
    BEGIN
      ALTER TABLE user_passwords
      ADD CONSTRAINT user_passwords_festival_password_unique 
      UNIQUE(festival_id, password);
      RAISE NOTICE '✓ Created UNIQUE(festival_id, password) constraint';
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE '✓ UNIQUE(festival_id, password) constraint already exists (different name)';
      WHEN others THEN
        RAISE NOTICE '⚠ Could not create UNIQUE(festival_id, password): %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '✓ UNIQUE(festival_id, password) constraint already exists';
  END IF;
END $$;

-- Check if UNIQUE(admin_id, label) exists
DO $$
DECLARE
  v_constraint_exists BOOLEAN;
  v_admin_id_attnum INTEGER;
  v_label_attnum INTEGER;
BEGIN
  -- Get attribute numbers for admin_id and label
  SELECT attnum INTO v_admin_id_attnum FROM pg_attribute WHERE attrelid = 'user_passwords'::regclass AND attname = 'admin_id';
  SELECT attnum INTO v_label_attnum FROM pg_attribute WHERE attrelid = 'user_passwords'::regclass AND attname = 'label';
  
  -- Check if a unique constraint exists with both columns
  SELECT EXISTS (
    SELECT 1 
    FROM pg_constraint c
    WHERE c.conrelid = 'user_passwords'::regclass
      AND c.contype = 'u'
      AND array_length(c.conkey, 1) = 2
      AND v_admin_id_attnum = ANY(c.conkey)
      AND v_label_attnum = ANY(c.conkey)
  ) INTO v_constraint_exists;
  
  IF NOT v_constraint_exists THEN
    BEGIN
      ALTER TABLE user_passwords
      ADD CONSTRAINT user_passwords_admin_label_unique 
      UNIQUE(admin_id, label);
      RAISE NOTICE '✓ Created UNIQUE(admin_id, label) constraint';
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE '✓ UNIQUE(admin_id, label) constraint already exists (different name)';
      WHEN others THEN
        RAISE NOTICE '⚠ Could not create UNIQUE(admin_id, label): %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '✓ UNIQUE(admin_id, label) constraint already exists';
  END IF;
END $$;

-- ============================================
-- STEP 4: Verify RLS Policies Allow Public Inserts
-- ============================================
-- During festival creation (public/anonymous access), we need to insert into admins and user_passwords

-- Check RLS status and policies for admins table
SELECT 
  'admins table RLS status:' as check_type,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'admins' AND (cmd = 'INSERT' OR cmd = 'ALL')) as insert_policy_count
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'admins';

-- Check RLS status and policies for user_passwords table
SELECT 
  'user_passwords table RLS status:' as check_type,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_passwords' AND (cmd = 'INSERT' OR cmd = 'ALL')) as insert_policy_count
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'user_passwords';

-- If no insert policy exists and RLS is enabled, create one
DO $$
DECLARE
  v_admins_policy_exists BOOLEAN;
  v_passwords_policy_exists BOOLEAN;
  v_admins_rls_enabled BOOLEAN;
  v_passwords_rls_enabled BOOLEAN;
BEGIN
  -- Check if RLS is enabled on admins table
  SELECT rowsecurity INTO v_admins_rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'admins';
  
  -- Check if RLS is enabled on user_passwords table
  SELECT rowsecurity INTO v_passwords_rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'user_passwords';
  
  -- Check if admins table has insert policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'admins' 
    AND (cmd = 'INSERT' OR cmd = 'ALL')
  ) INTO v_admins_policy_exists;
  
  -- Check if user_passwords table has insert policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_passwords' 
    AND (cmd = 'INSERT' OR cmd = 'ALL')
  ) INTO v_passwords_policy_exists;
  
  -- Create policy for admins table if needed
  IF v_admins_rls_enabled = TRUE THEN
    IF NOT v_admins_policy_exists THEN
      BEGIN
        CREATE POLICY "Public insert access for admins during festival creation" 
        ON admins FOR INSERT 
        WITH CHECK (true);
        RAISE NOTICE '✓ Created public insert policy for admins table';
      EXCEPTION
        WHEN duplicate_object THEN
          RAISE NOTICE '✓ Public insert policy already exists for admins table (different name)';
        WHEN others THEN
          RAISE NOTICE '⚠ Could not create insert policy for admins: %', SQLERRM;
      END;
    ELSE
      RAISE NOTICE '✓ Public insert policy already exists for admins table';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ RLS not enabled on admins table (no policy needed)';
  END IF;

  -- Create policy for user_passwords table if needed
  IF v_passwords_rls_enabled = TRUE THEN
    IF NOT v_passwords_policy_exists THEN
      BEGIN
        CREATE POLICY "Public insert access for user_passwords during festival creation" 
        ON user_passwords FOR INSERT 
        WITH CHECK (true);
        RAISE NOTICE '✓ Created public insert policy for user_passwords table';
      EXCEPTION
        WHEN duplicate_object THEN
          RAISE NOTICE '✓ Public insert policy already exists for user_passwords table (different name)';
        WHEN others THEN
          RAISE NOTICE '⚠ Could not create insert policy for user_passwords: %', SQLERRM;
      END;
    ELSE
      RAISE NOTICE '✓ Public insert policy already exists for user_passwords table';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ RLS not enabled on user_passwords table (no policy needed)';
  END IF;
END $$;

-- ============================================
-- STEP 5: Verify Table Structure
-- ============================================

-- Verify admins table has required columns
SELECT 
  'admins table columns:' as check_type,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✓ OK - Has all required columns'
    ELSE '⚠ WARNING - Missing some columns'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admins'
  AND column_name IN ('admin_id', 'festival_id', 'admin_code', 'admin_name', 'admin_password_hash', 'is_active', 'max_user_passwords', 'created_at');

-- Verify user_passwords table has required columns
SELECT 
  'user_passwords table columns:' as check_type,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✓ OK - Has all required columns'
    ELSE '⚠ WARNING - Missing some columns'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_passwords'
  AND column_name IN ('password_id', 'admin_id', 'festival_id', 'password', 'label', 'is_active', 'created_at', 'updated_at', 'usage_count', 'last_used_at');

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
  'PHASE 2 SQL VERIFICATION COMPLETE' as status,
  'Review the notices and queries above' as next_step,
  'If all checks pass (✓), Phase 2 should work without issues' as note,
  'If warnings (⚠) appear, address them before testing' as action_required;

-- ============================================
-- FIX: Change Admin Code Constraint from Global to Per-Festival
-- ============================================
-- This script changes admin_code constraint from globally unique to per-festival unique
-- Date: 2026-01-10
-- ============================================
--
-- IMPORTANT: This allows the same admin_code to exist in different festivals
-- which is the correct behavior for the multi-admin system
-- ============================================

-- ============================================
-- STEP 1: Check Current Constraints
-- ============================================
-- First, let's see what constraints currently exist on admin_code

SELECT
  'Current constraints on admin_code:' as check_type,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns,
  CASE
    WHEN string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) = 'admin_code' THEN '⚠ GLOBAL UNIQUE - Needs to be changed'
    WHEN string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) LIKE '%festival_id%,%admin_code%' OR
         string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) LIKE '%admin_code%,%festival_id%' THEN '✓ PER-FESTIVAL UNIQUE - Already correct'
    ELSE '❓ UNKNOWN - Needs investigation'
  END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'admins'
  AND tc.constraint_type = 'UNIQUE'
  AND kcu.column_name IN ('admin_code', 'festival_id')
GROUP BY tc.constraint_name, tc.constraint_type
ORDER BY tc.constraint_name;

-- ============================================
-- STEP 2: Check for Duplicate admin_codes (if global unique exists)
-- ============================================
-- If global unique exists and we have duplicates, we need to handle them before changing constraint

DO $$
DECLARE
  v_global_unique_exists BOOLEAN;
  v_duplicate_count INTEGER;
BEGIN
  -- Check if global unique constraint exists (only admin_code, not with festival_id)
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'admins'
      AND c.contype = 'u'
      AND a.attname = 'admin_code'
      AND array_length(c.conkey, 1) = 1 -- Only admin_code column
  ) INTO v_global_unique_exists;

  IF v_global_unique_exists THEN
    -- Check for duplicates across different festivals
    SELECT COUNT(*) INTO v_duplicate_count
    FROM (
      SELECT admin_code, COUNT(DISTINCT festival_id) as festival_count
      FROM admins
      GROUP BY admin_code
      HAVING COUNT(DISTINCT festival_id) > 1
    ) duplicates;

    IF v_duplicate_count > 0 THEN
      RAISE WARNING '⚠ Found % admin_code(s) used in multiple festivals. These need to be updated before changing constraint.', v_duplicate_count;
      RAISE NOTICE '⚠ Please review and update duplicate admin_codes manually, or run the fix script below.';
    ELSE
      RAISE NOTICE '✓ No duplicate admin_codes across festivals found. Safe to proceed.';
    END IF;
  ELSE
    RAISE NOTICE '✓ No global unique constraint found. Checking for per-festival unique...';
  END IF;
END $$;

-- ============================================
-- STEP 3: Show Duplicate admin_codes (if any)
-- ============================================
-- This helps identify which admin_codes need to be fixed

SELECT
  'Duplicate admin_codes across festivals:' as check_type,
  admin_code,
  COUNT(DISTINCT festival_id) as festival_count,
  string_agg(DISTINCT festival_id::text, ', ') as festival_ids,
  string_agg(DISTINCT admin_name, ' | ') as admin_names
FROM admins
GROUP BY admin_code
HAVING COUNT(DISTINCT festival_id) > 1
ORDER BY admin_code;

-- ============================================
-- STEP 4: Fix Duplicate admin_codes (if needed)
-- ============================================
-- If duplicates exist, generate new codes for them
-- This only runs if global unique constraint exists

DO $$
DECLARE
  v_global_unique_constraint_name TEXT;
  v_duplicate_record RECORD;
  v_new_code TEXT;
  v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_attempts INTEGER;
  v_code_exists BOOLEAN;
BEGIN
  -- Find global unique constraint name
  SELECT c.conname INTO v_global_unique_constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE t.relname = 'admins'
    AND c.contype = 'u'
    AND a.attname = 'admin_code'
    AND array_length(c.conkey, 1) = 1
  LIMIT 1;

  -- Only proceed if global unique exists
  IF v_global_unique_constraint_name IS NOT NULL THEN
    RAISE NOTICE 'Found global unique constraint: %', v_global_unique_constraint_name;
    
    -- Fix duplicates: keep first occurrence, regenerate others
    FOR v_duplicate_record IN
      WITH ranked AS (
        SELECT 
          admin_id,
          festival_id,
          admin_code,
          admin_name,
          ROW_NUMBER() OVER (PARTITION BY admin_code ORDER BY created_at) as rn
        FROM admins
        WHERE admin_code IN (
          SELECT admin_code
          FROM admins
          GROUP BY admin_code
          HAVING COUNT(DISTINCT festival_id) > 1
        )
      )
      SELECT admin_id, festival_id, admin_code, admin_name
      FROM ranked
      WHERE rn > 1
    LOOP
      -- Generate new unique code (keep first 3 chars, add 3 random)
      v_attempts := 0;
      LOOP
        v_new_code := SUBSTRING(v_duplicate_record.admin_code, 1, 3) || 
                     SUBSTRING(v_chars, 1 + floor(random() * length(v_chars))::int, 1) ||
                     SUBSTRING(v_chars, 1 + floor(random() * length(v_chars))::int, 1) ||
                     SUBSTRING(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
        
        -- Ensure exactly 6 characters
        v_new_code := SUBSTRING(v_new_code, 1, 6);
        IF LENGTH(v_new_code) < 6 THEN
          v_new_code := v_new_code || REPEAT('0', 6 - LENGTH(v_new_code));
        END IF;
        
        -- Check if code is unique globally
        SELECT EXISTS (
          SELECT 1 FROM admins WHERE admin_code = v_new_code
        ) INTO v_code_exists;
        
        EXIT WHEN NOT v_code_exists;
        
        v_attempts := v_attempts + 1;
        IF v_attempts > 50 THEN
          RAISE EXCEPTION 'Failed to generate unique code for admin % after 50 attempts', v_duplicate_record.admin_id;
        END IF;
      END LOOP;
      
      -- Update admin with new code
      UPDATE admins
      SET admin_code = v_new_code,
          updated_at = NOW()
      WHERE admin_id = v_duplicate_record.admin_id;
      
      RAISE NOTICE 'Updated admin % (festival: %) from code % to %', 
        v_duplicate_record.admin_name, 
        v_duplicate_record.festival_id, 
        v_duplicate_record.admin_code, 
        v_new_code;
    END LOOP;
    
    RAISE NOTICE '✓ Fixed all duplicate admin_codes';
  ELSE
    RAISE NOTICE 'ℹ No global unique constraint found. Skipping duplicate fix.';
  END IF;
END $$;

-- ============================================
-- STEP 5: Drop Global Unique Constraint (if exists)
-- ============================================

DO $$
DECLARE
  v_constraint_name TEXT;
  v_constraint_found BOOLEAN;
BEGIN
  -- Find global unique constraint (only admin_code column)
  SELECT c.conname INTO v_constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE t.relname = 'admins'
    AND c.contype = 'u'
    AND a.attname = 'admin_code'
    AND array_length(c.conkey, 1) = 1 -- Only admin_code column (global unique)
  LIMIT 1;

  IF v_constraint_name IS NOT NULL THEN
    BEGIN
      EXECUTE format('ALTER TABLE admins DROP CONSTRAINT %I', v_constraint_name);
      RAISE NOTICE '✓ Dropped global unique constraint: %', v_constraint_name;
      v_constraint_found := TRUE;
    EXCEPTION
      WHEN undefined_object THEN
        RAISE NOTICE '⚠ Constraint % does not exist (may have been dropped already)', v_constraint_name;
      WHEN others THEN
        RAISE WARNING '⚠ Error dropping constraint %: %', v_constraint_name, SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'ℹ No global unique constraint found. Checking for per-festival constraint...';
    v_constraint_found := FALSE;
  END IF;

  -- Check if per-festival unique already exists
  IF NOT v_constraint_found THEN
    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_attribute a1 ON a1.attrelid = c.conrelid AND a1.attnum = ANY(c.conkey) AND a1.attname = 'festival_id'
      JOIN pg_attribute a2 ON a2.attrelid = c.conrelid AND a2.attnum = ANY(c.conkey) AND a2.attname = 'admin_code'
      WHERE t.relname = 'admins'
        AND c.contype = 'u'
        AND array_length(c.conkey, 1) = 2
    ) INTO v_constraint_found;

    IF v_constraint_found THEN
      RAISE NOTICE '✓ Per-festival unique constraint already exists. No changes needed.';
    END IF;
  END IF;
END $$;

-- ============================================
-- STEP 6: Add Per-Festival Unique Constraint
-- ============================================

DO $$
DECLARE
  v_per_festival_exists BOOLEAN;
BEGIN
  -- Check if per-festival unique constraint already exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a1 ON a1.attrelid = c.conrelid AND a1.attnum = ANY(c.conkey) AND a1.attname = 'festival_id'
    JOIN pg_attribute a2 ON a2.attrelid = c.conrelid AND a2.attnum = ANY(c.conkey) AND a2.attname = 'admin_code'
    WHERE t.relname = 'admins'
      AND c.contype = 'u'
      AND array_length(c.conkey, 1) = 2
  ) INTO v_per_festival_exists;

  IF NOT v_per_festival_exists THEN
    BEGIN
      ALTER TABLE admins
      ADD CONSTRAINT admins_festival_code_unique UNIQUE(festival_id, admin_code);
      RAISE NOTICE '✓ Created per-festival unique constraint: admins_festival_code_unique';
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE '✓ Per-festival unique constraint already exists (different name)';
      WHEN others THEN
        RAISE WARNING '⚠ Could not create per-festival unique constraint: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '✓ Per-festival unique constraint already exists';
  END IF;
END $$;

-- ============================================
-- STEP 7: Verify Final Constraint State
-- ============================================

SELECT
  'Final constraint state:' as check_type,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns,
  CASE
    WHEN string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) = 'admin_code' THEN '❌ GLOBAL UNIQUE - Still exists (needs manual fix)'
    WHEN string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) LIKE '%festival_id%,%admin_code%' OR
         string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) LIKE '%admin_code%,%festival_id%' THEN '✓ PER-FESTIVAL UNIQUE - Correct!'
    ELSE '❓ UNKNOWN'
  END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'admins'
  AND tc.constraint_type = 'UNIQUE'
  AND kcu.column_name IN ('admin_code', 'festival_id')
GROUP BY tc.constraint_name, tc.constraint_type
ORDER BY tc.constraint_name;

-- ============================================
-- STEP 8: Verify No Duplicates Within Festivals
-- ============================================
-- After constraint change, verify data integrity

SELECT
  'Data integrity check - duplicates within festivals:' as check_type,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ OK - No duplicates found within festivals'
    ELSE '⚠ WARNING - Found ' || COUNT(*) || ' duplicate(s) within festivals (these will cause constraint violation)'
  END as status
FROM (
  SELECT festival_id, admin_code, COUNT(*) as count
  FROM admins
  GROUP BY festival_id, admin_code
  HAVING COUNT(*) > 1
) duplicates;

-- ============================================
-- SUMMARY
-- ============================================

SELECT
  'CONSTRAINT MIGRATION COMPLETE' as status,
  'Review the output above to verify changes' as next_step,
  'If all checks show ✓, the constraint is now per-festival unique' as conclusion,
  'If warnings (⚠) appear, address them before creating new festivals' as action_required;

-- ============================================
-- NOTES
-- ============================================
-- 1. This script changes admin_code constraint from global unique to per-festival unique
-- 2. If duplicates exist across festivals, they are automatically fixed (regenerated)
-- 3. Duplicates within the same festival will cause errors - these need manual fixing
-- 4. After running this script, admin codes can be the same across different festivals
-- 5. Admin codes must still be unique within each festival
-- 6. The constraint name is: admins_festival_code_unique
--
-- Expected behavior after migration:
-- - Same admin_code CAN exist in different festivals ✓
-- - Same admin_code CANNOT exist twice in the same festival ✗
-- - Festival creation will no longer fail due to global admin_code conflicts ✓

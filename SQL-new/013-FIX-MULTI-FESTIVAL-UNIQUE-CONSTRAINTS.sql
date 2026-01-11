-- Fix Multi-Festival Unique Constraint Issue
-- This migration removes global UNIQUE constraints on name columns
-- and ensures proper composite UNIQUE constraints per festival

-- ============================================================================
-- STEP 1: Remove old global UNIQUE constraints on name column
-- ============================================================================

-- Drop the old UNIQUE constraint on groups.name
-- This constraint prevents duplicate group names across ALL festivals
DO $$ 
BEGIN
    -- Find and drop the constraint (constraint name may vary)
    DECLARE
        constraint_name TEXT;
    BEGIN
        -- Get the constraint name for groups table unique constraint on name
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'groups'
          AND nsp.nspname = 'public'
          AND con.contype = 'u'
          AND array_length(con.conkey, 1) = 1  -- Single column constraint
          AND NOT EXISTS (
              SELECT 1 
              FROM pg_attribute attr 
              WHERE attr.attrelid = rel.oid 
                AND attr.attnum = con.conkey[1] 
                AND attr.attname = 'festival_id'
          );
        
        IF constraint_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE groups DROP CONSTRAINT IF EXISTS %I', constraint_name);
            RAISE NOTICE 'Dropped old UNIQUE constraint on groups.name: %', constraint_name;
        ELSE
            RAISE NOTICE 'No old UNIQUE constraint found on groups.name (may have been already removed)';
        END IF;
    END;
END $$;

-- Drop the old UNIQUE constraint on categories.name
DO $$ 
BEGIN
    DECLARE
        constraint_name TEXT;
    BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'categories'
          AND nsp.nspname = 'public'
          AND con.contype = 'u'
          AND array_length(con.conkey, 1) = 1
          AND NOT EXISTS (
              SELECT 1 
              FROM pg_attribute attr 
              WHERE attr.attrelid = rel.oid 
                AND attr.attnum = con.conkey[1] 
                AND attr.attname = 'festival_id'
          );
        
        IF constraint_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE categories DROP CONSTRAINT IF EXISTS %I', constraint_name);
            RAISE NOTICE 'Dropped old UNIQUE constraint on categories.name: %', constraint_name;
        ELSE
            RAISE NOTICE 'No old UNIQUE constraint found on categories.name';
        END IF;
    END;
END $$;

-- Drop the old UNIQUE constraint on collection_modes.name
DO $$ 
BEGIN
    DECLARE
        constraint_name TEXT;
    BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'collection_modes'
          AND nsp.nspname = 'public'
          AND con.contype = 'u'
          AND array_length(con.conkey, 1) = 1
          AND NOT EXISTS (
              SELECT 1 
              FROM pg_attribute attr 
              WHERE attr.attrelid = rel.oid 
                AND attr.attnum = con.conkey[1] 
                AND attr.attname = 'festival_id'
          );
        
        IF constraint_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE collection_modes DROP CONSTRAINT IF EXISTS %I', constraint_name);
            RAISE NOTICE 'Dropped old UNIQUE constraint on collection_modes.name: %', constraint_name;
        ELSE
            RAISE NOTICE 'No old UNIQUE constraint found on collection_modes.name';
        END IF;
    END;
END $$;

-- Drop the old UNIQUE constraint on expense_modes.name
DO $$ 
BEGIN
    DECLARE
        constraint_name TEXT;
    BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'expense_modes'
          AND nsp.nspname = 'public'
          AND con.contype = 'u'
          AND array_length(con.conkey, 1) = 1
          AND NOT EXISTS (
              SELECT 1 
              FROM pg_attribute attr 
              WHERE attr.attrelid = rel.oid 
                AND attr.attnum = con.conkey[1] 
                AND attr.attname = 'festival_id'
          );
        
        IF constraint_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE expense_modes DROP CONSTRAINT IF EXISTS %I', constraint_name);
            RAISE NOTICE 'Dropped old UNIQUE constraint on expense_modes.name: %', constraint_name;
        ELSE
            RAISE NOTICE 'No old UNIQUE constraint found on expense_modes.name';
        END IF;
    END;
END $$;

-- ============================================================================
-- STEP 2: Ensure composite UNIQUE constraints exist (per festival)
-- ============================================================================

-- Add composite UNIQUE constraint for groups (festival_id, name)
DO $$ 
BEGIN
  ALTER TABLE groups ADD CONSTRAINT groups_unique_per_festival UNIQUE (festival_id, name);
  RAISE NOTICE 'Added composite UNIQUE constraint: groups_unique_per_festival';
EXCEPTION 
  WHEN duplicate_object THEN 
    RAISE NOTICE 'Composite UNIQUE constraint groups_unique_per_festival already exists';
  WHEN duplicate_table THEN 
    RAISE NOTICE 'Composite UNIQUE constraint groups_unique_per_festival already exists';
END $$;

-- Add composite UNIQUE constraint for categories (festival_id, name)
DO $$ 
BEGIN
  ALTER TABLE categories ADD CONSTRAINT categories_unique_per_festival UNIQUE (festival_id, name);
  RAISE NOTICE 'Added composite UNIQUE constraint: categories_unique_per_festival';
EXCEPTION 
  WHEN duplicate_object THEN 
    RAISE NOTICE 'Composite UNIQUE constraint categories_unique_per_festival already exists';
  WHEN duplicate_table THEN 
    RAISE NOTICE 'Composite UNIQUE constraint categories_unique_per_festival already exists';
END $$;

-- Add composite UNIQUE constraint for collection_modes (festival_id, name)
DO $$ 
BEGIN
  ALTER TABLE collection_modes ADD CONSTRAINT col_modes_unique_per_festival UNIQUE (festival_id, name);
  RAISE NOTICE 'Added composite UNIQUE constraint: col_modes_unique_per_festival';
EXCEPTION 
  WHEN duplicate_object THEN 
    RAISE NOTICE 'Composite UNIQUE constraint col_modes_unique_per_festival already exists';
  WHEN duplicate_table THEN 
    RAISE NOTICE 'Composite UNIQUE constraint col_modes_unique_per_festival already exists';
END $$;

-- Add composite UNIQUE constraint for expense_modes (festival_id, name)
DO $$ 
BEGIN
  ALTER TABLE expense_modes ADD CONSTRAINT exp_modes_unique_per_festival UNIQUE (festival_id, name);
  RAISE NOTICE 'Added composite UNIQUE constraint: exp_modes_unique_per_festival';
EXCEPTION 
  WHEN duplicate_object THEN 
    RAISE NOTICE 'Composite UNIQUE constraint exp_modes_unique_per_festival already exists';
  WHEN duplicate_table THEN 
    RAISE NOTICE 'Composite UNIQUE constraint exp_modes_unique_per_festival already exists';
END $$;

-- ============================================================================
-- STEP 3: Ensure festival_id is NOT NULL (data integrity)
-- ============================================================================

-- Before setting NOT NULL, we need to handle any existing NULL values
-- If there are rows with NULL festival_id, we cannot proceed

-- Check for NULL festival_id in groups
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM groups WHERE festival_id IS NULL;
    IF null_count > 0 THEN
        RAISE WARNING 'Found % rows in groups table with NULL festival_id. Please fix these before setting NOT NULL constraint.', null_count;
    ELSE
        ALTER TABLE groups ALTER COLUMN festival_id SET NOT NULL;
        RAISE NOTICE 'Set groups.festival_id to NOT NULL';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'groups.festival_id may already be NOT NULL';
END;
$$;

-- Check for NULL festival_id in categories
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM categories WHERE festival_id IS NULL;
    IF null_count > 0 THEN
        RAISE WARNING 'Found % rows in categories table with NULL festival_id. Please fix these before setting NOT NULL constraint.', null_count;
    ELSE
        ALTER TABLE categories ALTER COLUMN festival_id SET NOT NULL;
        RAISE NOTICE 'Set categories.festival_id to NOT NULL';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'categories.festival_id may already be NOT NULL';
END;
$$;

-- Check for NULL festival_id in collection_modes
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM collection_modes WHERE festival_id IS NULL;
    IF null_count > 0 THEN
        RAISE WARNING 'Found % rows in collection_modes table with NULL festival_id. Please fix these before setting NOT NULL constraint.', null_count;
    ELSE
        ALTER TABLE collection_modes ALTER COLUMN festival_id SET NOT NULL;
        RAISE NOTICE 'Set collection_modes.festival_id to NOT NULL';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'collection_modes.festival_id may already be NOT NULL';
END;
$$;

-- Check for NULL festival_id in expense_modes
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM expense_modes WHERE festival_id IS NULL;
    IF null_count > 0 THEN
        RAISE WARNING 'Found % rows in expense_modes table with NULL festival_id. Please fix these before setting NOT NULL constraint.', null_count;
    ELSE
        ALTER TABLE expense_modes ALTER COLUMN festival_id SET NOT NULL;
        RAISE NOTICE 'Set expense_modes.festival_id to NOT NULL';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'expense_modes.festival_id may already be NOT NULL';
END;
$$;

-- ============================================================================
-- STEP 4: Verify the fix
-- ============================================================================

-- Show current constraints on all four tables
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICATION REPORT ===';
    RAISE NOTICE '';
    
    -- Groups table constraints
    RAISE NOTICE 'GROUPS table constraints:';
    FOR rec IN
        SELECT con.conname, con.contype,
               array_to_string(ARRAY(
                   SELECT att.attname
                   FROM pg_attribute att
                   WHERE att.attrelid = con.conrelid
                     AND att.attnum = ANY(con.conkey)
                   ORDER BY att.attnum
               ), ', ') as columns
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'groups'
          AND con.contype = 'u'
        ORDER BY con.conname
    LOOP
        RAISE NOTICE '  - % (type: %) on columns: %', rec.conname, rec.contype, rec.columns;
    END LOOP;
    
    -- Categories table constraints
    RAISE NOTICE '';
    RAISE NOTICE 'CATEGORIES table constraints:';
    FOR rec IN
        SELECT con.conname, con.contype,
               array_to_string(ARRAY(
                   SELECT att.attname
                   FROM pg_attribute att
                   WHERE att.attrelid = con.conrelid
                     AND att.attnum = ANY(con.conkey)
                   ORDER BY att.attnum
               ), ', ') as columns
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'categories'
          AND con.contype = 'u'
        ORDER BY con.conname
    LOOP
        RAISE NOTICE '  - % (type: %) on columns: %', rec.conname, rec.contype, rec.columns;
    END LOOP;
    
    -- Collection modes table constraints
    RAISE NOTICE '';
    RAISE NOTICE 'COLLECTION_MODES table constraints:';
    FOR rec IN
        SELECT con.conname, con.contype,
               array_to_string(ARRAY(
                   SELECT att.attname
                   FROM pg_attribute att
                   WHERE att.attrelid = con.conrelid
                     AND att.attnum = ANY(con.conkey)
                   ORDER BY att.attnum
               ), ', ') as columns
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'collection_modes'
          AND con.contype = 'u'
        ORDER BY con.conname
    LOOP
        RAISE NOTICE '  - % (type: %) on columns: %', rec.conname, rec.contype, rec.columns;
    END LOOP;
    
    -- Expense modes table constraints
    RAISE NOTICE '';
    RAISE NOTICE 'EXPENSE_MODES table constraints:';
    FOR rec IN
        SELECT con.conname, con.contype,
               array_to_string(ARRAY(
                   SELECT att.attname
                   FROM pg_attribute att
                   WHERE att.attrelid = con.conrelid
                     AND att.attnum = ANY(con.conkey)
                   ORDER BY att.attnum
               ), ', ') as columns
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'expense_modes'
          AND con.contype = 'u'
        ORDER BY con.conname
    LOOP
        RAISE NOTICE '  - % (type: %) on columns: %', rec.conname, rec.contype, rec.columns;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== EXPECTED RESULT ===';
    RAISE NOTICE 'Each table should have ONE UNIQUE constraint on (festival_id, name)';
    RAISE NOTICE 'NO UNIQUE constraint should exist on just (name) alone';
    RAISE NOTICE '';
END;
$$;

-- Pre-Check: Diagnose Current State of Multi-Festival Constraints
-- Run this BEFORE applying the fix to see what's wrong
-- This script is READ-ONLY and makes no changes

DO $$
DECLARE
    rec RECORD;
    has_old_constraint BOOLEAN := FALSE;
    has_new_constraint BOOLEAN := FALSE;
    table_name_var TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MULTI-FESTIVAL CONSTRAINT DIAGNOSIS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Check each table
    FOR table_name_var IN 
        SELECT unnest(ARRAY['groups', 'categories', 'collection_modes', 'expense_modes'])
    LOOP
        RAISE NOTICE '--- TABLE: % ---', upper(table_name_var);
        
        -- Reset flags
        has_old_constraint := FALSE;
        has_new_constraint := FALSE;
        
        -- Check for old single-column UNIQUE constraint on name
        FOR rec IN
            SELECT con.conname, 
                   array_to_string(ARRAY(
                       SELECT att.attname
                       FROM pg_attribute att
                       WHERE att.attrelid = con.conrelid
                         AND att.attnum = ANY(con.conkey)
                       ORDER BY att.attnum
                   ), ', ') as columns,
                   array_length(con.conkey, 1) as num_columns
            FROM pg_constraint con
            INNER JOIN pg_class rel ON rel.oid = con.conrelid
            WHERE rel.relname = table_name_var
              AND con.contype = 'u'
            ORDER BY con.conname
        LOOP
            RAISE NOTICE 'Found constraint: % on columns [%]', rec.conname, rec.columns;
            
            -- Check if this is the old problematic constraint (single column on name)
            IF rec.num_columns = 1 AND rec.columns = 'name' THEN
                has_old_constraint := TRUE;
                RAISE NOTICE '  ❌ PROBLEM: This is the OLD global constraint that breaks multi-festival';
            END IF;
            
            -- Check if this is the new composite constraint (festival_id, name)
            IF rec.num_columns = 2 AND rec.columns LIKE '%festival_id%name%' THEN
                has_new_constraint := TRUE;
                RAISE NOTICE '  ✅ GOOD: This is the correct composite constraint for multi-festival';
            END IF;
        END LOOP;
        
        -- Summary for this table
        RAISE NOTICE '';
        IF has_old_constraint AND has_new_constraint THEN
            RAISE NOTICE '⚠️  STATUS: CONFLICTING CONSTRAINTS - Has both old and new (THIS IS THE BUG!)';
        ELSIF has_old_constraint AND NOT has_new_constraint THEN
            RAISE NOTICE '❌ STATUS: ONLY OLD CONSTRAINT - Not ready for multi-festival';
        ELSIF NOT has_old_constraint AND has_new_constraint THEN
            RAISE NOTICE '✅ STATUS: CORRECT - Only has composite constraint';
        ELSE
            RAISE NOTICE '❓ STATUS: NO UNIQUE CONSTRAINTS FOUND';
        END IF;
        
        -- Check if festival_id column exists and is NOT NULL
        SELECT 
            CASE WHEN is_nullable = 'NO' THEN TRUE ELSE FALSE END
        INTO has_new_constraint
        FROM information_schema.columns
        WHERE table_name = table_name_var
          AND column_name = 'festival_id';
        
        IF FOUND THEN
            IF has_new_constraint THEN
                RAISE NOTICE '✅ festival_id: EXISTS and is NOT NULL';
            ELSE
                RAISE NOTICE '⚠️  festival_id: EXISTS but allows NULL (should be NOT NULL)';
            END IF;
        ELSE
            RAISE NOTICE '❌ festival_id: COLUMN DOES NOT EXIST';
        END IF;
        
        -- Check for rows with NULL festival_id
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE festival_id IS NULL', table_name_var) INTO has_old_constraint;
        IF has_old_constraint THEN
            RAISE NOTICE '⚠️  WARNING: Found % rows with NULL festival_id', has_old_constraint;
        END IF;
        
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSIS COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'RECOMMENDED ACTIONS:';
    RAISE NOTICE '1. If you see "CONFLICTING CONSTRAINTS", run migration 013';
    RAISE NOTICE '2. If you see "ONLY OLD CONSTRAINT", run the multi-festival migration first';
    RAISE NOTICE '3. If you see "CORRECT", no action needed - system is working properly';
    RAISE NOTICE '';
    
END;
$$;

-- Additional detailed check: Show all unique constraints
SELECT 
    '=== ALL UNIQUE CONSTRAINTS ===' as report_section;

SELECT 
    tc.table_name, 
    tc.constraint_name,
    tc.constraint_type,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns,
    CASE 
        WHEN string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) = 'name' 
        THEN '❌ PROBLEMATIC (global constraint)'
        WHEN string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) LIKE '%festival_id%name%' 
        THEN '✅ CORRECT (per-festival constraint)'
        ELSE '❓ OTHER'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name IN ('groups', 'categories', 'collection_modes', 'expense_modes')
    AND tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name, tc.constraint_name;

-- Check festival_id nullable status
SELECT 
    '=== FESTIVAL_ID COLUMN STATUS ===' as report_section;

SELECT 
    table_name, 
    column_name, 
    is_nullable,
    data_type,
    CASE 
        WHEN is_nullable = 'NO' THEN '✅ Correct (NOT NULL)'
        ELSE '⚠️  Should be NOT NULL'
    END as status
FROM information_schema.columns
WHERE table_name IN ('groups', 'categories', 'collection_modes', 'expense_modes')
    AND column_name = 'festival_id'
    AND table_schema = 'public'
ORDER BY table_name;

-- Check for orphaned rows (NULL festival_id)
SELECT 
    '=== ORPHANED ROWS CHECK ===' as report_section;

DO $$
DECLARE
    null_count INTEGER;
    table_name_var TEXT;
BEGIN
    FOR table_name_var IN 
        SELECT unnest(ARRAY['groups', 'categories', 'collection_modes', 'expense_modes'])
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE festival_id IS NULL', table_name_var) INTO null_count;
        IF null_count > 0 THEN
            RAISE NOTICE 'Table %: % rows with NULL festival_id ⚠️', table_name_var, null_count;
        ELSE
            RAISE NOTICE 'Table %: No orphaned rows ✅', table_name_var;
        END IF;
    END LOOP;
END;
$$;

-- Test query: Can we insert duplicate names in different festivals?
SELECT 
    '=== CURRENT BEHAVIOR TEST ===' as report_section;

DO $$
DECLARE
    test_festival_1 UUID;
    test_festival_2 UUID;
    can_insert_same_name BOOLEAN := FALSE;
BEGIN
    -- Get two different festival IDs (if they exist)
    SELECT id INTO test_festival_1 FROM festivals ORDER BY created_at LIMIT 1 OFFSET 0;
    SELECT id INTO test_festival_2 FROM festivals ORDER BY created_at LIMIT 1 OFFSET 1;
    
    IF test_festival_1 IS NOT NULL AND test_festival_2 IS NOT NULL THEN
        RAISE NOTICE 'Testing with Festival 1: %', test_festival_1;
        RAISE NOTICE 'Testing with Festival 2: %', test_festival_2;
        
        -- Try to determine if we can insert duplicate names
        -- We'll check if the old constraint exists
        SELECT COUNT(*) > 0 INTO can_insert_same_name
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'groups'
          AND con.contype = 'u'
          AND array_length(con.conkey, 1) = 1;
        
        IF can_insert_same_name THEN
            RAISE NOTICE '❌ Current behavior: Cannot create groups with same name in different festivals';
            RAISE NOTICE '   Reason: Old UNIQUE(name) constraint is active';
            RAISE NOTICE '   Fix: Run migration 013 to remove old constraint';
        ELSE
            RAISE NOTICE '✅ Current behavior: Can create groups with same name in different festivals';
            RAISE NOTICE '   System is working correctly for multi-festival';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  Need at least 2 festivals to test multi-festival behavior';
        RAISE NOTICE '   Current festival count: %', (SELECT COUNT(*) FROM festivals);
    END IF;
END;
$$;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRE-CHECK COMPLETE';
    RAISE NOTICE '========================================';
END;
$$;

# Migration 013: Fix Multi-Festival Unique Constraints

## Overview
This migration fixes the "Group already exists" error that occurs when trying to create groups, categories, or modes with the same name in different festivals.

## Problem
The database has TWO conflicting unique constraints:
1. **OLD:** `UNIQUE(name)` - prevents duplicate names across ALL festivals
2. **NEW:** `UNIQUE(festival_id, name)` - allows duplicate names in different festivals

The old constraint was never removed during the multi-festival migration, causing conflicts.

## Solution
This migration:
1. ✅ Removes old global UNIQUE constraints on `name` column
2. ✅ Ensures composite UNIQUE constraints on `(festival_id, name)` exist
3. ✅ Sets `festival_id` to NOT NULL for data integrity
4. ✅ Verifies the fix with a detailed report

## Affected Tables
- `groups`
- `categories`
- `collection_modes`
- `expense_modes`

## How to Apply

### Step 1: Run Pre-Check (Optional)
Before applying the migration, you can check current constraints:

```sql
-- Check current constraints on groups table
SELECT con.conname, con.contype,
       array_to_string(ARRAY(
           SELECT att.attname
           FROM pg_attribute att
           WHERE att.attrelid = con.conrelid
             AND att.attnum = ANY(con.conkey)
       ), ', ') as columns
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'groups'
  AND con.contype = 'u';
```

### Step 2: Apply the Migration
1. Open Supabase SQL Editor
2. Copy the contents of `013-FIX-MULTI-FESTIVAL-UNIQUE-CONSTRAINTS.sql`
3. Paste and run the SQL
4. Check the NOTICE messages in the output

### Step 3: Review the Output
The migration will output messages like:
```
NOTICE:  Dropped old UNIQUE constraint on groups.name: groups_name_key
NOTICE:  Composite UNIQUE constraint groups_unique_per_festival already exists
NOTICE:  Set groups.festival_id to NOT NULL
NOTICE:  === VERIFICATION REPORT ===
NOTICE:  GROUPS table constraints:
NOTICE:    - groups_unique_per_festival (type: u) on columns: festival_id, name
```

## Expected Result
After applying the migration, each table should have:
- ✅ ONE UNIQUE constraint on `(festival_id, name)`
- ❌ NO UNIQUE constraint on just `(name)` alone

## Testing

### Test Case 1: Create Same Group Name in Different Festivals
1. Go to Festival A admin page
2. Create a group called "Test Group" ✅ Should succeed
3. Go to Festival B admin page
4. Create a group called "Test Group" ✅ Should succeed (was failing before)

### Test Case 2: Prevent Duplicate in Same Festival
1. Go to Festival A admin page
2. Try to create another group called "Test Group" ❌ Should fail with error
3. Error message should be "Group already exists"

### Test Case 3: Verify Data Isolation
1. Go to Festival A admin page
2. Verify you see only Festival A's groups
3. Go to Festival B admin page
4. Verify you see only Festival B's groups

### Test All Affected Features
Repeat the tests above for:
- ✅ Groups (in Collections)
- ✅ Categories (in Expenses)
- ✅ Collection Modes
- ✅ Expense Modes

## Rollback (if needed)
If you need to rollback this migration:

```sql
-- Rollback: Re-add global UNIQUE constraints (NOT RECOMMENDED)
-- Only use this if you want to return to single-festival mode

ALTER TABLE groups ADD CONSTRAINT groups_name_key UNIQUE (name);
ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);
ALTER TABLE collection_modes ADD CONSTRAINT collection_modes_name_key UNIQUE (name);
ALTER TABLE expense_modes ADD CONSTRAINT expense_modes_name_key UNIQUE (name);

-- Remove composite constraints
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_unique_per_festival;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_unique_per_festival;
ALTER TABLE collection_modes DROP CONSTRAINT IF EXISTS col_modes_unique_per_festival;
ALTER TABLE expense_modes DROP CONSTRAINT IF EXISTS exp_modes_unique_per_festival;
```

**⚠️ WARNING:** Rolling back will break multi-festival functionality!

## Data Integrity Notes

### NULL festival_id Handling
The migration checks for NULL `festival_id` values before setting NOT NULL constraint. If found, you'll see a WARNING:
```
WARNING:  Found X rows in groups table with NULL festival_id. 
          Please fix these before setting NOT NULL constraint.
```

If you see this warning, run:
```sql
-- Find orphaned rows
SELECT * FROM groups WHERE festival_id IS NULL;
SELECT * FROM categories WHERE festival_id IS NULL;
SELECT * FROM collection_modes WHERE festival_id IS NULL;
SELECT * FROM expense_modes WHERE festival_id IS NULL;

-- Option 1: Delete orphaned rows
DELETE FROM groups WHERE festival_id IS NULL;
DELETE FROM categories WHERE festival_id IS NULL;
DELETE FROM collection_modes WHERE festival_id IS NULL;
DELETE FROM expense_modes WHERE festival_id IS NULL;

-- Option 2: Assign to a default festival (get festival_id first)
SELECT id, code, event_name FROM festivals LIMIT 5;
-- Then update (replace YOUR_FESTIVAL_ID with actual ID)
UPDATE groups SET festival_id = 'YOUR_FESTIVAL_ID' WHERE festival_id IS NULL;
```

## Safety
This migration is **SAFE** because:
- ✅ Uses `DO $$ ... END $$;` blocks for error handling
- ✅ Checks for existing constraints before dropping/adding
- ✅ Validates data before setting NOT NULL
- ✅ Provides detailed verification report
- ✅ No data is deleted or modified
- ✅ Only constraint changes

## Post-Migration Checks

### Verify Constraints
```sql
-- Should show ONLY composite constraints
SELECT 
    tc.table_name, 
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('groups', 'categories', 'collection_modes', 'expense_modes')
    AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name, tc.constraint_name;
```

Expected output:
```
table_name       | constraint_name                 | columns
-----------------+---------------------------------+-------------------
groups           | groups_unique_per_festival      | festival_id, name
categories       | categories_unique_per_festival  | festival_id, name
collection_modes | col_modes_unique_per_festival   | festival_id, name
expense_modes    | exp_modes_unique_per_festival   | festival_id, name
```

### Verify NOT NULL
```sql
-- Should show festival_id as NOT NULL for all tables
SELECT 
    table_name, 
    column_name, 
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name IN ('groups', 'categories', 'collection_modes', 'expense_modes')
    AND column_name = 'festival_id';
```

Expected output:
```
table_name       | column_name | is_nullable | data_type
-----------------+-------------+-------------+-----------
groups           | festival_id | NO          | uuid
categories       | festival_id | NO          | uuid
collection_modes | festival_id | NO          | uuid
expense_modes    | festival_id | NO          | uuid
```

## Related Documentation
- `DIAGNOSIS-MULTI-FESTIVAL-UNIQUE-CONSTRAINT.md` - Detailed diagnosis report
- `SQL/supabase-migration-multifestive.sql` - Original multi-festival migration
- `SQL/supabase-schema.sql` - Original schema with problematic constraints

## Support
If you encounter any issues:
1. Check the NOTICE/WARNING messages in the SQL output
2. Review the verification report at the end of the migration
3. Run the post-migration checks above
4. Refer to the diagnosis document for more details

## Migration Status
- **Created:** 2025-01-11
- **Status:** Ready to apply
- **Breaking Changes:** None
- **Rollback Available:** Yes (not recommended)
- **Testing Required:** Yes

# Multi-Festival Unique Constraint Issue - Diagnosis Report

## Issue Summary
When trying to create a group in a new festival, the system shows "Group already exists" error even though the group only exists in a different festival. The same issue affects:
- Groups
- Categories
- Collection Modes
- Expense Modes

## Root Cause Analysis

### Database Schema Problem
The tables have **TWO conflicting unique constraints**:

1. **OLD CONSTRAINT (PROBLEMATIC):**
   - `UNIQUE(name)` on just the name column
   - From original schema: `SQL/supabase-schema.sql`
   - Lines 51, 58, 65, 72
   - **Problem:** Prevents duplicate names across ALL festivals globally

2. **NEW CONSTRAINT (CORRECT):**
   - `UNIQUE(festival_id, name)` composite constraint
   - From migration: `SQL/supabase-migration-multifestive.sql`
   - Lines 50, 54, 58, 62
   - **Correct:** Allows duplicate names across different festivals

### Why This Happened
When the multi-festival migration was applied:
- ✅ Added `festival_id` column to all tables
- ✅ Added new composite unique constraints `UNIQUE(festival_id, name)`
- ❌ **Failed to remove** the old `UNIQUE(name)` constraints

The old constraints are still active and causing the error!

## Affected Tables

### 1. `groups` table
- **Old constraint:** `name TEXT NOT NULL UNIQUE`
- **New constraint:** `groups_unique_per_festival UNIQUE (festival_id, name)`
- **Error message:** "Group already exists"
- **Error code:** 23505 (unique_violation)

### 2. `categories` table
- **Old constraint:** `name TEXT NOT NULL UNIQUE`
- **New constraint:** `categories_unique_per_festival UNIQUE (festival_id, name)`
- **Error message:** "Category already exists"
- **Error code:** 23505 (unique_violation)

### 3. `collection_modes` table
- **Old constraint:** `name TEXT NOT NULL UNIQUE`
- **New constraint:** `col_modes_unique_per_festival UNIQUE (festival_id, name)`
- **Error message:** "Mode already exists"
- **Error code:** 23505 (unique_violation)

### 4. `expense_modes` table
- **Old constraint:** `name TEXT NOT NULL UNIQUE`
- **New constraint:** `exp_modes_unique_per_festival UNIQUE (festival_id, name)`
- **Error message:** "Mode already exists"
- **Error code:** 23505 (unique_violation)

## Application Code Analysis

### ✅ Code is Correct
All queries properly filter by `festival_id`:

**Admin Page (@app/f/[code]/admin/page.tsx):**
```typescript
// Fetching - Line 147-150
supabase.from("groups").select("*").eq("festival_id", fest.id)
supabase.from("categories").select("*").eq("festival_id", fest.id)
supabase.from("collection_modes").select("*").eq("festival_id", fest.id)
supabase.from("expense_modes").select("*").eq("festival_id", fest.id)

// Inserting - Lines 245, 287, 335, 383
.insert({ name: newGroup.trim(), festival_id: festival.id })
.insert({ name: newCategory.trim(), festival_id: festival.id })
.insert({ name: newCollectionMode.trim(), festival_id: festival.id })
.insert({ name: newExpenseMode.trim(), festival_id: festival.id })

// Deleting - Lines 267, 309, 357, 405
.delete().eq("name", groupName).eq("festival_id", festival.id)
```

**Collection Page (@app/f/[code]/collection/page.tsx):**
```typescript
// Line 53-54
supabase.from('groups').select('name').eq('festival_id', fest.id)
supabase.from('collection_modes').select('name').eq('festival_id', fest.id)
```

**Expense Page (@app/f/[code]/expense/page.tsx):**
```typescript
// Line 52-53
supabase.from('categories').select('name').eq('festival_id', fest.id)
supabase.from('expense_modes').select('name').eq('festival_id', fest.id)
```

**Transaction Page (@app/f/[code]/transaction/page.tsx):**
```typescript
// Line 53-54
supabase.from('collection_modes').select('name').eq('festival_id', fest.id)
supabase.from('expense_modes').select('name').eq('festival_id', fest.id)
```

### Conclusion
The application code is **completely correct** and properly isolated by festival. Only the database schema needs to be fixed.

## Required Fixes

### 1. Remove Old UNIQUE Constraints
Drop the single-column unique constraints on `name`:
- `groups.name` UNIQUE constraint
- `categories.name` UNIQUE constraint
- `collection_modes.name` UNIQUE constraint
- `expense_modes.name` UNIQUE constraint

### 2. Verify Composite Constraints Exist
Ensure these composite unique constraints are in place:
- `groups_unique_per_festival (festival_id, name)`
- `categories_unique_per_festival (festival_id, name)`
- `col_modes_unique_per_festival (festival_id, name)`
- `exp_modes_unique_per_festival (festival_id, name)`

### 3. Ensure NOT NULL on festival_id
The `festival_id` column must be NOT NULL for data integrity:
- `groups.festival_id NOT NULL`
- `categories.festival_id NOT NULL`
- `collection_modes.festival_id NOT NULL`
- `expense_modes.festival_id NOT NULL`

## Impact Assessment

### ✅ Safe Changes
- Removing old constraints is safe because:
  - The composite constraints provide the same protection per festival
  - All application code already uses `festival_id` in queries
  - No existing functionality will break

### ⚠️ Data Integrity
- The fix will allow multiple festivals to have the same group/category/mode names
- This is **intended behavior** for a multi-festival system
- Each festival maintains its own namespace

### 🔄 Testing Required
After applying the fix, test:
1. Create a group "Test Group" in Festival A ✅
2. Create a group "Test Group" in Festival B ✅ (should now work!)
3. Try to create duplicate "Test Group" in Festival A ❌ (should still fail)
4. Verify queries return only festival-specific data ✅

## Related Files
- `SQL/supabase-schema.sql` - Original schema with problematic constraints
- `SQL/supabase-migration-multifestive.sql` - Migration that added composite constraints
- `app/f/[code]/admin/page.tsx` - Main admin page with CRUD operations
- `app/f/[code]/collection/page.tsx` - Collection page
- `app/f/[code]/expense/page.tsx` - Expense page
- `app/f/[code]/transaction/page.tsx` - Transaction page

## Next Steps
1. ✅ Diagnosis complete
2. ⏳ Create SQL migration to fix constraints
3. ⏳ Apply migration to database
4. ⏳ Test multi-festival group creation
5. ⏳ Update documentation

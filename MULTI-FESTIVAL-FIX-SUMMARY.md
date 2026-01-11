# Multi-Festival Constraint Fix - Complete Summary

## 🎯 Problem
When trying to create a **group**, **category**, **collection mode**, or **expense mode** in a new festival, you get the error:
- **"Group already exists"**
- **"Category already exists"**
- **"Mode already exists"**

Even though the item only exists in a DIFFERENT festival.

## 🔍 Root Cause
The database has **TWO conflicting unique constraints**:

1. **❌ OLD CONSTRAINT (Problematic):**
   - `UNIQUE(name)` on just the name column
   - Prevents duplicate names across ALL festivals globally
   - Left over from single-festival version

2. **✅ NEW CONSTRAINT (Correct):**
   - `UNIQUE(festival_id, name)` composite constraint
   - Allows duplicate names in different festivals
   - Added during multi-festival migration

The old constraint was **never removed**, so it's still blocking duplicate names across festivals!

## 📊 Impact
### Affected Tables:
- ✅ `groups` - Collection groups
- ✅ `categories` - Expense categories
- ✅ `collection_modes` - Payment modes for collections
- ✅ `expense_modes` - Payment modes for expenses

### Affected Features:
- Creating groups in festival admin page
- Creating categories in festival admin page
- Creating collection modes in festival admin page
- Creating expense modes in festival admin page

## ✅ Solution

### Step 1: Diagnosis (Optional but Recommended)
Run this to see the current state without making changes:

```bash
SQL-new/013-PRE-CHECK-CURRENT-STATE.sql
```

This will show you:
- Which constraints currently exist
- Which constraints are problematic
- If you have any orphaned data
- Current system behavior

### Step 2: Apply the Fix
Run this migration in your Supabase SQL Editor:

```bash
SQL-new/013-FIX-MULTI-FESTIVAL-UNIQUE-CONSTRAINTS.sql
```

This migration will:
1. ✅ Remove old global UNIQUE constraints on `name`
2. ✅ Ensure composite UNIQUE constraints on `(festival_id, name)` exist
3. ✅ Set `festival_id` to NOT NULL for data integrity
4. ✅ Provide detailed verification report

### Step 3: Review Output
Check the NOTICE messages. You should see:
```
NOTICE:  Dropped old UNIQUE constraint on groups.name: groups_name_key
NOTICE:  Composite UNIQUE constraint groups_unique_per_festival already exists
NOTICE:  Set groups.festival_id to NOT NULL
NOTICE:  === VERIFICATION REPORT ===
```

### Step 4: Test
1. Go to Festival A → Admin → Create group "Test Group" ✅
2. Go to Festival B → Admin → Create group "Test Group" ✅ (Should work now!)
3. Go to Festival A → Admin → Try to create "Test Group" again ❌ (Should fail)

## 📁 Files Created

### Documentation:
- **`DIAGNOSIS-MULTI-FESTIVAL-UNIQUE-CONSTRAINT.md`** - Detailed technical diagnosis
- **`MULTI-FESTIVAL-FIX-SUMMARY.md`** - This file, quick summary
- **`SQL-new/013-INSTRUCTIONS.md`** - Complete migration instructions with testing

### SQL Scripts:
- **`SQL-new/013-PRE-CHECK-CURRENT-STATE.sql`** - Diagnostic script (read-only)
- **`SQL-new/013-FIX-MULTI-FESTIVAL-UNIQUE-CONSTRAINTS.sql`** - The fix (apply this)

## 🔒 Safety

### Why This Fix is Safe:
- ✅ Uses proper error handling (DO $$ ... END $$)
- ✅ Checks for existing constraints before dropping/adding
- ✅ Validates data before setting NOT NULL
- ✅ Provides detailed verification report
- ✅ No data is deleted or modified
- ✅ Only removes redundant constraints

### What Could Go Wrong:
1. **Orphaned rows with NULL festival_id:**
   - The migration will warn you
   - Fix by deleting or assigning to a festival
   - See instructions in `013-INSTRUCTIONS.md`

2. **Old constraint name is different:**
   - Migration uses dynamic SQL to find constraint by structure
   - Should handle any constraint name

3. **Composite constraint doesn't exist:**
   - Migration will create it
   - Uses exception handling to avoid duplicates

## 🧪 Testing Checklist

After applying the fix, test all four features:

### Groups (Collections):
- [ ] Create group "Sales Team" in Festival A ✅
- [ ] Create group "Sales Team" in Festival B ✅ (same name, different festival)
- [ ] Try duplicate "Sales Team" in Festival A ❌ (should fail)
- [ ] Delete "Sales Team" from Festival A ✅
- [ ] Verify Festival B still has "Sales Team" ✅

### Categories (Expenses):
- [ ] Create category "Food" in Festival A ✅
- [ ] Create category "Food" in Festival B ✅
- [ ] Try duplicate "Food" in Festival A ❌
- [ ] Verify data isolation between festivals ✅

### Collection Modes:
- [ ] Create mode "Cash" in Festival A ✅
- [ ] Create mode "Cash" in Festival B ✅
- [ ] Try duplicate "Cash" in Festival A ❌
- [ ] Verify data isolation ✅

### Expense Modes:
- [ ] Create mode "Credit Card" in Festival A ✅
- [ ] Create mode "Credit Card" in Festival B ✅
- [ ] Try duplicate "Credit Card" in Festival A ❌
- [ ] Verify data isolation ✅

## 🔧 Code Analysis

The application code is **already correct** and doesn't need changes:

### Fetching Data:
```typescript
// Already filtered by festival_id ✅
supabase.from("groups").select("*").eq("festival_id", fest.id)
```

### Inserting Data:
```typescript
// Already includes festival_id ✅
supabase.from("groups").insert({ 
  name: newGroup.trim(), 
  festival_id: festival.id 
})
```

### Deleting Data:
```typescript
// Already filtered by festival_id ✅
supabase.from("groups")
  .delete()
  .eq("name", groupName)
  .eq("festival_id", festival.id)
```

**Conclusion:** Only the database schema needs to be fixed. No code changes required.

## 📈 Expected Behavior

### Before Fix:
```
Festival A: Create "Group 1" → ✅ Success
Festival B: Create "Group 1" → ❌ Error: "Group already exists"
```

### After Fix:
```
Festival A: Create "Group 1" → ✅ Success
Festival B: Create "Group 1" → ✅ Success (different festival)
Festival A: Create "Group 1" → ❌ Error: "Group already exists" (same festival)
```

## 🚀 Quick Start

**If you just want to fix it quickly:**

1. Open Supabase SQL Editor
2. Copy and paste: `SQL-new/013-FIX-MULTI-FESTIVAL-UNIQUE-CONSTRAINTS.sql`
3. Click "Run"
4. Check for success messages
5. Test creating same group name in two different festivals

**If you want to understand it first:**

1. Read: `DIAGNOSIS-MULTI-FESTIVAL-UNIQUE-CONSTRAINT.md`
2. Run: `SQL-new/013-PRE-CHECK-CURRENT-STATE.sql`
3. Read: `SQL-new/013-INSTRUCTIONS.md`
4. Apply: `SQL-new/013-FIX-MULTI-FESTIVAL-UNIQUE-CONSTRAINTS.sql`
5. Test: Follow testing checklist above

## 🔄 Rollback

If you need to rollback (NOT RECOMMENDED):

```sql
-- Re-add global constraints (breaks multi-festival)
ALTER TABLE groups ADD CONSTRAINT groups_name_key UNIQUE (name);
ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);
ALTER TABLE collection_modes ADD CONSTRAINT collection_modes_name_key UNIQUE (name);
ALTER TABLE expense_modes ADD CONSTRAINT expense_modes_name_key UNIQUE (name);

-- Remove per-festival constraints
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_unique_per_festival;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_unique_per_festival;
ALTER TABLE collection_modes DROP CONSTRAINT IF EXISTS col_modes_unique_per_festival;
ALTER TABLE expense_modes DROP CONSTRAINT IF EXISTS exp_modes_unique_per_festival;
```

**⚠️ WARNING:** Rollback will break multi-festival functionality!

## 📞 Support

If you encounter issues:
1. Check NOTICE/WARNING messages in SQL output
2. Review verification report at end of migration
3. Run post-migration checks in `013-INSTRUCTIONS.md`
4. Check `DIAGNOSIS-MULTI-FESTIVAL-UNIQUE-CONSTRAINT.md` for technical details

## ✅ Migration Checklist

- [ ] Backup database (optional, migration is non-destructive)
- [ ] Run pre-check diagnostic script
- [ ] Review current constraints
- [ ] Apply fix migration
- [ ] Review output messages
- [ ] Run verification queries
- [ ] Test group creation in multiple festivals
- [ ] Test category creation in multiple festivals
- [ ] Test collection mode creation
- [ ] Test expense mode creation
- [ ] Verify data isolation between festivals
- [ ] Update project documentation

## 📝 Notes

- **No code changes needed** - Only database schema fix
- **Non-destructive** - No data is deleted
- **Idempotent** - Safe to run multiple times
- **Backward compatible** - Existing data works correctly after fix
- **Well-tested logic** - Uses proper error handling

## 🎉 Expected Outcome

After applying this fix:
- ✅ Each festival can have its own groups with any names
- ✅ Each festival can have its own categories with any names
- ✅ Each festival can have its own collection modes
- ✅ Each festival can have its own expense modes
- ✅ No conflicts between festivals
- ✅ Proper data isolation maintained
- ✅ Duplicate prevention within same festival still works

Your multi-festival system will work as intended! 🎊

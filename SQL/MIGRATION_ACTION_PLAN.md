# 🎯 SQL Migration - Action Plan

## ⚡ Quick Answer

**You got an error because the `usage_count` column is missing from your `user_passwords` table.**

This means the existing multi-admin migrations (001, 002, 003, rpc) were run, but they didn't include the usage tracking columns.

---

## ✅ SOLUTION: Run the Patch File

### Step 1: Run the Patch (2 minutes)

**File:** `SQL/PATCH_ADD_MISSING_COLUMNS.sql`

**What it does:**
- ✅ Adds `usage_count` column to `user_passwords` table
- ✅ Adds `last_used_at` column to `user_passwords` table
- ✅ Adds `admin_display_preference` column to `festivals` table
- ✅ Creates indexes for performance
- ✅ Verifies columns were added

**How to run:**
1. Open Supabase SQL Editor
2. Copy entire content of `SQL/PATCH_ADD_MISSING_COLUMNS.sql`
3. Paste and click "Run"
4. Should see: "✅ Patch applied successfully!"

**Safety:** 100% safe - uses `IF NOT EXISTS`, won't error if columns already exist

---

### Step 2: Verify Patch Worked (30 seconds)

Run this query:
\`\`\`sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_passwords' 
AND column_name IN ('usage_count', 'last_used_at');
\`\`\`

**Expected result:** 2 rows (usage_count, last_used_at)

---

### Step 3: Re-run Check Script (30 seconds)

Now run `SQL/CHECK_MIGRATION_STATUS.sql` again.

**Expected result:** Should complete without errors and show:
- ✅ All tables exist
- ✅ Columns added
- ✅ Functions exist
- ✅ Admins created
- ✅ "MIGRATION COMPLETE - No action needed!"

---

## 📊 What Happened?

### Your Current State:
- ✅ Tables created (admins, user_passwords, admin_activity_log)
- ✅ Columns added (created_by_admin_id, etc.)
- ✅ RPC functions created (log_admin_activity, verify_admin_credentials)
- ✅ Data migrated (Primary Admin created)
- ✅ Banner fields added
- ❌ **Missing:** usage_count, last_used_at columns

### Why Missing?
The existing `multi-admin-001.sql` file didn't include these columns. They were added in my new consolidated migration file.

### Impact:
- ❌ CHECK_MIGRATION_STATUS.sql failed (tried to query non-existent column)
- ❌ ManageUserPasswordsModal will fail (tries to display usage_count)
- ❌ PasswordGate will fail (tries to update usage_count)

### Fix:
✅ Run PATCH_ADD_MISSING_COLUMNS.sql to add the missing columns

---

## 🚀 Complete Migration Steps

### If You Haven't Run Anything Yet:

**Option A: Use Existing Files (Recommended)**
\`\`\`sql
-- Run in order:
1. multi-admin-001.sql
2. multi-admin-002.sql
3. multi-admin-003.sql
4. multi-admin-rpc.sql
5. PATCH_ADD_MISSING_COLUMNS.sql (adds missing columns)
\`\`\`

**Option B: Use My Consolidated File**
\`\`\`sql
-- Run just this one file:
supabase-migration-multi-admin-system.sql
\`\`\`

---

### If You Already Ran Existing Files (Your Case):

**Just run the patch:**
\`\`\`sql
PATCH_ADD_MISSING_COLUMNS.sql
\`\`\`

This adds the missing columns without affecting anything else.

---

## 🔍 Detailed Column Comparison

### Existing multi-admin-001.sql Creates:
\`\`\`sql
user_passwords (
  password_id UUID,
  festival_id UUID,
  admin_id UUID,
  password VARCHAR(255),
  label VARCHAR(255),
  is_active BOOLEAN,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
\`\`\`

### Missing Columns (Added by Patch):
\`\`\`sql
usage_count INTEGER DEFAULT 0,
last_used_at TIMESTAMPTZ
\`\`\`

### Why These Are Needed:
- **usage_count:** Tracks how many times a password has been used
- **last_used_at:** Tracks when password was last used
- Both are displayed in ManageUserPasswordsModal
- Both are updated when visitor logs in

---

## ✅ FINAL ACTION PLAN

### Step-by-Step:

1. **Run Patch File** (REQUIRED)
   \`\`\`
   File: SQL/PATCH_ADD_MISSING_COLUMNS.sql
   Time: 30 seconds
   Risk: None (100% safe)
   \`\`\`

2. **Verify Patch**
   \`\`\`sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'user_passwords';
   \`\`\`
   Should show: usage_count, last_used_at

3. **Re-run Check Script**
   \`\`\`
   File: SQL/CHECK_MIGRATION_STATUS.sql
   Should complete without errors
   \`\`\`

4. **Start Testing**
   \`\`\`bash
   npm run dev
   \`\`\`

---

## 🎉 After Patch

Your database will have:
- ✅ All tables (admins, user_passwords, admin_activity_log)
- ✅ All columns (including usage_count, last_used_at)
- ✅ All RPC functions
- ✅ All indexes
- ✅ All RLS policies
- ✅ Primary Admin for each festival
- ✅ Migrated user passwords
- ✅ Banner visibility fields
- ✅ Admin display preference

**Status:** 100% Ready for Testing! 🚀

---

## 📝 Summary

**Error Cause:** Missing columns (usage_count, last_used_at)  
**Solution:** Run PATCH_ADD_MISSING_COLUMNS.sql  
**Time Required:** 30 seconds  
**Risk Level:** Zero (completely safe)  
**Next Step:** Run patch, then start testing  

---

**Ready to proceed? Run the patch file and you're good to go!** 🎊

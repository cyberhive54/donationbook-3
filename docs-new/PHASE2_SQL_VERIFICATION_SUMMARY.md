# Phase 2 SQL Verification Summary

## ✅ Verification Complete

I've verified the Phase 2 implementation against the database schema and found **4 potential issues** that need to be addressed.

---

## 📋 Issues Found & Status

### ✅ **Issue 1: Admin Code Format Constraint** - **FIXED IN CODE**
- **Status:** ✅ Code already handles this correctly
- **Problem:** Database has constraint: `admin_code ~ '^[A-Z0-9]{6}$'` (exactly 6 uppercase alphanumeric)
- **Fix:** Updated `app/create/page.tsx` to ensure generated code always meets format (lines 183-191, 208-215)
- **Action Required:** ✅ **NONE** - Code is correct

---

### ⚠️ **Issue 2: Admin Code Uniqueness Constraint** - **NEEDS VERIFICATION**
- **Status:** ⚠️ **VERIFY IN DATABASE**
- **Problem:** Two SQL files have conflicting constraints:
  - `multi-admin-001.sql`: `admin_code VARCHAR(6) NOT NULL UNIQUE` (globally unique)
  - `supabase-migration-multi-admin-system.sql`: `UNIQUE(festival_id, admin_code)` (per-festival unique)
- **Current Code Behavior:** Checks uniqueness within festival (correct if per-festival unique exists)
- **Action Required:** 
  1. Run the verification SQL script: `SQL-new/002-PHASE2-VERIFY-AND-FIX.sql`
  2. Check which constraint actually exists in your database
  3. If global unique exists, you have two options:
     - **Option A:** Change code to check globally (not recommended - less flexible)
     - **Option B:** Remove global unique and add per-festival unique (recommended)
       ```sql
       ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_admin_code_key;
       ALTER TABLE admins ADD CONSTRAINT admins_festival_code_unique UNIQUE(festival_id, admin_code);
       ```

---

### ⚠️ **Issue 3: User Password Unique Constraints** - **MIGHT NEED FIX**
- **Status:** ⚠️ **VERIFY IN DATABASE**
- **Problem:** Need both constraints:
  1. `UNIQUE(festival_id, password)` - Password unique per festival (checked in code)
  2. `UNIQUE(admin_id, label)` - Label unique per admin (not checked in code, but should exist)
- **Current Code Behavior:** 
  - ✅ Checks `UNIQUE(festival_id, password)` when creating user password (line 198-203 in create/page.tsx)
  - ⚠️ Doesn't check `UNIQUE(admin_id, label)` but should exist in database
- **Action Required:**
  1. Run verification SQL script
  2. If `UNIQUE(festival_id, password)` doesn't exist, add it:
     ```sql
     ALTER TABLE user_passwords
     ADD CONSTRAINT user_passwords_festival_password_unique 
     UNIQUE(festival_id, password);
     ```
  3. If `UNIQUE(admin_id, label)` doesn't exist, add it:
     ```sql
     ALTER TABLE user_passwords
     ADD CONSTRAINT user_passwords_admin_label_unique 
     UNIQUE(admin_id, label);
     ```

---

### ✅ **Issue 4: RLS Policies** - **LIKELY OK, BUT VERIFY**
- **Status:** ✅ Should work, but verify
- **Problem:** During festival creation (public/anonymous), we insert into `admins` and `user_passwords` tables
- **Current SQL Files Show:**
  - ✅ Public insert policies exist in both `multi-admin-001.sql` and `supabase-migration-multi-admin-system.sql`
  - ✅ Policies allow public inserts: `CREATE POLICY ... FOR INSERT WITH CHECK (true)`
- **Action Required:**
  1. Run verification SQL script
  2. If policies don't exist, the script will create them automatically

---

## 🛠️ SQL Script Created

I've created a comprehensive verification and fix script:

**File:** `SQL-new/002-PHASE2-VERIFY-AND-FIX.sql`

**What it does:**
1. ✅ Checks and creates `admin_code_format` constraint if missing
2. ⚠️ **Informs** you about admin_code uniqueness constraint (you need to verify which one exists)
3. ✅ Creates `UNIQUE(festival_id, password)` constraint on `user_passwords` if missing
4. ✅ Creates `UNIQUE(admin_id, label)` constraint on `user_passwords` if missing
5. ✅ Checks and creates RLS insert policies if missing
6. ✅ Verifies table structure has all required columns

**How to use:**
1. Open Supabase SQL Editor
2. Copy and paste the entire `SQL-new/002-PHASE2-VERIFY-AND-FIX.sql` file
3. Run it
4. Review the output messages (NOTICE statements) to see what was created/fixed
5. Check the final verification queries to see status

---

## ✅ Code Changes Made (Already Fixed)

1. **Admin Code Generation** (`app/create/page.tsx`):
   - ✅ Generates exactly 6 uppercase alphanumeric characters
   - ✅ Pads with random characters if name is too short
   - ✅ Validates final code meets format: `^[A-Z0-9]{6}$`
   - ✅ Checks uniqueness within festival scope

2. **Password Constraints** (`app/create/page.tsx`):
   - ✅ Checks `UNIQUE(festival_id, password)` when creating user password
   - ✅ Uses unique label "Default Password" for first password

---

## 📝 Recommendations

### **Before Testing Phase 2:**

1. **MUST DO:**
   - Run `SQL-new/002-PHASE2-VERIFY-AND-FIX.sql` in your Supabase SQL Editor
   - Verify which admin_code uniqueness constraint exists in your database
   - If global unique exists, decide whether to:
     - Keep it and update code (not recommended)
     - OR remove it and add per-festival unique (recommended)

2. **SHOULD DO:**
   - Verify RLS policies allow public inserts on `admins` and `user_passwords` tables
   - Test festival creation with a test festival to ensure defaults are created correctly

3. **NICE TO HAVE:**
   - Check if constraints already exist before running the fix script (it uses `IF NOT EXISTS` but good to verify)

---

## ⚠️ Critical Action Required

**The admin_code uniqueness constraint is the most critical issue.** 

If your database has **global unique** (`UNIQUE(admin_code)`), festival creation will fail because:
- Our code checks within festival scope only
- But database enforces globally
- This means if another festival has the same admin_code, insert will fail

**Solution:** Ensure your database has `UNIQUE(festival_id, admin_code)` instead of `UNIQUE(admin_code)`.

**SQL to fix (if needed):**
```sql
-- First, check what constraint exists:
SELECT 
  tc.constraint_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admins'
  AND tc.constraint_type = 'UNIQUE'
  AND kcu.column_name IN ('admin_code', 'festival_id')
GROUP BY tc.constraint_name;

-- If global unique exists (only 'admin_code' in columns), remove it:
-- ALTER TABLE admins DROP CONSTRAINT <constraint_name>;

-- Then add per-festival unique:
-- ALTER TABLE admins ADD CONSTRAINT admins_festival_code_unique UNIQUE(festival_id, admin_code);
```

---

## ✅ Summary

- **Code Changes:** ✅ Complete and correct
- **SQL Verification Script:** ✅ Created at `SQL-new/002-PHASE2-VERIFY-AND-FIX.sql`
- **Action Required:** ⚠️ **Run the SQL script and verify constraints**
- **Critical Issue:** ⚠️ **Admin_code uniqueness constraint type needs verification**

**Next Steps:**
1. Run the SQL verification script
2. Verify admin_code uniqueness constraint is per-festival (not global)
3. Test festival creation
4. If issues occur, refer to the SQL script output for diagnostics

---

**Last Updated:** 2026-01-10  
**Status:** Code ready, SQL verification needed

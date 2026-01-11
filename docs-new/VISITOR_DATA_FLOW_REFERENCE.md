# Visitor Activity Data Flow - Complete Reference

## 🗄️ **TABLES USED**

### **1. `access_logs` Table**
**This is the MAIN table that stores ALL visitor login/logout data**

**Location:** Supabase Database → Public Schema → `access_logs` table

**Columns:**
```sql
id                          UUID (Primary Key)
festival_id                 UUID (Foreign Key → festivals.id)
visitor_name                TEXT (Visitor's name as entered)
access_method               TEXT ('password_modal' or 'direct_link')
password_used               TEXT (Password value that was used - legacy)
accessed_at                 TIMESTAMPTZ (Login time)
user_agent                  TEXT (Browser info)
ip_address                  TEXT (IP address)
session_id                  TEXT (Unique session ID)
logout_at                   TIMESTAMPTZ (Logout time - NULL if not logged out)
session_duration_seconds    INTEGER (How long session lasted)
logout_method               TEXT ('manual' or 'automatic')
admin_id                    UUID (Which admin owns the password)
user_password_id            UUID (Which specific password was used)
auth_method                 TEXT (Authentication method)
```

**Created by:** `SQL/supabase-migration-access-logging.sql`  
**Enhanced by:** `SQL/supabase-migration-multi-admin-system.sql` (adds admin_id, user_password_id)  
**Enhanced by:** `SQL-new/006-ADD-DOWNLOAD-CONTROL-AND-LOGOUT-TRACKING.sql` (adds logout fields)

---

## 📊 **WHERE DATA IS SAVED**

### **When Visitor Logs In:**

**File:** `components/PasswordGate.tsx`  
**Line:** 323-330

**Code:**
```typescript
await supabase.rpc('log_festival_access', {
  p_festival_id: festival.id,
  p_visitor_name: sanitizedName,
  p_access_method: 'password_modal',
  p_password_used: password.trim(),
  p_session_id: visitorSession.sessionId,
  p_admin_id: passwordData.admin_id,
  p_user_password_id: passwordData.password_id
});
```

**SQL Function:** `log_festival_access()`  
**Inserts into:** `access_logs` table  
**Sets:**
- `festival_id` = festival UUID
- `visitor_name` = sanitized visitor name
- `accessed_at` = NOW()
- `access_method` = 'password_modal'
- `admin_id` = admin UUID (NEW)
- `user_password_id` = password UUID (NEW)
- `session_id` = unique session ID
- `logout_at` = NULL (not logged out yet)

---

### **When Visitor Logs Out:**

**File:** `components/GlobalSessionBar.tsx`  
**Line:** 95-100

**Code:**
```typescript
const { data: logData, error: logError } = await supabase.rpc('log_visitor_logout', {
  p_festival_id: session.festivalId,
  p_visitor_name: session.visitorName,
  p_session_id: session.sessionId,
  p_logout_method: 'manual'
});
```

**SQL Function:** `log_visitor_logout()`  
**Updates:** SAME record in `access_logs` table  
**Sets:**
- `logout_at` = NOW()
- `session_duration_seconds` = calculated duration
- `logout_method` = 'manual'

**Note:** This function searches for the matching login record using:
```sql
WHERE festival_id = p_festival_id
  AND visitor_name = TRIM(p_visitor_name)
  AND session_id = p_session_id
  AND logout_at IS NULL
```

---

## 📥 **WHERE DATA IS FETCHED**

### **1. Visitor Activity Page** (`/f/[code]/activity`)

**File:** `app/f/[code]/activity/page.tsx`  
**Line:** 89-94

**Query:**
```typescript
const { data: logs } = await supabase
  .from('access_logs')
  .select('*')
  .eq('festival_id', fest.id)
  .eq('visitor_name', session.visitorName)
  .order('accessed_at', { ascending: false });
```

**Fetches from:** `access_logs` table  
**Filters by:**
- `festival_id` = current festival's UUID
- `visitor_name` = current logged-in visitor's name (exact match)
- Orders by `accessed_at` descending (newest first)

**Displays:** Login/logout history for CURRENT visitor only

---

### **2. Admin Activity Page** (`/f/[code]/admin/activity`)

**File:** `app/f/[code]/admin/activity/page.tsx`  
**Line:** 217-220

**Query:**
```typescript
const { data: visitorsData } = await supabase
  .from('access_logs')
  .select('*')
  .eq('festival_id', fest.id)
  .order('accessed_at', { ascending: false });
```

**Fetches from:** `access_logs` table  
**Filters by:**
- `festival_id` = current festival's UUID only
- NO visitor_name filter (gets ALL visitors)
- Orders by `accessed_at` descending

**Displays:** ALL visitor login/logout records for this festival

---

### **3. Super Admin Activity Page** (`/f/[code]/admin/sup/activity`)

**File:** `app/f/[code]/admin/sup/activity/page.tsx`  
**Line:** 176-179

**Query:**
```typescript
const { data: visitorsData } = await supabase
  .from('access_logs')
  .select('*')
  .eq('festival_id', fest.id)
  .order('accessed_at', { ascending: false });
```

**Fetches from:** `access_logs` table (same as admin activity)  
**Displays:** ALL visitor records

---

## 🔍 **MANUAL DATABASE CHECK QUERIES**

### **Step 1: Check if table exists**
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'access_logs'
);
```
**Expected:** `true`

---

### **Step 2: Check total records**
```sql
SELECT COUNT(*) as total_visitor_records 
FROM access_logs;
```
**Expected:** Number > 0 (if any visitors have logged in)  
**If 0:** NO data is being saved - function call is failing

---

### **Step 3: View all data**
```sql
SELECT * FROM access_logs 
ORDER BY accessed_at DESC 
LIMIT 20;
```
**Look for:**
- Your visitor names (e.g., "Test User 1", "Test User 2", "Test User 3")
- Login timestamps (accessed_at)
- Festival ID

---

### **Step 4: Check for your specific festival**
```sql
-- First, get your festival ID:
SELECT id, code, event_name FROM festivals WHERE code = 'YOUR_FESTIVAL_CODE';

-- Then check access_logs for that festival_id:
SELECT 
  visitor_name,
  accessed_at,
  logout_at,
  admin_id,
  user_password_id
FROM access_logs
WHERE festival_id = '<PASTE_ID_FROM_ABOVE>'
ORDER BY accessed_at DESC;
```

---

### **Step 5: Check if functions exist**
```sql
-- Check log_festival_access
SELECT routine_name, specific_name
FROM information_schema.routines
WHERE routine_name IN ('log_festival_access', 'log_visitor_logout');
```
**Expected:** 2 rows (both functions exist)  
**If 0 or 1:** Function(s) missing - need to run migration

---

### **Step 6: Test function manually**
```sql
-- Get festival ID first:
SELECT id FROM festivals WHERE code = 'YOUR_FESTIVAL_CODE';

-- Then call log_festival_access manually:
SELECT log_festival_access(
  '<PASTE_FESTIVAL_ID>',  -- p_festival_id
  'Manual Test User',      -- p_visitor_name
  'password_modal',        -- p_access_method
  'test123',              -- p_password_used
  NULL,                   -- p_user_agent
  NULL,                   -- p_ip_address
  'manual-test-session'   -- p_session_id
);

-- Should return a UUID (the log record ID)
-- If ERROR, shows what's wrong
```

**After running above, check if record was created:**
```sql
SELECT * FROM access_logs 
WHERE visitor_name = 'Manual Test User';
```

**Clean up test:**
```sql
DELETE FROM access_logs WHERE visitor_name = 'Manual Test User';
```

---

## 🔎 **WHAT TO LOOK FOR**

### **Scenario A: Table has NO data at all**
```sql
SELECT COUNT(*) FROM access_logs;
-- Returns: 0
```

**Problem:** `log_festival_access` function is NOT being called or is failing silently

**Solutions:**
1. Check browser console for errors when logging in
2. Check if function exists (Part 5)
3. Check if RLS policies allow INSERT
4. Run migrations: `supabase-migration-access-logging.sql`

---

### **Scenario B: Table has data but wrong festival_id**
```sql
SELECT festival_id, COUNT(*) 
FROM access_logs 
GROUP BY festival_id;
-- Shows data for different festival
```

**Problem:** Data is being saved for wrong festival

**Solutions:**
1. Check if festival code is correct
2. Check if visitor is logging into correct festival
3. Verify festival_id being passed to function

---

### **Scenario C: Table has data but admin_id is NULL**
```sql
SELECT admin_id, user_password_id, COUNT(*) 
FROM access_logs 
GROUP BY admin_id, user_password_id;
-- Shows admin_id = NULL
```

**Problem:** Old migration version running (before admin_id was added)

**Solutions:**
1. Run migration: `supabase-migration-multi-admin-system.sql`
2. Check if columns exist (Part 1)
3. Update log_festival_access function with new parameters

---

### **Scenario D: Table has data but visitor names don't match**
```sql
SELECT DISTINCT visitor_name 
FROM access_logs 
ORDER BY visitor_name;
-- Shows names but not the ones you entered
```

**Problem:** Name is being transformed/sanitized differently

**Solutions:**
1. Check what names are actually stored
2. Compare with what's shown in activity page filter
3. Check sanitization function

---

### **Scenario E: Column doesn't exist**
```sql
SELECT * FROM access_logs LIMIT 1;
-- ERROR: column "admin_id" does not exist
```

**Problem:** Migration not run properly

**Solutions:**
1. Run: `SQL/supabase-migration-multi-admin-system.sql`
2. Run: `SQL-new/006-ADD-DOWNLOAD-CONTROL-AND-LOGOUT-TRACKING.sql`
3. Verify columns added (Part 1)

---

## 📋 **SUMMARY: TABLES & QUERIES**

### **Single Source of Truth:**
**Table:** `access_logs`  
**Schema:** public  
**Purpose:** Stores ALL visitor login/logout activity

### **Data Flow:**

```
Visitor Login (PasswordGate.tsx)
    ↓
Calls: log_festival_access() RPC function
    ↓
Inserts into: access_logs table
    ↓
Sets: festival_id, visitor_name, accessed_at, admin_id, etc.
    ↓
Data saved ✓

Visitor Logout (GlobalSessionBar.tsx)
    ↓
Calls: log_visitor_logout() RPC function
    ↓
Updates: Same record in access_logs table
    ↓
Sets: logout_at, session_duration_seconds, logout_method
    ↓
Data updated ✓

Activity Pages Fetch
    ↓
Query: SELECT * FROM access_logs WHERE festival_id = ?
    ↓
Display: Visitor data in table
```

### **If "No visitors found" shows:**

**Check in this order:**
1. ✅ Table exists: `SELECT * FROM access_logs LIMIT 1;`
2. ✅ Has any data: `SELECT COUNT(*) FROM access_logs;`
3. ✅ Has data for your festival: `SELECT * FROM access_logs WHERE festival_id = '...'`
4. ✅ Functions exist: Check log_festival_access and log_visitor_logout
5. ✅ RLS policies allow SELECT: Check pg_policies
6. ✅ Columns exist: Check admin_id, user_password_id, logout_at

---

## 🎯 **ACTION ITEMS FOR YOU**

### **Run These SQL Queries in Order:**

1. **Check if data exists at all:**
   ```sql
   SELECT COUNT(*) FROM access_logs;
   ```
   **→ Tell me the count**

2. **Check your festival ID:**
   ```sql
   SELECT id, code FROM festivals WHERE code = 'YOUR_CODE';
   ```
   **→ Tell me the festival code and ID**

3. **Check data for your festival:**
   ```sql
   SELECT * FROM access_logs WHERE festival_id = '<ID_FROM_STEP_2>';
   ```
   **→ Tell me how many rows returned**

4. **Check if columns exist:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'access_logs'
   ORDER BY column_name;
   ```
   **→ Tell me if admin_id, user_password_id, logout_at are in the list**

5. **Check if functions exist:**
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name IN ('log_festival_access', 'log_visitor_logout');
   ```
   **→ Tell me which functions are returned**

---

## 📝 **FILES TO REFERENCE**

- **@SQL-new/DIAGNOSE-VISITOR-DATA.sql** - Complete diagnostic queries (RUN THIS)
- **@docs-new/VISITOR_ACTIVITY_LOGGING_FIX.md** - Bug fix documentation

---

## ⚡ **MOST LIKELY CAUSES**

1. **Migration not run** - access_logs table doesn't have admin_id/user_password_id columns
2. **Function not updated** - log_festival_access doesn't accept admin_id parameter yet
3. **RLS policy blocking** - Can insert but can't select
4. **Wrong festival_id** - Data is there but for different festival
5. **Function failing silently** - Error not shown in console

**Run the diagnostic queries in DIAGNOSE-VISITOR-DATA.sql and share the results with me!**

# 🚨 VISITOR DATA NOT SHOWING - QUICK DIAGNOSTIC

## Run These 5 Queries in Supabase SQL Editor

Copy and paste each query, replace the placeholders, and **share the results with me**.

---

## Query 1: Check if access_logs table has ANY data

```sql
SELECT COUNT(*) as total_records FROM access_logs;
```

**→ What number do you get?**  
- If **0** = NO data is being saved at all (function not being called)
- If **> 0** = Data exists, but might be for wrong festival

---

## Query 2: View ALL data in access_logs (last 20 records)

```sql
SELECT 
  visitor_name,
  accessed_at as login_time,
  logout_at,
  festival_id,
  admin_id,
  user_password_id
FROM access_logs
ORDER BY accessed_at DESC
LIMIT 20;
```

**→ Share screenshot or paste the results**  
**Look for:**
- Do you see your visitor names? (Test User 1, Test User 2, Test User 3)
- What are the festival_id values?
- Are admin_id and user_password_id NULL or have UUIDs?
- Are logout_at values NULL or have timestamps?

---

## Query 3: Get your festival's ID and code

```sql
SELECT id, code, event_name 
FROM festivals 
ORDER BY created_at DESC;
```

**→ Find your festival and copy its ID (UUID)**

---

## Query 4: Check access_logs for YOUR specific festival

```sql
-- Replace 'PASTE_YOUR_FESTIVAL_ID' with the ID from Query 3
SELECT 
  visitor_name,
  accessed_at,
  logout_at,
  admin_id,
  user_password_id,
  session_id
FROM access_logs
WHERE festival_id = 'PASTE_YOUR_FESTIVAL_ID'
ORDER BY accessed_at DESC;
```

**→ How many rows returned?**  
- If **0** = Data is being saved for different festival ID
- If **> 0** = Data exists! Issue is in how page is fetching it

---

## Query 5: Check if required columns exist

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'access_logs'
AND column_name IN ('admin_id', 'user_password_id', 'logout_at', 'session_duration_seconds')
ORDER BY column_name;
```

**→ How many rows returned?**  
- Should be **4 rows** (all 4 columns exist)
- If **< 4** = Missing columns - need to run migrations

---

## Also Check Browser Console

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Login as visitor**
4. **Look for these logs:**

```
[PasswordGate] Attempting to log visitor access: { ... }
[PasswordGate] log_festival_access result: { data: ..., error: ... }
```

**→ Share what you see, especially if there's an error**

---

## What to Tell Me

Please share:

1. **Query 1 result:** Total count number
2. **Query 2 result:** Screenshot or paste the data
3. **Query 3 result:** Your festival ID and code
4. **Query 4 result:** Number of rows and data
5. **Query 5 result:** Which columns exist
6. **Console logs:** Any errors when logging in as visitor

This will tell me exactly where the problem is! 🎯

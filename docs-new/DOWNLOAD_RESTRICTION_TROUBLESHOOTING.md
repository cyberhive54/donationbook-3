# Download Restriction Troubleshooting Guide

## Issue: Downloads Still Working After Disabling

If you've disabled downloads at the festival level but downloads are still working, follow these steps:

---

## Step 1: Check Your Viewing Mode

**Most Common Issue:** You're logged in as Admin or Super Admin

### What to Check:
1. Look at the top of the Showcase page
2. Do you see a **yellow/amber banner** that says "🔓 Admin Mode"?
3. If YES → That's why downloads work! Admins bypass all restrictions (intentional)

### Solution:
**To test download restrictions as a visitor:**
1. Open an **Incognito/Private browser window**
2. Navigate to your festival's showcase page
3. Login with a **visitor/user password** (NOT admin password)
4. Now try to download → should be blocked

**OR**

1. Logout from admin session
2. Login with a visitor/user password
3. Test downloads → should be blocked

---

## Step 2: Verify Database Settings

Run this SQL query in Supabase SQL Editor:

```sql
-- Check your festival's download settings
-- Replace 'YOUR_FESTIVAL_CODE' with your actual code
SELECT 
    code,
    event_name,
    allow_media_download,
    CASE 
        WHEN allow_media_download IS NULL THEN 'NOT SET (defaults to enabled)'
        WHEN allow_media_download = TRUE THEN 'ENABLED - Downloads allowed'
        WHEN allow_media_download = FALSE THEN 'DISABLED - Downloads blocked'
    END as status
FROM festivals
WHERE code = 'YOUR_FESTIVAL_CODE';
```

### Expected Results:

**If downloads should be BLOCKED:**
```
allow_media_download = FALSE
status = "DISABLED - Downloads blocked"
```

**If column doesn't exist:**
```
ERROR: column "allow_media_download" does not exist
```
→ **Solution:** Run migration 006-ADD-DOWNLOAD-CONTROL-AND-LOGOUT-TRACKING.sql

**If value is NULL:**
```
allow_media_download = NULL
status = "NOT SET (defaults to enabled)"
```
→ **Solution:** Explicitly set it to FALSE (see Step 3)

---

## Step 3: Set Download Restriction Correctly

### Method 1: Via Admin UI (Recommended)

1. Login as **Super Admin**
2. Go to **Admin Dashboard**
3. Click **Edit Festival** button
4. Scroll down to find: **"Allow visitors to download media (festival-wide)"** checkbox
5. **UNCHECK** the checkbox
6. Click **Save**
7. Refresh the page
8. Verify the setting saved

### Method 2: Via SQL (If UI doesn't work)

```sql
-- Disable downloads for your festival
UPDATE festivals
SET allow_media_download = FALSE
WHERE code = 'YOUR_FESTIVAL_CODE';

-- Verify it worked
SELECT code, allow_media_download FROM festivals WHERE code = 'YOUR_FESTIVAL_CODE';
-- Should show: allow_media_download = FALSE
```

---

## Step 4: Clear Cache and Test

After setting `allow_media_download = FALSE`:

1. **Logout completely** from all sessions
2. **Clear browser cache** (or use Incognito/Private window)
3. Navigate to Showcase page
4. Login with **visitor password** (NOT admin)
5. Try to download media
6. **Expected:** Lock icons appear, downloads blocked

---

## Step 5: Check Console Logs (For Debugging)

1. Open browser **Developer Tools** (F12)
2. Go to **Console** tab
3. Navigate to Showcase page
4. Look for logs like:

```
Festival data loaded: {
  code: "YOUR_CODE",
  allow_media_download: false,  ← Should be FALSE
  session_type: "visitor"        ← Should NOT be "admin"
}

canDownload check: {
  session_type: "visitor",       ← Should NOT be "admin"
  festival_allow: false,          ← Should be FALSE
  album_allow: true,
  active_album: "Album Name"
}

Downloads allowed or Festival blocks downloads  ← Should say "Festival blocks downloads"
```

### What Each Log Means:

**If you see:**
```
session_type: "admin"
Downloads allowed
```
→ You're logged in as admin. Use visitor account to test.

**If you see:**
```
festival_allow: true
Downloads allowed
```
→ Festival setting is still enabled. Go back to Step 3.

**If you see:**
```
festival_allow: false
Festival blocks downloads
```
→ Working correctly! If downloads still work, check if you're admin.

**If you see:**
```
festival_allow: undefined
Downloads allowed
```
→ Column doesn't exist or is NULL. Run migration in Step 6.

---

## Step 6: Run Database Migration (If Column Missing)

If the `allow_media_download` column doesn't exist:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open file: `SQL-new/006-ADD-DOWNLOAD-CONTROL-AND-LOGOUT-TRACKING.sql`
3. Copy and paste the entire SQL script
4. Click **Run**
5. Verify:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'festivals' AND column_name = 'allow_media_download';
```

Should return:
```
column_name           | data_type | column_default
allow_media_download  | boolean   | true
```

6. After migration, go back to **Step 3** to set the value to FALSE

---

## Step 7: Test All Scenarios

### Scenario 1: Visitor with Festival Block
**Setup:** 
- Festival: `allow_media_download = FALSE`
- Album: `allow_download = TRUE`
- Login as: **Visitor**

**Expected:**
- ❌ No downloads (lock icons everywhere)
- ❌ Bulk download disabled
- ❌ All media types blocked

**Test:**
1. Go to Showcase
2. Verify lock icons on download buttons
3. Try to download → should show error
4. Right-click image → should be prevented

---

### Scenario 2: Admin Override
**Setup:**
- Festival: `allow_media_download = FALSE`
- Login as: **Admin** or **Super Admin**

**Expected:**
- ✅ Downloads work (admin bypass)
- ✅ See amber banner: "Admin Mode"
- ✅ All download buttons work

**Test:**
1. Login as Admin
2. See amber banner at top
3. Download buttons should be green and working
4. This is **correct behavior**

---

### Scenario 3: Album-Level Block
**Setup:**
- Festival: `allow_media_download = TRUE`
- Album A: `allow_download = FALSE`
- Album B: `allow_download = TRUE`
- Login as: **Visitor**

**Expected:**
- ❌ Album A: downloads blocked
- ✅ Album B: downloads allowed

**Test:**
1. Select Album A → lock icons
2. Select Album B → green download buttons
3. Both albums in same festival, different settings

---

## Common Mistakes

### ❌ Mistake 1: Testing While Logged In As Admin
**Problem:** Admins can always download (bypasses restrictions)
**Solution:** Test with visitor account in incognito window

### ❌ Mistake 2: Not Logging Out After Changing Setting
**Problem:** Session cached old permission state
**Solution:** Logout completely, clear cache, login again

### ❌ Mistake 3: Migration Not Run
**Problem:** Column doesn't exist in database
**Solution:** Run 006-ADD-DOWNLOAD-CONTROL-AND-LOGOUT-TRACKING.sql

### ❌ Mistake 4: Value is NULL Instead of FALSE
**Problem:** NULL defaults to TRUE (enabled)
**Solution:** Explicitly set to FALSE via UI or SQL

### ❌ Mistake 5: Wrong Festival Code
**Problem:** Checking settings for different festival
**Solution:** Verify festival code in URL matches query

---

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] 1. Are you logged in as **Admin/Super Admin**?
  - If YES → Use visitor account to test
  
- [ ] 2. Is there an **amber banner** at top of Showcase?
  - If YES → You're in admin mode (restrictions don't apply)
  
- [ ] 3. Run SQL: `SELECT allow_media_download FROM festivals WHERE code = 'YOUR_CODE';`
  - Should return: `FALSE`
  
- [ ] 4. Check browser console for logs
  - Should show: `festival_allow: false`
  
- [ ] 5. Test in **Incognito window** with **visitor password**
  - Should see: Lock icons, downloads blocked
  
- [ ] 6. Column exists? `\d festivals` in psql
  - Should show: `allow_media_download | boolean | default true`

---

## Expected Behavior Summary

### For Visitors (Non-Admin):

**When Festival Blocks Downloads:**
```
✓ Lock icons on all download buttons
✓ "Downloads are disabled" error message
✓ Bulk download shows "Download Disabled"
✓ Video/audio controls hide download option
✓ Right-click prevented on all images
✓ Cannot open external links (if downloads blocked)
```

**When Festival Allows Downloads:**
```
✓ Green download buttons
✓ Downloads work normally
✓ Bulk download works
✓ External links open in new tab
✓ Video/audio controls show download
✓ Right-click still prevented (for consistency)
```

### For Admins:

**Always:**
```
✓ See amber banner: "Admin Mode"
✓ All download buttons work (green)
✓ Can download all media
✓ Bypass all restrictions
✓ This is intentional and correct
```

---

## Still Not Working?

If you've followed all steps and downloads still work for visitors:

1. **Confirm you're testing as visitor:**
   - Open incognito window
   - Use visitor/user password (NOT admin)
   - Should NOT see amber "Admin Mode" banner

2. **Confirm database value:**
   ```sql
   SELECT code, allow_media_download 
   FROM festivals 
   WHERE code = 'YOUR_CODE';
   ```
   Must return: `allow_media_download = false` (lowercase false, not NULL)

3. **Check browser console:**
   - Open DevTools (F12) → Console
   - Should see: `festival_allow: false`
   - Should see: `session_type: "visitor"`
   - Should see: `Festival blocks downloads`

4. **Hard refresh:**
   - Windows: Ctrl + Shift + R
   - Mac: Cmd + Shift + R
   - Or clear all site data

5. **Provide debug info:**
   - Screenshot of console logs
   - Screenshot of SQL query result
   - Screenshot of page (showing if amber banner is visible)
   - User role you're testing with

---

## Need More Help?

Share this information:

1. **SQL Query Result:**
```sql
SELECT code, event_name, allow_media_download 
FROM festivals 
WHERE code = 'YOUR_CODE';
```

2. **Console Logs:**
- Open F12 → Console
- Copy all logs that start with "Festival data loaded" and "canDownload check"

3. **Viewing Mode:**
- Are you logged in as Admin, Super Admin, or Visitor?
- Is there an amber "Admin Mode" banner visible?

4. **Browser:**
- Chrome/Firefox/Safari/Edge?
- Version?
- Incognito mode or normal?

5. **Screenshots:**
- Showcase page showing download buttons
- Browser console logs
- SQL query results

---

## Summary

**Most common cause:** Testing while logged in as Admin

**Solution:** Test as visitor in incognito window

**Verification:** 
1. No amber banner
2. Lock icons visible
3. Console shows `session_type: "visitor"` and `festival_allow: false`
4. Downloads blocked with error message

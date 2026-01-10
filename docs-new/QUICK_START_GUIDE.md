# 🚀 Multi-Admin System - Quick Start Guide

## ⚡ Get Started in 5 Minutes!

### Step 1: Run Database Migration (2 minutes)

1. Open Supabase Dashboard: https://supabase.com
2. Go to SQL Editor
3. Copy and paste the entire content of: `SQL/supabase-migration-multi-admin-system.sql`
4. Click "Run"
5. Wait for success message

**Verification:**
\`\`\`sql
-- Run this to verify migration succeeded:
SELECT f.code, f.event_name, a.admin_code, a.admin_name 
FROM festivals f 
JOIN admins a ON f.id = a.festival_id;

-- You should see one "Primary Admin" (ADMIN1) for each festival
\`\`\`

---

### Step 2: Start Application (1 minute)

\`\`\`bash
cd donationbook_capy
npm run dev
\`\`\`

Open browser: `http://localhost:3000`

---

### Step 3: Test Super Admin Login (1 minute)

1. Navigate to: `http://localhost:3000/f/{YOUR_FESTIVAL_CODE}/admin/sup/login`
2. Enter your super admin password (the one you set when creating the festival)
3. Click "Login as Super Admin"
4. You should see the Super Admin Dashboard

**What you'll see:**
- Festival code and copy URL button
- Basic info section
- Stats cards
- **Admin Management section** (new!)
- Super admin password section
- Banner visibility settings
- Quick links to Admin Dashboard, Analytics, Activity

---

### Step 4: Create Your First Admin (1 minute)

1. In Super Admin Dashboard, scroll to "Admin Management"
2. Click "Create Admin" button
3. Fill in details:
   - Admin Code: `JOHN01` (or leave auto-generated)
   - Admin Name: `John Admin`
   - Password: `john123`
   - Max User Passwords: `3`
   - Active: ✓ (checked)
4. Click "Create Admin"
5. Success! Admin created.

---

### Step 5: Test Admin Login (30 seconds)

1. Open new tab: `http://localhost:3000/f/{YOUR_FESTIVAL_CODE}/admin/login`
2. Enter:
   - Admin Code/Name: `JOHN01` (or `John Admin`)
   - Password: `john123`
3. Click "Login as Admin"
4. You should see the Admin Dashboard

**What you'll see:**
- Festival code and copy URL
- Basic info
- Stats cards
- Collections and expenses tables
- Groups, categories, modes settings
- Admin password section
- **User Password Management section** (new!)
- Showcase section
- NO super admin features (theme, delete festival, super admin password)

---

### Step 6: Create User Password (30 seconds)

1. In Admin Dashboard, find "User Password Management" section
2. Click "Manage Passwords" button
3. Click "Add New Password"
4. Fill in:
   - Password: `visitor123`
   - Label: `Password 1` (auto-filled, editable)
5. Click "Save"
6. Success! User password created.

---

### Step 7: Test Visitor Login (30 seconds)

1. Open new tab: `http://localhost:3000/f/{YOUR_FESTIVAL_CODE}`
2. Enter:
   - Your Name: `Test Visitor`
   - Password: `visitor123`
3. Click "Continue"
4. You should see the Festival Dashboard

**What you'll see:**
- Festival banner (respects visibility settings)
- Stats cards
- Recent transactions
- Bottom navigation
- **Global session bar** showing your name and admin info

---

## 🎯 Quick Feature Tests

### Test 1: Device ID & Name Pre-fill
1. Login as visitor with name "John"
2. Logout
3. Return to login page
4. Name should be pre-filled as "John" (locked)
5. Click pencil icon to edit
6. Change to "John2"
7. Login successfully

### Test 2: Name Uniqueness
1. Login as "John"
2. Logout
3. Try to login as "john" (lowercase)
4. Should show error: "Name already in use"
5. Try "John2" - should work

### Test 3: Concurrent Session
1. Login as "John"
2. Without logging out, try to login again
3. Should show warning: "Already logged in. Continue will logout previous session."
4. Click "Continue"
5. Previous session logged out, new session created

### Test 4: Admin Creates Collection
1. Login as admin
2. Click "Add Collection"
3. If super admin: See "Collected By" dropdown with all admins
4. If regular admin: No dropdown (auto-filled with your admin)
5. Fill in details and save
6. Verify collection is created

### Test 5: Force Logout (Password Deactivated)
1. Login as visitor using "Password 1"
2. In another tab, login as admin
3. Admin deactivates "Password 1"
4. Visitor should see yellow warning banner
5. Banner shows: "Your password has been deactivated. You will be logged out in 5 minutes."
6. Countdown timer shows time remaining
7. After 5 minutes, visitor is logged out

### Test 6: Force Logout (Admin Deactivated)
1. Login as admin
2. In another tab, login as super admin
3. Super admin deactivates the admin
4. Admin should see "Account deactivated" message
5. Admin is logged out immediately

### Test 7: Banner Visibility
1. Login as super admin
2. Scroll to "Banner Visibility Settings"
3. Uncheck "Guide" and "Mentor"
4. Click "Save Banner Settings"
5. Navigate to festival page
6. Verify Guide and Mentor are not shown in banner

### Test 8: Activity Logging
1. Perform various actions (add collection, edit expense, create admin, etc.)
2. Navigate to activity page
3. Verify all actions are logged with:
   - Timestamp
   - Action type
   - Admin name
   - Action details

---

## 🎊 Success Indicators

After completing the quick start, you should have:

- ✅ Database migrated successfully
- ✅ "Primary Admin" created for existing festivals
- ✅ Super admin dashboard accessible
- ✅ New admin created and can login
- ✅ User password created
- ✅ Visitor can login with user password
- ✅ Device ID generated and stored
- ✅ Name pre-fill working
- ✅ Activity logging working
- ✅ Banner visibility controls working
- ✅ Force logout working
- ✅ Global session bar showing correct info

---

## 🐛 Common Issues & Quick Fixes

### Issue: "RPC function log_admin_activity does not exist"
**Fix:** Re-run the migration SQL. The function should be created in Step 4.

### Issue: "Table admins does not exist"
**Fix:** Migration didn't run. Run the migration SQL in Supabase SQL Editor.

### Issue: "Cannot read property 'admin_id' of null"
**Fix:** Admin data not loaded. Check if admins table has data. Run migration if empty.

### Issue: "Session validation error"
**Fix:** Clear localStorage and login again. Session might be corrupted.

### Issue: "Warning banner not showing"
**Fix:** Check browser console for errors. Ensure sessionValidator.ts is imported correctly.

---

## 📞 Need Help?

### Check These Files:
1. `PHASE3_COMPLETE_SUMMARY.md` - Detailed implementation summary
2. `MULTI_ADMIN_SYSTEM_README.md` - Complete user guide
3. `ADMIN_DASHBOARD_CHANGES.md` - Admin dashboard changes
4. `PHASE3_PROGRESS.md` - Progress report

### Debugging:
1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify migration ran successfully
4. Check localStorage for session data
5. Verify RPC functions exist in Supabase

---

## 🎉 You're All Set!

The Multi-Admin System is now fully functional. Enjoy managing your festivals with multiple admins, user passwords, activity tracking, and more!

**Happy Festival Managing! 🎊**

---

**Quick Start Guide Version:** 1.0.0  
**Last Updated:** January 7, 2026

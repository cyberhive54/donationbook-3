# Showcase Errors - Complete Fix Guide

## Errors You're Experiencing:

1. ❌ **"Failed to save album"** when editing/creating albums
2. ❌ **"New row violates row-level security policy"** when uploading media

---

## Root Causes:

### Error 1: Failed to Save Album
**Cause**: The code was trying to set `updated_at` field which doesn't exist in the `albums` table.

**Fixed**: ✅ Removed the `updated_at` field from the update query.

### Error 2: RLS Policy Violation
**Cause**: Row Level Security (RLS) policies on `media_items` table are not properly configured or have conflicts.

**Fix Required**: Run the SQL fix script in Supabase.

---

## 🔧 STEP-BY-STEP FIX

### Step 1: Update Code (Already Done ✅)

I've already fixed the code:
- Fixed `AddEditAlbumModal.tsx` - Removed `updated_at`
- Improved error messages in both modals
- Added console logging for debugging

### Step 2: Fix Supabase RLS Policies 🔴 **YOU NEED TO DO THIS**

**Go to Supabase Dashboard:**

1. Open your Supabase project
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Copy and paste this SQL:

\`\`\`sql
-- Fix for Showcase RLS issues
-- Drop existing policies to avoid conflicts
drop policy if exists albums_public_select on albums;
drop policy if exists albums_public_insert on albums;
drop policy if exists albums_public_update on albums;
drop policy if exists albums_public_delete on albums;

drop policy if exists media_public_select on media_items;
drop policy if exists media_public_insert on media_items;
drop policy if exists media_public_update on media_items;
drop policy if exists media_public_delete on media_items;

-- Recreate policies with explicit permissions
create policy albums_public_select on albums
  for select using (true);

create policy albums_public_insert on albums
  for insert with check (true);

create policy albums_public_update on albums
  for update using (true) with check (true);

create policy albums_public_delete on albums
  for delete using (true);

create policy media_public_select on media_items
  for select using (true);

create policy media_public_insert on media_items
  for insert with check (true);

create policy media_public_update on media_items
  for update using (true) with check (true);

create policy media_public_delete on media_items
  for delete using (true);

-- Verify RLS is enabled
alter table albums enable row level security;
alter table media_items enable row level security;

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on table albums to anon, authenticated;
grant all on table media_items to anon, authenticated;
\`\`\`

5. Click **"Run"** button (or press Ctrl+Enter)
6. You should see **"Success. No rows returned"**

### Step 3: Verify Storage Bucket Exists 🔴 **CRITICAL**

The RLS error can also happen if the storage bucket doesn't exist.

**Check Storage Bucket:**

1. In Supabase Dashboard, click **"Storage"** in left sidebar
2. Look for a bucket named **`showcase`**

**If it doesn't exist:**

3. Click **"New bucket"**
4. Name: **`showcase`** (exactly this)
5. Check **"Public bucket"** ✅
6. Click **"Create bucket"**

**If it exists but is private:**

7. Click on the `showcase` bucket
8. Click the **settings icon** (gear/cog)
9. Make sure **"Public bucket"** is enabled
10. Click **"Save"**

### Step 4: Test the Fixes

After running the SQL and checking the bucket:

**Test Album Creation:**
1. Go to `/f/{CODE}/admin?p={PASSWORD}`
2. Scroll to Showcase section
3. Click **"Add Album"**
4. Enter: Title = "Test Album", Description = "Testing"
5. Click **"Save"**
6. Should show **"Album created"** ✅
7. Check browser console (F12) - should be no errors

**Test Album Editing:**
1. Click **"Edit"** on the test album
2. Change the title to "Test Album Updated"
3. Click **"Save"**
4. Should show **"Album updated"** ✅

**Test Media Upload:**
1. Click **"Manage Media"** on the album
2. Click **"Upload Files"**
3. Select an image from your computer
4. Wait a moment
5. Should show **"Uploaded successfully"** ✅
6. Image should appear in the grid
7. Check browser console - should be no errors

---

## 🐛 If Still Getting Errors:

### Check Browser Console

1. Press **F12** to open Developer Tools
2. Click **"Console"** tab
3. Try creating/editing album or uploading media
4. Look for error messages

Common errors and fixes:

#### "Bucket not found"
→ Create the `showcase` storage bucket (see Step 3)

#### "new row violates row-level security policy"
→ Run the SQL fix script again (see Step 2)

#### "column 'updated_at' does not exist"
→ Pull the latest code changes (I've already fixed this)

#### "permission denied for table albums/media_items"
→ Run the GRANT statements in the SQL fix

---

## 📝 Verify Tables Exist

If you're not sure if the tables exist, run this in SQL Editor:

\`\`\`sql
-- Check if tables exist
select table_name 
from information_schema.tables 
where table_schema = 'public' 
  and table_name in ('albums', 'media_items');
\`\`\`

Should return both `albums` and `media_items`.

**If tables don't exist**, run the original migration:
\`\`\`sql
-- Run the contents of supabase-migration-showcase.sql
\`\`\`

---

## 🎯 Quick Checklist

Run through this checklist:

- [ ] Code updated (pull latest changes)
- [ ] SQL fix script run in Supabase
- [ ] Storage bucket `showcase` exists and is public
- [ ] Tables `albums` and `media_items` exist
- [ ] RLS policies created successfully
- [ ] Test album creation - works ✅
- [ ] Test album editing - works ✅
- [ ] Test media upload - works ✅
- [ ] No console errors

---

## 📞 Still Having Issues?

If you've completed all steps and still getting errors:

1. **Check the exact error message** in browser console (F12)
2. **Screenshot the error** 
3. **Check Supabase logs**: Dashboard → Logs → select your table
4. **Verify your Supabase credentials** in `.env.local`

Common final checks:
- Is the Supabase project active (not paused)?
- Are you using the correct SUPABASE_URL and SUPABASE_ANON_KEY?
- Did you restart the dev server after code changes? (`npm run dev`)

---

## ✅ Expected Behavior After Fix:

✅ Albums can be created with title, description, year  
✅ Albums can be edited without errors  
✅ Albums can be deleted  
✅ Media files can be uploaded to albums  
✅ Multiple files can be uploaded at once  
✅ Images display in the grid  
✅ Media can be filtered by type  
✅ Media can be deleted  
✅ No console errors  

---

## 📄 Files I've Fixed:

1. `components/modals/AddEditAlbumModal.tsx` - Removed `updated_at`, improved errors
2. `components/modals/ManageAlbumMediaModal.tsx` - Better error messages, debugging
3. `supabase-showcase-fix.sql` - SQL script to fix RLS policies

All code changes are committed and pushed to GitHub.

---

## 🚀 Summary:

**What I fixed in code**: ✅
- Removed non-existent `updated_at` field
- Added better error messages
- Added console logging for debugging

**What YOU need to do**: 🔴
1. Pull the latest code changes
2. Run the SQL fix script in Supabase SQL Editor
3. Verify `showcase` storage bucket exists and is public
4. Test the showcase feature

Once you complete these steps, everything should work! 🎉

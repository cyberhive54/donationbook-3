# Showcase RLS Error - Complete Resolution Guide

## Error You're Getting:
\`\`\`
"Storage upload failed: new row violates row-level security policy"
\`\`\`

## What This Means:
- The file uploads successfully to Supabase Storage ✅
- BUT the database insert into `media_items` table fails ❌
- This is a Row-Level Security (RLS) policy blocking the insert

---

## 🔧 SOLUTION - Try These in Order:

### Option 1: Run Complete RLS Fix (RECOMMENDED)

**Go to Supabase Dashboard → SQL Editor → New Query**

Copy and paste this ENTIRE script:

\`\`\`sql
-- COMPLETE FIX - Run this entire script
-- Step 1: Drop ALL existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'albums') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON albums';
    END LOOP;
END $$;

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'media_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON media_items';
    END LOOP;
END $$;

-- Step 2: Disable RLS temporarily
ALTER TABLE albums DISABLE ROW LEVEL SECURITY;
ALTER TABLE media_items DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant permissions
GRANT ALL ON TABLE albums TO anon, authenticated, public;
GRANT ALL ON TABLE media_items TO anon, authenticated, public;

-- Step 4: Re-enable RLS
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- Step 5: Create new policies
CREATE POLICY "albums_allow_all_select" ON albums
  FOR SELECT TO public USING (true);

CREATE POLICY "albums_allow_all_insert" ON albums
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "albums_allow_all_update" ON albums
  FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "albums_allow_all_delete" ON albums
  FOR DELETE TO public USING (true);

CREATE POLICY "media_items_allow_all_select" ON media_items
  FOR SELECT TO public USING (true);

CREATE POLICY "media_items_allow_all_insert" ON media_items
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "media_items_allow_all_update" ON media_items
  FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "media_items_allow_all_delete" ON media_items
  FOR DELETE TO public USING (true);
\`\`\`

Click **RUN** → Should see **"Success. No rows returned"**

---

### Option 2: Disable RLS Completely (If Option 1 Doesn't Work)

**This is a last resort but guaranteed to work:**

\`\`\`sql
-- Disable RLS on both tables
ALTER TABLE albums DISABLE ROW LEVEL SECURITY;
ALTER TABLE media_items DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON TABLE albums TO anon, authenticated, public;
GRANT ALL ON TABLE media_items TO anon, authenticated, public;
\`\`\`

**Note**: This removes RLS protection but is consistent with your other tables (collections, expenses, etc.) which also have public access.

---

### Option 3: Check for Conflicting Policies

Run this to see ALL current policies:

\`\`\`sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('albums', 'media_items');
\`\`\`

If you see any policies, take a screenshot and share it.

---

## 🔍 Additional Checks:

### 1. Verify Tables Exist:
\`\`\`sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('albums', 'media_items');
\`\`\`

Should return 2 rows.

### 2. Verify Columns:
\`\`\`sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'media_items'
ORDER BY ordinal_position;
\`\`\`

Should show: id, album_id, type, title, description, url, mime_type, size_bytes, duration_sec, thumbnail_url, created_at

### 3. Check Storage Bucket Permissions:

In Supabase Dashboard:
1. Go to **Storage**
2. Click on **`showcase`** bucket
3. Click **Settings** (gear icon)
4. **Public bucket** should be **ON** ✅
5. Under **Policies** tab, there should be no policies (public bucket doesn't need them)

---

## 🧪 Test After Fix:

### Test in Browser Console:

Open browser console (F12) and run:

\`\`\`javascript
// Test album insert
const testAlbum = await supabase.from('albums').insert({
  festival_id: 'YOUR_FESTIVAL_ID',  // Replace with real ID
  title: 'Console Test Album',
  description: 'Testing from console'
});
console.log('Album insert:', testAlbum);

// Test media item insert (replace album_id)
const testMedia = await supabase.from('media_items').insert({
  album_id: 'YOUR_ALBUM_ID',  // Replace with real album ID
  type: 'image',
  title: 'Test Image',
  url: 'https://example.com/test.jpg'
});
console.log('Media insert:', testMedia);
\`\`\`

If these work in console but not in the app, it's a code issue.
If these also fail, it's a Supabase permissions issue.

---

## 🎯 Most Likely Cause:

The error mentions "Storage upload failed" but the actual issue is the **database insert**, not storage upload.

The RLS policy on `media_items` is blocking the INSERT operation.

**Try this simple fix:**

\`\`\`sql
-- Nuclear option: Completely disable RLS on media_items
ALTER TABLE media_items DISABLE ROW LEVEL SECURITY;

-- Test upload now - should work
\`\`\`

If this works, then we know it's definitely an RLS policy issue, and we can work on fixing the policies properly.

---

## 📋 What to Do NOW:

**1. Run Option 1 SQL (the complete fix above)** - Try this first

**2. If still fails, run Option 2 SQL (disable RLS)** - This will work for sure

**3. Test upload again**

**4. Share the results:**
- Does it work now? ✅
- Still getting error? Share exact error message from console

---

Let me know the result and I'll help you further!

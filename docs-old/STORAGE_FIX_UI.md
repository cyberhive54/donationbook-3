# Storage Upload Fix - Use Supabase Dashboard UI

## The Error You're Getting:
\`\`\`
ERROR: 42501: must be owner of table objects
\`\`\`

This means you can't use SQL to modify storage settings directly.

---

## ✅ SOLUTION - Use Supabase Dashboard UI:

### Step 1: Go to Storage Policies

1. Open **Supabase Dashboard**
2. Click **"Storage"** in left sidebar
3. Click on the **`showcase`** bucket
4. Click the **"Policies"** tab at the top

### Step 2: Create Policies (If Policies Tab Shows Policies)

**If you see any existing policies**, delete them all.

**Then click "New Policy"** and create these 4 policies:

#### Policy 1: Allow Public SELECT
- **Name**: `Public SELECT`
- **Allowed operation**: `SELECT`
- **Policy definition**: `true`
- **Target roles**: Leave default or select `public`
- Click **Review** → **Save policy**

#### Policy 2: Allow Public INSERT  
- **Name**: `Public INSERT`
- **Allowed operation**: `INSERT`
- **Policy definition**: `true`
- **WITH CHECK expression**: `true`
- Click **Review** → **Save policy**

#### Policy 3: Allow Public UPDATE
- **Name**: `Public UPDATE`
- **Allowed operation**: `UPDATE`
- **Policy definition**: `true`
- **WITH CHECK expression**: `true`
- Click **Review** → **Save policy**

#### Policy 4: Allow Public DELETE
- **Name**: `Public DELETE`
- **Allowed operation**: `DELETE`
- **Policy definition**: `true`
- Click **Review** → **Save policy**

### Step 3: Verify Bucket Settings

1. Still in the `showcase` bucket
2. Click **"Settings"** or gear icon
3. Ensure these settings:
   - **Public bucket**: ✅ ON
   - **File size limit**: 50 MB (or higher if you prefer)
   - **Allowed MIME types**: Leave empty (allows all)

---

## 🚀 ALTERNATIVE: Make Bucket Truly Public (No Policies Needed)

If the bucket is truly public, you shouldn't need ANY policies.

### Try This Simple Approach:

1. Go to **Storage** → `showcase` bucket
2. Click **Configuration** or **Settings**
3. Look for **"Policies"** section
4. If there's an option for **"Disable Row Level Security"** or **"Allow public access without policies"** → ENABLE IT

OR

1. Delete the `showcase` bucket
2. Create a new bucket:
   - Name: `showcase`
   - **Public bucket**: ✅ CHECK THIS
   - **No policies needed** for public buckets
3. Try upload again

---

## 🔍 Check Current Policies:

Run this SQL to see what's blocking:

\`\`\`sql
-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'showcase';

-- Check if bucket is truly public
SELECT id, name, public FROM storage.buckets WHERE id = 'showcase';
\`\`\`

**Expected result:**
- `public` column should be `true`
- Policies should either be empty OR have permissive `true` definitions

---

## 💡 QUICK FIX (Most Likely to Work):

**In Supabase Dashboard:**

1. Go to **Storage**
2. **DELETE** the `showcase` bucket completely
3. Click **"New bucket"**
4. Name: `showcase`
5. **Public bucket**: ✅ CHECK THIS BOX
6. Click **"Create"**
7. **DO NOT** add any policies (public buckets don't need them)
8. Try upload again

This fresh bucket should work immediately.

---

## 📋 What to Try:

**Option A**: Create storage policies via UI (see Step 2 above)

**Option B**: Delete and recreate bucket (Quick Fix above)

**Option C**: Share screenshot of Storage → showcase → Policies tab

Try **Option B** first - it's the quickest and most reliable!

---

Let me know which option you try and the result!

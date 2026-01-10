-- STORAGE BUCKET RLS FIX
-- This fixes the "new row violates row-level security policy" error during uploads

-- Step 1: Check existing storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'showcase';

-- Step 2: Delete all existing policies on showcase bucket
DELETE FROM storage.policies WHERE bucket_id = 'showcase';

-- Step 3: Create new permissive policies for showcase bucket
-- Allow anyone to upload
INSERT INTO storage.policies (bucket_id, name, definition, check, command)
VALUES (
  'showcase',
  'Allow public uploads',
  'true',
  'true',
  'INSERT'
);

-- Allow anyone to read/download
INSERT INTO storage.policies (bucket_id, name, definition, check, command)
VALUES (
  'showcase',
  'Allow public reads',
  'true',
  NULL,
  'SELECT'
);

-- Allow anyone to update
INSERT INTO storage.policies (bucket_id, name, definition, check, command)
VALUES (
  'showcase',
  'Allow public updates',
  'true',
  'true',
  'UPDATE'
);

-- Allow anyone to delete
INSERT INTO storage.policies (bucket_id, name, definition, check, command)
VALUES (
  'showcase',
  'Allow public deletes',
  'true',
  NULL,
  'DELETE'
);

-- Step 4: Verify bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'showcase';

-- Step 5: Grant permissions on storage schema
GRANT ALL ON storage.objects TO anon, authenticated, public;
GRANT ALL ON storage.buckets TO anon, authenticated, public;

-- Step 6: Check objects table RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop and recreate storage.objects policies for showcase bucket
DROP POLICY IF EXISTS "showcase_bucket_select" ON storage.objects;
DROP POLICY IF EXISTS "showcase_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "showcase_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "showcase_bucket_delete" ON storage.objects;

CREATE POLICY "showcase_bucket_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'showcase');

CREATE POLICY "showcase_bucket_insert" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'showcase');

CREATE POLICY "showcase_bucket_update" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'showcase')
  WITH CHECK (bucket_id = 'showcase');

CREATE POLICY "showcase_bucket_delete" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'showcase');

-- Step 8: Verify everything
SELECT 'Bucket exists:' as check_type, name, public FROM storage.buckets WHERE id = 'showcase'
UNION ALL
SELECT 'Storage policies:', name, NULL FROM storage.policies WHERE bucket_id = 'showcase'
UNION ALL
SELECT 'Table policies:', policyname, NULL FROM pg_policies WHERE tablename IN ('albums', 'media_items');

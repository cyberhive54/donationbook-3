-- COMPLETE FIX for Showcase RLS Issues
-- This script will completely reset RLS policies and permissions

-- Step 1: List all policies (for debugging)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('albums', 'media_items');

-- Step 2: Drop ALL policies on albums table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'albums') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON albums';
    END LOOP;
END $$;

-- Step 3: Drop ALL policies on media_items table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'media_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON media_items';
    END LOOP;
END $$;

-- Step 4: Disable RLS temporarily to clean up
ALTER TABLE albums DISABLE ROW LEVEL SECURITY;
ALTER TABLE media_items DISABLE ROW LEVEL SECURITY;

-- Step 5: Grant all permissions to public role
GRANT ALL ON TABLE albums TO anon;
GRANT ALL ON TABLE albums TO authenticated;
GRANT ALL ON TABLE albums TO public;

GRANT ALL ON TABLE media_items TO anon;
GRANT ALL ON TABLE media_items TO authenticated;
GRANT ALL ON TABLE media_items TO public;

-- Step 6: Re-enable RLS
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- Step 7: Create brand new policies with unique names
CREATE POLICY "albums_allow_all_select" ON albums
  FOR SELECT 
  TO public
  USING (true);

CREATE POLICY "albums_allow_all_insert" ON albums
  FOR INSERT 
  TO public
  WITH CHECK (true);

CREATE POLICY "albums_allow_all_update" ON albums
  FOR UPDATE 
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "albums_allow_all_delete" ON albums
  FOR DELETE 
  TO public
  USING (true);

CREATE POLICY "media_items_allow_all_select" ON media_items
  FOR SELECT 
  TO public
  USING (true);

CREATE POLICY "media_items_allow_all_insert" ON media_items
  FOR INSERT 
  TO public
  WITH CHECK (true);

CREATE POLICY "media_items_allow_all_update" ON media_items
  FOR UPDATE 
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "media_items_allow_all_delete" ON media_items
  FOR DELETE 
  TO public
  USING (true);

-- Step 8: Verify policies are created
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('albums', 'media_items')
ORDER BY tablename, policyname;

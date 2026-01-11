-- Add support for external media links (Google Drive, OneDrive, etc.)
-- This allows admins to add media via external URLs without using storage quota

-- Step 1: Create media_source_type enum
DO $$ BEGIN
  CREATE TYPE media_source_type AS ENUM ('upload', 'link');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Add new columns to media_items table
ALTER TABLE media_items
  ADD COLUMN IF NOT EXISTS media_source_type media_source_type DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Step 3: Update existing media items to have media_source_type = 'upload'
-- This ensures all existing uploaded media is properly marked
UPDATE media_items 
SET media_source_type = 'upload'
WHERE media_source_type IS NULL;

-- Step 4: Make size_bytes and mime_type nullable (not needed for external links)
-- They should already be nullable, but let's ensure it
ALTER TABLE media_items
  ALTER COLUMN size_bytes DROP NOT NULL,
  ALTER COLUMN mime_type DROP NOT NULL;

-- Step 5: Add index for media_source_type for filtering
CREATE INDEX IF NOT EXISTS idx_media_source_type ON media_items(media_source_type);

-- Step 6: Add comments for documentation
COMMENT ON COLUMN media_items.media_source_type IS 'Source of media: upload (Supabase storage) or link (external URL)';
COMMENT ON COLUMN media_items.external_url IS 'External URL for link-type media (Google Drive, OneDrive, etc.)';

-- Step 7: Add check constraint to ensure external_url is provided for link-type media
ALTER TABLE media_items
  DROP CONSTRAINT IF EXISTS media_items_source_url_check;

ALTER TABLE media_items
  ADD CONSTRAINT media_items_source_url_check CHECK (
    (media_source_type = 'upload' AND url IS NOT NULL) OR
    (media_source_type = 'link' AND external_url IS NOT NULL)
  );

-- Verification queries (uncomment to check)
-- SELECT media_source_type, COUNT(*) as count, 
--        SUM(CASE WHEN size_bytes IS NOT NULL THEN size_bytes ELSE 0 END) as total_bytes
-- FROM media_items 
-- GROUP BY media_source_type;

-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'media_items' 
-- AND column_name IN ('media_source_type', 'external_url', 'size_bytes', 'mime_type')
-- ORDER BY column_name;

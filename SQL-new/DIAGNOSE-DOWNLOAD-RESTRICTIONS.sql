-- Diagnostic: Check Download Restriction Settings
-- Run this to see what values are stored for your festival

-- Check festival download settings
SELECT 
    code,
    event_name,
    allow_media_download,
    CASE 
        WHEN allow_media_download IS NULL THEN 'NULL (will default to TRUE)'
        WHEN allow_media_download = TRUE THEN 'TRUE (downloads enabled)'
        WHEN allow_media_download = FALSE THEN 'FALSE (downloads disabled)'
    END as download_status
FROM festivals
ORDER BY created_at DESC;

-- Check album download settings for a specific festival
-- Replace 'YOUR_FESTIVAL_CODE' with your actual festival code
SELECT 
    a.title as album_title,
    a.year,
    a.allow_download,
    f.code as festival_code,
    f.allow_media_download as festival_allow,
    CASE 
        WHEN f.allow_media_download = FALSE THEN 'Festival blocks all downloads'
        WHEN a.allow_download = FALSE THEN 'Album blocks downloads'
        WHEN a.allow_download IS NULL OR a.allow_download = TRUE THEN 'Downloads enabled'
        ELSE 'Unknown state'
    END as effective_status
FROM albums a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'YOUR_FESTIVAL_CODE'  -- Replace with your festival code
ORDER BY a.year DESC;

-- Check if columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('festivals', 'albums')
AND column_name IN ('allow_media_download', 'allow_download')
ORDER BY table_name, column_name;

-- Quick fix: If columns don't exist, run this
-- (Only if the columns are missing - check above first)
/*
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS allow_media_download BOOLEAN DEFAULT TRUE;

ALTER TABLE albums
ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT TRUE;
*/

-- To explicitly disable downloads for a festival:
-- Replace 'YOUR_FESTIVAL_CODE' with your actual festival code
/*
UPDATE festivals
SET allow_media_download = FALSE
WHERE code = 'YOUR_FESTIVAL_CODE';
*/

-- To verify the update worked:
/*
SELECT code, event_name, allow_media_download
FROM festivals
WHERE code = 'YOUR_FESTIVAL_CODE';
*/

# External Media Links Implementation

## Overview
This migration adds support for external media links (Google Drive, OneDrive, etc.) to the showcase feature, allowing admins to add media without using storage quota.

## Features Added
- ✅ Two media source types: `upload` (Supabase storage) and `link` (external URL)
- ✅ Admin UI toggle between Upload/Link modes
- ✅ Automatic Google Drive URL conversion to preview/direct URLs
- ✅ External link preview in showcase with fallback to link icon on failure
- ✅ Storage stats exclude external links (only count uploaded files)
- ✅ Supports all media types: images, videos, audio, PDFs, documents

## Database Changes

### New Columns in `media_items` Table:
1. **`media_source_type`** (enum: 'upload' | 'link')
   - Indicates whether media is uploaded to Supabase storage or an external link
   - Default: 'upload'
   - All existing media will be marked as 'upload'

2. **`external_url`** (text, nullable)
   - Stores the external URL for link-type media
   - Used for Google Drive, OneDrive, direct image URLs, etc.

### Constraints:
- For `upload` type: `url` must be provided (Supabase storage URL)
- For `link` type: `external_url` must be provided

## Migration Steps

### 1. Run SQL Migration
Execute the SQL file in Supabase SQL Editor:
```sql
-- File: 011-ADD-EXTERNAL-MEDIA-LINKS.sql
```

This will:
- Create `media_source_type` enum
- Add new columns to `media_items` table
- Update all existing media to have `media_source_type = 'upload'`
- Add constraints and indexes
- Make `size_bytes` and `mime_type` nullable (not needed for external links)

### 2. Verify Migration
Run verification queries:
```sql
-- Check column structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'media_items' 
AND column_name IN ('media_source_type', 'external_url', 'size_bytes', 'mime_type')
ORDER BY column_name;

-- Check existing media
SELECT media_source_type, COUNT(*) as count, 
       SUM(CASE WHEN size_bytes IS NOT NULL THEN size_bytes ELSE 0 END) as total_bytes
FROM media_items 
GROUP BY media_source_type;
```

Expected results:
- All columns should exist
- `size_bytes` and `mime_type` should be nullable
- All existing media should have `media_source_type = 'upload'`

## UI Changes

### 1. ManageAlbumMediaModal (Admin)
**New Features:**
- Toggle between "Upload" and "Link" modes
- Upload mode: Traditional file upload interface
- Link mode:
  - URL input field (paste external link)
  - Title input field (optional)
  - Automatic Google Drive link conversion
  - Automatic media type detection from URL

**Google Drive Link Handling:**
- Automatically converts sharing links to direct preview URLs
- Supports: Google Docs, Sheets, Presentations, Drive files
- Example conversion:
  - From: `https://drive.google.com/file/d/ABC123/view`
  - To: `https://drive.google.com/uc?export=view&id=ABC123`

### 2. Showcase Page (Visitor/Admin)
**New Features:**
- External link media displays alongside uploaded media in the same grid
- Link indicator badge shows on external media
- If external media fails to load:
  - Shows "External Link" icon instead of broken image
  - Graceful fallback without breaking the UI
- Click to open external links in new tab

### 3. Storage Stats Modal
**Updated Behavior:**
- Only counts uploaded files towards storage quota
- External links are excluded from storage calculations
- Displays breakdown by album and media type

## Usage Instructions

### For Admins: Adding External Link Media

1. Navigate to Admin Dashboard
2. Go to "Manage Albums" in Showcase section
3. Select an album and click "Manage Media"
4. Click the "Link" toggle button
5. Paste external URL:
   - Google Drive: `https://drive.google.com/file/d/YOUR_FILE_ID/view`
   - Direct image: `https://example.com/image.jpg`
   - OneDrive: Public sharing link
   - Any publicly accessible media URL
6. (Optional) Enter a title
7. Click "Add Link"

### Supported Link Types

#### ✅ Will Work:
- Direct image URLs: `.jpg`, `.png`, `.gif`, `.webp`, etc.
- Direct video URLs: `.mp4`, `.webm`, `.mov`, etc.
- Google Drive public links (automatically converted)
- OneDrive public sharing links
- Any publicly accessible media URL with proper CORS headers

#### ⚠️ Limitations:
- Links may break if source is deleted or made private
- Some services may block embedding due to CORS policies
- Private links won't display
- No control over external content quality/availability
- External links don't use storage quota but also can't be cached

## Benefits

✅ **No Storage Space Used**: External links don't count towards storage quota  
✅ **Easy to Add**: Paste URL and done - no upload time  
✅ **Quick to Update**: Just change the link  
✅ **High Quality**: Can link to original high-resolution media  
✅ **Flexible**: Supports any publicly accessible media source  

## Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Verify existing media still displays correctly
- [ ] Test adding Google Drive link
- [ ] Test adding direct image URL
- [ ] Test adding OneDrive link
- [ ] Verify link indicator shows in admin modal
- [ ] Verify external media displays in showcase
- [ ] Test fallback icon when link fails
- [ ] Verify storage stats exclude external links
- [ ] Test media viewer modal with external links
- [ ] Test download functionality (opens in new tab for links)

## Rollback Plan

If issues occur, you can rollback by:

```sql
-- Remove new columns
ALTER TABLE media_items
  DROP COLUMN IF EXISTS media_source_type,
  DROP COLUMN IF EXISTS external_url;

-- Drop enum type
DROP TYPE IF EXISTS media_source_type;
```

However, this will lose any external link media that was added.

## Notes

- Google Drive links require proper sharing permissions (Anyone with the link can view)
- For best performance, use direct media URLs when possible
- External links are validated only on display - broken links show fallback icon
- No file size limits for external links (not stored in Supabase)
- Media type is auto-detected from URL extension or domain patterns

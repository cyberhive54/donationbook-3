# Google Drive Link Guide

## How to Get Public Google Drive Links

### For Images/Videos/Files:

1. **Upload file to Google Drive**
2. **Right-click file → Share**
3. **Change access to "Anyone with the link"**
4. **Copy the sharing link**

The link will look like:
```
https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing
```

### For Google Docs/Sheets/Slides:

1. **Open the document**
2. **Click Share button**
3. **Change access to "Anyone with the link"**
4. **Copy the link**

The link will look like:
```
https://docs.google.com/document/d/1A2B3C4D5E6F7G8H9I0J/edit?usp=sharing
```

## Automatic URL Conversion

Our system automatically converts Google Drive sharing links to direct preview URLs:

### File Links:
**Input:**
```
https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing
```

**Converted to:**
```
https://drive.google.com/uc?export=view&id=1A2B3C4D5E6F7G8H9I0J
```

### Google Docs:
**Input:**
```
https://docs.google.com/document/d/1A2B3C4D5E6F7G8H9I0J/edit?usp=sharing
```

**Converted to:**
```
https://docs.google.com/document/d/1A2B3C4D5E6F7G8H9I0J/preview
```

### Google Sheets:
**Input:**
```
https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/edit?usp=sharing
```

**Converted to:**
```
https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/preview
```

### Google Slides:
**Input:**
```
https://docs.google.com/presentation/d/1A2B3C4D5E6F7G8H9I0J/edit?usp=sharing
```

**Converted to:**
```
https://docs.google.com/presentation/d/1A2B3C4D5E6F7G8H9I0J/preview
```

## Supported File Types

### Direct Preview (will show in showcase):
- ✅ Images: JPG, PNG, GIF, WebP, BMP, SVG
- ✅ Videos: MP4, WebM (if browser supports)
- ⚠️ PDFs: Some browsers may block iframe embedding

### Download/Open (will show link icon):
- 📄 Google Docs
- 📊 Google Sheets
- 📽️ Google Slides
- 📦 Other file types

## Common Issues & Solutions

### Issue: "Access Denied" or "File not found"
**Solution:** Make sure the sharing setting is "Anyone with the link can view"

### Issue: Image doesn't display
**Solutions:**
1. Check if file is actually an image (JPG, PNG, etc.)
2. Try the direct download link format
3. Some very large images may fail to load

### Issue: Video doesn't play
**Solutions:**
1. Google Drive may block video embedding for large files
2. Consider using direct video URL format
3. Try MP4 format (most compatible)

### Issue: Link shows but doesn't preview
**This is expected for:**
- Google Docs/Sheets/Slides (shown as PDF/document icon)
- Large video files (may need to open in new tab)
- Files requiring authentication

## Tips for Best Results

### 1. Use Direct Image URLs when possible
Instead of Google Drive, use direct image hosting:
- ✅ `https://example.com/image.jpg`
- ✅ `https://i.imgur.com/abc123.jpg`
- ⚠️ Google Drive (works but slower)

### 2. For Videos
- Keep file size under 100MB for best performance
- Use MP4 format
- Consider using YouTube or Vimeo for large videos

### 3. For Documents
- PDFs work best with direct URLs
- Google Docs will show as document icon (click to open)

### 4. File Naming
- Use descriptive names in the "Title" field
- Include file type in title if not obvious
- Example: "Event Photo 2024.jpg" instead of "IMG_1234"

## Testing Your Links

Before adding to showcase, test your link:

1. **Open in Incognito/Private browser window**
2. **Paste the link**
3. **If you can view it without logging in → ✅ It will work**
4. **If it asks for login → ❌ Change sharing settings**

## Alternative Cloud Storage

### OneDrive:
1. Upload file to OneDrive
2. Right-click → Share
3. Choose "Anyone with the link"
4. Copy link
5. Paste in showcase (may need adjustment for preview)

### Imgur (Images only):
1. Upload to Imgur.com
2. Right-click image → Copy image address
3. Use direct link (ends in .jpg, .png, etc.)
4. ✅ Works perfectly for images

### Direct URLs:
Any publicly accessible direct URL will work:
```
https://example.com/photos/image.jpg
https://cdn.example.com/videos/video.mp4
https://example.com/files/document.pdf
```

## Media Type Auto-Detection

The system automatically detects media type from URL:

- `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg` → Image
- `.mp4`, `.webm`, `.avi`, `.mov`, `.mkv` → Video
- `.mp3`, `.wav`, `.ogg`, `.m4a` → Audio
- `.pdf` → PDF
- `drive.google.com/document` → PDF (Google Doc)
- Everything else → Other

## Examples

### Working Examples:

✅ **Google Drive Image:**
```
https://drive.google.com/file/d/1abcdefghijklmnopqrstuvwxyz/view
→ Will display as image
```

✅ **Direct Image URL:**
```
https://picsum.photos/800/600
→ Will display as image
```

✅ **Imgur Image:**
```
https://i.imgur.com/abc123.jpg
→ Will display as image
```

✅ **Google Doc:**
```
https://docs.google.com/document/d/1abc123/edit
→ Will show as document icon, opens in new tab
```

### Non-Working Examples:

❌ **Private Google Drive:**
```
https://drive.google.com/file/d/1abc123/view
(without public sharing)
→ Will show "External Link" fallback icon
```

❌ **Broken URL:**
```
https://example.com/nonexistent.jpg
→ Will show "External Link" fallback icon
```

❌ **Link requiring login:**
```
Any URL that requires authentication
→ Will show "External Link" fallback icon
```

## Summary

- ✅ Make all links publicly accessible ("Anyone with the link")
- ✅ Test in incognito mode before adding
- ✅ Use direct URLs when possible for best performance
- ✅ System handles Google Drive conversion automatically
- ✅ Broken links show fallback icon gracefully
- ✅ No validation on save - fails gracefully on display

## Questions?

If a link doesn't work as expected:
1. Check sharing permissions (must be public)
2. Test in incognito browser
3. Try direct URL format
4. Check file type compatibility
5. Verify URL is accessible without login

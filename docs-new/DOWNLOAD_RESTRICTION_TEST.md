# Download Restriction Testing Guide

## Overview
This document outlines how to test the download restriction feature to ensure it's working correctly across all scenarios.

## Test Scenarios

### Setup Prerequisites
1. Have at least one festival created
2. Create at least 2 albums with media (one for each restriction test)
3. Upload some media files (images, videos, audio)
4. Add some external link media
5. Create test users: admin account and visitor (user password)

---

## Test 1: Festival-Level Download Restriction

### Test 1A: Festival allows downloads (default)
**Setup:**
1. Edit Festival settings
2. Ensure "Allow Media Download" is **checked** ✓
3. Create/edit an album with "Allow Download" **checked** ✓

**Expected Behavior (Visitor):**
- ✅ Download button appears on media cards
- ✅ Download button in media viewer appears
- ✅ Bulk download button appears when selecting multiple items
- ✅ Video controls show download option (if browser supports)
- ✅ Audio controls show download option (if browser supports)
- ✅ Click download → file downloads successfully
- ✅ For external links → opens in new tab

**Expected Behavior (Admin/Super Admin):**
- ✅ Same as visitor - all downloads work

**Test Steps:**
1. Login as visitor
2. Go to Showcase page
3. Select an album
4. Hover over a media item → verify Download button appears (green)
5. Click Download button → verify download starts
6. Click media to open viewer → verify Download button appears in top-right
7. Select multiple items → verify Bulk Download appears
8. Click Bulk Download → verify all files download
9. Test with external link media → verify opens in new tab

---

### Test 1B: Festival denies downloads
**Setup:**
1. Edit Festival settings
2. **Uncheck** "Allow Media Download" ✗
3. Album settings don't matter (festival overrides)

**Expected Behavior (Visitor):**
- ❌ Download button shows lock icon (disabled/gray)
- ❌ Download button in media viewer shows lock icon
- ❌ Bulk download button shows "Download Disabled" with lock
- ❌ Video controls don't show download option
- ❌ Audio controls don't show download option
- ❌ Click download button → nothing happens
- ❌ Right-click on media → prevented with message

**Expected Behavior (Admin/Super Admin):**
- ✅ All downloads still work (admins bypass restrictions)

**Test Steps:**
1. Login as visitor
2. Go to Showcase page
3. Select an album
4. Hover over a media item → verify Download button shows **lock icon** and is gray
5. Click Download button → verify nothing happens or shows error message
6. Click media to open viewer → verify Download button shows lock icon
7. Try to click download in viewer → verify doesn't work
8. Select multiple items → verify shows "Download Disabled" message
9. Try bulk download → verify shows error toast "Downloads are disabled"
10. Open video in viewer → verify no download option in video controls
11. Right-click on image → verify prevented with toast message
12. **Logout and login as Admin**
13. Repeat steps 3-8 → verify admin CAN download everything

---

## Test 2: Album-Level Download Restriction

### Test 2A: Festival allows, Album denies
**Setup:**
1. Festival: "Allow Media Download" **checked** ✓
2. Album: "Allow Download" **unchecked** ✗

**Expected Behavior (Visitor):**
- ❌ Downloads disabled for THIS album only
- ✅ Downloads work for OTHER albums (that have allow_download=true)

**Expected Behavior (Admin/Super Admin):**
- ✅ All downloads work (admins bypass restrictions)

**Test Steps:**
1. Login as visitor
2. Create two albums:
   - Album A: Allow Download **unchecked** ✗
   - Album B: Allow Download **checked** ✓
3. Add media to both albums
4. Go to Showcase → Select Album A
5. Verify downloads are **disabled** (lock icons)
6. Go to Showcase → Select Album B
7. Verify downloads are **enabled** (green download buttons)
8. **Logout and login as Admin**
9. Verify admin can download from both Album A and Album B

---

### Test 2B: Festival denies, Album allows
**Setup:**
1. Festival: "Allow Media Download" **unchecked** ✗
2. Album: "Allow Download" **checked** ✓

**Expected Behavior:**
- ❌ Downloads disabled (festival setting overrides album)
- Festival-level restriction takes precedence

**Test Steps:**
1. Edit festival → uncheck "Allow Media Download"
2. Edit album → ensure "Allow Download" is checked
3. Login as visitor
4. Go to Showcase → select the album
5. Verify downloads are **disabled** (festival overrides album setting)

---

## Test 3: External Link Media

### Test 3A: External link with downloads enabled
**Setup:**
1. Festival & Album: Downloads **allowed** ✓
2. Add external link media (Google Drive, direct URL, etc.)

**Expected Behavior:**
- ✅ External link displays in showcase grid
- ✅ Shows "Link" badge on media card
- ✅ Download button appears
- ✅ Click download → opens link in new tab
- ✅ Shows "Opening link in new tab" toast

**Test Steps:**
1. Go to Admin → Manage Album → Manage Media
2. Switch to "Link" tab
3. Add a Google Drive public image link
4. Go to Showcase (as visitor)
5. Verify external link displays with "Link" badge
6. Click Download button → verify opens in new tab
7. Verify toast shows "Opening link in new tab"

---

### Test 3B: External link with downloads disabled
**Setup:**
1. Festival: "Allow Media Download" **unchecked** ✗ OR
2. Album: "Allow Download" **unchecked** ✗
3. External link media exists in album

**Expected Behavior:**
- ❌ Download button shows lock icon
- ❌ Cannot open external link (restricted)
- ❌ Click download → shows error "Downloads are disabled"

**Test Steps:**
1. Disable downloads (festival or album level)
2. Go to Showcase (as visitor)
3. Find external link media
4. Verify Download button shows lock icon
5. Try to click download → verify blocked
6. Open in media viewer → verify download button is locked
7. **Login as Admin**
8. Verify admin CAN open/download external link

---

## Test 4: Media Viewer Modal

### Test 4A: Downloads enabled
**Setup:**
1. Downloads allowed ✓
2. Open media viewer by clicking on media item

**Expected Behavior:**
- ✅ Download button appears in top-right
- ✅ Click download → file downloads (or opens external link)
- ✅ Video/Audio controls allow download (if browser supports)
- ✅ Navigate between media items → download button remains

**Test Steps:**
1. Go to Showcase
2. Click on any media item to open viewer
3. Verify Download button appears in top-right (next to X button)
4. Click Download → verify works
5. Navigate to next item (arrow buttons) → verify Download button still appears
6. Test with video → verify video controls show download option
7. Test with audio → verify audio controls show download option
8. Test with external link → verify opens in new tab

---

### Test 4B: Downloads disabled
**Setup:**
1. Downloads disabled ✗
2. Open media viewer

**Expected Behavior:**
- ❌ Download button shows lock icon
- ❌ Click download → nothing happens
- ❌ Video controls don't show download option
- ❌ Audio controls don't show download option

**Test Steps:**
1. Disable downloads (festival or album level)
2. Go to Showcase (as visitor)
3. Click on media to open viewer
4. Verify Download button shows **lock icon** with red background
5. Hover over lock icon → shows "Downloads are disabled"
6. Try to click → verify nothing happens
7. Test with video → verify no download option in controls
8. Test with audio → verify no download option in controls
9. Navigate between items → verify lock icon persists
10. **Login as Admin**
11. Verify admin sees working Download button

---

## Test 5: Bulk Download

### Test 5A: Bulk download with downloads enabled
**Setup:**
1. Downloads allowed ✓
2. Multiple media items in album

**Expected Behavior:**
- ✅ Can select multiple items
- ✅ "Download All" button appears
- ✅ Click → all files download sequentially
- ✅ Shows progress toast
- ✅ External links open in new tabs

**Test Steps:**
1. Go to Showcase
2. Check checkboxes on multiple media items (mix of uploaded and external links)
3. Verify selection counter appears: "3 selected · 2.5 MB"
4. Verify "Download All" button appears (blue)
5. Click Download All
6. Verify toast shows "Downloading 3 items..."
7. Verify files download one by one
8. Verify external links open in new tabs
9. Verify success toast at the end

---

### Test 5B: Bulk download with downloads disabled
**Setup:**
1. Downloads disabled ✗
2. Multiple items selected

**Expected Behavior:**
- ❌ "Download All" button shows as disabled with lock
- ❌ Click → shows error "Downloads are disabled"
- ❌ No files download

**Test Steps:**
1. Disable downloads
2. Go to Showcase (as visitor)
3. Select multiple media items
4. Verify button shows "Download Disabled" with lock icon
5. Click button → verify shows error toast
6. Verify no files download
7. **Login as Admin**
8. Select multiple items → verify admin can bulk download

---

## Test 6: Right-Click Protection

### Test 6A: Right-click on images
**Expected Behavior:**
- ❌ Right-click prevented on all images (both showcase and viewer)
- ❌ Shows toast: "Right-click is disabled on media"
- ❌ Image dragging disabled

**Test Steps:**
1. Go to Showcase
2. Right-click on any image
3. Verify context menu doesn't appear
4. Verify toast shows "Right-click is disabled"
5. Try to drag image → verify can't drag
6. Open image in viewer
7. Right-click on full-size image → verify still prevented

---

### Test 6B: Right-click on videos
**Expected Behavior:**
- ❌ Right-click prevented on video element
- ❌ Shows toast message

**Test Steps:**
1. Open video in media viewer
2. Right-click on video → verify prevented
3. Verify toast appears

---

## Test 7: Admin Override

### Test 7A: Admin can always download
**Setup:**
1. Set festival/album to disable downloads ✗
2. Login as Admin

**Expected Behavior:**
- ✅ Admin sees working download buttons (not locked)
- ✅ Admin can download all media
- ✅ Admin bypasses all restrictions

**Test Steps:**
1. Disable downloads at festival level
2. Login as Admin
3. Go to Showcase
4. Verify Download buttons are **green** (not locked)
5. Download a file → verify works
6. Download external link → verify opens
7. Bulk download → verify works
8. Check media viewer → verify Download button works

---

### Test 7B: Super Admin can always download
**Setup:**
1. Disable downloads ✗
2. Login as Super Admin

**Expected Behavior:**
- ✅ Super Admin bypasses all restrictions
- ✅ Can download everything

**Test Steps:**
1. Same as Test 7A but with Super Admin login

---

## Test 8: Edge Cases

### Test 8A: No album selected
**Expected Behavior:**
- No media displayed
- No download buttons shown
- Prompt to select an album

**Test Steps:**
1. Go to Showcase
2. Don't select any album
3. Verify message: "Select an album to view media"

---

### Test 8B: Empty album
**Expected Behavior:**
- Message: "No media found"
- No download buttons

**Test Steps:**
1. Create empty album
2. Go to Showcase → select empty album
3. Verify shows "No media found" message

---

### Test 8C: Failed external link
**Expected Behavior:**
- Shows "External Link" icon fallback
- Still respects download restrictions
- Download button shows lock if disabled

**Test Steps:**
1. Add external link with broken/private URL
2. Go to Showcase
3. Verify shows "External Link" icon instead of broken image
4. If downloads enabled → verify can try to open link
5. If downloads disabled → verify button is locked

---

## Test 9: UI Indicators

### Test 9A: Visual indicators for disabled downloads
**Check these elements:**
- [ ] Download button shows lock icon (not download icon)
- [ ] Button is gray/disabled color (not green)
- [ ] Cursor shows "not-allowed" on hover
- [ ] Tooltip shows "Downloads disabled"
- [ ] Bulk download shows "Download Disabled" text with lock

---

### Test 9B: Visual indicators for enabled downloads
**Check these elements:**
- [ ] Download button shows download icon
- [ ] Button is green color
- [ ] Cursor shows pointer on hover
- [ ] Tooltip shows "Download"
- [ ] Bulk download shows "Download All" with count

---

## Test 10: Album Settings UI

### Test 10A: Festival allows downloads
**Setup:**
1. Festival: Allow Media Download **checked** ✓

**Expected Behavior:**
- ✅ In "Add/Edit Album" modal, "Allow Download" checkbox is **enabled**
- ✅ Admin can check/uncheck it
- ✅ No warning message

**Test Steps:**
1. Ensure festival allows downloads
2. Go to Admin → Manage Albums
3. Click "Add Album" or edit existing
4. Verify "Allow Download" checkbox is enabled (can be toggled)
5. Verify no warning message shown

---

### Test 10B: Festival denies downloads
**Setup:**
1. Festival: Allow Media Download **unchecked** ✗

**Expected Behavior:**
- ❌ In "Add/Edit Album" modal, "Allow Download" checkbox is **disabled/grayed out**
- ❌ Shows warning: "Downloads are disabled at festival level"
- ❌ Album setting has no effect

**Test Steps:**
1. Edit festival → uncheck "Allow Media Download"
2. Go to Admin → Manage Albums
3. Click "Add Album" or edit existing
4. Verify "Allow Download" checkbox is grayed out/disabled
5. Verify warning message appears in red:
   "Downloads are disabled at festival level and will override this setting"
6. Try to toggle checkbox → verify can't change it

---

## Summary Checklist

After completing all tests, verify:

### Download Restrictions Work:
- [ ] Festival-level restriction blocks all downloads for visitors
- [ ] Album-level restriction blocks downloads for that album only
- [ ] Festival restriction overrides album allowance
- [ ] Admin and Super Admin can always download
- [ ] External links respect download restrictions

### UI Elements:
- [ ] Lock icons appear when downloads disabled
- [ ] Green download buttons when enabled
- [ ] Proper tooltips and messages
- [ ] Album settings UI reflects festival restrictions

### Security:
- [ ] Right-click is always prevented
- [ ] Video/audio controls respect restrictions
- [ ] No bypass methods available for visitors
- [ ] Admins can override all restrictions

### External Links:
- [ ] External links open in new tab when allowed
- [ ] External links blocked when downloads disabled
- [ ] Failed external links show graceful fallback
- [ ] Link badge appears on external media

### User Experience:
- [ ] Clear error messages when trying to download while disabled
- [ ] Consistent behavior across showcase and media viewer
- [ ] Bulk download respects restrictions
- [ ] Smooth navigation between media items

---

## Bug Report Template

If you find an issue, use this template:

**Bug Title:** [Brief description]

**Severity:** [Critical / High / Medium / Low]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**User Role:** [Visitor / Admin / Super Admin]

**Festival Setting:** [Allow Download: Yes/No]

**Album Setting:** [Allow Download: Yes/No]

**Media Type:** [Image / Video / Audio / PDF / External Link]

**Browser:** [Chrome / Firefox / Safari / Edge]

**Screenshots:** [If applicable]

---

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Test 1A: Festival allows | ⬜ | |
| Test 1B: Festival denies | ⬜ | |
| Test 2A: Album denies | ⬜ | |
| Test 2B: Festival overrides | ⬜ | |
| Test 3A: External link allowed | ⬜ | |
| Test 3B: External link blocked | ⬜ | |
| Test 4A: Viewer downloads enabled | ⬜ | |
| Test 4B: Viewer downloads disabled | ⬜ | |
| Test 5A: Bulk download enabled | ⬜ | |
| Test 5B: Bulk download disabled | ⬜ | |
| Test 6A: Right-click images | ⬜ | |
| Test 6B: Right-click videos | ⬜ | |
| Test 7A: Admin override | ⬜ | |
| Test 7B: Super Admin override | ⬜ | |
| Test 8: Edge cases | ⬜ | |
| Test 9: UI indicators | ⬜ | |
| Test 10: Album settings UI | ⬜ | |

**Legend:** ✅ Pass | ❌ Fail | ⬜ Not Tested | ⚠️ Partial

---

## Notes
- Test with different browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices (iOS Safari, Chrome Android)
- Test with slow network connection
- Test with very large media files
- Test with many media items (100+)

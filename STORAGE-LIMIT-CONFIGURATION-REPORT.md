# Storage Limit Configuration Report

## Current Status: **HARDCODED** ❌

The storage limit for festival media is **hardcoded** at **400MB** and is **NOT configurable** by superadmin or anyone else.

## Where It's Defined

### 1. **Hardcoded Value** (@lib/utils.ts, line 62)
```typescript
export const calculateStorageStats = (items: MediaItem[]) => {
  const uploadedItems = items.filter(item => !item.media_source_type || item.media_source_type === 'upload');
  const totalBytes = uploadedItems.reduce((sum, item) => sum + (item.size_bytes || 0), 0);
  const maxBytes = 400 * 1024 * 1024; // ❌ HARDCODED: 400MB
  const percentage = (totalBytes / maxBytes) * 100;
  
  // ... rest of the function
}
```

### 2. **File Size Limits** (Also Hardcoded)
```typescript
export const getFileSizeLimit = (type: string): { bytes: number; label: string } => {
  if (type.startsWith('video/')) return { bytes: 50 * 1024 * 1024, label: '50MB' }; // 50MB per video
  return { bytes: 15 * 1024 * 1024, label: '15MB' }; // 15MB for other files
};
```

## Where It's Used

### Components That Display Storage Limits:
1. **StorageStatsModal** (@components/modals/StorageStatsModal.tsx)
   - Shows total capacity: 400MB (hardcoded via `calculateStorageStats`)
   - Shows usage percentage
   - Shows available storage

2. **Admin Page** (@app/f/[code]/admin/page.tsx, line 1519)
   - Shows storage progress bar
   - Uses `calculateStorageStats(allMediaItems)`
   - Color codes based on percentage (red >90%, yellow >75%)

## Database Schema Analysis

### ❌ No Storage Limit Field in `festivals` Table
The `festivals` table does NOT have any storage-related columns:

**Existing fields:**
- ✅ `id`, `code`, `event_name`
- ✅ `organiser`, `mentor`, `guide`, `location`
- ✅ `event_start_date`, `event_end_date`
- ✅ `ce_start_date`, `ce_end_date`
- ✅ `theme_*` (colors, dark mode, etc.)
- ✅ `multi_admin_enabled`
- ✅ `allow_media_download`
- ❌ **NO `max_storage_bytes` field**
- ❌ **NO `storage_limit_mb` field**

### ❌ No Storage Limit Field in TypeScript Interface
**File:** @types/index.ts

The `Festival` interface does NOT include:
```typescript
export interface Festival {
  // ... 45 fields ...
  // ❌ NO storage_limit_mb?: number
  // ❌ NO max_storage_bytes?: number
}
```

## Super Admin Dashboard

### Current Super Admin Controls:
Located at: `/f/[code]/admin/sup`

**What Super Admin CAN control:**
- ✅ Super admin password
- ✅ Festival basic info (name, organiser, mentor, guide, location)
- ✅ Event dates (start/end, CE dates)
- ✅ Theme settings
- ✅ Password requirements
- ✅ Multi-admin settings
- ✅ Banner visibility
- ✅ Admin display preferences

**What Super Admin CANNOT control:**
- ❌ **Storage limit per festival**
- ❌ Individual file size limits
- ❌ Storage quotas

## Documentation References

### Product Specification (@docs-new/PRODUCT_SPECIFICATION_FOR_TESTING.md)
```
Storage Limits:
- Total storage limit: 400MB per festival
- File Size Limits:
  - Images: 15MB
  - Videos: 50MB
  - Audio: 15MB
  - PDFs: 15MB
  - Other files: 15MB
```

**Status:** All hardcoded, documented as fixed limits.

## Current Behavior

### For ALL Festivals:
- Storage limit: **400MB** (cannot be changed)
- Video file limit: **50MB** per file
- Other files limit: **15MB** per file
- No way to increase limits for specific festivals
- No way to decrease limits for specific festivals

### Storage Bar Colors:
- 🟢 Green: 0-75% used
- 🟡 Yellow: 75-90% used
- 🔴 Red: 90-100% used

## Why This Matters

### Potential Issues:
1. **One Size Fits All:**
   - Small festivals might not need 400MB
   - Large festivals might need MORE than 400MB
   - No flexibility for different use cases

2. **Cannot Offer Premium Plans:**
   - Can't give some festivals more storage
   - Can't monetize storage upgrades
   - No differentiation between plans

3. **No Super Admin Control:**
   - Super admin must change code to adjust limits
   - Cannot adjust per-festival dynamically
   - Requires code deployment for limit changes

## Recommended Solution

### Option 1: Add Per-Festival Storage Limit (Recommended)

#### Step 1: Add Database Field
```sql
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS max_storage_mb INTEGER DEFAULT 400;

-- Optionally add per-file limits too
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS max_video_size_mb INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 15;
```

#### Step 2: Update TypeScript Interface
```typescript
export interface Festival {
  // ... existing fields ...
  max_storage_mb?: number // Default 400MB
  max_video_size_mb?: number // Default 50MB
  max_file_size_mb?: number // Default 15MB
}
```

#### Step 3: Update Utils Function
```typescript
export const calculateStorageStats = (items: MediaItem[], maxStorageMB: number = 400) => {
  const uploadedItems = items.filter(item => !item.media_source_type || item.media_source_type === 'upload');
  const totalBytes = uploadedItems.reduce((sum, item) => sum + (item.size_bytes || 0), 0);
  const maxBytes = maxStorageMB * 1024 * 1024; // Use parameter instead of hardcoded
  const percentage = (totalBytes / maxBytes) * 100;
  
  // ... rest of the function
}

export const getFileSizeLimit = (type: string, festival?: Festival): { bytes: number; label: string } => {
  const videoLimitMB = festival?.max_video_size_mb || 50;
  const fileLimitMB = festival?.max_file_size_mb || 15;
  
  if (type.startsWith('video/')) {
    return { bytes: videoLimitMB * 1024 * 1024, label: `${videoLimitMB}MB` };
  }
  return { bytes: fileLimitMB * 1024 * 1024, label: `${fileLimitMB}MB` };
};
```

#### Step 4: Update Components
```typescript
// In admin page and storage modal
const stats = calculateStorageStats(allMediaItems, festival.max_storage_mb || 400);
```

#### Step 5: Add Super Admin UI
Add to Super Admin Dashboard:
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6">
  <h3 className="font-semibold text-gray-800 mb-4">Storage Settings</h3>
  
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Total Storage Limit (MB)
      </label>
      <input
        type="number"
        min="100"
        max="5000"
        value={maxStorageMB}
        onChange={(e) => setMaxStorageMB(Number(e.target.value))}
        className="w-full px-3 py-2 border rounded-lg"
      />
      <p className="text-xs text-gray-500 mt-1">Default: 400MB</p>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Max Video File Size (MB)
      </label>
      <input
        type="number"
        min="10"
        max="500"
        value={maxVideoSizeMB}
        onChange={(e) => setMaxVideoSizeMB(Number(e.target.value))}
        className="w-full px-3 py-2 border rounded-lg"
      />
      <p className="text-xs text-gray-500 mt-1">Default: 50MB</p>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Max File Size (MB) - Images, Audio, PDFs
      </label>
      <input
        type="number"
        min="5"
        max="100"
        value={maxFileSizeMB}
        onChange={(e) => setMaxFileSizeMB(Number(e.target.value))}
        className="w-full px-3 py-2 border rounded-lg"
      />
      <p className="text-xs text-gray-500 mt-1">Default: 15MB</p>
    </div>
    
    <button
      onClick={handleUpdateStorageLimits}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Update Storage Limits
    </button>
  </div>
</div>
```

### Option 2: Environment Variable (Quick Fix)

Add to `.env`:
```env
NEXT_PUBLIC_DEFAULT_STORAGE_LIMIT_MB=400
NEXT_PUBLIC_MAX_VIDEO_SIZE_MB=50
NEXT_PUBLIC_MAX_FILE_SIZE_MB=15
```

Update utils:
```typescript
const maxBytes = (Number(process.env.NEXT_PUBLIC_DEFAULT_STORAGE_LIMIT_MB) || 400) * 1024 * 1024;
```

**Pros:** Quick to implement
**Cons:** Still global, not per-festival

### Option 3: Config File (Medium Solution)

Create `config/storage.ts`:
```typescript
export const STORAGE_CONFIG = {
  default_limit_mb: 400,
  video_limit_mb: 50,
  file_limit_mb: 15,
  // Could add festival-specific overrides
  festival_overrides: {
    'festivalcode1': { limit_mb: 1000 },
    'festivalcode2': { limit_mb: 200 },
  }
}
```

**Pros:** Centralized configuration
**Cons:** Requires code changes for adjustments

## Summary

### ✅ Current Status:
- **Storage limit:** 400MB (hardcoded)
- **Who sets it:** Developers in code
- **Who can change it:** Only developers via code deployment
- **Per-festival:** No, same for all festivals
- **Super admin control:** No

### 🎯 Recommended:
Implement **Option 1** - Add per-festival storage limits configurable by super admin in the database.

### 📝 Benefits of Making It Configurable:
- ✅ Flexibility for different festival sizes
- ✅ Super admin can adjust without code changes
- ✅ Can offer different plans/tiers
- ✅ Better resource management
- ✅ Can increase limits for special cases
- ✅ Can decrease limits for testing/small events

## Related Files
- `lib/utils.ts` (line 59-82) - Storage calculation logic
- `components/modals/StorageStatsModal.tsx` - Storage display
- `app/f/[code]/admin/page.tsx` (line 1519) - Storage bar
- `types/index.ts` - Festival interface
- `SQL/supabase-migration-multifestive.sql` - Festivals table schema

## Migration File Name (If Implementing)
`SQL-new/014-ADD-CONFIGURABLE-STORAGE-LIMITS.sql`

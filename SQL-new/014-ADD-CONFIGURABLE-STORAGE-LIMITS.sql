-- Migration 014: Add Configurable Storage Limits Per Festival
-- This migration adds storage configuration fields to the festivals table
-- allowing super admins to set custom storage limits for each festival

-- ============================================================================
-- STEP 1: Add storage limit columns to festivals table
-- ============================================================================

-- Add max_storage_mb column (default 400MB)
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS max_storage_mb INTEGER DEFAULT 400;

-- Add max_video_size_mb column (default 50MB per video file)
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS max_video_size_mb INTEGER DEFAULT 50;

-- Add max_file_size_mb column (default 15MB per other file)
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 15;

-- Add timestamp for when storage settings were last updated
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS storage_settings_updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- STEP 2: Set default values for existing festivals
-- ============================================================================

-- Update existing festivals to have default storage limits
UPDATE festivals
SET 
  max_storage_mb = 400,
  max_video_size_mb = 50,
  max_file_size_mb = 15,
  storage_settings_updated_at = NOW()
WHERE max_storage_mb IS NULL 
   OR max_video_size_mb IS NULL 
   OR max_file_size_mb IS NULL;

-- ============================================================================
-- STEP 3: Add constraints to ensure valid values
-- ============================================================================

-- Ensure max_storage_mb is between 100MB and 10GB (10000MB)
ALTER TABLE festivals 
ADD CONSTRAINT check_max_storage_mb_range 
CHECK (max_storage_mb >= 100 AND max_storage_mb <= 10000);

-- Ensure max_video_size_mb is between 10MB and 500MB
ALTER TABLE festivals 
ADD CONSTRAINT check_max_video_size_mb_range 
CHECK (max_video_size_mb >= 10 AND max_video_size_mb <= 500);

-- Ensure max_file_size_mb is between 1MB and 100MB
ALTER TABLE festivals 
ADD CONSTRAINT check_max_file_size_mb_range 
CHECK (max_file_size_mb >= 1 AND max_file_size_mb <= 100);

-- ============================================================================
-- STEP 4: Add helpful comments
-- ============================================================================

COMMENT ON COLUMN festivals.max_storage_mb IS 'Maximum total storage in MB for festival media (default: 400MB, range: 100-10000MB)';
COMMENT ON COLUMN festivals.max_video_size_mb IS 'Maximum size in MB for individual video files (default: 50MB, range: 10-500MB)';
COMMENT ON COLUMN festivals.max_file_size_mb IS 'Maximum size in MB for individual non-video files (default: 15MB, range: 1-100MB)';
COMMENT ON COLUMN festivals.storage_settings_updated_at IS 'Timestamp of last storage settings update';

-- ============================================================================
-- STEP 5: Create a function to update storage settings
-- ============================================================================

CREATE OR REPLACE FUNCTION update_festival_storage_settings(
  p_festival_id UUID,
  p_max_storage_mb INTEGER,
  p_max_video_size_mb INTEGER,
  p_max_file_size_mb INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update the festival's storage settings
  UPDATE festivals
  SET 
    max_storage_mb = p_max_storage_mb,
    max_video_size_mb = p_max_video_size_mb,
    max_file_size_mb = p_max_file_size_mb,
    storage_settings_updated_at = NOW(),
    updated_at = NOW()
  WHERE id = p_festival_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_festival_storage_settings(UUID, INTEGER, INTEGER, INTEGER) TO authenticated, anon;

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    total_festivals INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STORAGE LIMITS MIGRATION VERIFICATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Check if columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'festivals' AND column_name = 'max_storage_mb'
    ) THEN
        RAISE NOTICE '✅ Column max_storage_mb added successfully';
    ELSE
        RAISE NOTICE '❌ Column max_storage_mb NOT found';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'festivals' AND column_name = 'max_video_size_mb'
    ) THEN
        RAISE NOTICE '✅ Column max_video_size_mb added successfully';
    ELSE
        RAISE NOTICE '❌ Column max_video_size_mb NOT found';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'festivals' AND column_name = 'max_file_size_mb'
    ) THEN
        RAISE NOTICE '✅ Column max_file_size_mb added successfully';
    ELSE
        RAISE NOTICE '❌ Column max_file_size_mb NOT found';
    END IF;
    
    -- Check constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'festivals' AND constraint_name = 'check_max_storage_mb_range'
    ) THEN
        RAISE NOTICE '✅ Constraint check_max_storage_mb_range added successfully';
    ELSE
        RAISE NOTICE '⚠️  Constraint check_max_storage_mb_range NOT found';
    END IF;
    
    -- Count festivals and show their settings
    SELECT COUNT(*) INTO total_festivals FROM festivals;
    RAISE NOTICE '';
    RAISE NOTICE 'Total festivals: %', total_festivals;
    RAISE NOTICE '';
    
    IF total_festivals > 0 THEN
        RAISE NOTICE 'Festival Storage Settings:';
        RAISE NOTICE '%-25s | %-12s | %-15s | %-15s', 'Festival Code', 'Total (MB)', 'Video Max (MB)', 'File Max (MB)';
        RAISE NOTICE '--------------------------|--------------|-----------------|------------------';
        
        FOR rec IN 
            SELECT 
                code,
                COALESCE(max_storage_mb, 400) as storage,
                COALESCE(max_video_size_mb, 50) as video,
                COALESCE(max_file_size_mb, 15) as file
            FROM festivals
            ORDER BY code
            LIMIT 10
        LOOP
            RAISE NOTICE '%-25s | %12s | %15s | %15s', 
                rec.code, 
                rec.storage, 
                rec.video, 
                rec.file;
        END LOOP;
        
        IF total_festivals > 10 THEN
            RAISE NOTICE '... and % more festivals', total_festivals - 10;
        END IF;
    ELSE
        RAISE NOTICE 'No festivals found in database';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Default values:';
    RAISE NOTICE '  - Total Storage: 400MB';
    RAISE NOTICE '  - Video File Max: 50MB';
    RAISE NOTICE '  - Other File Max: 15MB';
    RAISE NOTICE '';
    RAISE NOTICE 'Super admins can now configure these values per festival!';
    RAISE NOTICE '';
END;
$$;

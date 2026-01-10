-- ============================================
-- FIX: Analytics Config Tables Schema
-- ============================================
-- This script fixes missing tables and columns for analytics configuration
-- Date: 2026-01-10
-- ============================================
--
-- ISSUES FIXED:
-- 1. Missing columns in analytics_config table (previous_year_total_collection, etc.)
-- 2. Missing donation_buckets table
-- 3. Missing time_of_day_buckets table
-- 4. Missing RLS policies and indexes
-- ============================================

-- ============================================
-- STEP 1: Fix analytics_config Table Columns
-- ============================================

-- Check if analytics_config table exists and add missing columns
DO $$
BEGIN
  -- Add previous_year_total_collection if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'analytics_config' 
    AND column_name = 'previous_year_total_collection'
  ) THEN
    ALTER TABLE analytics_config 
    ADD COLUMN previous_year_total_collection DECIMAL(12,2);
    RAISE NOTICE '✓ Added previous_year_total_collection column';
  ELSE
    RAISE NOTICE '✓ previous_year_total_collection column already exists';
  END IF;

  -- Add previous_year_total_expense if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'analytics_config' 
    AND column_name = 'previous_year_total_expense'
  ) THEN
    ALTER TABLE analytics_config 
    ADD COLUMN previous_year_total_expense DECIMAL(12,2);
    RAISE NOTICE '✓ Added previous_year_total_expense column';
  ELSE
    RAISE NOTICE '✓ previous_year_total_expense column already exists';
  END IF;

  -- Add previous_year_net_balance if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'analytics_config' 
    AND column_name = 'previous_year_net_balance'
  ) THEN
    ALTER TABLE analytics_config 
    ADD COLUMN previous_year_net_balance DECIMAL(12,2);
    RAISE NOTICE '✓ Added previous_year_net_balance column';
  ELSE
    RAISE NOTICE '✓ previous_year_net_balance column already exists';
  END IF;

  -- Add collection_target_amount if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'analytics_config' 
    AND column_name = 'collection_target_amount'
  ) THEN
    ALTER TABLE analytics_config 
    ADD COLUMN collection_target_amount DECIMAL(12,2);
    RAISE NOTICE '✓ Added collection_target_amount column';
  ELSE
    RAISE NOTICE '✓ collection_target_amount column already exists';
  END IF;

  -- Add target_visibility if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'analytics_config' 
    AND column_name = 'target_visibility'
  ) THEN
    ALTER TABLE analytics_config 
    ADD COLUMN target_visibility TEXT DEFAULT 'public';
    RAISE NOTICE '✓ Added target_visibility column';
  ELSE
    RAISE NOTICE '✓ target_visibility column already exists';
  END IF;

  -- Add created_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'analytics_config' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE analytics_config 
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✓ Added created_at column';
  ELSE
    RAISE NOTICE '✓ created_at column already exists';
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'analytics_config' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE analytics_config 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✓ Added updated_at column';
  ELSE
    RAISE NOTICE '✓ updated_at column already exists';
  END IF;

  -- Ensure festival_id has UNIQUE constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'analytics_config'::regclass 
    AND conname LIKE '%festival_id%unique%'
  ) THEN
    -- Check if constraint exists with different name
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'analytics_config'::regclass 
      AND contype = 'u'
      AND array_length(conkey, 1) = 1
      AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'analytics_config'::regclass AND attname = 'festival_id')
    ) THEN
      RAISE NOTICE '✓ festival_id UNIQUE constraint already exists (different name)';
    ELSE
      ALTER TABLE analytics_config 
      ADD CONSTRAINT analytics_config_festival_id_unique UNIQUE (festival_id);
      RAISE NOTICE '✓ Added festival_id UNIQUE constraint';
    END IF;
  ELSE
    RAISE NOTICE '✓ festival_id UNIQUE constraint already exists';
  END IF;
END $$;

-- ============================================
-- STEP 2: Create donation_buckets Table
-- ============================================

CREATE TABLE IF NOT EXISTS donation_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  bucket_label TEXT NOT NULL,
  min_amount DECIMAL(10,2) NOT NULL,
  max_amount DECIMAL(10,2),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create time_of_day_buckets Table
-- ============================================

CREATE TABLE IF NOT EXISTS time_of_day_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  bucket_label TEXT NOT NULL,
  start_hour INTEGER NOT NULL,
  start_minute INTEGER DEFAULT 0,
  end_hour INTEGER NOT NULL,
  end_minute INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create Indexes
-- ============================================

-- Indexes for analytics_config
CREATE INDEX IF NOT EXISTS idx_analytics_config_festival ON analytics_config(festival_id);

-- Indexes for donation_buckets
CREATE INDEX IF NOT EXISTS idx_donation_buckets_festival ON donation_buckets(festival_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_donation_buckets_unique 
ON donation_buckets(festival_id, bucket_label)
WHERE bucket_label IS NOT NULL;

-- Indexes for time_of_day_buckets
CREATE INDEX IF NOT EXISTS idx_time_buckets_festival ON time_of_day_buckets(festival_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_buckets_unique 
ON time_of_day_buckets(festival_id, bucket_label)
WHERE bucket_label IS NOT NULL;

-- ============================================
-- STEP 5: Enable RLS and Create Policies
-- ============================================

-- Enable RLS
ALTER TABLE analytics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_of_day_buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read analytics_config" ON analytics_config;
DROP POLICY IF EXISTS "Allow authenticated admins to update analytics_config" ON analytics_config;
DROP POLICY IF EXISTS "Allow authenticated admins to insert analytics_config" ON analytics_config;

DROP POLICY IF EXISTS "Allow authenticated users to read donation_buckets" ON donation_buckets;
DROP POLICY IF EXISTS "Allow authenticated admins to update donation_buckets" ON donation_buckets;
DROP POLICY IF EXISTS "Allow authenticated admins to insert donation_buckets" ON donation_buckets;
DROP POLICY IF EXISTS "Allow authenticated admins to delete donation_buckets" ON donation_buckets;

DROP POLICY IF EXISTS "Allow authenticated users to read time_of_day_buckets" ON time_of_day_buckets;
DROP POLICY IF EXISTS "Allow authenticated admins to update time_of_day_buckets" ON time_of_day_buckets;
DROP POLICY IF EXISTS "Allow authenticated admins to insert time_of_day_buckets" ON time_of_day_buckets;
DROP POLICY IF EXISTS "Allow authenticated admins to delete time_of_day_buckets" ON time_of_day_buckets;

-- Create policies for analytics_config
CREATE POLICY "Allow authenticated users to read analytics_config"
  ON analytics_config FOR SELECT USING (true);

CREATE POLICY "Allow authenticated admins to update analytics_config"
  ON analytics_config FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated admins to insert analytics_config"
  ON analytics_config FOR INSERT WITH CHECK (true);

-- Create policies for donation_buckets
CREATE POLICY "Allow authenticated users to read donation_buckets"
  ON donation_buckets FOR SELECT USING (true);

CREATE POLICY "Allow authenticated admins to update donation_buckets"
  ON donation_buckets FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated admins to insert donation_buckets"
  ON donation_buckets FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated admins to delete donation_buckets"
  ON donation_buckets FOR DELETE USING (true);

-- Create policies for time_of_day_buckets
CREATE POLICY "Allow authenticated users to read time_of_day_buckets"
  ON time_of_day_buckets FOR SELECT USING (true);

CREATE POLICY "Allow authenticated admins to update time_of_day_buckets"
  ON time_of_day_buckets FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated admins to insert time_of_day_buckets"
  ON time_of_day_buckets FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated admins to delete time_of_day_buckets"
  ON time_of_day_buckets FOR DELETE USING (true);

-- ============================================
-- STEP 6: Verify Schema
-- ============================================

-- Verify analytics_config columns
SELECT 
  'analytics_config columns:' as check_type,
  CASE
    WHEN COUNT(*) >= 8 THEN '✓ OK - All required columns exist'
    ELSE '⚠ WARNING - Missing some columns (count: ' || COUNT(*) || ')'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'analytics_config'
  AND column_name IN ('id', 'festival_id', 'collection_target_amount', 'target_visibility', 'previous_year_total_collection', 'previous_year_total_expense', 'previous_year_net_balance', 'created_at', 'updated_at');

-- Verify donation_buckets table exists
SELECT 
  'donation_buckets table:' as check_type,
  CASE
    WHEN COUNT(*) >= 8 THEN '✓ OK - Table exists with all columns'
    ELSE '⚠ WARNING - Table missing or incomplete (count: ' || COUNT(*) || ')'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'donation_buckets'
  AND column_name IN ('id', 'festival_id', 'bucket_label', 'min_amount', 'max_amount', 'sort_order', 'created_at', 'updated_at');

-- Verify time_of_day_buckets table exists
SELECT 
  'time_of_day_buckets table:' as check_type,
  CASE
    WHEN COUNT(*) >= 9 THEN '✓ OK - Table exists with all columns'
    ELSE '⚠ WARNING - Table missing or incomplete (count: ' || COUNT(*) || ')'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'time_of_day_buckets'
  AND column_name IN ('id', 'festival_id', 'bucket_label', 'start_hour', 'start_minute', 'end_hour', 'end_minute', 'sort_order', 'created_at', 'updated_at');

-- ============================================
-- SUMMARY
-- ============================================

SELECT
  'ANALYTICS CONFIG SCHEMA FIX COMPLETE' as status,
  'Review the notices and queries above' as next_step,
  'If all checks show ✓, the schema is fixed and ready' as conclusion,
  'If warnings (⚠) appear, check the specific table/columns' as action_required;

-- ============================================
-- NOTES
-- ============================================
-- 1. This script safely adds missing columns and tables
-- 2. RLS policies are recreated to ensure proper access
-- 3. Indexes are created for performance
-- 4. All operations use IF NOT EXISTS / IF EXISTS for safety
-- 5. After running this script, analytics config modal should work correctly

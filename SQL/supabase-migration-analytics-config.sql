-- Migration: Analytics Configuration Tables
-- Adds support for configurable donation amount buckets, time-of-day buckets,
-- collection targets, and previous year summary data per festival

-- ============================================
-- 1. CREATE ANALYTICS CONFIG TABLE
-- ============================================
-- Stores analytics configuration per festival including target amount and visibility
CREATE TABLE IF NOT EXISTS analytics_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL UNIQUE REFERENCES festivals(id) ON DELETE CASCADE,
  collection_target_amount DECIMAL(12,2), -- Target collection amount for the festival
  target_visibility TEXT DEFAULT 'public', -- 'public' or 'admin_only'
  previous_year_total_collection DECIMAL(12,2), -- Previous year collection total
  previous_year_total_expense DECIMAL(12,2), -- Previous year expense total
  previous_year_net_balance DECIMAL(12,2), -- Previous year balance (calculated on retrieval)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_analytics_config_festival ON analytics_config(festival_id);

-- ============================================
-- 2. CREATE DONATION AMOUNT BUCKETS TABLE
-- ============================================
-- Stores configurable donation amount ranges per festival
CREATE TABLE IF NOT EXISTS donation_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  bucket_label TEXT NOT NULL, -- e.g., "₹1–₹750", "₹751–₹2000"
  min_amount DECIMAL(10,2) NOT NULL,
  max_amount DECIMAL(10,2), -- NULL for "above" buckets (e.g., ₹5000+)
  sort_order INTEGER DEFAULT 0, -- For ordering buckets display
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_donation_buckets_festival ON donation_buckets(festival_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_donation_buckets_unique 
ON donation_buckets(festival_id, bucket_label);

-- ============================================
-- 3. CREATE TIME OF DAY BUCKETS TABLE
-- ============================================
-- Stores configurable time-of-day ranges per festival
CREATE TABLE IF NOT EXISTS time_of_day_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  bucket_label TEXT NOT NULL, -- e.g., "Morning (06:00–11:00)"
  start_hour INTEGER NOT NULL, -- 0-23
  start_minute INTEGER DEFAULT 0, -- 0-59
  end_hour INTEGER NOT NULL, -- 0-23
  end_minute INTEGER DEFAULT 0, -- 0-59
  sort_order INTEGER DEFAULT 0, -- For ordering buckets display
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_buckets_festival ON time_of_day_buckets(festival_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_buckets_unique 
ON time_of_day_buckets(festival_id, bucket_label);

-- ============================================
-- 4. ENABLE RLS POLICIES
-- ============================================
ALTER TABLE analytics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_of_day_buckets ENABLE ROW LEVEL SECURITY;

-- Policies for analytics_config (festival-level access)
CREATE POLICY "Allow authenticated users to read analytics_config"
  ON analytics_config FOR SELECT USING (true);

CREATE POLICY "Allow authenticated admins to update analytics_config"
  ON analytics_config FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated admins to insert analytics_config"
  ON analytics_config FOR INSERT WITH CHECK (true);

-- Policies for donation_buckets (festival-level access)
CREATE POLICY "Allow authenticated users to read donation_buckets"
  ON donation_buckets FOR SELECT USING (true);

CREATE POLICY "Allow authenticated admins to update donation_buckets"
  ON donation_buckets FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated admins to insert donation_buckets"
  ON donation_buckets FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated admins to delete donation_buckets"
  ON donation_buckets FOR DELETE USING (true);

-- Policies for time_of_day_buckets (festival-level access)
CREATE POLICY "Allow authenticated users to read time_of_day_buckets"
  ON time_of_day_buckets FOR SELECT USING (true);

CREATE POLICY "Allow authenticated admins to update time_of_day_buckets"
  ON time_of_day_buckets FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated admins to insert time_of_day_buckets"
  ON time_of_day_buckets FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated admins to delete time_of_day_buckets"
  ON time_of_day_buckets FOR DELETE USING (true);

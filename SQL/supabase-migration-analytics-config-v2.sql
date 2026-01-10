-- Analytics Configuration Tables for Donation Book
-- This migration adds support for configurable analytics settings per festival

-- 1) Analytics Configuration Table
CREATE TABLE IF NOT EXISTS analytics_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id UUID NOT NULL UNIQUE REFERENCES festivals(id) ON DELETE CASCADE,
  collection_target_amount DECIMAL(12,2),
  is_target_visible BOOLEAN DEFAULT FALSE,
  previous_year_collection DECIMAL(12,2) DEFAULT 0,
  previous_year_expense DECIMAL(12,2) DEFAULT 0,
  previous_year_balance DECIMAL(12,2) DEFAULT 0,
  donation_buckets JSONB DEFAULT '[]'::jsonb,
  time_of_day_buckets JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Festival Code History Table (for tracking old codes and redirects)
CREATE TABLE IF NOT EXISTS festival_code_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  old_code TEXT NOT NULL,
  new_code TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Add updated_at trigger for analytics_config
CREATE OR REPLACE FUNCTION update_analytics_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_config_timestamp
BEFORE UPDATE ON analytics_config
FOR EACH ROW
EXECUTE FUNCTION update_analytics_config_timestamp();

-- 4) Add columns to festivals table for code tracking and old code storage
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS old_code TEXT;
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS code_updated_at TIMESTAMPTZ;

-- 5) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_config_festival ON analytics_config(festival_id);
CREATE INDEX IF NOT EXISTS idx_festival_code_history_festival ON festival_code_history(festival_id);
CREATE INDEX IF NOT EXISTS idx_festival_code_history_old_code ON festival_code_history(old_code);

-- 6) RLS Policies for analytics_config
ALTER TABLE analytics_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "analytics_config_public_select" ON analytics_config;
DROP POLICY IF EXISTS "analytics_config_public_insert" ON analytics_config;
DROP POLICY IF EXISTS "analytics_config_public_update" ON analytics_config;

-- Create new policies
CREATE POLICY "analytics_config_public_select" ON analytics_config FOR SELECT USING (true);
CREATE POLICY "analytics_config_public_insert" ON analytics_config FOR INSERT WITH CHECK (true);
CREATE POLICY "analytics_config_public_update" ON analytics_config FOR UPDATE USING (true);

ALTER TABLE festival_code_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "festival_code_history_public_select" ON festival_code_history;
DROP POLICY IF EXISTS "festival_code_history_public_insert" ON festival_code_history;

-- Create new policies
CREATE POLICY "festival_code_history_public_select" ON festival_code_history FOR SELECT USING (true);
CREATE POLICY "festival_code_history_public_insert" ON festival_code_history FOR INSERT WITH CHECK (true);

-- 7) Create default analytics config when festival is created (optional trigger)
-- This can be handled in application code, but here's a trigger alternative:
-- CREATE OR REPLACE FUNCTION create_default_analytics_config()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO analytics_config (festival_id) VALUES (NEW.id);
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER festival_create_analytics_config
-- AFTER INSERT ON festivals
-- FOR EACH ROW
-- EXECUTE FUNCTION create_default_analytics_config();

-- Multi-festive refactor
-- 1) Create festivals table
CREATE TABLE IF NOT EXISTS festivals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  organiser TEXT,
  mentor TEXT,
  guide TEXT,
  location TEXT,
  event_start_date DATE,
  event_end_date DATE,
  other_data JSONB,
  requires_user_password BOOLEAN DEFAULT TRUE,
  user_password TEXT,
  user_password_updated_at TIMESTAMPTZ DEFAULT NOW(),
  admin_password TEXT NOT NULL DEFAULT 'admin',
  admin_password_updated_at TIMESTAMPTZ DEFAULT NOW(),
  theme_primary_color TEXT DEFAULT '#2563eb',
  theme_secondary_color TEXT DEFAULT '#1f2937',
  theme_bg_color TEXT DEFAULT '#f8fafc',
  theme_bg_image_url TEXT,
  theme_text_color TEXT DEFAULT '#111827',
  theme_border_color TEXT DEFAULT '#d1d5db',
  theme_table_bg TEXT DEFAULT '#ffffff',
  theme_card_bg TEXT DEFAULT '#ffffff',
  theme_dark BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Add festival_id to transactional and taxonomy tables
ALTER TABLE collections ADD COLUMN IF NOT EXISTS festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE;
ALTER TABLE collection_modes ADD COLUMN IF NOT EXISTS festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE;
ALTER TABLE expense_modes ADD COLUMN IF NOT EXISTS festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE;

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_collections_festival_date ON collections(festival_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_festival_date ON expenses(festival_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_groups_festival_name ON groups(festival_id, name);
CREATE INDEX IF NOT EXISTS idx_categories_festival_name ON categories(festival_id, name);
CREATE INDEX IF NOT EXISTS idx_col_modes_festival_name ON collection_modes(festival_id, name);
CREATE INDEX IF NOT EXISTS idx_exp_modes_festival_name ON expense_modes(festival_id, name);

-- 4) Unique constraints per festival
DO $$ BEGIN
  ALTER TABLE groups ADD CONSTRAINT groups_unique_per_festival UNIQUE (festival_id, name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE categories ADD CONSTRAINT categories_unique_per_festival UNIQUE (festival_id, name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE collection_modes ADD CONSTRAINT col_modes_unique_per_festival UNIQUE (festival_id, name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE expense_modes ADD CONSTRAINT exp_modes_unique_per_festival UNIQUE (festival_id, name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5) RLS policies for festivals
ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "festivals_public_select" ON festivals FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "festivals_public_insert" ON festivals FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "festivals_public_update" ON festivals FOR UPDATE USING (true);

-- 6) Optional backfill from basic_info (if any single-row app existed)
-- This attempts to create a festival from the first basic_info row and assign existing data to it
-- Adjust or remove if not desired.
WITH bi AS (
  SELECT id, event_name, organiser, mentor, guide, location, event_start_date, event_end_date, other_data
  FROM basic_info
  ORDER BY created_at ASC
  LIMIT 1
), ins AS (
  INSERT INTO festivals(code, event_name, organiser, mentor, guide, location, event_start_date, event_end_date, other_data, requires_user_password, user_password, admin_password)
  SELECT
    SUBSTRING(REPLACE(uuid_generate_v4()::text, '-', ''), 1, 8),
    COALESCE(event_name, 'Festive Celebration'),
    organiser,
    mentor,
    guide,
    location,
    event_start_date,
    event_end_date,
    other_data,
    TRUE,
    'Festive@123',
    'admin'
  FROM bi
  ON CONFLICT DO NOTHING
  RETURNING id
)
UPDATE collections SET festival_id = (SELECT id FROM ins) WHERE festival_id IS NULL;

UPDATE expenses SET festival_id = (SELECT id FROM ins) WHERE festival_id IS NULL;

-- Note: You may want to require NOT NULL on festival_id after backfill is complete:
-- ALTER TABLE collections ALTER COLUMN festival_id SET NOT NULL;
-- ALTER TABLE expenses ALTER COLUMN festival_id SET NOT NULL;
-- And similarly for taxonomy tables after you re-create them per festival.

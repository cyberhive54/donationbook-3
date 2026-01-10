-- ============================================
-- PATCH: Add Missing Columns to Existing Multi-Admin Setup
-- ============================================
-- This patch adds columns that may be missing from the initial multi-admin migration
-- SAFE to run - uses IF NOT EXISTS, won't error if columns already exist
-- ============================================

-- Add usage tracking to user_passwords table
ALTER TABLE user_passwords
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

ALTER TABLE user_passwords
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Add admin_display_preference to festivals table
ALTER TABLE festivals
ADD COLUMN IF NOT EXISTS admin_display_preference TEXT DEFAULT 'code';

-- Create index for usage tracking (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_passwords_usage ON user_passwords(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_user_passwords_last_used ON user_passwords(last_used_at DESC);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if columns were added
SELECT 
  'Verification' as check_type,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_passwords' AND column_name = 'usage_count') as usage_count_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_passwords' AND column_name = 'last_used_at') as last_used_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'festivals' AND column_name = 'admin_display_preference') as display_pref_exists;

-- Show sample data
SELECT 
  'Sample Data' as info,
  COUNT(*) as total_user_passwords
FROM user_passwords;

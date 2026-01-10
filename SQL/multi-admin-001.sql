-- Multi-Admin System - Database Schema Migration
-- This creates the new tables for multi-admin functionality
-- Existing festivals table remains unchanged for backwards compatibility

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For password hashing

-- ============================================
-- ADMINS TABLE
-- ============================================
-- Stores multiple admins per festival
CREATE TABLE IF NOT EXISTS admins (
  admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  admin_code VARCHAR(6) NOT NULL UNIQUE, -- Unique 6-character code (e.g., "A1B2C3")
  admin_name VARCHAR(255) NOT NULL,
  admin_password_hash TEXT NOT NULL, -- bcrypt hashed password
  is_active BOOLEAN DEFAULT TRUE,
  max_user_passwords INTEGER DEFAULT 3, -- Each admin can create up to 3 user passwords
  created_by UUID REFERENCES admins(admin_id) ON DELETE SET NULL, -- Super admin who created this admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique admin name within a festival
  UNIQUE(festival_id, admin_name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_festival_id ON admins(festival_id);
CREATE INDEX IF NOT EXISTS idx_admins_code ON admins(admin_code);
CREATE INDEX IF NOT EXISTS idx_admins_festival_name ON admins(festival_id, admin_name);

-- ============================================
-- USER PASSWORDS TABLE
-- ============================================
-- Each admin can create multiple user passwords (up to their max_user_passwords limit)
CREATE TABLE IF NOT EXISTS user_passwords (
  password_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
  password VARCHAR(255) NOT NULL, -- Plain text password (as requested in plan)
  label VARCHAR(255), -- Optional label like "Group A Password", "VIP Password"
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admins(admin_id), -- Admin who created this password
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique password within a festival
  UNIQUE(festival_id, password)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_passwords_festival_id ON user_passwords(festival_id);
CREATE INDEX IF NOT EXISTS idx_user_passwords_admin_id ON user_passwords(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_passwords_active ON user_passwords(festival_id, is_active);

-- ============================================
-- ADMIN ACTIVITY LOG TABLE
-- ============================================
-- Tracks all admin actions for accountability
CREATE TABLE IF NOT EXISTS admin_activity_log (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL, -- NULL if admin is deleted
  admin_name VARCHAR(255), -- Store name for historical record even if admin deleted
  action_type VARCHAR(100) NOT NULL, -- e.g., 'add_collection', 'add_expense', 'update_banner', etc.
  action_details JSONB, -- Store details of the action
  target_type VARCHAR(50), -- 'collection', 'expense', 'user_password', 'album', etc.
  target_id UUID, -- ID of the affected resource
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_activity_festival_id ON admin_activity_log(festival_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_timestamp ON admin_activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action_type ON admin_activity_log(action_type);

-- ============================================
-- MODIFY EXISTING TABLES
-- ============================================

-- Add multi_admin_enabled flag to festivals table
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS multi_admin_enabled BOOLEAN DEFAULT FALSE;

-- Add admin tracking fields to collections table
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add admin tracking fields to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add admin tracking to albums table (if exists)
ALTER TABLE albums 
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL;

-- Enhance access_logs table to track which admin's password was used
ALTER TABLE access_logs 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS user_password_id UUID REFERENCES user_passwords(password_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS auth_method VARCHAR(50) DEFAULT 'url-param'; -- 'url-param' or 'login-page'

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate unique admin code
CREATE OR REPLACE FUNCTION generate_admin_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  
  -- Check if code already exists, regenerate if needed
  WHILE EXISTS (SELECT 1 FROM admins WHERE admin_code = result) LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if admin can create more user passwords
CREATE OR REPLACE FUNCTION can_create_user_password(p_admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  max_allowed INTEGER;
  current_count INTEGER;
BEGIN
  -- Get max allowed passwords for this admin
  SELECT max_user_passwords INTO max_allowed
  FROM admins
  WHERE admin_id = p_admin_id AND is_active = TRUE;
  
  IF max_allowed IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Count active passwords created by this admin
  SELECT COUNT(*) INTO current_count
  FROM user_passwords
  WHERE admin_id = p_admin_id AND is_active = TRUE;
  
  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_festival_id UUID,
  p_admin_id UUID,
  p_action_type VARCHAR,
  p_action_details JSONB DEFAULT NULL,
  p_target_type VARCHAR DEFAULT NULL,
  p_target_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_name VARCHAR(255);
BEGIN
  -- Get admin name for historical record
  SELECT admin_name INTO v_admin_name
  FROM admins
  WHERE admin_id = p_admin_id;
  
  INSERT INTO admin_activity_log (
    festival_id,
    admin_id,
    admin_name,
    action_type,
    action_details,
    target_type,
    target_id
  ) VALUES (
    p_festival_id,
    p_admin_id,
    v_admin_name,
    p_action_type,
    p_action_details,
    p_target_type,
    p_target_id
  ) RETURNING log_id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Public read access for admins table
CREATE POLICY "Allow public read access on admins" 
  ON admins FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert on admins" 
  ON admins FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update on admins" 
  ON admins FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete on admins" 
  ON admins FOR DELETE 
  USING (true);

-- Public read access for user_passwords table
CREATE POLICY "Allow public read access on user_passwords" 
  ON user_passwords FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert on user_passwords" 
  ON user_passwords FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update on user_passwords" 
  ON user_passwords FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete on user_passwords" 
  ON user_passwords FOR DELETE 
  USING (true);

-- Public read access for admin_activity_log table
CREATE POLICY "Allow public read access on admin_activity_log" 
  ON admin_activity_log FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert on admin_activity_log" 
  ON admin_activity_log FOR INSERT 
  WITH CHECK (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to admins table
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_passwords table
DROP TRIGGER IF EXISTS update_user_passwords_updated_at ON user_passwords;
CREATE TRIGGER update_user_passwords_updated_at
  BEFORE UPDATE ON user_passwords
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to collections table
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to expenses table
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE admins IS 'Stores multiple administrators for each festival';
COMMENT ON TABLE user_passwords IS 'User passwords managed by admins (each admin can create up to max_user_passwords)';
COMMENT ON TABLE admin_activity_log IS 'Audit log of all admin actions for accountability';
COMMENT ON COLUMN admins.admin_code IS 'Unique 6-character code for admin identification (e.g., A1B2C3)';
COMMENT ON COLUMN admins.max_user_passwords IS 'Maximum number of user passwords this admin can create (default: 3)';
COMMENT ON COLUMN user_passwords.password IS 'Plain text password - used for user access verification';
COMMENT ON COLUMN admin_activity_log.action_details IS 'JSONB field storing detailed information about the action';

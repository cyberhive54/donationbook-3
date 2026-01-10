-- Donation Book - Supabase Database Schema
-- Run this SQL script in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Basic Information Table
CREATE TABLE IF NOT EXISTS basic_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  organiser TEXT,
  mentor TEXT,
  guide TEXT,
  event_date DATE,
  other_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections Table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  group_name TEXT NOT NULL,
  mode TEXT NOT NULL,
  note TEXT,
  date DATE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item TEXT NOT NULL,
  pieces INTEGER NOT NULL,
  price_per_piece DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  mode TEXT NOT NULL,
  note TEXT,
  date DATE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups Table (for collection groups)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection Modes Table
CREATE TABLE IF NOT EXISTS collection_modes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories Table (for expense categories)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense Modes Table
CREATE TABLE IF NOT EXISTS expense_modes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Passwords Table
CREATE TABLE IF NOT EXISTS passwords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_password TEXT NOT NULL DEFAULT 'Festive@123',
  admin_password TEXT NOT NULL DEFAULT 'admin',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_date ON collections(date DESC);
CREATE INDEX IF NOT EXISTS idx_collections_group ON collections(group_name);
CREATE INDEX IF NOT EXISTS idx_collections_mode ON collections(mode);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_mode ON expenses(mode);

-- Insert initial data
INSERT INTO passwords (user_password, admin_password) 
VALUES ('Festive@123', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO collection_modes (name) VALUES ('Cash'), ('Online')
ON CONFLICT (name) DO NOTHING;

INSERT INTO expense_modes (name) VALUES ('Cash'), ('Online')
ON CONFLICT (name) DO NOTHING;

-- Insert sample groups (optional)
INSERT INTO groups (name) VALUES 
  ('Group A'),
  ('Group B'),
  ('Group C')
ON CONFLICT (name) DO NOTHING;

-- Insert sample categories (optional)
INSERT INTO categories (name) VALUES 
  ('Food'),
  ('Decoration'),
  ('Entertainment'),
  ('Miscellaneous')
ON CONFLICT (name) DO NOTHING;

-- Set up Row Level Security (RLS)
-- Note: For a community app, we're allowing public access
-- In production, you may want to implement proper authentication

ALTER TABLE basic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Allow public read access on basic_info" ON basic_info FOR SELECT USING (true);
CREATE POLICY "Allow public insert on basic_info" ON basic_info FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on basic_info" ON basic_info FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on basic_info" ON basic_info FOR DELETE USING (true);

CREATE POLICY "Allow public read access on collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Allow public insert on collections" ON collections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on collections" ON collections FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on collections" ON collections FOR DELETE USING (true);

CREATE POLICY "Allow public read access on expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on expenses" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on expenses" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on expenses" ON expenses FOR DELETE USING (true);

CREATE POLICY "Allow public read access on groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert on groups" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on groups" ON groups FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on groups" ON groups FOR DELETE USING (true);

CREATE POLICY "Allow public read access on collection_modes" ON collection_modes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on collection_modes" ON collection_modes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on collection_modes" ON collection_modes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on collection_modes" ON collection_modes FOR DELETE USING (true);

CREATE POLICY "Allow public read access on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert on categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on categories" ON categories FOR DELETE USING (true);

CREATE POLICY "Allow public read access on expense_modes" ON expense_modes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on expense_modes" ON expense_modes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on expense_modes" ON expense_modes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on expense_modes" ON expense_modes FOR DELETE USING (true);

CREATE POLICY "Allow public read access on passwords" ON passwords FOR SELECT USING (true);
CREATE POLICY "Allow public update on passwords" ON passwords FOR UPDATE USING (true);

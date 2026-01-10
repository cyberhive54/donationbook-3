-- Migration: Add time fields to collections and expenses
-- This adds hour and minute columns to track time along with dates

-- Add time columns to collections table
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS time_hour INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_minute INTEGER DEFAULT 0;

-- Add time columns to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS time_hour INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_minute INTEGER DEFAULT 0;

-- Add constraints to ensure valid time values (using DO block to handle if exists)
DO $$ 
BEGIN
  -- Constraints for collections
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'collections_time_hour_check'
  ) THEN
    ALTER TABLE collections ADD CONSTRAINT collections_time_hour_check 
    CHECK (time_hour >= 0 AND time_hour <= 23);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'collections_time_minute_check'
  ) THEN
    ALTER TABLE collections ADD CONSTRAINT collections_time_minute_check 
    CHECK (time_minute >= 0 AND time_minute <= 59);
  END IF;

  -- Constraints for expenses
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_time_hour_check'
  ) THEN
    ALTER TABLE expenses ADD CONSTRAINT expenses_time_hour_check 
    CHECK (time_hour >= 0 AND time_hour <= 23);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_time_minute_check'
  ) THEN
    ALTER TABLE expenses ADD CONSTRAINT expenses_time_minute_check 
    CHECK (time_minute >= 0 AND time_minute <= 59);
  END IF;
END $$;

-- Create indexes for time-based queries
CREATE INDEX IF NOT EXISTS idx_collections_datetime ON collections(date DESC, time_hour DESC, time_minute DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_datetime ON expenses(date DESC, time_hour DESC, time_minute DESC);

-- Note: Existing records will have time set to 00:00 (midnight)
-- You can update them manually if needed

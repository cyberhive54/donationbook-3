-- Migration: Extend basic_info with location and date range

-- Safe alterations (if not exists checks)
ALTER TABLE basic_info ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE basic_info ADD COLUMN IF NOT EXISTS event_start_date DATE;
ALTER TABLE basic_info ADD COLUMN IF NOT EXISTS event_end_date DATE;

-- Optional: backfill event_date into start/end if only event_date exists
UPDATE basic_info
SET event_start_date = COALESCE(event_start_date, event_date),
    event_end_date = COALESCE(event_end_date, event_date)
WHERE event_start_date IS NULL OR event_end_date IS NULL;

-- Indexes for querying by dates
CREATE INDEX IF NOT EXISTS idx_basic_info_event_start ON basic_info(event_start_date);
CREATE INDEX IF NOT EXISTS idx_basic_info_event_end ON basic_info(event_end_date);

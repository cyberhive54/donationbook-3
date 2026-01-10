-- Migration 003: Banner Visibility Controls for BasicInfo Component
-- Add fields to control what displays in the BasicInfo banner component

-- Add banner visibility control fields to festivals table
ALTER TABLE festivals
ADD COLUMN IF NOT EXISTS banner_show_organiser BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS banner_show_guide BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS banner_show_mentor BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS banner_show_location BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS banner_show_dates BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS banner_show_duration BOOLEAN DEFAULT true;

COMMENT ON COLUMN festivals.banner_show_organiser IS 'Control visibility of organiser in BasicInfo banner';
COMMENT ON COLUMN festivals.banner_show_guide IS 'Control visibility of guide in BasicInfo banner';
COMMENT ON COLUMN festivals.banner_show_mentor IS 'Control visibility of mentor in BasicInfo banner';
COMMENT ON COLUMN festivals.banner_show_location IS 'Control visibility of location in BasicInfo banner';
COMMENT ON COLUMN festivals.banner_show_dates IS 'Control visibility of dates in BasicInfo banner';
COMMENT ON COLUMN festivals.banner_show_duration IS 'Control visibility of duration in BasicInfo banner';

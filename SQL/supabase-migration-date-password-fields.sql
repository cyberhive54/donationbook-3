-- Migration: Add Collection/Expense Date Range and Password Requirements
-- This adds new date fields and password management features

-- ============================================
-- 1. ADD NEW COLUMNS TO FESTIVALS TABLE
-- ============================================

-- Add Collection/Expense date range (required for operations)
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS ce_start_date DATE,
ADD COLUMN IF NOT EXISTS ce_end_date DATE;

-- Add Super Admin Password field
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS super_admin_password TEXT DEFAULT 'Super Admin';

-- Add requires_password flag (default true for existing festivals)
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS requires_password BOOLEAN DEFAULT TRUE;

-- Add timestamps for tracking
ALTER TABLE festivals 
ADD COLUMN IF NOT EXISTS ce_dates_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS super_admin_password_updated_at TIMESTAMPTZ;

-- ============================================
-- 2. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN festivals.ce_start_date IS 'Collection/Expense operations start date - defines the valid date range for collections and expenses';
COMMENT ON COLUMN festivals.ce_end_date IS 'Collection/Expense operations end date - defines the valid date range for collections and expenses';
COMMENT ON COLUMN festivals.event_start_date IS 'Festival event start date - optional, must be within ce_start_date and ce_end_date if provided';
COMMENT ON COLUMN festivals.event_end_date IS 'Festival event end date - optional, must be within ce_start_date and ce_end_date if provided';
COMMENT ON COLUMN festivals.super_admin_password IS 'Super admin password for advanced features (to be implemented)';
COMMENT ON COLUMN festivals.requires_password IS 'Whether password is required to view festival data. If false, anyone with code can view (no analytics tracking)';

-- ============================================
-- 3. CREATE VALIDATION FUNCTION
-- ============================================

-- Function to validate festival dates are within collection/expense dates
CREATE OR REPLACE FUNCTION validate_festival_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- If festival dates are provided, they must be within ce dates
  IF NEW.event_start_date IS NOT NULL AND NEW.ce_start_date IS NOT NULL THEN
    IF NEW.event_start_date < NEW.ce_start_date THEN
      RAISE EXCEPTION 'Festival start date (%) must be on or after Collection/Expense start date (%)', 
        NEW.event_start_date, NEW.ce_start_date;
    END IF;
  END IF;

  IF NEW.event_end_date IS NOT NULL AND NEW.ce_end_date IS NOT NULL THEN
    IF NEW.event_end_date > NEW.ce_end_date THEN
      RAISE EXCEPTION 'Festival end date (%) must be on or before Collection/Expense end date (%)', 
        NEW.event_end_date, NEW.ce_end_date;
    END IF;
  END IF;

  -- Validate ce_start_date is before ce_end_date
  IF NEW.ce_start_date IS NOT NULL AND NEW.ce_end_date IS NOT NULL THEN
    IF NEW.ce_start_date > NEW.ce_end_date THEN
      RAISE EXCEPTION 'Collection/Expense start date (%) must be before end date (%)', 
        NEW.ce_start_date, NEW.ce_end_date;
    END IF;
  END IF;

  -- Validate event_start_date is before event_end_date
  IF NEW.event_start_date IS NOT NULL AND NEW.event_end_date IS NOT NULL THEN
    IF NEW.event_start_date > NEW.event_end_date THEN
      RAISE EXCEPTION 'Festival start date (%) must be before end date (%)', 
        NEW.event_start_date, NEW.event_end_date;
    END IF;
  END IF;

  -- Update timestamp when ce dates change
  IF NEW.ce_start_date IS DISTINCT FROM OLD.ce_start_date 
     OR NEW.ce_end_date IS DISTINCT FROM OLD.ce_end_date THEN
    NEW.ce_dates_updated_at = NOW();
  END IF;

  -- Update timestamp when super admin password changes
  IF NEW.super_admin_password IS DISTINCT FROM OLD.super_admin_password THEN
    NEW.super_admin_password_updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CREATE TRIGGER FOR DATE VALIDATION
-- ============================================

-- Drop trigger if exists
DROP TRIGGER IF EXISTS validate_festival_dates_trigger ON festivals;

-- Create trigger
CREATE TRIGGER validate_festival_dates_trigger
  BEFORE INSERT OR UPDATE ON festivals
  FOR EACH ROW
  EXECUTE FUNCTION validate_festival_dates();

-- ============================================
-- 5. CREATE FUNCTION TO CHECK COLLECTIONS/EXPENSES IN DATE RANGE
-- ============================================

-- Function to get count of collections/expenses outside ce date range
CREATE OR REPLACE FUNCTION get_out_of_range_transactions(
  p_festival_id UUID,
  p_new_ce_start_date DATE,
  p_new_ce_end_date DATE
)
RETURNS TABLE (
  collections_out_of_range INTEGER,
  expenses_out_of_range INTEGER,
  earliest_collection_date DATE,
  latest_collection_date DATE,
  earliest_expense_date DATE,
  latest_expense_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER 
     FROM collections 
     WHERE festival_id = p_festival_id 
       AND (date < p_new_ce_start_date OR date > p_new_ce_end_date)
    ) as collections_out_of_range,
    
    (SELECT COUNT(*)::INTEGER 
     FROM expenses 
     WHERE festival_id = p_festival_id 
       AND (date < p_new_ce_start_date OR date > p_new_ce_end_date)
    ) as expenses_out_of_range,
    
    (SELECT MIN(date) FROM collections WHERE festival_id = p_festival_id) as earliest_collection_date,
    (SELECT MAX(date) FROM collections WHERE festival_id = p_festival_id) as latest_collection_date,
    (SELECT MIN(date) FROM expenses WHERE festival_id = p_festival_id) as earliest_expense_date,
    (SELECT MAX(date) FROM expenses WHERE festival_id = p_festival_id) as latest_expense_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_festivals_ce_dates ON festivals(ce_start_date, ce_end_date);
CREATE INDEX IF NOT EXISTS idx_festivals_requires_password ON festivals(requires_password);

-- Index for collections date filtering
CREATE INDEX IF NOT EXISTS idx_collections_festival_date ON collections(festival_id, date);

-- Index for expenses date filtering
CREATE INDEX IF NOT EXISTS idx_expenses_festival_date ON expenses(festival_id, date);

-- ============================================
-- 7. UPDATE EXISTING DATA (MIGRATION)
-- ============================================

-- For existing festivals, set ce_dates to NULL (will be updated by admin)
-- requires_password defaults to TRUE (already set in ALTER TABLE)
-- super_admin_password defaults to 'Super Admin' (already set in ALTER TABLE)

-- Note: Existing festivals will need to have ce_start_date and ce_end_date 
-- set by admin before they can add new collections/expenses

-- ============================================
-- 8. CREATE VIEW FOR FESTIVAL DATE INFO
-- ============================================

CREATE OR REPLACE VIEW festival_date_info AS
SELECT 
  f.id as festival_id,
  f.code as festival_code,
  f.event_name,
  f.ce_start_date,
  f.ce_end_date,
  f.event_start_date,
  f.event_end_date,
  f.requires_password,
  -- Calculate if festival has valid ce dates
  (f.ce_start_date IS NOT NULL AND f.ce_end_date IS NOT NULL) as has_ce_dates,
  -- Calculate if festival dates are within ce dates
  CASE 
    WHEN f.event_start_date IS NULL OR f.event_end_date IS NULL THEN TRUE
    WHEN f.ce_start_date IS NULL OR f.ce_end_date IS NULL THEN TRUE
    WHEN f.event_start_date >= f.ce_start_date 
         AND f.event_end_date <= f.ce_end_date THEN TRUE
    ELSE FALSE
  END as dates_valid,
  -- Count collections and expenses
  (SELECT COUNT(*) FROM collections WHERE festival_id = f.id) as total_collections,
  (SELECT COUNT(*) FROM expenses WHERE festival_id = f.id) as total_expenses,
  -- Count out of range transactions
  (SELECT COUNT(*) FROM collections 
   WHERE festival_id = f.id 
     AND f.ce_start_date IS NOT NULL 
     AND f.ce_end_date IS NOT NULL
     AND (date < f.ce_start_date OR date > f.ce_end_date)
  ) as collections_out_of_range,
  (SELECT COUNT(*) FROM expenses 
   WHERE festival_id = f.id 
     AND f.ce_start_date IS NOT NULL 
     AND f.ce_end_date IS NOT NULL
     AND (date < f.ce_start_date OR date > f.ce_end_date)
  ) as expenses_out_of_range
FROM festivals f;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if columns were added
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'festivals' 
-- AND column_name IN ('ce_start_date', 'ce_end_date', 'super_admin_password', 'requires_password');

-- Check if functions were created
-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('validate_festival_dates', 'get_out_of_range_transactions');

-- Check if view was created
-- SELECT table_name 
-- FROM information_schema.views 
-- WHERE table_schema = 'public' 
-- AND table_name = 'festival_date_info';

-- Test date validation (should fail)
-- UPDATE festivals 
-- SET event_start_date = '2025-01-01', 
--     event_end_date = '2025-12-31',
--     ce_start_date = '2025-06-01',
--     ce_end_date = '2025-06-30'
-- WHERE id = 'some-festival-id';
-- This should raise: "Festival start date must be on or after Collection/Expense start date"

-- ============================================
-- NOTES
-- ============================================

-- 1. Existing festivals will have:
--    - ce_start_date: NULL (needs to be set by admin)
--    - ce_end_date: NULL (needs to be set by admin)
--    - requires_password: TRUE (default)
--    - super_admin_password: 'Super Admin' (default)

-- 2. When creating new festivals:
--    - ce_start_date and ce_end_date are REQUIRED
--    - event_start_date and event_end_date are OPTIONAL
--    - If event dates provided, they must be within ce dates
--    - If requires_password is TRUE, all 3 passwords are required

-- 3. When editing festivals:
--    - Changing ce dates will check for out-of-range transactions
--    - Use get_out_of_range_transactions() function to preview impact

-- 4. When adding collections/expenses:
--    - Date must be within ce_start_date and ce_end_date
--    - Frontend should restrict date picker to this range

-- 5. Password requirements:
--    - If requires_password = TRUE: user_password, admin_password, super_admin_password required
--    - If requires_password = FALSE: passwords optional, no analytics tracking

-- ============================================
-- END OF MIGRATION
-- ============================================

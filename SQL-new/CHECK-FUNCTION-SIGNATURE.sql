-- ============================================
-- EMERGENCY FIX: Check Function Signature
-- ============================================

-- Step 1: Check if log_festival_access function exists
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'log_festival_access';

-- If this returns NO rows, the function doesn't exist!
-- Run: SQL/supabase-migration-access-logging.sql

-- Step 2: Check the exact parameters the function accepts
SELECT 
  routine_name,
  parameter_name,
  data_type,
  ordinal_position
FROM information_schema.parameters
WHERE specific_name IN (
  SELECT specific_name 
  FROM information_schema.routines 
  WHERE routine_name = 'log_festival_access'
)
ORDER BY ordinal_position;

-- Expected parameters (OLD version):
-- 1. p_festival_id     | uuid
-- 2. p_visitor_name    | text
-- 3. p_access_method   | text
-- 4. p_password_used   | text (default null)
-- 5. p_user_agent      | text (default null)
-- 6. p_ip_address      | text (default null)
-- 7. p_session_id      | text (default null)

-- NEW version should also have:
-- 8. p_admin_id        | text (default null)
-- 9. p_user_password_id| text (default null)

-- If you DON'T see parameters 8 and 9, that's the problem!

-- Step 3: Quick fix - Update the function immediately
-- Run the entire content below:

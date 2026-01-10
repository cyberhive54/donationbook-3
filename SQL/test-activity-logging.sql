-- Test script to verify activity logging is working
-- Run this in Supabase SQL editor to check:

-- 1. Check if function exists and its signature
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'log_admin_activity';

-- 2. Check if table exists and has data
SELECT COUNT(*) as total_logs FROM admin_activity_log;

-- 3. Check recent logs (last 20)
SELECT 
  log_id,
  festival_id,
  admin_id,
  admin_name,
  action_type,
  timestamp,
  action_details
FROM admin_activity_log 
ORDER BY timestamp DESC 
LIMIT 20;

-- 4. Check logs by festival (replace 'YOUR_FESTIVAL_ID' with actual UUID)
-- First, get your festival ID:
SELECT id, code, event_name FROM festivals LIMIT 5;

-- Then check logs for that festival:
-- SELECT * FROM admin_activity_log WHERE festival_id = 'YOUR_FESTIVAL_ID' ORDER BY timestamp DESC;

-- 5. Check admin IDs in your festival (replace 'YOUR_FESTIVAL_ID')
-- SELECT admin_id, admin_code, admin_name FROM admins WHERE festival_id = 'YOUR_FESTIVAL_ID';

-- 6. Test the function directly (replace with actual values):
-- SELECT log_admin_activity(
--   'YOUR_FESTIVAL_ID'::UUID,
--   'YOUR_ADMIN_ID'::UUID,  -- or NULL for super admin
--   'test_action',
--   '{"test": true}'::JSONB,
--   NULL,
--   NULL
-- );

-- ============================================
-- VISITOR ACTIVITY DATA DIAGNOSTIC
-- ============================================
-- Run these queries to see what data exists and where the problem is
-- Copy one section at a time and run in Supabase SQL Editor

-- ============================================
-- PART 1: CHECK TABLE STRUCTURE
-- ============================================

-- Check if access_logs table exists and what columns it has
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'access_logs'
ORDER BY ordinal_position;

-- Expected columns:
-- id, festival_id, visitor_name, access_method, password_used, 
-- accessed_at, user_agent, ip_address, session_id,
-- logout_at, session_duration_seconds, logout_method,
-- admin_id, user_password_id, auth_method

-- ============================================
-- PART 2: CHECK IF ANY DATA EXISTS
-- ============================================

-- Count total records in access_logs
SELECT COUNT(*) as total_records FROM access_logs;

-- If count = 0, NO DATA IS BEING SAVED AT ALL
-- If count > 0, continue to next section

-- ============================================
-- PART 3: VIEW ALL ACCESS LOG DATA
-- ============================================

-- See ALL access log records (limit 50)
SELECT 
  id,
  festival_id,
  visitor_name,
  accessed_at,
  logout_at,
  session_duration_seconds,
  access_method,
  password_used,
  admin_id,
  user_password_id,
  session_id
FROM access_logs
ORDER BY accessed_at DESC
LIMIT 50;

-- LOOK FOR:
-- 1. Do you see your visitor names?
-- 2. Do you see login timestamps (accessed_at)?
-- 3. Is logout_at NULL or has timestamp?
-- 4. Is admin_id NULL or has UUID?
-- 5. Is user_password_id NULL or has UUID?

-- ============================================
-- PART 4: CHECK SPECIFIC FESTIVAL
-- ============================================

-- Replace 'YOUR_FESTIVAL_CODE' with your actual festival code
SELECT 
  al.id,
  al.visitor_name,
  al.accessed_at as login_time,
  al.logout_at,
  al.session_duration_seconds,
  al.access_method,
  al.admin_id,
  al.user_password_id,
  f.code as festival_code,
  f.event_name
FROM access_logs al
JOIN festivals f ON al.festival_id = f.id
WHERE f.code = 'YOUR_FESTIVAL_CODE'  -- ← CHANGE THIS
ORDER BY al.accessed_at DESC
LIMIT 20;

-- If this returns 0 rows, NO DATA FOR THIS FESTIVAL
-- Check if festival_id is correct

-- ============================================
-- PART 5: CHECK FESTIVAL ID
-- ============================================

-- Get your festival's ID
SELECT id, code, event_name 
FROM festivals 
WHERE code = 'YOUR_FESTIVAL_CODE';  -- ← CHANGE THIS

-- Copy the ID from above and use in next query

-- ============================================
-- PART 6: CHECK BY FESTIVAL ID DIRECTLY
-- ============================================

-- Use the festival ID from PART 5
SELECT *
FROM access_logs
WHERE festival_id = 'PASTE_FESTIVAL_ID_HERE'  -- ← CHANGE THIS
ORDER BY accessed_at DESC;

-- If this returns data, the issue is in the JOIN
-- If this returns NO data, visitors are NOT being logged at all

-- ============================================
-- PART 7: CHECK IF FUNCTIONS EXIST
-- ============================================

-- Check if log_festival_access function exists
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'log_festival_access';

-- Should show the function definition
-- If empty, function doesn't exist - need to run migration

-- Check if log_visitor_logout function exists
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'log_visitor_logout';

-- Should show the function definition
-- If empty, function doesn't exist - need to run migration

-- ============================================
-- PART 8: TEST LOGGING MANUALLY
-- ============================================

-- Try to manually insert a test record
-- Replace festival_id with your actual festival ID from PART 5
INSERT INTO access_logs (
  festival_id,
  visitor_name,
  access_method,
  password_used,
  accessed_at,
  session_id
) VALUES (
  'PASTE_FESTIVAL_ID_HERE',  -- ← CHANGE THIS
  'Test Visitor',
  'password_modal',
  'test123',
  NOW(),
  'test-session-' || gen_random_uuid()::text
) RETURNING *;

-- If this INSERT succeeds, table structure is OK
-- If this INSERT fails, check the error message

-- After insert, check if it shows up:
SELECT * FROM access_logs 
WHERE visitor_name = 'Test Visitor' 
ORDER BY accessed_at DESC;

-- Clean up test record:
-- DELETE FROM access_logs WHERE visitor_name = 'Test Visitor';

-- ============================================
-- PART 9: CHECK RLS POLICIES
-- ============================================

-- Check if RLS is blocking reads
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'access_logs';

-- Should show policies allowing SELECT
-- If no SELECT policy or restrictive policy, data won't be readable

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'access_logs';

-- rowsecurity should be TRUE (RLS enabled)
-- But policies should allow SELECT using (true)

-- ============================================
-- PART 10: DETAILED RESULTS TO SHARE
-- ============================================

-- Run this comprehensive query and share the results:
SELECT 
  'Table exists:' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_logs') 
    THEN 'YES' ELSE 'NO' END as result
UNION ALL
SELECT 
  'Total records:',
  COUNT(*)::text
FROM access_logs
UNION ALL
SELECT
  'log_festival_access function:',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'log_festival_access')
    THEN 'EXISTS' ELSE 'MISSING' END
UNION ALL
SELECT
  'log_visitor_logout function:',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'log_visitor_logout')
    THEN 'EXISTS' ELSE 'MISSING' END
UNION ALL
SELECT
  'RLS enabled:',
  CASE WHEN rowsecurity THEN 'YES' ELSE 'NO' END
FROM pg_tables
WHERE tablename = 'access_logs'
UNION ALL
SELECT
  'SELECT policy exists:',
  CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'access_logs' AND cmd = 'SELECT')
    THEN 'YES' ELSE 'NO' END;

-- ============================================
-- EXPECTED RESULTS
-- ============================================

-- Table exists: YES
-- Total records: <number> (should be > 0 if visitors logged in)
-- log_festival_access function: EXISTS
-- log_visitor_logout function: EXISTS
-- RLS enabled: YES
-- SELECT policy exists: YES

-- If ANY of these show unexpected values, that's the problem!

-- ============================================
-- PART 11: CHECK COLUMNS EXIST
-- ============================================

-- Verify admin_id and user_password_id columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'access_logs'
AND column_name IN ('admin_id', 'user_password_id', 'logout_at', 'session_duration_seconds');

-- Should return 4 rows
-- If missing any, need to run migrations

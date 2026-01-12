-- ============================================
-- TEST VISITOR LOGIN/LOGOUT LOGGING
-- ============================================
-- Run these queries to verify visitor logging is working

-- Step 1: Check if access_logs table has required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'access_logs'
ORDER BY ordinal_position;

-- Expected columns:
-- id, festival_id, visitor_name, access_method, password_used, 
-- accessed_at, session_id, admin_id, user_password_id,
-- logout_at, session_duration_seconds, logout_method

-- ============================================
-- Step 2: View all visitor login/logout records
-- ============================================

-- Replace 'YOUR_FESTIVAL_CODE' with your actual festival code
SELECT 
  al.id,
  f.code as festival_code,
  al.visitor_name,
  al.accessed_at as login_time,
  al.logout_at as logout_time,
  al.session_duration_seconds as duration_sec,
  al.logout_method,
  al.access_method,
  al.session_id,
  a.admin_code,
  a.admin_name,
  up.label as password_label
FROM access_logs al
JOIN festivals f ON al.festival_id = f.id
LEFT JOIN admins a ON al.admin_id = a.admin_id
LEFT JOIN user_passwords up ON al.user_password_id = up.password_id
WHERE f.code = 'YOUR_FESTIVAL_CODE'  -- ← CHANGE THIS
ORDER BY al.accessed_at DESC
LIMIT 20;

-- ============================================
-- Step 3: Check for login records without logout
-- ============================================

SELECT 
  al.visitor_name,
  al.accessed_at as login_time,
  al.session_id,
  a.admin_code
FROM access_logs al
JOIN festivals f ON al.festival_id = f.id
LEFT JOIN admins a ON al.admin_id = a.admin_id
WHERE f.code = 'YOUR_FESTIVAL_CODE'  -- ← CHANGE THIS
  AND al.logout_at IS NULL
ORDER BY al.accessed_at DESC;

-- These are active sessions or incomplete logout records

-- ============================================
-- Step 4: Count total logins vs logouts
-- ============================================

SELECT 
  f.code as festival_code,
  COUNT(*) as total_logins,
  COUNT(al.logout_at) as total_logouts,
  COUNT(*) - COUNT(al.logout_at) as active_sessions
FROM access_logs al
JOIN festivals f ON al.festival_id = f.id
WHERE f.code = 'YOUR_FESTIVAL_CODE'  -- ← CHANGE THIS
GROUP BY f.code;

-- ============================================
-- Step 5: View recent activity (last 10)
-- ============================================

SELECT 
  al.visitor_name,
  al.accessed_at::timestamp::time as login_time,
  al.logout_at::timestamp::time as logout_time,
  CASE 
    WHEN al.logout_at IS NOT NULL 
    THEN (al.session_duration_seconds || ' seconds')
    ELSE 'Still logged in'
  END as session_info,
  a.admin_code
FROM access_logs al
JOIN festivals f ON al.festival_id = f.id
LEFT JOIN admins a ON al.admin_id = a.admin_id
WHERE f.code = 'YOUR_FESTIVAL_CODE'  -- ← CHANGE THIS
ORDER BY al.accessed_at DESC
LIMIT 10;

-- ============================================
-- WHAT TO CHECK:
-- ============================================
-- 1. After visitor logs in, check if new record appears in Step 2
-- 2. After visitor logs out, check if logout_at and session_duration_seconds are updated
-- 3. Visitor name should be normalized (e.g., "John Doe" → "john-doe")
-- 4. session_id should be a UUID
-- 5. admin_id and user_password_id should be populated
-- 6. logout_method should be "manual"

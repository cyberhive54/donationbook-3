# Debug Activity Logging Issues

## Steps to Debug:

1. **FIRST: Run the SQL fix** - Execute `SQL/fix-log-admin-activity-null.sql` in your Supabase SQL editor

2. **Check Browser Console** - Open browser DevTools (F12) and check the Console tab. You should now see detailed logs for:
   - `[AdminLogin]` - Login activity logging attempts
   - `[AddCollection]` - Collection creation logging
   - `[AddExpense]` - Expense creation logging  
   - `[GlobalSessionBar]` - Logout activity logging
   - `[ActivityPage]` - Activity fetching attempts

3. **Check Network Tab** - Look for RPC calls to `log_admin_activity` and check if they're:
   - Being made (should see the request)
   - Returning errors (check response)
   - Returning success with a UUID

4. **Verify Function Exists** - Run this in Supabase SQL editor:
\`\`\`sql
SELECT proname, pronargs, proargnames, proargtypes 
FROM pg_proc 
WHERE proname = 'log_admin_activity';
\`\`\`

5. **Check if logs are being created** - Run this in Supabase SQL editor (replace YOUR_FESTIVAL_ID):
\`\`\`sql
SELECT * FROM admin_activity_log 
WHERE festival_id = 'YOUR_FESTIVAL_ID' 
ORDER BY timestamp DESC 
LIMIT 10;
\`\`\`

6. **Check admin_id match** - Verify your session adminId matches what's in the database:
\`\`\`sql
SELECT admin_id, admin_code, admin_name 
FROM admins 
WHERE festival_id = 'YOUR_FESTIVAL_ID';
\`\`\`

## Common Issues:

1. **SQL function not updated** - The function signature might not match. Run the fix SQL file.

2. **NULL handling** - The old function might fail when admin_id is NULL. The fix handles this.

3. **RPC call failing silently** - Check console logs now - they'll show all errors.

4. **admin_id mismatch** - Session adminId must exactly match the UUID in the admins table.

5. **Permission issues** - The function needs SECURITY DEFINER and proper GRANT statements.

## What to Look For:

After logging in/adding data, check console for:
- `[AdminLogin] RPC call result:` - Should show `data` with a UUID if successful
- Any `error` objects with `message`, `code`, `details`, `hint`
- `[ActivityPage] All logs in festival:` - Shows all logs, even if they don't match your admin_id
- `[ActivityPage] Admin-specific logs:` - Shows only your logs

If you see errors, copy the full error object and check:
- Error code (PGRST301, 42P13, etc.)
- Error message
- Error details/hint

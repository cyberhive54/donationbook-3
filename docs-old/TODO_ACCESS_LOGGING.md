# Access Logging & Multiple Passwords - Implementation TODO

## ✅ Phase 1: Database & Types (COMPLETED)

- [x] Create SQL migration file (`supabase-migration-access-logging.sql`)
  - [x] `access_logs` table
  - [x] `festival_passwords` table  
  - [x] Helper functions (log_festival_access, verify_festival_password, get_festival_passwords)
  - [x] Views (festival_visitor_stats, recent_festival_visitors, password_usage_stats)
  - [x] RLS policies
  - [x] Migration of existing passwords

- [x] Update TypeScript types (`types/index.ts`)
  - [x] AccessLog interface
  - [x] FestivalPassword interface
  - [x] VisitorStats interface
  - [x] UserSession interface

## ✅ Phase 2: Authentication System (COMPLETED)

- [x] Update `usePasswordAuth` hook (`lib/hooks/usePasswordAuth.ts`)
  - [x] Add name parameter to verifyPassword
  - [x] Add formatName function
  - [x] Add generateSessionId function
  - [x] Call log_festival_access on successful auth
  - [x] Update localStorage structure with visitor info
  - [x] Return storedName for pre-filling
  - [x] Return festivalId

- [x] Update `PasswordGate` component (`components/PasswordGate.tsx`)
  - [x] Add name input field with User icon
  - [x] Make name required
  - [x] Pre-fill name from localStorage (editable)
  - [x] Update form validation
  - [x] Update UI text and labels
  - [x] Pass name to verifyPassword

- [x] Add direct link authentication (`app/f/[code]/page.tsx`)
  - [x] Import useSearchParams
  - [x] Add helper functions (formatName, generateSessionId, todayStr)
  - [x] Add handleDirectLinkAuth function
  - [x] Parse URL parameters (mode, p, name)
  - [x] Verify all parameters present
  - [x] Verify password
  - [x] Format name (lowercase, spaces to dashes)
  - [x] Log access with method='direct_link'
  - [x] Create session in localStorage
  - [x] Remove query params and reload
  - [x] Show welcome toast

## ⏳ Phase 3: Admin Panel - Visitor Logs (PENDING)

- [ ] Add visitor logs section to admin panel (`app/f/[code]/admin/page.tsx`)
  - [ ] Fetch access logs from database
  - [ ] Fetch visitor stats
  - [ ] Display stats cards:
    - [ ] Unique visitors count
    - [ ] Total visits count
    - [ ] Last visitor name
    - [ ] Last visit time
  - [ ] Display logs table with columns:
    - [ ] Visitor name
    - [ ] Access method (badge: password_modal / direct_link)
    - [ ] Password used
    - [ ] Timestamp
  - [ ] Add pagination (show 50 per page)
  - [ ] Add filtering:
    - [ ] Filter by date range
    - [ ] Filter by access method
    - [ ] Search by visitor name
  - [ ] Add export to CSV button
  - [ ] Add refresh button

## ⏳ Phase 4: Testing (PENDING)

### Database Testing
- [ ] Run SQL migration in Supabase
- [ ] Verify tables created successfully
- [ ] Verify functions created successfully
- [ ] Verify views created successfully
- [ ] Test log_festival_access function manually
- [ ] Test verify_festival_password function manually
- [ ] Test get_festival_passwords function manually

### Frontend Testing
- [ ] Test password modal with name field
  - [ ] Name field is required
  - [ ] Name is pre-filled from localStorage
  - [ ] Name can be edited
  - [ ] Password is required
  - [ ] Form submits correctly
  - [ ] Success toast shows
  - [ ] Error toast shows for wrong password

- [ ] Test name formatting
  - [ ] "John Doe" → "john-doe"
  - [ ] "AMIT KUMAR" → "amit-kumar"
  - [ ] "  Jane Smith  " → "jane-smith"
  - [ ] Spaces converted to dashes
  - [ ] Lowercase conversion

- [ ] Test access logging
  - [ ] Log created on password modal login
  - [ ] Log created on direct link login
  - [ ] Visitor name stored correctly
  - [ ] Timestamp stored with seconds
  - [ ] Access method stored correctly
  - [ ] Password used stored correctly
  - [ ] Session ID generated and stored

- [ ] Test direct link authentication
  - [ ] Valid URL: `/f/CODE?mode=login&p=password&name=John%20Doe`
  - [ ] All parameters required
  - [ ] Invalid password shows error
  - [ ] Missing mode parameter shows error
  - [ ] Missing p parameter shows error
  - [ ] Missing name parameter shows error
  - [ ] Wrong mode value shows error
  - [ ] Query params removed after auth
  - [ ] Welcome toast shows with formatted name
  - [ ] Session created in localStorage
  - [ ] Access logged to database

- [ ] Test session persistence
  - [ ] Session valid until midnight
  - [ ] Session expires at midnight
  - [ ] Session invalidated on password change
  - [ ] Session works across page refreshes
  - [ ] Session works across different pages

- [ ] Test visitor logs (admin panel)
  - [ ] Stats cards show correct numbers
  - [ ] Logs table displays all logs
  - [ ] Pagination works
  - [ ] Filtering works
  - [ ] Search works
  - [ ] Export to CSV works
  - [ ] Refresh button works

### Mobile Testing
- [ ] Test on mobile devices
  - [ ] Password modal responsive
  - [ ] Name field works on mobile
  - [ ] Direct link works on mobile
  - [ ] Visitor logs responsive

### Edge Cases
- [ ] Test with special characters in name
- [ ] Test with very long names
- [ ] Test with empty spaces in name
- [ ] Test with multiple consecutive spaces
- [ ] Test concurrent logins
- [ ] Test expired sessions
- [ ] Test invalid festival codes
- [ ] Test network errors
- [ ] Test database errors

## 📝 Phase 5: Documentation (PENDING)

- [ ] Update README.md
  - [ ] Add access logging feature
  - [ ] Add direct link authentication
  - [ ] Add URL format examples
  - [ ] Add visitor tracking info

- [ ] Update USER_FLOWS.md
  - [ ] Add direct link flow
  - [ ] Update viewing flow with name field
  - [ ] Add visitor logs section

- [ ] Create VISITOR_TRACKING.md
  - [ ] Explain access logging system
  - [ ] Explain visitor stats
  - [ ] Explain how to view logs
  - [ ] Explain how to export logs

- [ ] Update PROJECT_OVERVIEW.md
  - [ ] Add new tables to database schema
  - [ ] Add new features list
  - [ ] Update architecture diagram

## 🚀 Phase 6: Deployment (PENDING)

- [ ] Pre-deployment checklist
  - [ ] All tests passing
  - [ ] No console errors
  - [ ] No TypeScript errors
  - [ ] No linting errors
  - [ ] Documentation updated

- [ ] Deployment steps
  - [ ] Run SQL migration in production Supabase
  - [ ] Verify migration successful
  - [ ] Deploy frontend changes
  - [ ] Test in production
  - [ ] Monitor for errors
  - [ ] Check logs for issues

- [ ] Post-deployment
  - [ ] Verify access logging working
  - [ ] Verify direct links working
  - [ ] Verify visitor stats updating
  - [ ] Check database performance
  - [ ] Monitor storage usage

## 🔮 Phase 7: Future Enhancements (LATER)

- [ ] Multiple passwords management (admin panel)
  - [ ] Add password with label
  - [ ] List all passwords
  - [ ] Show usage stats per password
  - [ ] Deactivate/activate passwords
  - [ ] Delete passwords
  - [ ] Password usage analytics

- [ ] Advanced visitor analytics
  - [ ] Visitor heatmap
  - [ ] Time spent tracking
  - [ ] Device/browser stats
  - [ ] Geographic location (if IP tracking)

- [ ] Export features
  - [ ] Export logs to PDF
  - [ ] Export logs to Excel
  - [ ] Scheduled exports
  - [ ] Email reports

- [ ] Real-time features
  - [ ] Live visitor count
  - [ ] Real-time activity feed
  - [ ] Push notifications for new visitors

---

## 📊 Progress Summary

**Completed**: 2/7 phases (29%)
- ✅ Phase 1: Database & Types
- ✅ Phase 2: Authentication System
- ⏳ Phase 3: Admin Panel - Visitor Logs
- ⏳ Phase 4: Testing
- ⏳ Phase 5: Documentation
- ⏳ Phase 6: Deployment
- 🔮 Phase 7: Future Enhancements

**Next Steps**:
1. Run SQL migration in Supabase
2. Test password modal with name field
3. Test direct link authentication
4. Add visitor logs to admin panel

---

## 🐛 Known Issues

None yet.

---

## 💡 Notes

- Session expires at midnight (same day)
- Name is pre-filled but editable
- Direct link format: `/f/CODE?mode=login&p=password&name=name`
- All three URL parameters are mandatory
- Name formatting: lowercase, spaces to dashes
- Access logging happens on successful authentication only
- Multiple passwords feature will be added in next iteration

---

**Last Updated**: January 2025
**Status**: Phase 2 Complete - Ready for Testing

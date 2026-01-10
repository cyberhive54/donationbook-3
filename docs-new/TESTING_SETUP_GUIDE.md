# Testing Setup Guide for Donation Book

## 🎯 Current Testing Infrastructure

Your app already has testing infrastructure configured:
- **Jest** - Unit/Component testing (configured)
- **Playwright** - E2E testing (configured)
- **Testing Library** - React component testing utilities
- **Mock Setup** - Next.js router, Supabase, localStorage already mocked

## ⚠️ Important Issues to Fix Before Testing

### 1. Playwright Config Issue
The `playwright.config.ts` uses `pnpm dev` but you're using `npm`. Fix this:

```typescript
// In playwright.config.ts, line 74, change:
command: 'pnpm dev',
// To:
command: 'npm run dev',
```

### 2. Environment Variables for Testing
Create `.env.test.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
```

**Important**: Use a separate Supabase project for testing to avoid polluting production data!

## 🔧 TestSprite MCP Setup Considerations

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase test project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase test project anon key

### Database Setup for Testing
1. **Create a test Supabase project** (separate from production)
2. **Run all SQL migrations in order**:
   - `SQL/supabase-schema.sql` (base schema)
   - `SQL/supabase-migration-multi-admin-system.sql` (multi-admin migration)
   - `SQL-new/001-FIX-ADMIN-LOGIN-PASSWORD-VERIFICATION.sql` (fix migration)

3. **Seed test data** - Create at least:
   - One festival with code (e.g., "TESTFEST")
   - One visitor password
   - One admin account
   - Sample collections and expenses

### Key Testing Areas

#### 1. **Authentication Flows** (Critical)
- Visitor password authentication
- Admin authentication (multi-admin system)
- Super admin authentication
- Session management (localStorage-based)
- Session expiration at midnight IST
- Concurrent session handling

#### 2. **Festival Management**
- Festival creation
- Festival code redirects/history
- Basic info editing
- Theme customization (colors, images)

#### 3. **Collection & Expense Management**
- CRUD operations (Create, Read, Update, Delete)
- Bulk entry (5 collections, 10 expenses limit)
- Date validation (within festival CE range)
- Filtering, sorting, pagination

#### 4. **Admin Features**
- Multi-admin CRUD
- User password management (max limit enforcement)
- Group/Category/Mode management
- Analytics configuration
- Activity logging

#### 5. **Analytics & Charts**
- Collection vs Expense charts
- Pie charts (by group/category/mode)
- Bar charts (daily trends)
- Top donators visualization
- Time-of-day analysis
- Bucket analysis

#### 6. **Media Showcase**
- Album CRUD
- Media upload (images, videos, PDFs)
- Bulk download
- Storage usage calculation
- Thumbnail generation

#### 7. **Activity Tracking**
- Visitor login history
- Admin activity logs
- Transaction history per user

## 🧪 Test Configuration Files

### Jest Configuration (`jest.config.js`)
✅ Already configured correctly
- Path aliases (`@/*`) mapped
- Coverage collection configured
- jsdom environment set up

### Jest Setup (`jest.setup.js`)
✅ Mocks already in place:
- Next.js router hooks
- Supabase client
- localStorage
- window.matchMedia

### Playwright Configuration (`playwright.config.ts`)
⚠️ **Needs fix**: Change `pnpm dev` to `npm run dev`

## 📝 Testing Commands

```bash
# Unit/Component tests
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report

# E2E tests
npm run test:e2e           # Run Playwright tests
npm run test:e2e:debug     # Debug mode
npm run test:e2e:ui        # UI mode
```

## 🎯 TestSprite MCP Specific Notes

### 1. **Session Management Testing**
The app uses `localStorage` for sessions. TestSprite should:
- Clear localStorage between tests or use isolated test sessions
- Mock `localStorage` if needed (already done in jest.setup.js)
- Test session expiration logic (midnight IST timezone)

### 2. **Supabase Integration**
- Use a **test Supabase project** (not production)
- Mock Supabase calls in unit tests (already done)
- Use real Supabase in E2E tests for integration testing
- Consider using Supabase's built-in test mode if available

### 3. **Date/Time Testing**
- Festival dates use CE (Common Era) format
- Session expiration uses IST timezone
- Collection/expense dates validated against festival date range
- **Test across different timezones** if needed

### 4. **Responsive Testing**
- Mobile-first design
- Test on mobile viewports (use Playwright's mobile emulation)
- Bottom navigation is mobile-specific
- Charts should be responsive

### 5. **Performance Considerations**
- Pagination (20 items per page default)
- Bulk operations have limits (5 collections, 10 expenses)
- Large dataset loading (1000+ records)
- Chart rendering with many data points

### 6. **Error Scenarios to Test**
- Invalid festival code
- Expired/invalid passwords
- Deactivated admin accounts
- Concurrent session conflicts
- Date validation failures
- File upload size limits
- Storage quota exceeded
- Network failures

## 🚨 Critical Test Scenarios

### Must Test:
1. ✅ Visitor can log in with password
2. ✅ Visitor can view collections/expenses
3. ✅ Admin can log in and manage data
4. ✅ Super admin can access all festivals
5. ✅ Session expires at midnight IST
6. ✅ Date validation works correctly
7. ✅ Bulk operations respect limits
8. ✅ Charts render correctly with data
9. ✅ Media upload/download works
10. ✅ Activity logs are recorded

## 📋 Recommended Test Data

Create these test records in your test database:

```sql
-- Festival
Festival Code: TESTFEST
Event Name: Test Festival 2024
Event Start: 2024-01-01
Event End: 2024-12-31

-- Visitor Password
Password: TESTVISITOR123
Name: Test Visitor

-- Admin
Code: ADM01
Name: Test Admin
Password: TESTADMIN123

-- Super Admin Password (in festivals table)
super_admin_password: TESTSUPER123
```

## 🔍 Mocking Strategy

### For Unit Tests (Jest):
- ✅ Supabase client already mocked
- ✅ Next.js router already mocked
- ✅ localStorage already mocked
- ✅ window.matchMedia already mocked

### For E2E Tests (Playwright):
- Use **real Supabase** test project
- Use **real localStorage** (isolate between tests)
- Test **real user flows** end-to-end

## 💡 Tips for TestSprite MCP

1. **Start with E2E tests** - They validate the full user experience
2. **Use test fixtures** - Create reusable test data setup
3. **Parallel test execution** - Configure workers appropriately
4. **Screenshot on failure** - Already configured in Playwright
5. **Trace collection** - Enabled on retry in Playwright config
6. **Isolate tests** - Each test should be independent
7. **Clean up data** - Delete test data after tests complete

## 🐛 Known Issues to Test Around

1. **React Hook warnings** - Missing dependencies (non-blocking)
2. **Image optimization warnings** - Using `<img>` instead of `<Image />` (non-blocking)
3. **localStorage size limits** - Session data should stay < 10KB

## ✅ Pre-Flight Checklist

Before running TestSprite MCP:
- [ ] Fix Playwright config (`pnpm dev` → `npm run dev`)
- [ ] Create `.env.test.local` with test Supabase credentials
- [ ] Set up test Supabase project
- [ ] Run all database migrations
- [ ] Seed test data
- [ ] Verify dev server starts (`npm run dev`)
- [ ] Verify build succeeds (`npm run build`)
- [ ] Review `PRODUCT_SPECIFICATION_FOR_TESTING.md` for detailed test requirements

---

Good luck with your testing! 🚀

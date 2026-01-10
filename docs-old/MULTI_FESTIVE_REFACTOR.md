# Multi-Festive Refactor - Complete Change Log

## Overview

The application has been completely refactored to support **multiple independent festivals** with unique codes, per-festival data isolation, per-festival password settings, and comprehensive theming.

---

## Architecture Changes

### Before (Single Festival)
- One global festival with password in `passwords` table
- All data in global `collections`, `expenses` tables
- Global groups/categories/modes
- Routes: `/`, `/collection`, `/expense`, `/transaction`, `/admin`

### After (Multi-Festival)
- Each festival has a unique 8-character code
- Per-festival data (collections, expenses, groups, categories, modes)
- Per-festival passwords (user & admin)
- Per-festival theme customization
- Routes: `/` (landing), `/view`, `/create`, `/f/[code]/*`

---

## Database Schema Changes

### New Table: `festivals`

Primary table storing all festival information:

\`\`\`sql
CREATE TABLE festivals (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,              -- 8-char unique code
  event_name TEXT NOT NULL,
  organiser TEXT,
  mentor TEXT,
  guide TEXT,
  location TEXT,
  event_start_date DATE,
  event_end_date DATE,
  other_data JSONB,                       -- Title styling
  
  -- Password settings
  requires_user_password BOOLEAN DEFAULT TRUE,
  user_password TEXT,
  user_password_updated_at TIMESTAMPTZ,
  admin_password TEXT NOT NULL DEFAULT 'admin',
  admin_password_updated_at TIMESTAMPTZ,
  
  -- Theme settings
  theme_primary_color TEXT DEFAULT '#2563eb',
  theme_secondary_color TEXT DEFAULT '#1f2937',
  theme_bg_color TEXT DEFAULT '#f8fafc',
  theme_bg_image_url TEXT,
  theme_text_color TEXT DEFAULT '#111827',
  theme_border_color TEXT DEFAULT '#d1d5db',
  theme_table_bg TEXT DEFAULT '#ffffff',
  theme_card_bg TEXT DEFAULT '#ffffff',
  theme_dark BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Modified Tables

All transactional and taxonomy tables now have `festival_id`:

- `collections` → `festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE`
- `expenses` → `festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE`
- `groups` → `festival_id UUID` + UNIQUE(festival_id, name)
- `categories` → `festival_id UUID` + UNIQUE(festival_id, name)
- `collection_modes` → `festival_id UUID` + UNIQUE(festival_id, name)
- `expense_modes` → `festival_id UUID` + UNIQUE(festival_id, name)

**Indexes added** for performance:
- `collections(festival_id, date DESC)`
- `expenses(festival_id, date DESC)`
- `groups(festival_id, name)`
- `categories(festival_id, name)`
- And more...

---

## Authentication System Changes

### User Authentication (Per-Festival, Daily Session)

**Old System:**
- Single global password in `passwords` table
- Persistent localStorage `userPasswordAuth`
- Never expires

**New System:**
- Per-festival password in `festivals.user_password`
- Optional: `festivals.requires_user_password` toggle
- Daily session: localStorage key `userPasswordAuth:{CODE}`
- Session includes token from `user_password_updated_at`
- **Auto-logout on password change**: When admin updates user password, the `user_password_updated_at` timestamp changes → all existing sessions invalidate on next page load

**Session Structure:**
\`\`\`json
{
  "authenticated": true,
  "date": "2024-11-16",
  "token": "2024-11-16T10:30:00.000Z"  // user_password_updated_at
}
\`\`\`

**Logic:**
- If `date` ≠ today → session expired
- If `token` ≠ current `user_password_updated_at` → password was changed, session invalid
- User must re-enter password

### Admin Authentication (Per-Festival, Daily Session)

**Old System:**
- Single global admin password
- URL param `/admin?p=password`
- Daily localStorage token

**New System:**
- Per-festival admin password in `festivals.admin_password`
- URL param `/f/{CODE}/admin?p=password` (not advertised)
- Daily session: localStorage key `adminPasswordAuth:{CODE}`
- Session includes token from `admin_password_updated_at`
- **Decoy input** on gate (always fails, for distraction)

---

## New Routes & Pages

### Landing & Entry Pages

1. **`/` (Superhome)**
   - Landing page with hero section
   - "View a Festival" button → `/view`
   - "Create a Festival" button → `/create`
   - Features section, footer

2. **`/view`**
   - Input field for festival code
   - Navigates to `/f/{CODE}` on submit

3. **`/create`**
   - Form to create new festival
   - Auto-generates unique 8-char code
   - Fields: event details, date range, location, organiser, etc.
   - Toggle: "Requires user password"
   - If enabled: user password & admin password inputs
   - Theme settings: background color, image URL, dark mode
   - Redirects to `/f/{CODE}` after creation

### Festival Pages (Per-Festival Routes)

All pages now under `/f/[code]/*`:

1. **`/f/[code]`** - Festival Dashboard
2. **`/f/[code]/collection`** - Collections with charts
3. **`/f/[code]/expense`** - Expenses with charts
4. **`/f/[code]/transaction`** - Combined transactions
5. **`/f/[code]/admin`** - Admin panel with full CRUD

**All pages:**
- Wrapped in `<PasswordGate code={code}>`
- Fetch festival by code
- Filter all data by `festival_id`
- Apply per-festival theme (background, colors)
- Use `<BottomNav code={code} />` for navigation

---

## Component Changes

### Updated Components

**PasswordGate**
- Now accepts `code` prop
- Uses `usePasswordAuth(code)` hook
- Respects `festival.requires_user_password`
- Daily session with token-based invalidation
- If password not required → renders children directly

**AdminPasswordGate**
- Now accepts `code` prop
- Uses `useAdminAuth(code)` hook
- Shows decoy input (no hints about URL param)
- URL param still works: `?p={admin_password}`
- Daily session with token-based invalidation

**BottomNav**
- Now accepts `code` prop
- Dynamic routes: `/f/{code}`, `/f/{code}/collection`, etc.
- Returns null if no code

**Modals (AddCollectionModal, AddExpenseModal)**
- Now accept `festivalId` prop
- Include `festival_id` when inserting records
- Filter groups/modes by festival

**New: EditFestivalModal**
- Replaces EditBasicInfoModal
- Edits festival details + title styling

---

## New Hooks

### `usePasswordAuth(code: string)`

Returns:
- `isAuthenticated`: boolean
- `isLoading`: boolean
- `requiresPassword`: boolean (from festival settings)
- `verifyPassword(password: string)`: async function

**Daily Session Logic:**
1. Check localStorage key `userPasswordAuth:{code}`
2. Validate:
   - `date` === today
   - `token` === current `user_password_updated_at`
3. If valid → authenticate
4. Otherwise → require password

**On Password Change:**
- Admin updates `user_password` → `user_password_updated_at` auto-updates
- All existing sessions have old token
- Next time user visits: token mismatch → must re-enter password

### `useAdminAuth(code: string)`

Same logic as user auth but:
- Checks URL param `?p`
- Compares to `festival.admin_password`
- Stores token from `admin_password_updated_at`
- Daily session in `adminPasswordAuth:{code}`

---

## Theme System

### Theme Fields (Per-Festival)

Each festival can customize:

| Field | Purpose | Default |
|-------|---------|---------|
| `theme_primary_color` | Primary buttons, accents | `#2563eb` |
| `theme_secondary_color` | Secondary UI elements | `#1f2937` |
| `theme_bg_color` | Page background | `#f8fafc` |
| `theme_bg_image_url` | Background image (overrides color) | `null` |
| `theme_text_color` | Text color | `#111827` |
| `theme_border_color` | Borders | `#d1d5db` |
| `theme_table_bg` | Table background | `#ffffff` |
| `theme_card_bg` | Card background | `#ffffff` |
| `theme_dark` | Dark mode toggle | `false` |

### Theme Application

**In every festival page:**
\`\`\`tsx
const bgStyle = festival?.theme_bg_image_url
  ? { backgroundImage: `url(${festival.theme_bg_image_url})`, ... }
  : { backgroundColor: festival?.theme_bg_color };

const themeStyles = getThemeStyles(festival);

<div style={{ ...bgStyle, ...themeStyles }}>
  {/* page content */}
</div>
\`\`\`

**`getThemeStyles()` utility** (lib/theme.ts):
Returns CSS custom properties:
\`\`\`css
--theme-primary: #2563eb
--theme-secondary: #1f2937
--theme-bg: #f8fafc
--theme-text: #111827
--theme-border: #d1d5db
--theme-table-bg: #ffffff
--theme-card-bg: #ffffff
\`\`\`

Components can use these variables for dynamic theming.

### Admin Theme Editor

In `/f/{code}/admin`:
- "Theme & Appearance" section
- Color pickers for all theme colors
- Background image URL input
- Dark mode toggle
- "Save Theme" button → updates festival record

---

## Data Flow Changes

### Creating a Festival

1. User visits `/create`
2. Fills form (event details, passwords, theme)
3. Code auto-generated (e.g., `ABCD1234`)
4. Festival inserted into `festivals` table
5. Redirect to `/f/ABCD1234`

### Viewing a Festival

1. User visits `/view`
2. Enters code (e.g., `ABCD1234`)
3. Redirects to `/f/ABCD1234`
4. If password required → PasswordGate shows
5. If not required → dashboard loads directly

### Adding Collections/Expenses

**Old:** Insert with no festival_id  
**New:** Insert with `festival_id` from current festival

\`\`\`tsx
await supabase.from('collections').insert({
  festival_id: festival.id,  // ← NEW
  name: '...',
  amount: 100,
  // ...
});
\`\`\`

### Querying Data

**Old:** `SELECT * FROM collections`  
**New:** `SELECT * FROM collections WHERE festival_id = 'festival-uuid'`

All queries now scoped to festival:
\`\`\`tsx
await supabase
  .from('collections')
  .select('*')
  .eq('festival_id', festival.id)  // ← Filter by festival
  .order('date', { ascending: false });
\`\`\`

---

## Password Invalidation Logic

### Scenario: Admin Changes User Password

**Step-by-step:**

1. **Before change:**
   - User logged in today
   - localStorage: `userPasswordAuth:ABCD1234 = { date: "2024-11-16", token: "2024-11-15T08:00:00Z" }`

2. **Admin changes password:**
   - Admin updates `user_password` = "NewPass123"
   - Supabase auto-updates `user_password_updated_at` = "2024-11-16T14:30:00Z"

3. **User returns (same day):**
   - Hook reads localStorage
   - Stored token: `"2024-11-15T08:00:00Z"`
   - Current token: `"2024-11-16T14:30:00Z"`
   - **Mismatch** → clear localStorage → show password gate
   - User must enter new password

4. **User enters new password:**
   - Verified against `user_password`
   - New session saved with new token
   - Access granted

### Scenario: Next Day Login

**Step-by-step:**

1. **User returns next day:**
   - Hook reads localStorage
   - Stored date: `"2024-11-16"`
   - Current date: `"2024-11-17"`
   - **Date mismatch** → session expired → show password gate

2. **User enters password:**
   - New session saved with today's date
   - Access granted for the day

---

## Removed Components & Pages

### Deleted:
- `app/admin/page.tsx` (replaced by `/f/[code]/admin`)
- `app/collection/page.tsx` (replaced by `/f/[code]/collection`)
- `app/expense/page.tsx` (replaced by `/f/[code]/expense`)
- `app/transaction/page.tsx` (replaced by `/f/[code]/transaction`)
- `components/modals/EditBasicInfoModal.tsx` (replaced by `EditFestivalModal.tsx`)

### Deprecated (but kept for reference):
- `supabase-schema.sql` (old single-festival schema)
- `types/BasicInfo` interface (kept for now, but Festival is primary)
- Global `passwords` table (no longer used)
- Global `basic_info` table (no longer used)

---

## Migration Steps

### 1. Clean Existing Data (You're doing this)

\`\`\`sql
-- In Supabase SQL Editor
TRUNCATE collections, expenses, groups, categories, collection_modes, expense_modes CASCADE;
DELETE FROM basic_info;
DELETE FROM passwords;
\`\`\`

### 2. Run Multi-Festive Migration

In Supabase SQL Editor, run:
\`\`\`
supabase-migration-multifestive.sql
\`\`\`

This will:
- Create `festivals` table
- Add `festival_id` to all data tables
- Add unique constraints per festival
- Create indexes
- Set up RLS policies

### 3. Create Your First Festival

Visit: `http://localhost:3000/create`

Fill in:
- Event name, organiser, guide, mentor, location
- Start and end dates
- Toggle "Requires user password" (default: ON)
- Set user password (e.g., `MyFest2024`)
- Set admin password (e.g., `admin`)
- Choose background color or image URL
- Click "Create Festival"

You'll be redirected to `/f/{CODE}` (e.g., `/f/ABCD1234`)

### 4. Share Festival URL

Copy URL: `http://localhost:3000/f/ABCD1234`

Share with your team. They can:
- Visit the URL
- Enter user password (if required)
- View dashboard, collections, expenses, transactions

### 5. Admin Access

Visit: `http://localhost:3000/f/ABCD1234/admin?p=admin`

(Decoy input shows on screen but URL param is the real method)

---

## New Features

### Per-Festival Passwords

Each festival can:
- Require or not require user password
- Have unique user password
- Have unique admin password
- Update passwords anytime (invalidates all sessions)

### Comprehensive Theming

Admins can customize (per festival):
- **Colors**: Primary, secondary, background, text, border, table, card
- **Background**: Solid color OR image URL (image wins if both set)
- **Dark Mode**: Toggle (future enhancement for full dark theme)

Theme editor in Admin panel:
- Color pickers for all theme colors
- Background image URL input
- Dark mode checkbox
- "Save Theme" button

### Data Isolation

Each festival has its own:
- Collections
- Expenses
- Groups
- Categories
- Collection modes
- Expense modes

No cross-festival data pollution.

### Code-Based Access

- 8-character uppercase codes (e.g., `XYZABC12`)
- Auto-generated, guaranteed unique
- Easy to share
- Can be used as QR code (future)

---

## User Flows

### Creating a Festival

\`\`\`
/ (landing)
  → Click "Create a Festival"
  → /create
  → Fill form
  → Auto-generated code: ABCD1234
  → Redirects to /f/ABCD1234
  → Start adding data!
\`\`\`

### Viewing an Existing Festival

\`\`\`
/ (landing)
  → Click "View a Festival"
  → /view
  → Enter code: ABCD1234
  → /f/ABCD1234
  → If password required:
    → Enter password
    → Access granted for today
  → If not required:
    → Dashboard loads immediately
\`\`\`

### Admin Workflow

\`\`\`
/f/ABCD1234/admin?p=admin
  → Verify admin password
  → Access granted for today
  → Edit festival info
  → Add/edit/delete collections
  → Add/edit/delete expenses
  → Manage groups/categories/modes
  → Update passwords (invalidates user sessions)
  → Customize theme
  → Save changes
\`\`\`

---

## Files Changed

### New Files
- `supabase-migration-multifestive.sql` - Multi-festival migration
- `app/page.tsx` - Superhome landing
- `app/view/page.tsx` - View festival (code entry)
- `app/create/page.tsx` - Create festival
- `app/f/[code]/page.tsx` - Festival dashboard
- `app/f/[code]/collection/page.tsx` - Collections
- `app/f/[code]/expense/page.tsx` - Expenses
- `app/f/[code]/transaction/page.tsx` - Transactions
- `app/f/[code]/admin/page.tsx` - Admin panel
- `components/modals/EditFestivalModal.tsx` - Edit festival info
- `lib/theme.ts` - Theme utilities

### Modified Files
- `types/index.ts` - Added Festival interface, festival_id to Collection/Expense
- `lib/hooks/usePasswordAuth.ts` - Per-festival, daily session, token-based invalidation
- `lib/hooks/useAdminAuth.ts` - Per-festival admin auth
- `components/PasswordGate.tsx` - Accepts code, respects requires_password
- `components/AdminPasswordGate.tsx` - Accepts code, decoy input
- `components/BottomNav.tsx` - Dynamic routes with code
- `components/modals/AddCollectionModal.tsx` - Accepts festivalId
- `components/modals/AddExpenseModal.tsx` - Accepts festivalId
- `app/globals.css` - Fixed input text visibility

### Deleted Files
- `app/admin/page.tsx`
- `app/collection/page.tsx`
- `app/expense/page.tsx`
- `app/transaction/page.tsx`
- `components/modals/EditBasicInfoModal.tsx`

---

## Breaking Changes

### For Existing Users

**Old URLs no longer work:**
- `/` (was dashboard, now landing)
- `/collection` → use `/f/{CODE}/collection`
- `/expense` → use `/f/{CODE}/expense`
- `/transaction` → use `/f/{CODE}/transaction`
- `/admin` → use `/f/{CODE}/admin?p={password}`

**Migration path:**
1. Note your data (export if needed)
2. Clear all tables
3. Run new migration
4. Create festival via `/create`
5. Re-add data via admin panel

---

## Features Summary

### ✅ Implemented

- [x] Multi-festival support with unique codes
- [x] Per-festival data isolation
- [x] Per-festival user password (optional)
- [x] Per-festival admin password
- [x] Daily session expiration
- [x] Auto-logout on password change (token-based)
- [x] Comprehensive theme customization (7 colors + dark mode)
- [x] Background image support
- [x] Superhome landing page
- [x] Create festival flow
- [x] View festival flow
- [x] All CRUD operations per festival
- [x] Per-festival groups/categories/modes
- [x] Theme editor in admin panel
- [x] Festival URL sharing (copy button in admin)

### 🔮 Future Enhancements

- [ ] QR code generation for festival URLs
- [ ] CSV export per festival
- [ ] Festival analytics (visitor count, etc.)
- [ ] Festival archival
- [ ] Full dark mode CSS (not just background)
- [ ] Image upload for background (not just URL)
- [ ] Custom fonts per festival
- [ ] Multi-admin support with roles

---

## Testing Checklist

After running migration:

1. **Create Festival**
   - [ ] Visit `/create`
   - [ ] Fill all fields
   - [ ] Toggle password requirement
   - [ ] Set theme colors
   - [ ] Submit → redirects to `/f/{CODE}`

2. **View Festival**
   - [ ] Visit `/view`
   - [ ] Enter code
   - [ ] Redirects to festival dashboard
   - [ ] Password gate shows (if required)
   - [ ] Enter correct password
   - [ ] Dashboard loads

3. **User Session**
   - [ ] Login with password
   - [ ] Navigate between pages (no re-prompt)
   - [ ] Close browser, return same day (no re-prompt)
   - [ ] Return next day (password required)

4. **Password Change Invalidation**
   - [ ] Login as user
   - [ ] Admin changes user password
   - [ ] User refreshes page (password required again)
   - [ ] User enters new password
   - [ ] Access granted

5. **Admin Access**
   - [ ] Visit `/f/{CODE}/admin?p={admin_password}`
   - [ ] Access granted
   - [ ] Edit festival info
   - [ ] Add/edit/delete collections
   - [ ] Add/edit/delete expenses
   - [ ] Manage settings
   - [ ] Update theme
   - [ ] Update passwords

6. **Theming**
   - [ ] Change background color → reflects on all pages
   - [ ] Add background image URL → overrides color
   - [ ] Change text color → visible on all pages
   - [ ] Change primary color → buttons update
   - [ ] Save theme → persist across reload

7. **Multi-Festival Isolation**
   - [ ] Create Festival A
   - [ ] Add collections to Festival A
   - [ ] Create Festival B
   - [ ] Add collections to Festival B
   - [ ] Verify Festival A collections ≠ Festival B collections

---

## Code Examples

### Creating a Festival (Client-Side)

\`\`\`tsx
const code = genCode(); // 8-char uppercase
await supabase.from('festivals').insert({
  code,
  event_name: 'Diwali 2024',
  organiser: 'Cultural Committee',
  guide: 'Prof. Sharma',
  location: 'Main Campus',
  event_start_date: '2024-11-10',
  event_end_date: '2024-11-15',
  requires_user_password: true,
  user_password: 'Diwali@2024',
  admin_password: 'admin123',
  theme_bg_color: '#fef3c7',
  theme_primary_color: '#f59e0b',
});
\`\`\`

### Adding a Collection (Admin)

\`\`\`tsx
await supabase.from('collections').insert({
  festival_id: festival.id,
  name: 'John Doe',
  amount: 500,
  group_name: 'Group A',
  mode: 'Cash',
  date: '2024-11-16',
});
\`\`\`

### Checking Password Session (Hook)

\`\`\`tsx
const { isAuthenticated, verifyPassword } = usePasswordAuth(code);

// On submit
const valid = await verifyPassword(enteredPassword);
if (valid) {
  // Session saved: userPasswordAuth:ABCD1234
  // Valid until: end of day OR password change
}
\`\`\`

---

## Security Improvements

1. **Per-festival isolation**: No festival can see another's data
2. **Daily session expiration**: Reduces long-lived sessions
3. **Token-based invalidation**: Password changes immediately invalidate all sessions
4. **Decoy admin input**: Hides real admin access method
5. **Optional password**: Festivals can be public if admin chooses

---

## Performance Considerations

- **Indexes added** on all frequently queried columns
- **Client-side filtering** for tables (no repeated DB queries)
- **Scoped queries** with `festival_id` (fast lookups)
- **Single festival fetch** per page load
- **React.useMemo** for expensive calculations

---

## What You Need to Do Now

1. **Clear your existing data** (you mentioned you'll do this)
2. **Run migration**: `supabase-migration-multifestive.sql` in Supabase SQL Editor
3. **Create your first festival**: Visit `http://localhost:3000/create`
4. **Test the flow**: View, add data, manage settings, update theme
5. **Share the code** with your team

---

## Summary

✅ **Multi-festival architecture** complete  
✅ **Per-festival passwords** with daily sessions  
✅ **Auto-logout on password change** via token comparison  
✅ **Comprehensive theming** (7 colors + image + dark mode)  
✅ **Data isolation** per festival  
✅ **Clean routing** `/f/[code]/*`  
✅ **Superhome landing** with create/view flows  
✅ **All CRUD operations** scoped to festival  

The app is now a **multi-tenant system** where each festival operates independently with its own code, data, passwords, and theme!

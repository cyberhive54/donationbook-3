# Multi-Admin System - Comprehensive Implementation Plan

## 📋 Overview

Transform the single-admin system into a multi-admin system managed by Super Admin, with complete activity tracking, role-based permissions, and enhanced user experience.

---

## 🎯 Requirements Summary

### Core Changes:
1. **Multi-Admin System**: Super Admin can create multiple admins
2. **Admin Authentication**: Admin Code + Password (no more ?p=password)
3. **User Password Management**: Each admin can create up to 3 user passwords
4. **Activity Tracking**: Track who added what, when, and with which password
5. **Role-Based UI**: Different dashboards for Admin vs Super Admin
6. **Global Session Component**: Show auth details on all pages
7. **Banner Visibility Controls**: Toggle what shows in festival details
8. **Backward Compatibility**: Migrate existing data without loss

---

## 🗄️ Database Schema Changes

### New Tables:

#### 1. `admins` Table
\`\`\`sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  admin_code TEXT NOT NULL, -- Auto-generated, editable (e.g., "ADM001")
  admin_name TEXT NOT NULL, -- Manually entered by Super Admin
  admin_password TEXT NOT NULL,
  created_by_admin_id UUID REFERENCES admins(id), -- Super Admin who created them
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  total_logins INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{"can_manage_collections": true, "can_manage_expenses": true}',
  UNIQUE(festival_id, admin_code)
);
\`\`\`

#### 2. `admin_user_passwords` Table
\`\`\`sql
CREATE TABLE admin_user_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  password TEXT NOT NULL,
  password_label TEXT NOT NULL, -- "Password 1", "Password 2", "Password 3"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  UNIQUE(admin_id, password_label)
);
\`\`\`

#### 3. `admin_activity_logs` Table
\`\`\`sql
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'login', 'add_collection', 'edit_collection', 'delete_collection', etc.
  action_details JSONB, -- Details about the action
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);
\`\`\`

### Modified Tables:

#### 1. `collections` Table - Add tracking
\`\`\`sql
ALTER TABLE collections 
ADD COLUMN created_by_admin_id UUID REFERENCES admins(id),
ADD COLUMN updated_by_admin_id UUID REFERENCES admins(id),
ADD COLUMN updated_at TIMESTAMPTZ;
\`\`\`

#### 2. `expenses` Table - Add tracking
\`\`\`sql
ALTER TABLE expenses 
ADD COLUMN created_by_admin_id UUID REFERENCES admins(id),
ADD COLUMN updated_by_admin_id UUID REFERENCES admins(id),
ADD COLUMN updated_at TIMESTAMPTZ;
\`\`\`

#### 3. `festivals` Table - Add banner visibility settings
\`\`\`sql
ALTER TABLE festivals
ADD COLUMN banner_show_organiser BOOLEAN DEFAULT TRUE,
ADD COLUMN banner_show_guide BOOLEAN DEFAULT TRUE,
ADD COLUMN banner_show_mentor BOOLEAN DEFAULT TRUE,
ADD COLUMN banner_show_location BOOLEAN DEFAULT TRUE,
ADD COLUMN banner_show_dates BOOLEAN DEFAULT TRUE,
ADD COLUMN banner_show_duration BOOLEAN DEFAULT TRUE,
ADD COLUMN admin_display_preference TEXT DEFAULT 'code'; -- 'code' or 'name'
\`\`\`

#### 4. `access_logs` Table - Add admin tracking
\`\`\`sql
ALTER TABLE access_logs
ADD COLUMN admin_id UUID REFERENCES admins(id), -- Which admin's password was used
ADD COLUMN admin_code TEXT, -- Denormalized for quick display
ADD COLUMN admin_name TEXT; -- Denormalized for quick display
\`\`\`

---

## 🏗️ Architecture Changes

### Authentication Flow:

#### **Visitor Authentication**:
1. Visitor enters name
2. Visitor enters password (created by any admin)
3. System checks `admin_user_passwords` table
4. If valid, log access with admin_id reference
5. Store session with admin info

#### **Admin Authentication**:
1. Admin enters admin code/name
2. Admin enters password
3. System checks `admins` table
4. If valid, log admin login
5. Redirect to `/f/[code]/admin`

#### **Super Admin Authentication**:
1. Super Admin enters super admin password
2. System checks `festivals.super_admin_password`
3. If valid, log super admin login
4. Redirect to `/f/[code]/admin/sup/dashboard`

---

## 📁 File Structure Changes

### New Pages:

\`\`\`
app/f/[code]/
├── admin/
│   ├── page.tsx (Admin Dashboard - Limited)
│   ├── login/
│   │   └── page.tsx (Admin Login Page)
│   ├── activity/
│   │   └── page.tsx (Admin Activity Page)
│   └── sup/
│       ├── login/
│       │   └── page.tsx (Super Admin Login Page)
│       ├── dashboard/
│       │   └── page.tsx (Super Admin Dashboard - Full Control)
│       └── analytics/
│           └── page.tsx (Already exists)
├── activity/
│   └── page.tsx (Visitor Activity Page)
└── [existing pages...]
\`\`\`

### New Components:

\`\`\`
components/
├── GlobalSessionBar.tsx (Shows auth details, logout, navigation)
├── AdminLoginForm.tsx (Admin code + password)
├── SuperAdminLoginForm.tsx (Super admin password only)
├── CreateAdminModal.tsx (Super Admin creates admins)
├── ManageAdminPasswordsModal.tsx (Admin manages their 3 user passwords)
├── BannerVisibilitySettings.tsx (Toggle banner fields)
└── [existing components...]
\`\`\`

### Modified Components:

\`\`\`
components/
├── BasicInfo.tsx (Respect banner visibility settings)
├── modals/
│   ├── AddCollectionModal.tsx (Add "Collected By" dropdown)
│   ├── AddExpenseModal.tsx (Add "Expense By" dropdown)
│   └── EditFestivalModal.tsx (Remove passwords, add banner settings)
└── [existing components...]
\`\`\`

---

## 🔄 Migration Strategy

### Phase 1: Database Migration
1. Create new tables (admins, admin_user_passwords, admin_activity_logs)
2. Add columns to existing tables
3. Create indexes and constraints
4. Create helper functions

### Phase 2: Data Migration
1. For each existing festival:
   - Create "Default Admin" (admin_code: "ADMIN001", admin_name: "Default Admin")
   - Use existing `admin_password` as their password
   - Migrate existing `user_password` to `admin_user_passwords` table
   - Set created_by_admin_id to NULL (or Default Admin)

### Phase 3: Frontend Updates
1. Create new authentication components
2. Update admin dashboard (remove super admin features)
3. Create super admin dashboard
4. Add global session bar
5. Create activity pages
6. Update modals with admin tracking

### Phase 4: Testing & Validation
1. Test admin login flow
2. Test super admin login flow
3. Test admin creation
4. Test password management
5. Test activity tracking
6. Test backward compatibility

---

## 🎨 UI/UX Design

### Admin Login Page (`/f/[code]/admin/login`)
\`\`\`
┌─────────────────────────────────────┐
│     Admin Login                     │
│                                     │
│  Admin Code/Name: [____________]    │
│  Password:        [____________]    │
│                                     │
│  [Login as Admin]                   │
│                                     │
│  Super Admin? [Login Here]          │
└─────────────────────────────────────┘
\`\`\`

### Super Admin Login Page (`/f/[code]/admin/sup/login`)
\`\`\`
┌─────────────────────────────────────┐
│     Super Admin Login               │
│                                     │
│  Super Admin Password: [________]   │
│                                     │
│  [Login as Super Admin]             │
│                                     │
│  Regular Admin? [Login Here]        │
└─────────────────────────────────────┘
\`\`\`

### Admin Dashboard (`/f/[code]/admin`)
**Sections**:
- ✅ Festival Code & Copy URL
- ✅ Basic Info (with edit button - limited fields)
- ✅ Stats Cards
- ✅ Collections Table (with "Collected By" column)
- ✅ Expenses Table (with "Expense By" column)
- ✅ Collection Settings (Groups, Modes)
- ✅ Expense Settings (Categories, Modes)
- ✅ My Password (admin's own password)
- ✅ User Passwords (manage 3 user passwords)
- ❌ Super Admin Password (removed)
- ❌ Theme Settings (removed)
- ❌ Delete Festival (removed)

### Super Admin Dashboard (`/f/[code]/admin/sup/dashboard`)
**Sections**:
- ✅ Festival Code & Copy URL
- ✅ Basic Info (full edit access)
- ✅ Stats Cards
- ✅ Collections Table (with "Collected By" column)
- ✅ Expenses Table (with "Expense By" column)
- ✅ Collection Settings
- ✅ Expense Settings
- ✅ Admin Management (Create, Edit, Delete admins)
- ✅ Super Admin Password
- ✅ Theme Settings
- ✅ Banner Visibility Settings
- ✅ Delete Festival

### Global Session Bar (Bottom of all pages)
\`\`\`
┌─────────────────────────────────────────────────────────┐
│ 👤 John Doe | 🔐 Logged in: Jan 26, 2025 10:30 AM      │
│ via Admin: ADMIN001 (John Admin)                        │
│ [Logout] [View Activity] [Home/Admin Page]              │
└─────────────────────────────────────────────────────────┘
\`\`\`

### Activity Page (`/f/[code]/activity` or `/f/[code]/admin/activity`)
\`\`\`
┌─────────────────────────────────────────────────────────┐
│  My Activity History                                    │
│                                                         │
│  📅 Jan 26, 2025 10:30 AM                              │
│  🔐 Logged in using Admin: ADMIN001's Password 1       │
│  📍 Session ID: abc123                                  │
│                                                         │
│  📅 Jan 25, 2025 15:20 PM                              │
│  🔐 Logged in using Admin: ADMIN002's Password 2       │
│  📍 Session ID: def456                                  │
│                                                         │
│  [Load More]                                            │
└─────────────────────────────────────────────────────────┘
\`\`\`

---

## 🔐 Authentication & Authorization

### Session Storage Structure:

#### Visitor Session:
\`\`\`typescript
{
  type: 'visitor',
  festivalId: 'uuid',
  festivalCode: 'XXXXXXXX',
  visitorName: 'John Doe',
  adminId: 'uuid', // Which admin's password was used
  adminCode: 'ADMIN001',
  adminName: 'John Admin',
  passwordLabel: 'Password 1',
  loginTime: '2025-01-26T10:30:00Z',
  sessionId: 'uuid'
}
\`\`\`

#### Admin Session:
\`\`\`typescript
{
  type: 'admin',
  festivalId: 'uuid',
  festivalCode: 'XXXXXXXX',
  adminId: 'uuid',
  adminCode: 'ADMIN001',
  adminName: 'John Admin',
  loginTime: '2025-01-26T10:30:00Z',
  sessionId: 'uuid'
}
\`\`\`

#### Super Admin Session:
\`\`\`typescript
{
  type: 'super_admin',
  festivalId: 'uuid',
  festivalCode: 'XXXXXXXX',
  loginTime: '2025-01-26T10:30:00Z',
  sessionId: 'uuid'
}
\`\`\`

---

## 📊 Data Flow

### 1. **Visitor Views Festival**
\`\`\`
Visitor → Enter Name → Enter Password → 
Check admin_user_passwords → 
Log to access_logs (with admin_id) → 
Store session → 
Show dashboard
\`\`\`

### 2. **Admin Adds Collection**
\`\`\`
Admin → Login → Add Collection → 
Select "Collected By" (admin dropdown) → 
Save with created_by_admin_id → 
Log to admin_activity_logs → 
Show in activity page
\`\`\`

### 3. **Super Admin Creates Admin**
\`\`\`
Super Admin → Login → Admin Management → 
Create Admin (auto-generate code, enter name) → 
Set password → 
Save to admins table → 
Log to admin_activity_logs
\`\`\`

### 4. **Admin Creates User Password**
\`\`\`
Admin → My Passwords → Add Password → 
Enter password → Select label (1/2/3) → 
Save to admin_user_passwords → 
Show in password list
\`\`\`

---

## 🎨 UI Components Breakdown

### 1. **GlobalSessionBar Component**

**Props**:
- `sessionType`: 'visitor' | 'admin' | 'super_admin'
- `sessionData`: Session object
- `currentPage`: string (to show Home or View Activity)

**Features**:
- Fixed at bottom of page (above BottomNav if present)
- Responsive design
- Shows different info based on session type
- Logout functionality
- Navigation buttons

### 2. **AdminLoginForm Component**

**Features**:
- Admin Code/Name input
- Password input
- Login button
- Link to Super Admin login
- Error handling
- Loading state

### 3. **CreateAdminModal Component**

**Features**:
- Auto-generate admin code (editable)
- Admin name input
- Password input
- Confirm password
- Save button
- Validation

### 4. **ManageAdminPasswordsModal Component**

**Features**:
- Show existing passwords (up to 3)
- Add new password (if < 3)
- Edit existing password
- Delete password
- Show usage stats
- Password labels (Password 1, 2, 3)

### 5. **BannerVisibilitySettings Component**

**Features**:
- Checkboxes for each field
- Festival Name (always checked, disabled)
- Organiser (checked, disabled for admin, editable for super admin)
- Guide, Mentor, Location (toggleable)
- Festival Dates (checked, disabled for admin, editable for super admin)
- Duration (checked, disabled for admin, editable for super admin)
- Save button

---

## 🔄 Migration Plan

### Step 1: Database Migration
**File**: `supabase-migration-multi-admin-system.sql`

1. Create `admins` table
2. Create `admin_user_passwords` table
3. Create `admin_activity_logs` table
4. Add columns to `collections`, `expenses`, `festivals`, `access_logs`
5. Create indexes
6. Create helper functions
7. Migrate existing data

### Step 2: TypeScript Types
**File**: `types/index.ts`

Add new interfaces:
- `Admin`
- `AdminUserPassword`
- `AdminActivityLog`
- `AdminSession`
- `VisitorSession`
- `SuperAdminSession`

### Step 3: Authentication Hooks
**Files**:
- `lib/hooks/useAdminAuth.ts` (update for new system)
- `lib/hooks/useSuperAdminAuth.ts` (new)
- `lib/hooks/useSession.ts` (new - unified session management)

### Step 4: Login Pages
**Files**:
- `app/f/[code]/admin/login/page.tsx` (new)
- `app/f/[code]/admin/sup/login/page.tsx` (new)

### Step 5: Dashboard Pages
**Files**:
- `app/f/[code]/admin/page.tsx` (update - remove super admin features)
- `app/f/[code]/admin/sup/dashboard/page.tsx` (new - full control)

### Step 6: Activity Pages
**Files**:
- `app/f/[code]/activity/page.tsx` (visitor activity)
- `app/f/[code]/admin/activity/page.tsx` (admin activity)

### Step 7: Global Components
**Files**:
- `components/GlobalSessionBar.tsx` (new)
- Update all 6 visitor pages to include GlobalSessionBar

### Step 8: Modals & Forms
**Files**:
- `components/modals/CreateAdminModal.tsx` (new)
- `components/modals/ManageAdminPasswordsModal.tsx` (new)
- `components/modals/AddCollectionModal.tsx` (add "Collected By" dropdown)
- `components/modals/AddExpenseModal.tsx` (add "Expense By" dropdown)
- `components/modals/EditFestivalModal.tsx` (remove passwords, add banner settings)

### Step 9: Update Create Festival Flow
**Files**:
- `app/create/page.tsx` (update success modal - remove admin URL with ?p=)

---

## 📝 Detailed Implementation Steps

### Database Migration (Priority 1)

**File**: `supabase-migration-multi-admin-system.sql`

\`\`\`sql
-- 1. Create admins table
-- 2. Create admin_user_passwords table
-- 3. Create admin_activity_logs table
-- 4. Alter collections, expenses, festivals, access_logs
-- 5. Create migration function to create default admin
-- 6. Create helper functions:
--    - create_admin()
--    - verify_admin_credentials()
--    - log_admin_activity()
--    - get_admin_by_code()
--    - get_admin_user_passwords()
-- 7. Create views:
--    - admin_stats_view
--    - admin_activity_summary
\`\`\`

### TypeScript Types (Priority 1)

**File**: `types/index.ts`

\`\`\`typescript
export interface Admin {
  id: string;
  festival_id: string;
  admin_code: string;
  admin_name: string;
  admin_password: string;
  created_by_admin_id?: string;
  created_at: string;
  last_login_at?: string;
  total_logins: number;
  is_active: boolean;
  permissions: {
    can_manage_collections: boolean;
    can_manage_expenses: boolean;
  };
}

export interface AdminUserPassword {
  id: string;
  admin_id: string;
  festival_id: string;
  password: string;
  password_label: string;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
  usage_count: number;
}

export interface AdminActivityLog {
  id: string;
  festival_id: string;
  admin_id: string;
  action_type: string;
  action_details: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AdminSession {
  type: 'admin';
  festivalId: string;
  festivalCode: string;
  adminId: string;
  adminCode: string;
  adminName: string;
  loginTime: string;
  sessionId: string;
}

export interface VisitorSession {
  type: 'visitor';
  festivalId: string;
  festivalCode: string;
  visitorName: string;
  adminId: string;
  adminCode: string;
  adminName: string;
  passwordLabel: string;
  loginTime: string;
  sessionId: string;
}

export interface SuperAdminSession {
  type: 'super_admin';
  festivalId: string;
  festivalCode: string;
  loginTime: string;
  sessionId: string;
}

export type SessionData = VisitorSession | AdminSession | SuperAdminSession;
\`\`\`

### Authentication Hooks (Priority 2)

**File**: `lib/hooks/useSession.ts`

\`\`\`typescript
// Unified session management
export function useSession(festivalCode: string) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load session from localStorage
  // Validate session
  // Provide logout function
  // Provide session info
  
  return { session, loading, logout };
}
\`\`\`

### Global Session Bar (Priority 2)

**File**: `components/GlobalSessionBar.tsx`

**Features**:
- Shows at bottom of all pages (above BottomNav)
- Different display for visitor/admin/super admin
- Logout button
- View Activity button (or Home if on activity page)
- Admin Page button (for admins only)
- Responsive design
- Smooth animations

---

## 🧪 Testing Strategy

### Unit Tests:
- [ ] Admin creation function
- [ ] Password verification
- [ ] Activity logging
- [ ] Session management

### Integration Tests:
- [ ] Admin login flow
- [ ] Super Admin login flow
- [ ] Visitor login with admin password
- [ ] Admin creates user password
- [ ] Admin adds collection (tracked)
- [ ] Activity page shows correct data

### E2E Tests:
- [ ] Complete visitor journey
- [ ] Complete admin journey
- [ ] Complete super admin journey
- [ ] Migration from old system
- [ ] Multi-admin collaboration

---

## ⚠️ Important Considerations

### 1. **Security**
- Hash passwords in production
- Implement rate limiting
- Add CSRF protection
- Validate all inputs
- Sanitize admin codes

### 2. **Performance**
- Index all foreign keys
- Cache admin info in session
- Optimize activity queries
- Paginate activity logs

### 3. **User Experience**
- Clear error messages
- Loading states everywhere
- Responsive design
- Mobile-friendly
- Keyboard navigation

### 4. **Data Integrity**
- Cascade deletes properly
- Handle orphaned records
- Validate admin limits
- Prevent duplicate codes

---

## 📅 Implementation Timeline

### Phase 1: Database & Types (Day 1)
- Create migration SQL
- Update TypeScript types
- Test migration on dev database

### Phase 2: Authentication (Day 2)
- Create login pages
- Update authentication hooks
- Implement session management

### Phase 3: Dashboards (Day 3)
- Update admin dashboard
- Create super admin dashboard
- Add admin management

### Phase 4: Activity & Tracking (Day 4)
- Create activity pages
- Add global session bar
- Implement activity logging

### Phase 5: Modals & Forms (Day 5)
- Update collection/expense modals
- Create admin management modals
- Update edit festival modal

### Phase 6: Testing & Polish (Day 6)
- End-to-end testing
- Bug fixes
- UI polish
- Documentation

---

## ✅ Success Criteria

- [ ] Super Admin can create multiple admins
- [ ] Each admin has unique code and password
- [ ] Admins can create up to 3 user passwords
- [ ] All logins are tracked with admin reference
- [ ] Activity pages show complete history
- [ ] Global session bar works on all pages
- [ ] Banner visibility controls work
- [ ] Collections/Expenses track which admin created them
- [ ] Admin dashboard has limited features
- [ ] Super Admin dashboard has full control
- [ ] Backward compatibility maintained
- [ ] No data loss during migration
- [ ] Responsive on all devices
- [ ] Loading states and error handling

---

## 🚀 Ready to Proceed?

This is a **major architectural change** that will touch many files. The implementation will take significant time and careful testing.

**Estimated Implementation Time**: 15-20 hours of development work

**Files to Create**: ~15 new files
**Files to Modify**: ~20 existing files

Should I proceed with this implementation? Or would you like to adjust any part of the plan first?

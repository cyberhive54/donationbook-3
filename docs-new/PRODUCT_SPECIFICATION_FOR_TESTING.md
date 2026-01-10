# Donation Book - Product Specification Document for Testing

**Version:** 1.0  
**Date:** 2026-01-09  
**Application Type:** Web Application (Next.js 14)  
**Testing Scope:** Complete Application Testing

---

## 1. EXECUTIVE SUMMARY

### 1.1 Application Overview
Donation Book is a multi-festival digital khatabook (ledger book) web application for tracking festive donations, collections, and expenses in communities or hostels. It supports multiple festivals with unique codes, per-festival password protection, multi-admin system, visitor tracking, analytics, and media showcase functionality.

### 1.2 Technology Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui components
- **Database:** Supabase (PostgreSQL) with Row Level Security (RLS)
- **State Management:** React Hooks (useState, useEffect, useMemo)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Toast Notifications:** React Hot Toast
- **Date Handling:** date-fns
- **Authentication:** Custom localStorage-based session management

### 1.3 Key Features
- Multi-festival support with unique 8-letter codes
- Three-tier authentication (Visitor, Admin, Super Admin)
- Multi-admin system with admin-specific user passwords
- Collection and expense tracking with date validation
- Interactive charts and analytics
- Media showcase (albums, images, videos, PDFs)
- Activity logging and visitor tracking
- Theme customization (colors, dark mode, background images)
- Mobile-responsive design

---

## 2. DATABASE SCHEMA

### 2.1 Core Tables

#### **festivals**
- **Purpose:** Main festival entity
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `code` (TEXT, UNIQUE, 6-12 alphanumeric characters)
  - `event_name` (TEXT, Required)
  - `organiser`, `mentor`, `guide`, `location` (TEXT, Optional)
  - `event_start_date`, `event_end_date` (DATE, Optional - must be within CE dates)
  - `ce_start_date`, `ce_end_date` (DATE, Required - Collection/Expense date range)
  - `requires_password` (BOOLEAN, Default: true)
  - `user_password` (TEXT, Legacy field)
  - `admin_password` (TEXT, Legacy field)
  - `super_admin_password` (TEXT)
  - `theme_*` (Various theme customization fields)
  - `multi_admin_enabled` (BOOLEAN, Default: false)
  - `banner_show_*` (BOOLEAN flags for banner visibility)
  - `admin_display_preference` (TEXT, 'code' or 'name')
- **Constraints:** 
  - Festival dates must be within CE date range (enforced by triggers)
  - Code format: 6-12 alphanumeric + hyphens only
  - Code uniqueness

#### **collections**
- **Purpose:** Donation/collection records
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id)
  - `name` (TEXT, Required) - Donor name
  - `amount` (DECIMAL(10,2), Required)
  - `group_name` (TEXT, Required)
  - `mode` (TEXT, Required) - Payment mode
  - `note` (TEXT, Optional)
  - `date` (DATE, Required) - Must be within CE date range
  - `time_hour`, `time_minute` (INTEGER, Optional) - Time of transaction
  - `image_url` (TEXT, Optional)
  - `created_by_admin_id`, `updated_by_admin_id` (UUID, Foreign Key → admins.admin_id)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Constraints:**
  - Date must be within `ce_start_date` and `ce_end_date` (trigger validation)
  - Amount >= 0

#### **expenses**
- **Purpose:** Expense records
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id)
  - `item` (TEXT, Required)
  - `pieces` (INTEGER, Required, >= 1)
  - `price_per_piece` (DECIMAL(10,2), Required)
  - `total_amount` (DECIMAL(10,2), Required) - Calculated: pieces * price_per_piece
  - `category` (TEXT, Required)
  - `mode` (TEXT, Required) - Payment mode
  - `note` (TEXT, Optional)
  - `date` (DATE, Required) - Must be within CE date range
  - `time_hour`, `time_minute` (INTEGER, Optional)
  - `image_url` (TEXT, Optional)
  - `created_by_admin_id`, `updated_by_admin_id` (UUID, Foreign Key → admins.admin_id)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Constraints:**
  - Date must be within CE date range (trigger validation)
  - Pieces >= 1
  - Price per piece >= 0
  - Total amount = pieces * price_per_piece (calculated)

#### **admins**
- **Purpose:** Multi-admin system - admin accounts
- **Key Fields:**
  - `admin_id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id, CASCADE DELETE)
  - `admin_code` (TEXT, Required, UNIQUE per festival)
  - `admin_name` (TEXT, Required, UNIQUE per festival)
  - `admin_password_hash` (TEXT, Required) - Plain text password (not hashed)
  - `is_active` (BOOLEAN, Default: true)
  - `max_user_passwords` (INTEGER, Default: 3) - Maximum user passwords this admin can create
  - `created_by` (TEXT, Optional) - Super admin who created this
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Constraints:**
  - Admin code must be unique per festival
  - Admin name must be unique per festival
  - Admin code/name can be used interchangeably for login

#### **user_passwords**
- **Purpose:** Admin-specific user passwords for visitor access
- **Key Fields:**
  - `password_id` (UUID, Primary Key)
  - `admin_id` (UUID, Foreign Key → admins.admin_id, CASCADE DELETE)
  - `festival_id` (UUID, Foreign Key → festivals.id)
  - `password` (TEXT, Required) - Must be unique per festival
  - `label` (TEXT, Required) - e.g., "Password 1", "Guest Password" (unique per admin)
  - `is_active` (BOOLEAN, Default: true)
  - `usage_count` (INTEGER, Default: 0)
  - `last_used_at` (TIMESTAMPTZ, Optional)
  - `created_by` (TEXT, Optional)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Constraints:**
  - Password must be unique across entire festival
  - Label must be unique per admin
  - Admin cannot exceed `max_user_passwords` limit

#### **access_logs**
- **Purpose:** Visitor access tracking and analytics
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id)
  - `visitor_name` (TEXT, Required) - Sanitized lowercase name
  - `access_method` (TEXT) - 'password_modal' or 'direct_link'
  - `password_used` (TEXT, Optional)
  - `user_password_id` (UUID, Foreign Key → user_passwords.password_id)
  - `admin_id` (UUID, Foreign Key → admins.admin_id)
  - `auth_method` (TEXT, Optional)
  - `session_id` (TEXT, Optional)
  - `ip_address`, `user_agent` (TEXT, Optional)
  - `accessed_at` (TIMESTAMPTZ, Default: NOW())
- **Purpose:** Track who accessed festival, when, and which password was used

#### **admin_activity_log**
- **Purpose:** Admin action tracking for audit trail
- **Key Fields:**
  - `log_id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id)
  - `admin_id` (UUID, Foreign Key → admins.admin_id, NULL for super_admin actions)
  - `admin_name` (TEXT, Optional)
  - `action_type` (TEXT, Required) - e.g., 'create_collection', 'delete_expense', 'login', 'logout'
  - `action_details` (JSONB, Optional) - Additional action metadata
  - `target_type`, `target_id` (TEXT, Optional) - What was affected
  - `ip_address`, `user_agent` (TEXT, Optional)
  - `timestamp` (TIMESTAMPTZ, Default: NOW())

#### **albums**
- **Purpose:** Media showcase - album containers
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id)
  - `title` (TEXT, Required)
  - `description` (TEXT, Optional)
  - `year` (INTEGER, Optional)
  - `cover_url` (TEXT, Optional)
  - `created_by_admin_id`, `updated_by_admin_id` (UUID, Foreign Key → admins.admin_id)
  - `created_at` (TIMESTAMPTZ)

#### **media_items**
- **Purpose:** Media files in albums (images, videos, PDFs, audio)
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `album_id` (UUID, Foreign Key → albums.id, CASCADE DELETE)
  - `type` (TEXT) - 'image', 'video', 'audio', 'pdf', 'other'
  - `title`, `description` (TEXT, Optional)
  - `url` (TEXT, Required) - Supabase Storage URL
  - `mime_type` (TEXT, Optional)
  - `size_bytes` (BIGINT, Optional)
  - `duration_sec` (INTEGER, Optional) - For videos/audio
  - `thumbnail_url` (TEXT, Optional) - For videos
  - `created_at` (TIMESTAMPTZ)

#### **groups**
- **Purpose:** Collection groups (e.g., "Group A", "Group B")
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id)
  - `name` (TEXT, Required, UNIQUE per festival)
  - `created_at` (TIMESTAMPTZ)

#### **categories**
- **Purpose:** Expense categories (e.g., "Food", "Decoration")
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id)
  - `name` (TEXT, Required, UNIQUE per festival)
  - `created_at` (TIMESTAMPTZ)

#### **collection_modes** & **expense_modes**
- **Purpose:** Payment modes (e.g., "Cash", "Online", "UPI")
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id)
  - `name` (TEXT, Required, UNIQUE per festival)
  - `created_at` (TIMESTAMPTZ)

#### **analytics_config**
- **Purpose:** Analytics configuration per festival
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id, UNIQUE)
  - `collection_target_amount` (DECIMAL(10,2), Optional)
  - `target_visibility` (TEXT) - 'public' or 'admin_only'
  - `previous_year_total_collection`, `previous_year_total_expense`, `previous_year_net_balance` (DECIMAL(10,2), Optional)
  - `donation_buckets`, `time_of_day_buckets` (JSONB, Optional)
  - `created_at`, `updated_at` (TIMESTAMPTZ)

#### **donation_buckets** & **time_of_day_buckets**
- **Purpose:** Custom analytics buckets
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id)
  - `bucket_label` (TEXT, Required)
  - `min_amount`, `max_amount` (DECIMAL, Optional - null for "above" buckets)
  - `start_hour`, `start_minute`, `end_hour`, `end_minute` (INTEGER, For time buckets)
  - `sort_order` (INTEGER, Required)
  - `created_at`, `updated_at` (TIMESTAMPTZ)

#### **festival_code_history**
- **Purpose:** Track festival code changes for backward compatibility
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `festival_id` (UUID, Foreign Key → festivals.id)
  - `old_code` (TEXT, Required)
  - `new_code` (TEXT, Required)
  - `changed_at` (TIMESTAMPTZ, Default: NOW())

### 2.2 Database Functions (RPC)

#### **log_festival_access**
- **Purpose:** Log visitor access to festival
- **Parameters:**
  - `p_festival_id` (UUID)
  - `p_visitor_name` (TEXT) - Sanitized lowercase name
  - `p_access_method` (TEXT) - 'password_modal' or 'direct_link'
  - `p_password_used` (TEXT, Optional)
  - `p_session_id` (TEXT, Optional)
  - `p_user_password_id` (UUID, Optional)
- **Returns:** UUID (log entry ID)

#### **log_admin_activity**
- **Purpose:** Log admin actions for audit trail
- **Parameters:**
  - `p_festival_id` (UUID)
  - `p_admin_id` (UUID, Optional - NULL for super_admin)
  - `p_action_type` (TEXT) - e.g., 'create_collection', 'delete_expense', 'login', 'logout'
  - `p_action_details` (JSONB, Optional)
  - `p_target_type`, `p_target_id` (TEXT, Optional)
- **Returns:** UUID (log entry ID)

#### **verify_admin_credentials**
- **Purpose:** Verify admin login credentials
- **Parameters:**
  - `p_festival_code` (TEXT)
  - `p_admin_code_or_name` (TEXT) - Admin code or name (case-sensitive for code, case-insensitive for name)
  - `p_password` (TEXT) - Plain text password
- **Returns:** JSON object
  - `success` (BOOLEAN)
  - `admin_id`, `admin_code`, `admin_name`, `festival_id` (if success)
  - `error` (TEXT, if failure)
- **Logic:**
  - Finds admin by festival_code and (admin_code OR admin_name)
  - Compares password directly (plain text comparison)
  - Checks `is_active = true`
  - Returns success or error message

#### **get_admin_by_code_or_name**
- **Purpose:** Get admin details by code or name
- **Parameters:**
  - `p_festival_id` (UUID)
  - `p_admin_code_or_name` (TEXT)
- **Returns:** Admin record or NULL

### 2.3 Database Triggers & Constraints

#### **Date Validation Triggers**
- Collections and expenses must have `date` within `ce_start_date` and `ce_end_date` of festival
- Festival `event_start_date` and `event_end_date` must be within `ce_start_date` and `ce_end_date`
- Triggers prevent invalid date insertions/updates

#### **Unique Constraints**
- Festival code: UNIQUE across all festivals
- Admin code: UNIQUE per festival
- Admin name: UNIQUE per festival
- User password: UNIQUE per festival (across all admins)
- User password label: UNIQUE per admin
- Group name: UNIQUE per festival
- Category name: UNIQUE per festival
- Collection/Expense mode name: UNIQUE per festival

#### **Cascade Deletes**
- Delete festival → Delete all related admins, collections, expenses, albums, etc.
- Delete admin → Delete all related user_passwords
- Delete album → Delete all related media_items

---

## 3. USER ROLES & AUTHENTICATION

### 3.1 User Roles

#### **Visitor**
- **Access Level:** View-only access to festival pages
- **Authentication:** User password (provided by admin)
- **Session Type:** `VisitorSession`
- **Session Storage:** localStorage key: `session:{festivalCode}`
- **Session Duration:** Valid until midnight IST (end of current day)
- **Session Data:**
  - `type: "visitor"`
  - `festivalId`, `festivalCode`
  - `visitorName` (sanitized lowercase)
  - `adminId`, `adminCode`, `adminName` (admin who created the password)
  - `passwordLabel`, `passwordId`
  - `loginTime`, `sessionId`, `deviceId`
- **Capabilities:**
  - View festival home page
  - View collections page (read-only)
  - View expenses page (read-only)
  - View transactions page
  - View analytics page
  - View showcase page
  - View activity page (their own activity)
  - Cannot edit, add, or delete any data
- **Session Invalidation:**
  - Expires at midnight IST
  - Invalidated if password is deactivated
  - Invalidated if password is updated after login time
  - Invalidated if admin is deactivated
  - Shows 5-minute warning before logout if password/admin deactivated

#### **Admin**
- **Access Level:** Full CRUD operations for assigned festival
- **Authentication:** Admin code/name + admin password
- **Session Type:** `AdminSession`
- **Session Storage:** localStorage key: `session:{festivalCode}`
- **Session Duration:** Valid until midnight IST
- **Session Data:**
  - `type: "admin"`
  - `festivalId`, `festivalCode`
  - `adminId`, `adminCode`, `adminName`
  - `loginTime`, `sessionId`
- **Capabilities:**
  - All visitor capabilities PLUS:
  - Admin dashboard access (`/f/{code}/admin`)
  - Create/edit/delete collections
  - Create/edit/delete expenses
  - Manage groups, categories, payment modes
  - Manage user passwords (up to `max_user_passwords` limit)
  - Edit festival basic info
  - Edit festival theme settings
  - View admin activity logs
  - Manage albums and media (showcase)
  - Configure analytics settings
  - Cannot:
    - Create/delete other admins
    - Access super admin dashboard
    - Change festival code
    - Change super admin password
- **Session Invalidation:**
  - Expires at midnight IST
  - Invalidated if admin is deactivated
  - Immediate logout if deactivated (no warning)

#### **Super Admin**
- **Access Level:** Full control including admin management
- **Authentication:** Super admin password (stored in festivals table)
- **Session Type:** `SuperAdminSession`
- **Session Storage:** localStorage key: `session:{festivalCode}`
- **Session Duration:** Valid until midnight IST
- **Session Data:**
  - `type: "super_admin"`
  - `festivalId`, `festivalCode`
  - `loginTime`, `sessionId`
- **Capabilities:**
  - All admin capabilities PLUS:
  - Super admin dashboard (`/f/{code}/admin/sup/dashboard`)
  - Create/edit/delete admins
  - Activate/deactivate admins
  - Set admin `max_user_passwords` limit
  - View all admin activity logs
  - Change festival code (with history tracking)
  - Access advanced analytics
  - Full system configuration
- **Session Invalidation:**
  - Expires at midnight IST only
  - Cannot be deactivated (no deactivation mechanism)

### 3.2 Authentication Flow

#### **Visitor Authentication**
1. User visits `/f/{code}` or any visitor page
2. `PasswordGate` component checks if password required
3. If password required:
   - Shows password input form with name and password fields
   - User enters name and password
   - System validates password against `user_passwords` table
   - Checks if password is active and admin is active
   - Checks for duplicate name (case-insensitive) in `access_logs`
   - Checks for concurrent session on same device
   - If valid:
     - Creates `VisitorSession`
     - Saves to localStorage
     - Logs access via `log_festival_access` RPC
     - Updates password `usage_count` and `last_used_at`
     - Saves last used name for device (pre-fills on next visit)
   - If invalid: Shows error message
4. If password not required: Allows direct access
5. Session validated every 30 seconds for password/admin status changes

#### **Admin Authentication**
1. User visits `/f/{code}/admin/login`
2. Admin enters festival code, admin code/name, and password
3. System calls `verify_admin_credentials` RPC
4. If valid:
   - Creates `AdminSession`
   - Saves to localStorage
   - Logs activity via `log_admin_activity` RPC (action_type: 'login')
   - Redirects to admin dashboard
5. If invalid: Shows error message
6. Session validated every 30 seconds for admin status

#### **Super Admin Authentication**
1. User visits `/f/{code}/admin/sup/login`
2. Super admin enters festival code and super admin password
3. System queries `festivals` table for `super_admin_password`
4. If password matches:
   - Creates `SuperAdminSession`
   - Saves to localStorage
   - Redirects to super admin dashboard
5. If invalid: Shows error message

### 3.3 Session Management

#### **Session Storage Format**
```json
{
  "type": "visitor" | "admin" | "super_admin",
  "festivalId": "uuid",
  "festivalCode": "ABCDEFGH",
  "loginTime": "2026-01-09T10:30:00.000Z",
  "sessionId": "uuid",
  // Visitor-specific:
  "visitorName": "john-doe",
  "adminId": "uuid",
  "adminCode": "ADM01",
  "adminName": "Admin Name",
  "passwordLabel": "Password 1",
  "passwordId": "uuid",
  "deviceId": "ABCDEFGH-090120241030-ABC123"
  // Admin-specific:
  "adminId": "uuid",
  "adminCode": "ADM01",
  "adminName": "Admin Name"
}
```

#### **Session Validation**
- **Location:** `lib/sessionValidator.ts`
- **Frequency:** Every 30 seconds after initial load
- **Checks:**
  - Session date matches today (IST timezone)
  - For visitors: Password is active, password not updated after login, admin is active
  - For admins: Admin is active
  - For super_admin: Always valid (no checks)
- **Results:**
  - If invalid with warning: Shows 5-minute warning banner, then logs out
  - If invalid without warning: Immediate logout and page reload

#### **IST Timezone Handling**
- **Critical:** Sessions expire at midnight IST, not UTC
- **Implementation:** Uses `Intl.DateTimeFormat` with timezone 'Asia/Kolkata'
- **Functions:**
  - `getTodayIST()` - Returns today's date in IST (YYYY-MM-DD format)
  - Session validation compares login date (IST) with today (IST)

#### **Device ID Management**
- **Purpose:** Track concurrent sessions on same device
- **Format:** `{festivalCode}-{DDMMYYHHMMSS}-{6-char-random}`
- **Storage:** localStorage key: `deviceId:{festivalCode}`
- **Last Used Name:** localStorage key: `lastUsedName:{festivalCode}`
- **Behavior:** Pre-fills name on subsequent visits, allows editing with pencil icon

---

## 4. APPLICATION ROUTES & PAGES

### 4.1 Root Routes

#### **`/` (Home/Landing Page)**
- **File:** `app/page.tsx`
- **Access:** Public (no authentication)
- **Features:**
  - Application introduction
  - Links to "View a Festival" (`/view`) and "Create a Festival" (`/create`)
  - Feature highlights (Multi-Festival Support, Per-Festival Passwords, Beautiful Charts)
- **Testing Requirements:**
  - Verify links navigate correctly
  - Verify responsive design
  - Verify feature descriptions display correctly

#### **`/create` (Create Festival Page)**
- **File:** `app/create/page.tsx`
- **Access:** Public (no authentication)
- **Features:**
  - Form to create new festival
  - Fields:
    - Event/Festival Name (Required)
    - Organiser, Mentor, Guide, Location (Optional)
    - Collection/Expense Start Date (Required)
    - Collection/Expense End Date (Required)
    - Festival Start Date (Optional, must be within CE dates)
    - Festival End Date (Optional, must be within CE dates)
    - Password Protection checkbox
    - User Password (Required if password protection enabled)
    - Admin Password (Required if password protection enabled)
    - Super Admin Password (Required if password protection enabled)
    - Background Color picker
    - Background Image URL
    - Dark Theme checkbox
  - Validation:
    - Event name required
    - CE dates required and valid (end > start)
    - Festival dates must be within CE date range
    - Passwords required if protection enabled
  - On submit:
    - Generates unique 8-letter code (retries up to 5 times if duplicate)
    - Creates festival in database
    - Shows success modal with:
      - Festival code (copyable)
      - Public URL (copyable)
      - Admin URL (copyable)
      - Auto-redirect countdown (10 seconds, toggleable)
- **Testing Requirements:**
  - Form validation (required fields, date ranges)
  - Code generation uniqueness
  - Success modal display and functionality
  - Copy to clipboard functionality
  - Auto-redirect functionality
  - Password warning modal when unchecking password protection

#### **`/view` (View Festival Entry Page)**
- **File:** `app/view/page.tsx`
- **Access:** Public (no authentication)
- **Features:**
  - Input field for festival code
  - Validates festival code exists in database
  - Redirects to `/f/{code}` if valid
  - Shows error if code invalid or not found
- **Testing Requirements:**
  - Valid code redirects correctly
  - Invalid code shows error message
  - Code validation (case-insensitive)
  - Old code redirects (via code history)

### 4.2 Festival Routes (`/f/[code]/*`)

#### **`/f/[code]` (Festival Home/Dashboard)**
- **File:** `app/f/[code]/page.tsx`
- **Access:** Protected by `PasswordGate` (if password required)
- **Features:**
  - Displays `BasicInfo` component (festival name, organiser, dates, location)
  - Displays `StatsCards` (Total Collection, Total Expense, Number of Donators, Balance)
  - Recent Transactions table (7 most recent, sorted by date/time descending)
  - Recent Collections table (7 most recent)
  - Recent Expenses table (7 most recent)
  - "View All" links to detailed pages
  - Bottom navigation bar
  - Global session bar (if authenticated)
  - Direct link authentication support (via query params: `?mode=login&p={password}&name={name}`)
- **Testing Requirements:**
  - Password gate functionality (if password required)
  - Data loading and display
  - Stats calculation accuracy
  - Recent items sorting (date, time)
  - Navigation links functionality
  - Direct link authentication
  - Theme application (background color/image, dark mode)

#### **`/f/[code]/collection` (Collections Page)**
- **File:** `app/f/[code]/collection/page.tsx`
- **Access:** Protected by `PasswordGate` (if password required)
- **Features:**
  - Full collections table with pagination
  - Filters: Group, Mode, Search by name
  - Sort options: Latest, Oldest, Highest Amount, Lowest Amount, Name (A-Z)
  - Pagination: Configurable records per page (10, 25, 50, 100)
  - Charts:
    - Collection vs Expense timeline chart
    - Collections by Group (pie chart)
    - Collections by Mode (pie chart)
    - Daily Collection bar chart (within festival date range)
    - Top 5 Donators chart
- **Testing Requirements:**
  - Table filtering functionality
  - Sorting functionality
  - Search functionality
  - Pagination functionality
  - Charts render correctly with data
  - Date range filtering for daily chart
  - Responsive design

#### **`/f/[code]/expense` (Expenses Page)**
- **File:** `app/f/[code]/expense/page.tsx`
- **Access:** Protected by `PasswordGate` (if password required)
- **Features:**
  - Full expenses table with pagination
  - Filters: Category, Mode, Search by item name
  - Sort options: Latest, Oldest, Highest Amount, Lowest Amount, Item Name (A-Z)
  - Pagination: Configurable records per page
  - Charts:
    - Collection vs Expense timeline chart
    - Expenses by Category (pie chart)
    - Expenses by Mode (pie chart)
    - Daily Expense bar chart (within festival date range)
    - Top 8 Most Expensive Items chart
- **Testing Requirements:**
  - Table filtering, sorting, search, pagination
  - Charts render correctly
  - Total amount calculation (pieces * price_per_piece)

#### **`/f/[code]/transaction` (Transactions Page)**
- **File:** `app/f/[code]/transaction/page.tsx`
- **Access:** Protected by `PasswordGate` (if password required)
- **Features:**
  - Combined collections + expenses table
  - Type badges (Collection/Expense)
  - Filters: Mode, Search
  - Sort options: Latest, Oldest, Highest, Lowest
  - Pagination
  - All charts from both collections and expenses pages
  - Daily Net Balance chart (collection - expense per day)
  - Transaction Count by Day chart
- **Testing Requirements:**
  - Combined data sorting (by date, then time)
  - Type badges display correctly
  - All charts render correctly
  - Net balance calculation accuracy

#### **`/f/[code]/analytics` (Analytics Page)**
- **File:** `app/f/[code]/analytics/page.tsx`
- **Access:** Protected by `PasswordGate` (if password required)
- **Features:**
  - Advanced analytics and insights
  - Custom donation buckets analysis
  - Time of day buckets analysis
  - Target vs actual comparison (if target configured)
  - Previous year comparison (if data configured)
- **Testing Requirements:**
  - Analytics calculations accuracy
  - Bucket grouping correct
  - Target visibility settings (public vs admin_only)
  - Charts render with custom buckets

#### **`/f/[code]/showcase` (Showcase/Media Page)**
- **File:** `app/f/[code]/showcase/page.tsx`
- **Access:** Protected by `PasswordGate` (if password required)
- **Features:**
  - Grid display of albums
  - Each album shows: Cover image, Title, Year, Description
  - Click album → View media items in modal
  - Media viewer supports: Images, Videos, PDFs, Audio files
  - Download functionality for media files
  - Storage stats display (total used, percentage of 400MB limit)
- **Testing Requirements:**
  - Album grid display
  - Media viewer functionality
  - File type handling (images, videos, PDFs, audio)
  - Download functionality
  - Storage limit calculations
  - Thumbnail generation for videos

#### **`/f/[code]/activity` (Visitor Activity Page)**
- **File:** `app/f/[code]/activity/page.tsx`
- **Access:** Protected by `PasswordGate` (if password required)
- **Features:**
  - Shows visitor's own access log
  - Lists: Visitor name, access method, password used, timestamp
  - Filtering and search capabilities
- **Testing Requirements:**
  - Activity log display
  - Filtering functionality
  - Timestamp formatting
  - Access method badges

### 4.3 Admin Routes

#### **`/f/[code]/admin/login` (Admin Login Page)**
- **File:** `app/f/[code]/admin/login/page.tsx`
- **Access:** Public (redirects if already logged in as admin/super_admin)
- **Features:**
  - Form: Festival code, Admin code/name, Admin password
  - Calls `verify_admin_credentials` RPC
  - On success: Creates admin session, logs activity, redirects to admin dashboard
  - On failure: Shows error message
  - Link to super admin login
- **Testing Requirements:**
  - Login form validation
  - Credential verification
  - Session creation
  - Error message display
  - Navigation to super admin login
  - Redirect if already logged in

#### **`/f/[code]/admin` (Admin Dashboard)**
- **File:** `app/f/[code]/admin/page.tsx`
- **Access:** Protected by `AdminPasswordGate`
- **Features:**
  - Full CRUD interface for collections and expenses
  - Add Collection modal (supports bulk entry up to 5)
  - Add Expense modal (supports bulk entry up to 10)
  - Edit/Delete functionality for collections and expenses
  - Manage Groups (add/delete)
  - Manage Categories (add/delete)
  - Manage Collection Modes (add/delete)
  - Manage Expense Modes (add/delete)
  - Edit Festival Basic Info modal
  - Edit Festival Theme modal
  - Manage User Passwords modal (up to `max_user_passwords` limit)
  - Manage Albums and Media modal
  - Storage Stats modal
  - Analytics Config modal
  - Admin password change (if not super admin)
  - Date validation: Collections/expenses must be within CE date range
  - Admin activity logging for all actions
- **Testing Requirements:**
  - All CRUD operations
  - Bulk entry functionality
  - Date validation (CE date range)
  - Admin activity logging
  - Password management (create, edit, activate/deactivate, delete)
  - Password limit enforcement (`max_user_passwords`)
  - Modal functionality
  - Data persistence

#### **`/f/[code]/admin/activity` (Admin Activity Log Page)**
- **File:** `app/f/[code]/admin/activity/page.tsx`
- **Access:** Protected by `AdminPasswordGate`
- **Features:**
  - Displays admin activity logs
  - Filters: Action type, Date range, Admin
  - Shows: Action type, Admin name, Target, Timestamp, Details
- **Testing Requirements:**
  - Activity log display
  - Filtering functionality
  - Action type categorization
  - Timestamp formatting

#### **`/f/[code]/admin/sup/login` (Super Admin Login Page)**
- **File:** `app/f/[code]/admin/sup/login/page.tsx`
- **Access:** Public (redirects if already logged in as super_admin)
- **Features:**
  - Form: Festival code, Super Admin password
  - Queries festivals table for `super_admin_password`
  - On success: Creates super admin session, redirects to super admin dashboard
  - On failure: Shows error message
- **Testing Requirements:**
  - Login form validation
  - Password verification
  - Session creation
  - Error message display
  - Redirect if already logged in

#### **`/f/[code]/admin/sup/dashboard` (Super Admin Dashboard)**
- **File:** `app/f/[code]/admin/sup/dashboard/page.tsx`
- **Access:** Protected by `SuperAdminPasswordGate`
- **Features:**
  - All admin dashboard features PLUS:
  - Admin Management:
    - Create Admin modal (admin code, name, password, max_user_passwords)
    - Edit Admin modal (change name, password, max_user_passwords, activate/deactivate)
    - Delete Admin modal (with confirmation)
    - List all admins with status
  - Festival Code Change:
    - Change festival code (with validation: 6-12 chars, alphanumeric + hyphens)
    - Creates history entry for old code → new code mapping
    - Old codes redirect to new code automatically
  - System Settings:
    - Multi-admin system enable/disable
    - Banner visibility settings (organiser, guide, mentor, location, dates, duration)
    - Admin display preference (code or name)
  - Advanced Analytics:
    - Super admin analytics overview
    - All admin activity logs
    - System-wide statistics
- **Testing Requirements:**
  - Admin management (create, edit, delete, activate/deactivate)
  - Festival code change functionality
  - Code history tracking
  - Old code redirect functionality
  - System settings persistence
  - Advanced analytics display

#### **`/f/[code]/admin/sup/activity` (Super Admin Activity Log Page)**
- **File:** `app/f/[code]/admin/sup/activity/page.tsx`
- **Access:** Protected by `SuperAdminPasswordGate`
- **Features:**
  - All admin activity logs (all admins + super admin)
  - Advanced filtering and search
  - Export functionality
- **Testing Requirements:**
  - Activity log display (all admins)
  - Filtering functionality
  - Export functionality

#### **`/f/[code]/admin/sup/analytics` (Super Admin Analytics)**
- **File:** `app/f/[code]/admin/sup/analytics/page.tsx`
- **Access:** Protected by `SuperAdminPasswordGate`
- **Features:**
  - Advanced analytics and insights
  - Admin-specific statistics
  - System-wide trends
- **Testing Requirements:**
  - Analytics calculations
  - Admin-specific data
  - Charts render correctly

#### **`/f/[code]/admin/sup/analytics-overview` (Analytics Overview)**
- **File:** `app/f/[code]/admin/sup/analytics-overview/page.tsx`
- **Access:** Protected by `SuperAdminPasswordGate`
- **Features:**
  - Comprehensive analytics overview
  - Key metrics dashboard
- **Testing Requirements:**
  - Metrics display
  - Data accuracy

#### **`/f/[code]/admin/sup/expense-analytics` (Expense Analytics)**
- **File:** `app/f/[code]/admin/sup/expense-analytics/page.tsx`
- **Access:** Protected by `SuperAdminPasswordGate`
- **Features:**
  - Detailed expense analytics
  - Category breakdowns
  - Trend analysis
- **Testing Requirements:**
  - Analytics calculations
  - Chart rendering
  - Data filtering

#### **`/f/[code]/admin/sup/transaction-analytics` (Transaction Analytics)**
- **File:** `app/f/[code]/admin/sup/transaction-analytics/page.tsx`
- **Access:** Protected by `SuperAdminPasswordGate`
- **Features:**
  - Transaction flow analysis
  - Daily/weekly/monthly trends
- **Testing Requirements:**
  - Transaction analytics
  - Trend calculations
  - Chart rendering

### 4.4 Layout Files

#### **`/f/[code]/layout.tsx` (Festival Layout)**
- **File:** `app/f/[code]/layout.tsx`
- **Purpose:** Wraps all festival routes with code redirect handler
- **Component:** `CodeRedirectHandler` - Handles old code → new code redirects
- **Testing Requirements:**
  - Code redirect functionality
  - Layout persistence across navigation

#### **`/f/[code]/admin/sup/layout.tsx` (Super Admin Layout)**
- **File:** `app/f/[code]/admin/sup/layout.tsx`
- **Purpose:** Wraps super admin routes with super admin password gate
- **Testing Requirements:**
  - Super admin authentication
  - Layout consistency

---

## 5. CORE COMPONENTS

### 5.1 Authentication Components

#### **PasswordGate**
- **File:** `components/PasswordGate.tsx`
- **Purpose:** Visitor password authentication gate
- **Props:**
  - `code` (string) - Festival code
  - `children` (ReactNode) - Protected content
- **Features:**
  - Checks if password required for festival
  - Shows password form if required
  - Validates password against `user_passwords` table
  - Validates name (sanitization, duplicate check, length)
  - Checks for concurrent sessions on device
  - Creates visitor session on success
  - Logs access via `log_festival_access` RPC
  - Pre-fills name from last used name (device-based)
  - Name field editable with pencil icon
  - Device ID generation and management
- **Testing Requirements:**
  - Password requirement check
  - Form validation (name, password)
  - Password verification
  - Name sanitization
  - Duplicate name detection
  - Concurrent session detection
  - Session creation
  - Access logging
  - Name pre-filling
  - Device ID persistence

#### **AdminPasswordGate**
- **File:** `components/AdminPasswordGate.tsx`
- **Purpose:** Admin/super_admin authentication gate
- **Props:**
  - `code` (string) - Festival code
  - `children` (ReactNode) - Protected content
- **Features:**
  - Checks for admin or super_admin session
  - Redirects to admin login if no session
  - Validates admin status (is_active)
  - Shows deactivation message if admin deactivated
- **Testing Requirements:**
  - Session validation
  - Redirect functionality
  - Admin status check
  - Deactivation message display

#### **SuperAdminPasswordGate**
- **File:** `components/SuperAdminPasswordGate.tsx`
- **Purpose:** Super admin authentication gate
- **Props:**
  - `code` (string) - Festival code
  - `children` (ReactNode) - Protected content
- **Features:**
  - Checks for super_admin session only
  - Redirects to super admin login if no session
- **Testing Requirements:**
  - Session validation
  - Redirect functionality

### 5.2 Display Components

#### **BasicInfo**
- **File:** `components/BasicInfo.tsx`
- **Purpose:** Displays festival basic information
- **Props:**
  - `basicInfo` (BasicInfo object)
  - `festival` (Festival object, optional) - For banner visibility settings
  - `showEditButton` (boolean, optional)
  - `onEdit` (function, optional)
- **Features:**
  - Displays: Event name, Organiser, Mentor, Guide, Location, Festival dates, Duration
  - Banner visibility controlled by `festival.banner_show_*` flags
  - Customizable title styling (size, weight, align, color) via `other_data`
  - Edit button (if `showEditButton` and `onEdit` provided)
- **Testing Requirements:**
  - Information display
  - Banner visibility flags
  - Title styling customization
  - Edit button functionality

#### **StatsCards**
- **File:** `components/StatsCards.tsx`
- **Purpose:** Displays key statistics in card format
- **Props:**
  - `stats` (Stats object) - { totalCollection, totalExpense, numDonators, balance }
- **Features:**
  - Four cards: Total Collection (green), Total Expense (red), Number of Donators (blue), Balance (green/red based on value)
  - Currency formatting (INR format)
  - Icons for each stat
  - Responsive grid layout
- **Testing Requirements:**
  - Stats calculation accuracy
  - Currency formatting
  - Color coding (balance positive/negative)
  - Responsive design

#### **GlobalSessionBar**
- **File:** `components/GlobalSessionBar.tsx`
- **Purpose:** Global session information bar at bottom of pages
- **Props:**
  - `festivalCode` (string)
  - `currentPage` ('home' | 'activity' | 'admin' | 'other', optional)
- **Features:**
  - Shows session information based on type:
    - Visitor: Name, login time, admin info (code, name), password label
    - Admin: Admin name (code), login time, "Admin" badge
    - Super Admin: "Super Admin" text, login time
  - Action buttons:
    - "View Activity" / "Go to Home" (toggles based on current page)
    - "Go to Admin Dashboard" (on visitor pages, for admin/super_admin)
    - "Logout" (logs activity, clears session, redirects)
  - Session warning banner integration (via `SessionWarningBanner`)
  - Logs logout activity for admin/super_admin
- **Testing Requirements:**
  - Session info display (all types)
  - Button functionality
  - Logout activity logging
  - Warning banner integration
  - Responsive design

#### **SessionWarningBanner**
- **File:** `components/SessionWarningBanner.tsx`
- **Purpose:** Warning banner for session invalidation
- **Props:**
  - `message` (string) - Warning message
  - `duration` (number) - Duration in milliseconds
  - `onDismiss` (function, optional) - Dismiss callback
- **Features:**
  - Displays warning message
  - Countdown timer (updates every second)
  - Dismiss button
  - Auto-dismisses after duration
- **Testing Requirements:**
  - Message display
  - Countdown timer accuracy
  - Dismiss functionality
  - Auto-dismiss functionality

#### **BottomNav**
- **File:** `components/BottomNav.tsx`
- **Purpose:** Fixed bottom navigation bar
- **Props:**
  - `code` (string, optional) - Festival code
- **Features:**
  - Six navigation items: Home, Collection, Transaction, Expense, Analytics, Showcase
  - Active page highlighting
  - Icons for each item
  - Responsive design
- **Testing Requirements:**
  - Navigation functionality
  - Active state highlighting
  - Responsive design

### 5.3 Table Components

#### **CollectionTable**
- **File:** `components/tables/CollectionTable.tsx`
- **Purpose:** Collections data table with filtering, sorting, pagination
- **Props:**
  - `collections` (Collection[]) - Collection data
  - `groups` (string[]) - Available groups for filter
  - `modes` (string[]) - Available modes for filter
  - `onEdit` (function, optional) - Edit callback (admin only)
  - `onDelete` (function, optional) - Delete callback (admin only)
  - `isAdmin` (boolean, optional) - Whether to show edit/delete buttons
- **Features:**
  - Columns: Name, Amount, Group, Mode, Date, Time, Note (optional), Actions (admin only)
  - Filters: Group dropdown, Mode dropdown, Search by name
  - Sort options: Latest, Oldest, Highest Amount, Lowest Amount, Name (A-Z)
  - Pagination: Configurable records per page (10, 25, 50, 100)
  - Edit/Delete buttons (admin only)
  - Currency formatting
  - Date/time formatting
  - Responsive design
- **Testing Requirements:**
  - Data display
  - Filtering functionality
  - Sorting functionality
  - Search functionality
  - Pagination functionality
  - Edit/Delete buttons (conditional display)
  - Formatting (currency, date, time)

#### **ExpenseTable**
- **File:** `components/tables/ExpenseTable.tsx`
- **Purpose:** Expenses data table with filtering, sorting, pagination
- **Props:**
  - `expenses` (Expense[]) - Expense data
  - `categories` (string[]) - Available categories for filter
  - `modes` (string[]) - Available modes for filter
  - `onEdit` (function, optional) - Edit callback
  - `onDelete` (function, optional) - Delete callback
  - `isAdmin` (boolean, optional) - Whether to show edit/delete buttons
- **Features:**
  - Columns: Item, Pieces, Price per Piece, Total Amount, Category, Mode, Date, Time, Note (optional), Actions (admin only)
  - Filters: Category dropdown, Mode dropdown, Search by item name
  - Sort options: Latest, Oldest, Highest Amount, Lowest Amount, Item Name (A-Z)
  - Pagination: Configurable records per page
  - Edit/Delete buttons (admin only)
  - Calculations: Total = Pieces * Price per Piece
  - Currency formatting
  - Date/time formatting
- **Testing Requirements:**
  - Data display
  - Filtering, sorting, search, pagination
  - Calculation accuracy
  - Edit/Delete buttons
  - Formatting

#### **TransactionTable**
- **File:** `components/tables/TransactionTable.tsx`
- **Purpose:** Combined collections + expenses table
- **Props:**
  - `transactions` (Transaction[]) - Combined transaction data
  - `modes` (string[]) - Available modes for filter
  - `onEdit` (function, optional) - Edit callback
  - `onDelete` (function, optional) - Delete callback
  - `isAdmin` (boolean, optional) - Whether to show edit/delete buttons
- **Features:**
  - Columns: Type (badge), Name/Item, Amount, Group/Category, Mode, Date, Time, Note, Actions (admin only)
  - Type badges: "Collection" (green) or "Expense" (red)
  - Filters: Mode dropdown, Search
  - Sort options: Latest, Oldest, Highest, Lowest
  - Pagination
  - Combined sorting: Date descending, then time descending
- **Testing Requirements:**
  - Combined data display
  - Type badges
  - Filtering, sorting, search, pagination
  - Combined sorting logic

### 5.4 Chart Components

#### **CollectionVsExpenseChart**
- **File:** `components/charts/CollectionVsExpenseChart.tsx`
- **Purpose:** Timeline chart showing collections vs expenses over time
- **Props:**
  - `collections` (Collection[])
  - `expenses` (Expense[])
  - `festivalStartDate` (string, optional)
  - `festivalEndDate` (string, optional)
- **Features:**
  - Line chart with two lines: Collections (green) and Expenses (red)
  - X-axis: Date (within festival date range if provided)
  - Y-axis: Amount
  - Tooltips showing date and amounts
- **Testing Requirements:**
  - Chart rendering
  - Data accuracy
  - Date range filtering
  - Tooltip functionality

#### **PieChart**
- **File:** `components/charts/PieChart.tsx`
- **Purpose:** Generic pie chart component for categorical data
- **Props:**
  - `data` ({ name: string; value: number }[]) - Chart data
  - `title` (string) - Chart title
  - `colors` (string[], optional) - Custom color palette
- **Features:**
  - Pie chart with labels showing name and percentage
  - Default color palette (8 colors)
  - Customizable colors via props
  - Tooltips showing amount in currency format
  - Legend display
  - Empty state: "No data available" message
- **Testing Requirements:**
  - Chart rendering with data
  - Percentage calculation accuracy
  - Color assignment
  - Tooltip functionality
  - Empty state display
  - Legend display

#### **BarChart**
- **File:** `components/charts/BarChart.tsx`
- **Purpose:** Generic bar chart component
- **Props:**
  - `data` (any[]) - Chart data
  - `title` (string) - Chart title
  - `dataKey` (string) - Key for bar values
  - `xAxisKey` (string) - Key for X-axis labels
  - `color` (string, optional, default: '#3b82f6') - Bar color
- **Features:**
  - Vertical bar chart
  - Customizable data keys
  - Customizable color
  - Tooltips showing amount in currency format
  - Grid lines
  - Empty state: "No data available" message
- **Testing Requirements:**
  - Chart rendering
  - Data key mapping
  - Color customization
  - Tooltip functionality
  - Empty state display
  - X/Y axis labels

#### **TopDonatorsChart**
- **File:** `components/charts/TopDonatorsChart.tsx`
- **Purpose:** Horizontal bar chart showing top donators with detailed list
- **Props:**
  - `collections` (Collection[]) - Collection data
  - `topN` (number, optional, default: 5) - Number of top donators to show
- **Features:**
  - Groups collections by donor name
  - Calculates total amount per donor
  - Sorts by total amount descending
  - Shows top N donators (includes ties if amount matches Nth place)
  - Horizontal bar chart
  - Detailed list below chart with:
    - Donor image (if available) or avatar with first letter
    - Donor name
    - Rank number
    - Total amount (formatted currency)
  - Empty state: "No data available" message
- **Testing Requirements:**
  - Donor grouping accuracy
  - Amount aggregation accuracy
  - Sorting accuracy
  - Top N selection (including ties)
  - Chart rendering
  - List display
  - Image display (if available)
  - Avatar fallback (first letter)
  - Rank numbering
  - Empty state display

### 5.5 Modal Components

#### **AddCollectionModal**
- **File:** `components/modals/AddCollectionModal.tsx`
- **Purpose:** Modal for adding/editing collections
- **Props:**
  - `isOpen` (boolean) - Modal open state
  - `onClose` (function) - Close callback
  - `onSuccess` (function) - Success callback (refreshes data)
  - `groups` (string[]) - Available groups
  - `modes` (string[]) - Available payment modes
  - `editData` (Collection, optional) - Collection data for edit mode
  - `festivalId` (string) - Festival ID
  - `festivalStartDate`, `festivalEndDate` (string, optional) - For date validation
- **Features:**
  - Form fields: Name, Amount, Group, Mode, Note, Date, Time (hour, minute)
  - Bulk entry support: Add up to 5 collections at once
  - Date validation: Must be within CE date range (`ce_start_date`, `ce_end_date`)
  - Time validation: Hour (0-23), Minute (0-59)
  - Pre-fills current date and time for new entries
  - Admin selection dropdown (for super admin - can assign to any admin)
  - Admin ID auto-filled from session (for regular admin)
  - Edit mode: Pre-fills form with existing data
  - Validation errors displayed inline
  - Date error messages shown per form in bulk mode
  - Creates/updates collection via Supabase
  - Logs admin activity on create/update
  - Updates `created_by_admin_id` or `updated_by_admin_id`
- **Testing Requirements:**
  - Form validation (required fields, date range, time range)
  - Bulk entry functionality (add/remove forms)
  - Date validation against CE date range
  - Time validation
  - Edit mode (pre-fill data)
  - Admin selection (super admin vs regular admin)
  - Create/update functionality
  - Activity logging
  - Error message display
  - Success callback (data refresh)

#### **AddExpenseModal**
- **File:** `components/modals/AddExpenseModal.tsx`
- **Purpose:** Modal for adding/editing expenses
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `onSuccess` (function)
  - `categories` (string[]) - Available categories
  - `modes` (string[]) - Available payment modes
  - `editData` (Expense, optional)
  - `festivalId` (string)
  - `festivalStartDate`, `festivalEndDate` (string, optional)
- **Features:**
  - Form fields: Item, Pieces, Price per Piece, Category, Mode, Note, Date, Time
  - Bulk entry support: Add up to 10 expenses at once
  - Auto-calculates total amount: Pieces × Price per Piece
  - Date validation: Must be within CE date range
  - Validation: Pieces >= 1, Price per Piece >= 0
  - Admin selection (super admin vs regular admin)
  - Edit mode support
  - Activity logging
- **Testing Requirements:**
  - Form validation (pieces, price, date range)
  - Total amount calculation accuracy
  - Bulk entry functionality
  - Date validation
  - Edit mode
  - Create/update functionality
  - Activity logging

#### **ManageUserPasswordsModal**
- **File:** `components/modals/ManageUserPasswordsModal.tsx`
- **Purpose:** Modal for managing admin-specific user passwords
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `onSuccess` (function)
  - `adminId` (string) - Admin ID (required)
  - `festivalId` (string)
  - `maxUserPasswords` (number) - Maximum passwords allowed for this admin
- **Features:**
  - Lists all user passwords for the admin
  - Shows: Label, Password (masked, toggle visibility), Status (Active/Inactive), Usage Count, Last Used At, Created At
  - Add new password: Password, Label (auto-generated "Password 1", "Password 2", etc.)
  - Edit password: Change password, label, status
  - Delete password (with confirmation)
  - Activate/Deactivate password
  - Validation:
    - Password must be unique across entire festival
    - Label must be unique per admin
    - Cannot exceed `maxUserPasswords` limit
  - View visitor usage: Click to see which visitors used the password
  - Password visibility toggle (eye icon)
  - Usage statistics display
- **Testing Requirements:**
  - Password list display
  - Add password (with limit enforcement)
  - Edit password functionality
  - Delete password (with confirmation)
  - Activate/Deactivate toggle
  - Uniqueness validation (password across festival, label per admin)
  - Limit enforcement (`maxUserPasswords`)
  - Password visibility toggle
  - Visitor usage display
  - Usage count and last used tracking

#### **EditFestivalModal**
- **File:** `components/modals/EditFestivalModal.tsx`
- **Purpose:** Modal for editing festival basic information and settings
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `onSuccess` (function)
  - `festival` (Festival) - Festival data
- **Features:**
  - Edit: Event name, Organiser, Mentor, Guide, Location
  - Edit: Festival dates (event_start_date, event_end_date)
  - Edit: CE dates (ce_start_date, ce_end_date) - with validation
  - Edit: Banner visibility settings (organiser, guide, mentor, location, dates, duration)
  - Edit: Theme settings (background color, background image URL, dark mode)
  - Edit: Title styling (size, weight, align, color) via `other_data`
  - Date validation: Festival dates must be within CE dates
  - Updates festival in database
  - Activity logging
- **Testing Requirements:**
  - Form fields and validation
  - Date validation (festival dates within CE dates)
  - Banner visibility settings
  - Theme settings
  - Title styling
  - Update functionality
  - Activity logging

#### **CreateAdminModal**
- **File:** `components/modals/CreateAdminModal.tsx`
- **Purpose:** Modal for creating new admin (super admin only)
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `onSuccess` (function)
  - `festivalId` (string)
- **Features:**
  - Form fields: Admin Code, Admin Name, Admin Password, Max User Passwords (default: 3)
  - Validation:
    - Admin code must be unique per festival
    - Admin name must be unique per festival
    - Password required
    - Max user passwords >= 1
  - Creates admin in `admins` table
  - Activity logging
- **Testing Requirements:**
  - Form validation
  - Uniqueness validation (code, name per festival)
  - Admin creation
  - Activity logging
  - Success callback

#### **EditAdminModal**
- **File:** `components/modals/EditAdminModal.tsx`
- **Purpose:** Modal for editing admin details (super admin only)
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `onSuccess` (function)
  - `admin` (Admin) - Admin data to edit
- **Features:**
  - Edit: Admin Name, Admin Password, Max User Passwords, Is Active status
  - Cannot edit admin code (immutable)
  - Validation:
    - Admin name must be unique per festival (if changed)
    - Password required
    - Max user passwords >= 1
    - If reducing max_user_passwords, must ensure current password count doesn't exceed new limit
  - Updates admin in database
  - Activity logging
- **Testing Requirements:**
  - Form pre-fill (existing data)
  - Field editing
  - Uniqueness validation
  - Password limit validation (cannot reduce below current count)
  - Activate/Deactivate toggle
  - Update functionality
  - Activity logging

#### **DeleteAdminModal**
- **File:** `components/modals/DeleteAdminModal.tsx`
- **Purpose:** Confirmation modal for deleting admin (super admin only)
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `onConfirm` (function)
  - `admin` (Admin) - Admin to delete
- **Features:**
  - Shows admin details (code, name)
  - Warning message about cascade deletion (all user passwords will be deleted)
  - Confirmation required
  - Deletes admin (cascades to user_passwords)
  - Activity logging
- **Testing Requirements:**
  - Admin details display
  - Warning message
  - Confirmation functionality
  - Cascade deletion (user passwords)
  - Activity logging
  - Success callback

#### **DeleteConfirmModal**
- **File:** `components/modals/DeleteConfirmModal.tsx`
- **Purpose:** Generic confirmation modal for delete operations
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `onConfirm` (function)
  - `title` (string) - Modal title
  - `message` (string) - Confirmation message
  - `itemName` (string, optional) - Name of item being deleted
- **Features:**
  - Generic confirmation dialog
  - Cancel and Confirm buttons
  - Customizable title and message
- **Testing Requirements:**
  - Modal display
  - Cancel functionality
  - Confirm functionality
  - Message display

#### **AnalyticsConfigModal**
- **File:** `components/modals/AnalyticsConfigModal.tsx`
- **Purpose:** Modal for configuring analytics settings
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `onSuccess` (function)
  - `festivalId` (string)
  - `existingConfig` (AnalyticsConfig, optional)
- **Features:**
  - Collection target amount setting
  - Target visibility (public or admin_only)
  - Previous year data (collection, expense, net balance)
  - Donation buckets configuration
  - Time of day buckets configuration
  - Creates/updates analytics_config record
  - Activity logging
- **Testing Requirements:**
  - Form fields and validation
  - Target visibility settings
  - Buckets configuration
  - Create/update functionality
  - Activity logging

#### **AddEditAlbumModal**
- **File:** `components/modals/AddEditAlbumModal.tsx`
- **Purpose:** Modal for creating/editing albums
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `onSuccess` (function)
  - `festivalId` (string)
  - `album` (Album, optional) - Album data for edit mode
- **Features:**
  - Form fields: Title, Description, Year, Cover Image URL
  - Create/Edit album
  - Activity logging
- **Testing Requirements:**
  - Form validation
  - Create/Edit functionality
  - Activity logging

#### **ManageAlbumMediaModal**
- **File:** `components/modals/ManageAlbumMediaModal.tsx`
- **Purpose:** Modal for managing media items in an album
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `onSuccess` (function)
  - `albumId` (string)
  - `festivalId` (string)
- **Features:**
  - Upload media files (images, videos, PDFs, audio)
  - File type validation
  - File size limits:
    - Videos: 50MB
    - Other files: 15MB
  - Total storage limit: 400MB per festival
  - Drag-and-drop upload
  - File preview
  - Delete media items
  - Thumbnail generation for videos
  - PDF thumbnail placeholder
  - Storage stats display
  - Activity logging
- **Testing Requirements:**
  - File upload functionality
  - File type validation
  - File size validation
  - Storage limit enforcement
  - Drag-and-drop
  - Preview functionality
  - Delete functionality
  - Thumbnail generation
  - Storage stats calculation

#### **MediaViewerModal**
- **File:** `components/modals/MediaViewerModal.tsx`
- **Purpose:** Full-screen media viewer modal
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `mediaItem` (MediaItem) - Media item to display
- **Features:**
  - Displays images (full view)
  - Displays videos (HTML5 video player)
  - Displays PDFs (embedded PDF viewer)
  - Displays audio (HTML5 audio player)
  - Download button
  - Next/Previous navigation (if multiple items)
  - File information (title, size, type)
- **Testing Requirements:**
  - Image display
  - Video playback
  - PDF viewing
  - Audio playback
  - Download functionality
  - Navigation (next/previous)
  - File information display

#### **StorageStatsModal**
- **File:** `components/modals/StorageStatsModal.tsx`
- **Purpose:** Modal showing storage usage statistics
- **Props:**
  - `isOpen` (boolean)
  - `onClose` (function)
  - `festivalId` (string)
- **Features:**
  - Total storage used (bytes, formatted)
  - Storage limit (400MB)
  - Percentage used
  - Storage by type (images, videos, PDFs, audio)
  - Count and size per type
  - Visual progress bar
- **Testing Requirements:**
  - Storage calculation accuracy
  - Percentage calculation
  - Type breakdown
  - Progress bar display
  - Data formatting

### 5.6 Utility Components

#### **Loader**
- **File:** `components/Loader.tsx`
- **Purpose:** Loading skeleton components
- **Components:**
  - `InfoSkeleton` - Basic info loading skeleton
  - `CardSkeleton` - Stats card loading skeleton
  - `TableSkeleton` - Table loading skeleton (rows parameter)
  - `ChartSkeleton` - Chart loading skeleton
- **Testing Requirements:**
  - Skeleton display during loading
  - Appropriate skeleton for each component type

#### **Toggle**
- **File:** `components/Toggle.tsx`
- **Purpose:** Toggle switch component
- **Testing Requirements:**
  - Toggle functionality
  - State persistence
  - Visual feedback

#### **theme-provider**
- **File:** `components/theme-provider.tsx`
- **Purpose:** Theme context provider (dark/light mode)
- **Testing Requirements:**
  - Theme switching
  - Theme persistence
  - Theme application across components

---

## 6. BUSINESS LOGIC & RULES

### 6.1 Date Validation Rules

#### **CE Date Range (Collection/Expense Date Range)**
- **Purpose:** Defines valid date range for adding collections and expenses
- **Rules:**
  - Required fields: `ce_start_date`, `ce_end_date`
  - `ce_end_date` must be >= `ce_start_date`
  - All collection and expense dates must be within this range
  - Festival event dates (if provided) must be within CE date range
  - Enforced by database triggers

#### **Festival Event Dates**
- **Purpose:** Actual festival event dates (optional)
- **Rules:**
  - Optional fields: `event_start_date`, `event_end_date`
  - If provided, must be within CE date range
  - `event_end_date` must be >= `event_start_date`
  - Used for filtering charts and analytics

#### **Transaction Date Validation**
- **Rules:**
  - Collection date must be within CE date range
  - Expense date must be within CE date range
  - Validation happens:
    - Frontend: Form validation before submit
    - Backend: Database trigger validation
  - If validation fails: Error message displayed, transaction not saved

### 6.2 Session Management Rules

#### **Session Expiry**
- **Rule:** Sessions expire at midnight IST (end of current day)
- **Implementation:** 
  - Compares login date (IST) with today's date (IST)
  - Uses `Intl.DateTimeFormat` with timezone 'Asia/Kolkata'
  - If login date != today: Session invalid, user must re-login

#### **Session Invalidation Triggers**
- **Visitor Sessions:**
  - Password deactivated → 5-minute warning, then logout
  - Password updated after login time → Immediate logout
  - Admin who created password deactivated → 5-minute warning, then logout
  - Session date != today (IST) → Immediate logout
- **Admin Sessions:**
  - Admin deactivated → Immediate logout (no warning)
  - Session date != today (IST) → Immediate logout
- **Super Admin Sessions:**
  - Session date != today (IST) → Immediate logout
  - Cannot be deactivated (no deactivation mechanism)

#### **Concurrent Session Handling**
- **Rule:** One device can have one active session per festival
- **Implementation:**
  - Device ID stored with session: `{festivalCode}-{DDMMYYHHMMSS}-{6-char-random}`
  - If same device tries to create new session, shows confirmation dialog
  - If confirmed: Previous session cleared, new session created
  - If cancelled: Previous session remains active

### 6.3 Password Management Rules

#### **User Passwords (Visitor Access)**
- **Rule:** Each admin can create up to `max_user_passwords` user passwords
- **Default:** `max_user_passwords = 3`
- **Constraints:**
  - Password must be unique across entire festival (all admins)
  - Label must be unique per admin
  - Cannot exceed admin's `max_user_passwords` limit
- **Status:**
  - Active: Visitors can use this password
  - Inactive: Visitors cannot use this password (existing sessions show warning)
- **Usage Tracking:**
  - `usage_count`: Increments each time password is used
  - `last_used_at`: Updated each time password is used

#### **Admin Passwords**
- **Rule:** Admin password stored in `admin_password_hash` field (plain text, not hashed)
- **Login:** Admin can use either admin code OR admin name (case-insensitive for name, case-sensitive for code)
- **Validation:** Direct plain text comparison (not bcrypt)

#### **Super Admin Password**
- **Rule:** Stored in `festivals.super_admin_password` field (plain text)
- **Login:** Requires festival code and super admin password
- **Validation:** Direct plain text comparison

### 6.4 Multi-Admin System Rules

#### **Admin Creation (Super Admin Only)**
- **Rule:** Only super admin can create new admins
- **Required Fields:**
  - Admin Code (unique per festival)
  - Admin Name (unique per festival)
  - Admin Password
  - Max User Passwords (default: 3)
- **Constraints:**
  - Admin code must be unique per festival
  - Admin name must be unique per festival
  - Admin code and name are immutable (cannot be changed after creation)

#### **Admin Management**
- **Super Admin Can:**
  - Create admins
  - Edit admin name, password, max_user_passwords, is_active status
  - Delete admins (cascades to user_passwords)
  - Cannot edit admin code
- **Admin Cannot:**
  - Create other admins
  - Edit other admins
  - Delete other admins
  - Access super admin dashboard

#### **Admin Deactivation**
- **Rule:** When admin is deactivated (`is_active = false`):
  - Admin cannot login (credential verification fails)
  - All active admin sessions logged out immediately
  - All user passwords created by this admin become inactive
  - Active visitor sessions using these passwords show 5-minute warning, then logout

### 6.5 Name Validation & Sanitization

#### **Visitor Name Rules**
- **Rule:** Visitor name must be sanitized and validated
- **Validation:**
  - Required field
  - Max length: 50 characters
  - Cannot be only whitespace
  - Sanitization removes HTML tags and special characters
  - Converts to lowercase with hyphens for spaces: "John Doe" → "john-doe"
- **Duplicate Check:**
  - Checks if name already exists in `access_logs` (case-insensitive)
  - If exact match exists: Shows error, suggests adding number/symbol
  - Name is stored in sanitized format

### 6.6 Festival Code Management

#### **Code Generation**
- **Rule:** Festival code generated on creation
- **Format:** 8 uppercase letters (A-Z)
- **Generation:** Random 8-character string
- **Uniqueness:** Checks database, retries up to 5 times if duplicate
- **Storage:** Stored in `festivals.code` field

#### **Code Change (Super Admin Only)**
- **Rule:** Super admin can change festival code
- **Validation:**
  - New code must be 6-12 characters
  - Alphanumeric + hyphens only: `^[a-zA-Z0-9-]{6,12}$`
  - Must be unique across all festivals
- **History Tracking:**
  - Old code stored in `festival_code_history` table
  - Mapping: old_code → new_code
  - Enables backward compatibility (old URLs redirect to new code)

#### **Code Redirect**
- **Rule:** Old codes automatically redirect to new code
- **Implementation:**
  - `CodeRedirectHandler` component checks code on page load
  - Queries `festival_code_history` for old code
  - If found: Redirects to new code, shows success toast
  - If not found and code doesn't exist: Shows error, redirects to home

### 6.7 Storage Management Rules

#### **Storage Limits**
- **Rule:** 400MB total storage limit per festival
- **File Size Limits:**
  - Videos: 50MB per file
  - Other files (images, PDFs, audio): 15MB per file
- **Calculation:**
  - Sum of all `media_items.size_bytes` for festival
  - Displayed as: Total used / 400MB (percentage)
- **Enforcement:**
  - Frontend: Validates before upload
  - Backend: Supabase Storage policies (if configured)

### 6.8 Activity Logging Rules

#### **Access Logging (Visitors)**
- **Trigger:** Visitor login (password authentication)
- **Logged Fields:**
  - Festival ID
  - Visitor Name (sanitized)
  - Access Method ('password_modal' or 'direct_link')
  - Password Used
  - User Password ID
  - Admin ID (who created the password)
  - Session ID
  - IP Address, User Agent (if available)
  - Timestamp
- **Purpose:** Visitor tracking and analytics

#### **Admin Activity Logging**
- **Trigger:** All admin actions
- **Action Types:**
  - `login`, `logout`
  - `create_collection`, `update_collection`, `delete_collection`
  - `create_expense`, `update_expense`, `delete_expense`
  - `create_group`, `delete_group`
  - `create_category`, `delete_category`
  - `create_mode`, `delete_mode`
  - `create_user_password`, `update_user_password`, `delete_user_password`, `activate_user_password`, `deactivate_user_password`
  - `update_festival`, `update_festival_theme`
  - `create_album`, `update_album`, `delete_album`
  - `upload_media`, `delete_media`
  - `update_analytics_config`
  - `create_admin`, `update_admin`, `delete_admin`, `activate_admin`, `deactivate_admin`
  - `change_festival_code`
  - `super_admin_login`
- **Logged Fields:**
  - Festival ID
  - Admin ID (NULL for super_admin actions)
  - Admin Name
  - Action Type
  - Action Details (JSONB)
  - Target Type, Target ID
  - IP Address, User Agent
  - Timestamp

### 6.9 Calculation Rules

#### **Expense Total Amount**
- **Rule:** `total_amount = pieces × price_per_piece`
- **Calculation:**
  - Frontend: Auto-calculated in form
  - Backend: Calculated before insert/update (via trigger or application logic)
- **Validation:**
  - Pieces >= 1
  - Price per piece >= 0
  - Total amount >= 0

#### **Stats Calculations**
- **Total Collection:** Sum of all `collections.amount` for festival
- **Total Expense:** Sum of all `expenses.total_amount` for festival
- **Balance:** Total Collection - Total Expense
- **Number of Donators:** Unique count of `collections.name` for festival

#### **Chart Data Grouping**
- **By Group:** Groups collections by `group_name`, sums amounts
- **By Category:** Groups expenses by `category`, sums total amounts
- **By Mode:** Groups by `mode`, sums amounts
- **By Date:** Groups by date, sums amounts per day
- **Top Donators:** Groups by `name`, sums amounts, sorts descending, takes top N (includes ties)

---

## 7. TESTING SCENARIOS & TEST CASES

### 7.1 Authentication Testing

#### **Visitor Authentication**
1. **Valid Password Login**
   - **Steps:** Enter valid name and password, submit
   - **Expected:** Session created, redirected to festival home, access logged
   - **Verify:** Session in localStorage, access_log entry, password usage_count incremented

2. **Invalid Password**
   - **Steps:** Enter valid name, invalid password, submit
   - **Expected:** Error message "Invalid password", form not submitted

3. **Password Deactivated**
   - **Steps:** Login with active password, admin deactivates password, wait for validation check
   - **Expected:** Warning banner appears, 5-minute countdown, then logout

4. **Password Updated After Login**
   - **Steps:** Login, admin updates password, wait for validation check
   - **Expected:** Immediate logout, message "Your password has been changed. Please login again"

5. **Admin Deactivated (Password Creator)**
   - **Steps:** Login with password, admin who created password is deactivated, wait for validation check
   - **Expected:** Warning banner, 5-minute countdown, then logout

6. **Duplicate Name**
   - **Steps:** Enter name that already exists in access_logs (exact match, case-insensitive), submit
   - **Expected:** Error message suggesting to add number/symbol

7. **Concurrent Session (Same Device)**
   - **Steps:** Already logged in, try to login again on same device
   - **Expected:** Confirmation dialog "Already logged in on this device. Continue will logout previous session"
   - **If confirmed:** Previous session cleared, new session created
   - **If cancelled:** Previous session remains

8. **Session Expiry (IST Midnight)**
   - **Steps:** Login on day 1, wait until midnight IST (or change system date), refresh page
   - **Expected:** Session invalid, password gate shows again

9. **Name Pre-filling (Device-Based)**
   - **Steps:** Login with name "John Doe", logout, login again on same device
   - **Expected:** Name field pre-filled with "john-doe" (sanitized), editable with pencil icon

10. **Direct Link Authentication**
    - **Steps:** Access URL: `/f/{code}?mode=login&p={password}&name={name}`
    - **Expected:** Automatic authentication, session created, query params removed, page reloaded

11. **Password Not Required (Festival Setting)**
    - **Steps:** Access festival with `requires_password = false`
    - **Expected:** Password gate bypassed, direct access

#### **Admin Authentication**
1. **Valid Credentials (Code)**
   - **Steps:** Enter festival code, admin code, password, submit
   - **Expected:** Admin session created, redirected to admin dashboard, activity logged

2. **Valid Credentials (Name)**
   - **Steps:** Enter festival code, admin name (case-insensitive), password, submit
   - **Expected:** Admin session created, redirected to admin dashboard

3. **Invalid Admin Code/Name**
   - **Steps:** Enter invalid admin code/name, submit
   - **Expected:** Error message "Invalid admin code/name or password"

4. **Invalid Password**
   - **Steps:** Enter valid admin code/name, invalid password, submit
   - **Expected:** Error message "Invalid admin code/name or password"

5. **Admin Deactivated**
   - **Steps:** Try to login with deactivated admin credentials
   - **Expected:** Error message "Admin not found" or "Invalid credentials"

6. **Already Logged In**
   - **Steps:** Already have admin session, navigate to admin login page
   - **Expected:** Redirected to admin dashboard

7. **Session Expiry (IST Midnight)**
   - **Steps:** Login on day 1, wait until midnight IST, refresh page
   - **Expected:** Session invalid, redirected to admin login

#### **Super Admin Authentication**
1. **Valid Password**
   - **Steps:** Enter festival code, super admin password, submit
   - **Expected:** Super admin session created, redirected to super admin dashboard, activity logged

2. **Invalid Password**
   - **Steps:** Enter invalid super admin password, submit
   - **Expected:** Error message "Invalid super admin password"

3. **Already Logged In**
   - **Steps:** Already have super admin session, navigate to super admin login page
   - **Expected:** Redirected to super admin dashboard

4. **Session Expiry (IST Midnight)**
   - **Steps:** Login on day 1, wait until midnight IST, refresh page
   - **Expected:** Session invalid, redirected to super admin login

### 7.2 Festival Creation Testing

1. **Valid Festival Creation**
   - **Steps:** Fill all required fields, valid dates, submit
   - **Expected:** Festival created, unique 8-letter code generated, success modal shown with code and URLs

2. **Missing Required Fields**
   - **Steps:** Submit form with missing event name or CE dates
   - **Expected:** Validation errors displayed, form not submitted

3. **Invalid Date Range (CE End < CE Start)**
   - **Steps:** Enter CE end date before CE start date, submit
   - **Expected:** Validation error "End date must be after start date"

4. **Festival Dates Outside CE Range**
   - **Steps:** Enter festival start date before CE start date, submit
   - **Expected:** Validation error "Festival start date must be within Collection/Expense date range"

5. **Password Protection Disabled**
   - **Steps:** Uncheck password protection, confirm warning, submit
   - **Expected:** Festival created with `requires_password = false`, no passwords required

6. **Code Uniqueness**
   - **Steps:** Create festival, code generated, try to create another with same code (manually)
   - **Expected:** System retries up to 5 times, generates new code if duplicate found

7. **Success Modal Functionality**
   - **Steps:** Create festival, success modal appears
   - **Expected:** Code, Public URL, Admin URL displayed, copy buttons work, auto-redirect countdown works, can toggle auto-redirect

### 7.3 Collection Management Testing

1. **Add Single Collection (Valid)**
   - **Steps:** Admin opens Add Collection modal, fills form with valid data within CE date range, submit
   - **Expected:** Collection created, table refreshed, activity logged, `created_by_admin_id` set

2. **Add Collection (Date Outside CE Range)**
   - **Steps:** Try to add collection with date before `ce_start_date` or after `ce_end_date`
   - **Expected:** Validation error displayed, collection not created

3. **Bulk Add Collections (5 at once)**
   - **Steps:** Add 5 collection forms, fill all with valid data, submit
   - **Expected:** All 5 collections created, activity logged for each

4. **Edit Collection**
   - **Steps:** Admin clicks edit on existing collection, modifies data, submit
   - **Expected:** Collection updated, `updated_by_admin_id` set, activity logged

5. **Delete Collection**
   - **Steps:** Admin clicks delete, confirms, submit
   - **Expected:** Collection deleted, table refreshed, activity logged

6. **Time Validation**
   - **Steps:** Try to enter hour > 23 or minute > 59
   - **Expected:** Browser validation prevents invalid values (or custom validation shows error)

7. **Amount Validation**
   - **Steps:** Try to enter negative amount or non-numeric value
   - **Expected:** Validation error displayed

### 7.4 Expense Management Testing

1. **Add Single Expense (Valid)**
   - **Steps:** Admin opens Add Expense modal, fills form with valid data, submit
   - **Expected:** Expense created, total amount calculated correctly (pieces × price), activity logged

2. **Total Amount Calculation**
   - **Steps:** Enter pieces = 5, price per piece = 100, observe total amount field
   - **Expected:** Total amount auto-calculated to 500

3. **Bulk Add Expenses (10 at once)**
   - **Steps:** Add 10 expense forms, fill all, submit
   - **Expected:** All 10 expenses created

4. **Pieces Validation**
   - **Steps:** Try to enter pieces < 1 or non-integer
   - **Expected:** Validation error displayed

5. **Price Validation**
   - **Steps:** Try to enter negative price per piece
   - **Expected:** Validation error displayed

6. **Edit Expense**
   - **Steps:** Edit existing expense, modify pieces or price
   - **Expected:** Total amount recalculated, expense updated, activity logged

7. **Delete Expense**
   - **Steps:** Delete expense with confirmation
   - **Expected:** Expense deleted, activity logged

### 7.5 Admin Management Testing (Super Admin Only)

1. **Create Admin (Valid)**
   - **Steps:** Super admin opens Create Admin modal, enters unique admin code and name, password, max_user_passwords = 5, submit
   - **Expected:** Admin created, listed in admin management section, activity logged

2. **Create Admin (Duplicate Code)**
   - **Steps:** Try to create admin with code that already exists for festival
   - **Expected:** Validation error "Admin code already exists"

3. **Create Admin (Duplicate Name)**
   - **Steps:** Try to create admin with name that already exists for festival
   - **Expected:** Validation error "Admin name already exists"

4. **Edit Admin (Change Password)**
   - **Steps:** Edit admin, change password, submit
   - **Expected:** Admin password updated, admin can login with new password

5. **Edit Admin (Reduce Max User Passwords Below Current Count)**
   - **Steps:** Admin has 5 passwords, try to set max_user_passwords to 3
   - **Expected:** Validation error "Cannot reduce below current password count"

6. **Deactivate Admin**
   - **Steps:** Edit admin, set is_active = false, submit
   - **Expected:** Admin deactivated, cannot login, all user passwords become inactive, active sessions logged out

7. **Delete Admin**
   - **Steps:** Delete admin with confirmation
   - **Expected:** Admin deleted, all user_passwords cascade deleted, activity logged

### 7.6 User Password Management Testing (Admin)

1. **Create User Password (Within Limit)**
   - **Steps:** Admin has max_user_passwords = 3, currently has 2, create new password
   - **Expected:** Password created with auto-generated label "Password 3", listed in modal

2. **Create User Password (Exceeds Limit)**
   - **Steps:** Admin has max_user_passwords = 3, currently has 3, try to create new password
   - **Expected:** Error message "Maximum 3 passwords allowed"

3. **Create User Password (Duplicate Password)**
   - **Steps:** Try to create password that already exists in festival (from any admin)
   - **Expected:** Error message "This password already exists in the festival"

4. **Create User Password (Duplicate Label)**
   - **Steps:** Try to create password with label that already exists for this admin
   - **Expected:** Error message "This label already exists for your passwords"

5. **Edit User Password (Change Password)**
   - **Steps:** Edit password, change password value, submit
   - **Expected:** Password updated, `updated_at` timestamp updated, active visitor sessions invalidated (immediate logout)

6. **Deactivate User Password**
   - **Steps:** Deactivate password, submit
   - **Expected:** Password inactive, visitors cannot use, active sessions show warning, then logout after 5 minutes

7. **Delete User Password**
   - **Steps:** Delete password with confirmation
   - **Expected:** Password deleted, visitors cannot use, active sessions invalidated

8. **View Visitor Usage**
   - **Steps:** Click on password's usage count or "View Usage" button
   - **Expected:** Modal/table shows list of visitors who used this password, with timestamps

### 7.7 Festival Code Change Testing (Super Admin)

1. **Change Code (Valid)**
   - **Steps:** Super admin changes code from "ABCDEFGH" to "NEWCODE12", submit
   - **Expected:** Code updated, history entry created (old_code: "ABCDEFGH", new_code: "NEWCODE12"), success message

2. **Change Code (Invalid Format)**
   - **Steps:** Try to change code to "ABC" (too short) or "ABC@DEF" (invalid characters)
   - **Expected:** Validation error "Code must be 6-12 characters long and contain only alphanumeric characters and hyphens"

3. **Change Code (Duplicate)**
   - **Steps:** Try to change code to one that already exists for another festival
   - **Expected:** Validation error "Code already in use by another festival"

4. **Old Code Redirect**
   - **Steps:** Change code from "OLD" to "NEW", access URL `/f/OLD`
   - **Expected:** Automatic redirect to `/f/NEW`, success toast "Festival code was updated. Redirecting to new code..."

5. **Multiple Code Changes**
   - **Steps:** Change code multiple times, check history
   - **Expected:** All old codes redirect to latest new code via history chain

### 7.8 Analytics & Charts Testing

1. **Collection vs Expense Chart**
   - **Steps:** View collections/expenses page, observe chart
   - **Expected:** Line chart shows collections (green) and expenses (red) over time, tooltips show amounts

2. **Pie Chart (Collections by Group)**
   - **Steps:** View collections page, observe pie chart
   - **Expected:** Pie chart shows groups with percentages, colors assigned, legend displayed

3. **Top Donators Chart**
   - **Steps:** View collections page, observe top donators chart
   - **Expected:** Horizontal bar chart shows top 5 donators (or more if tied), list below shows names, ranks, amounts, avatars

4. **Daily Collection Chart (Date Range)**
   - **Steps:** View collections page, observe daily collection chart
   - **Expected:** Bar chart shows daily collections within festival date range (if provided), or last 30 days (if not)

5. **Analytics Configuration**
   - **Steps:** Super admin configures analytics (target amount, buckets), save
   - **Expected:** Analytics config saved, charts update to use custom buckets

6. **Target Visibility (Admin Only)**
   - **Steps:** Set target visibility to "admin_only", view analytics page as visitor
   - **Expected:** Target progress not shown to visitor, only to admin

### 7.9 Media Showcase Testing

1. **Create Album**
   - **Steps:** Admin creates album with title, description, year, cover URL
   - **Expected:** Album created, displayed in showcase grid

2. **Upload Media (Image)**
   - **Steps:** Open album, upload image file (< 15MB)
   - **Expected:** Image uploaded, thumbnail generated, displayed in album

3. **Upload Media (Video)**
   - **Steps:** Upload video file (< 50MB)
   - **Expected:** Video uploaded, thumbnail generated from first second, displayed

4. **Upload Media (Exceeds Size Limit)**
   - **Steps:** Try to upload file > 15MB (non-video) or > 50MB (video)
   - **Expected:** Validation error, file not uploaded

5. **Upload Media (Exceeds Total Storage)**
   - **Steps:** Upload files until total exceeds 400MB, try to upload another
   - **Expected:** Validation error "Storage limit reached", file not uploaded

6. **View Media (Image)**
   - **Steps:** Click on image in album
   - **Expected:** Full-screen image viewer opens, download button available

7. **View Media (Video)**
   - **Steps:** Click on video in album
   - **Expected:** Video player opens, playback controls, download button

8. **Download Media**
   - **Steps:** Click download button on media item
   - **Expected:** File downloads with original filename

9. **Bulk Download**
   - **Steps:** Select multiple media items, click "Download All"
   - **Expected:** All selected files download sequentially (with 500ms delay between each)

10. **Delete Media**
    - **Steps:** Delete media item from album
    - **Expected:** Media deleted, storage stats updated, activity logged

### 7.10 Session Validation Testing

1. **Periodic Validation (30 seconds)**
   - **Steps:** Login as visitor, wait 30 seconds, check network requests
   - **Expected:** Validation check runs every 30 seconds, queries database for password/admin status

2. **Password Deactivation During Session**
   - **Steps:** Login, admin deactivates password, wait for next validation check
   - **Expected:** Warning banner appears, 5-minute countdown, then logout

3. **Admin Deactivation During Session**
   - **Steps:** Login as admin, super admin deactivates admin, wait for next validation check
   - **Expected:** Immediate logout (no warning), redirected to login

4. **Session Date Validation (IST)**
   - **Steps:** Login at 11:30 PM IST, wait until 12:01 AM IST, refresh page
   - **Expected:** Session invalid (date changed), password gate shows

5. **Session Validation Failure (Network Error)**
   - **Steps:** Login, disconnect network, wait for validation check
   - **Expected:** Validation fails gracefully, session remains (fail-open to avoid locking users out)

### 7.11 Error Handling Testing

1. **Network Error (Fetch Failure)**
   - **Steps:** Disconnect network, try to fetch data
   - **Expected:** Error message displayed, user notified, page remains functional

2. **Database Error (Insert Failure)**
   - **Steps:** Try to insert data with invalid foreign key or constraint violation
   - **Expected:** Error message displayed with details, operation not completed

3. **Invalid Festival Code**
   - **Steps:** Access `/f/INVALIDCODE`
   - **Expected:** Error message "Festival not found", redirect to home or view page

4. **Missing Required Fields**
   - **Steps:** Submit form with missing required fields
   - **Expected:** Validation errors displayed inline, form not submitted

5. **Unauthorized Access**
   - **Steps:** Try to access admin page without admin session
   - **Expected:** Redirected to admin login page

6. **Race Condition (Session Validation)**
   - **Steps:** Login, immediately change password, wait for validation
   - **Expected:** No flash of protected content, validation catches change, session invalidated

### 7.12 UI/UX Testing

1. **Responsive Design (Mobile)**
   - **Steps:** View application on mobile device (< 768px width)
   - **Expected:** All components responsive, tables scrollable, bottom nav visible, text readable

2. **Responsive Design (Tablet)**
   - **Steps:** View application on tablet (768px - 1024px width)
   - **Expected:** Layout adapts, components properly sized

3. **Responsive Design (Desktop)**
   - **Steps:** View application on desktop (> 1024px width)
   - **Expected:** Full layout, all features accessible, optimal spacing

4. **Dark Mode**
   - **Steps:** Enable dark theme for festival, view pages
   - **Expected:** Dark theme applied, text readable, contrast appropriate, all components themed

5. **Theme Customization (Background Color)**
   - **Steps:** Change festival background color, view pages
   - **Expected:** Background color applied across all festival pages

6. **Theme Customization (Background Image)**
   - **Steps:** Set background image URL, view pages
   - **Expected:** Background image displayed, covers page, doesn't interfere with content readability

7. **Loading States**
   - **Steps:** Navigate between pages, observe loading
   - **Expected:** Skeleton loaders displayed, smooth transitions, no blank screens

8. **Toast Notifications**
   - **Steps:** Perform actions (create, update, delete), observe notifications
   - **Expected:** Success/error toasts appear, auto-dismiss after delay, positioned correctly

9. **Modal Functionality**
   - **Steps:** Open/close modals, test keyboard (ESC to close)
   - **Expected:** Modals open/close smoothly, ESC key closes modal, backdrop click closes (if configured)

10. **Form Validation Feedback**
    - **Steps:** Fill forms with invalid data, observe feedback
    - **Expected:** Inline error messages displayed, fields highlighted, submit button disabled if errors

### 7.13 Performance Testing

1. **Large Dataset (1000+ Collections)**
   - **Steps:** Create festival with 1000+ collections, view collections page
   - **Expected:** Page loads within reasonable time (< 3 seconds), pagination works, filters work, charts render

2. **Large Dataset (1000+ Expenses)**
   - **Steps:** Create festival with 1000+ expenses, view expenses page
   - **Expected:** Page loads within reasonable time, pagination works, calculations accurate

3. **Multiple Charts on Page**
   - **Steps:** View analytics page with multiple charts
   - **Expected:** All charts render, no performance degradation, smooth interactions

4. **Bulk Entry Performance**
   - **Steps:** Add 10 expenses via bulk entry, submit
   - **Expected:** All expenses created within reasonable time, no timeout errors

5. **Session Validation Performance**
   - **Steps:** Login, monitor validation checks over time
   - **Expected:** Validation checks complete within 1 second, no performance impact

### 7.14 Security Testing

1. **XSS Prevention (Name Sanitization)**
   - **Steps:** Try to enter name with HTML/script tags: `<script>alert('XSS')</script>`
   - **Expected:** Name sanitized, tags removed, stored as plain text

2. **SQL Injection Prevention**
   - **Steps:** Try to enter SQL in form fields: `'; DROP TABLE collections; --`
   - **Expected:** Input treated as literal text, no SQL execution, Supabase parameterized queries prevent injection

3. **CSRF Protection**
   - **Steps:** Attempt to perform actions without proper session
   - **Expected:** Actions rejected, proper error messages, no unauthorized operations

4. **Session Hijacking Prevention**
   - **Steps:** Try to access localStorage session data from different origin
   - **Expected:** Browser security prevents cross-origin access (if applicable)

5. **Password Visibility**
   - **Steps:** Check if passwords stored in plain text are visible in network requests
   - **Expected:** Passwords sent over HTTPS (if deployed), but stored as plain text (by design - not production-grade security)

6. **Admin Privilege Escalation**
   - **Steps:** Regular admin tries to access super admin routes
   - **Expected:** Redirected or access denied, proper error messages

7. **Unauthorized Data Access**
   - **Steps:** Try to access data from another festival using valid session from different festival
   - **Expected:** Data filtered by festival_id, no cross-festival data leakage

---

## 8. EDGE CASES & ERROR SCENARIOS

### 8.1 Date Edge Cases

1. **CE Date Range Not Set**
   - **Scenario:** Festival created without CE dates (legacy data or error)
   - **Expected:** Date validation shows error "Collection/Expense date range not set for this festival"

2. **Festival Dates Not Set**
   - **Scenario:** Festival has CE dates but no event dates
   - **Expected:** Charts use CE date range, basic info shows "N/A" for festival dates

3. **Transactions Outside Date Range (Legacy Data)**
   - **Scenario:** Collections/expenses exist with dates outside CE range (from before range was set)
   - **Expected:** Transactions display but marked as out-of-range, cannot edit/delete without fixing date first

4. **Same Date for Start and End (CE Dates)**
   - **Scenario:** CE start date equals CE end date (single day range)
   - **Expected:** Transactions can only be added for that single date, validation works correctly

5. **Timezone Edge Cases (IST Boundary)**
   - **Scenario:** Login at 11:59 PM IST, session should expire at 12:00 AM IST
   - **Expected:** Session expires correctly at midnight IST, not UTC

6. **Daylight Saving Time (IST doesn't have DST, but test for consistency)**
   - **Scenario:** Login across different dates, verify IST calculation
   - **Expected:** IST timezone handling consistent (IST is UTC+5:30, no DST)

### 8.2 Session Edge Cases

1. **Multiple Tabs with Same Session**
   - **Scenario:** Open festival in multiple browser tabs, logout in one tab
   - **Expected:** Other tabs detect session cleared, redirect to login/password gate

2. **Session Storage Corruption**
   - **Scenario:** Manually corrupt localStorage session data, try to use application
   - **Expected:** Application detects invalid session format, clears corrupted data, shows login/password gate

3. **Session Without Device ID (Legacy Sessions)**
   - **Scenario:** Old session exists without deviceId field
   - **Expected:** Application handles gracefully, generates device ID on next login

4. **Concurrent Login from Different Devices**
   - **Scenario:** Login on device A, then login on device B with same name
   - **Expected:** Both sessions valid (different device IDs), each device has its own session

5. **Session Validation Race Condition**
   - **Scenario:** Password changed during page load, before validation check runs
   - **Expected:** Loading state prevents content flash, validation catches change after load

### 8.3 Password Management Edge Cases

1. **Password Limit Reduction (Below Current Count)**
   - **Scenario:** Admin has 5 passwords, max_user_passwords reduced to 3
   - **Expected:** Validation prevents reduction, error message "Cannot reduce below current password count"

2. **All Passwords Deactivated**
   - **Scenario:** Admin deactivates all their user passwords
   - **Expected:** Visitors cannot login, existing sessions show warning, then logout

3. **Password with Special Characters**
   - **Scenario:** Create password with special characters: `P@ssw0rd!@#`
   - **Expected:** Password accepted, stored correctly, works for login

4. **Very Long Password**
   - **Scenario:** Create password with 100 characters
   - **Expected:** Password accepted (or validated against max length), works for login

5. **Password Used by Multiple Visitors**
   - **Scenario:** Same password used by 50+ visitors
   - **Expected:** All visitors can login, usage_count increments correctly, last_used_at updates

6. **Password Updated While Visitors Active**
   - **Scenario:** Admin updates password, 10 visitors are currently logged in
   - **Expected:** All active sessions invalidated on next validation check, immediate logout

### 8.4 Admin Management Edge Cases

1. **Delete Admin with Active Visitor Sessions**
   - **Scenario:** Delete admin who has active visitor sessions using their passwords
   - **Expected:** All user passwords cascade deleted, visitor sessions invalidated on next check

2. **Deactivate Admin with Many User Passwords**
   - **Scenario:** Deactivate admin who has max_user_passwords = 10, all 10 are active
   - **Expected:** All passwords become inactive, visitors see warning, then logout

3. **Admin Code/Name Case Sensitivity**
   - **Scenario:** Create admin with code "ADM01", try to login with "adm01" (lowercase)
   - **Expected:** Code login is case-sensitive, fails. Name login is case-insensitive, works if name matches

4. **Admin with No User Passwords**
   - **Scenario:** Create admin, never create any user passwords
   - **Expected:** Admin can still login, can create passwords up to max_user_passwords limit

5. **Max User Passwords Set to 0**
   - **Scenario:** Try to set max_user_passwords to 0
   - **Expected:** Validation prevents this, error "Max user passwords must be at least 1"

### 8.5 Data Integrity Edge Cases

1. **Festival Deletion (Cascade)**
   - **Scenario:** Delete festival with 1000+ collections, expenses, albums, admins
   - **Expected:** All related data cascade deleted correctly, no orphaned records

2. **Foreign Key Constraint Violations**
   - **Scenario:** Try to create collection with invalid festival_id
   - **Expected:** Database constraint error, application shows user-friendly error message

3. **Duplicate Code During Creation**
   - **Scenario:** Two users create festivals simultaneously, same code generated
   - **Expected:** Database unique constraint catches duplicate, one succeeds, one gets new code (retry logic)

4. **Empty Festival (No Data)**
   - **Scenario:** Create festival, never add any collections or expenses
   - **Expected:** Pages display correctly with "No data" messages, charts show empty states, stats show zeros

5. **Very Large Numbers**
   - **Scenario:** Enter collection amount of 999999999.99 (maximum DECIMAL(10,2))
   - **Expected:** Amount accepted, calculations work correctly, currency formatting displays correctly

6. **Unicode Characters in Names**
   - **Scenario:** Enter collection name with Unicode: "आभार ₹1000"
   - **Expected:** Name stored correctly, displayed correctly, search works

### 8.6 Media & Storage Edge Cases

1. **Storage at Limit (Exactly 400MB)**
   - **Scenario:** Upload files until total is exactly 400MB, try to upload one more byte
   - **Expected:** Validation prevents upload, error "Storage limit reached"

2. **Storage Calculation (Files Deleted)**
   - **Scenario:** Upload 50MB of files, delete 20MB, check storage stats
   - **Expected:** Storage stats update correctly, shows 30MB used, 370MB available

3. **Multiple File Types in Same Album**
   - **Scenario:** Upload images, videos, PDFs, audio files to same album
   - **Expected:** All file types display correctly, filters work, download works for each type

4. **Very Large Video File (Approaching 50MB Limit)**
   - **Scenario:** Upload video file of 49.9MB
   - **Expected:** File uploads successfully, thumbnail generated, storage stats updated

5. **Corrupted Media File**
   - **Scenario:** Upload corrupted image/video file
   - **Expected:** Upload succeeds (if size valid), display/playback may fail gracefully, error handling

6. **Media Deletion (Album Cascade)**
   - **Scenario:** Delete album with 100+ media items
   - **Expected:** All media items cascade deleted, storage freed, stats updated

### 8.7 Chart & Analytics Edge Cases

1. **Zero Data (Empty Festival)**
   - **Scenario:** View charts with no collections or expenses
   - **Expected:** Charts show "No data available" message, no errors

2. **Single Data Point**
   - **Scenario:** Festival has only 1 collection and 1 expense
   - **Expected:** Charts render correctly with single data point, percentages are 100%

3. **Equal Values (Tie in Top Donators)**
   - **Scenario:** Multiple donators have exact same total amount, all equal to 5th place amount
   - **Expected:** All tied donators shown, chart includes all, list shows all with same rank

4. **Negative Balance**
   - **Scenario:** Total expenses exceed total collections
   - **Expected:** Balance shows negative (red color), stats card displays negative value correctly

5. **Very Large Amounts**
   - **Scenario:** Collection amounts in crores (₹1,00,00,000+)
   - **Expected:** Currency formatting displays correctly, charts scale appropriately, calculations accurate

6. **Date Range with No Transactions**
   - **Scenario:** Festival has CE dates, but no transactions in that range
   - **Expected:** Charts show empty data, no errors, proper empty state messages

### 8.8 Network & Performance Edge Cases

1. **Slow Network Connection**
   - **Scenario:** Simulate slow 3G network, perform data operations
   - **Expected:** Loading indicators shown, operations complete, no timeout errors

2. **Network Interruption During Upload**
   - **Scenario:** Upload large file, disconnect network mid-upload
   - **Expected:** Upload fails gracefully, error message displayed, partial file not saved

3. **Multiple Rapid Requests**
   - **Scenario:** Rapidly click "Add Collection" button multiple times
   - **Expected:** Only one request processed, or debouncing prevents duplicate submissions

4. **Large Pagination (1000+ records)**
   - **Scenario:** View collections page with 1000+ records, navigate through all pages
   - **Expected:** Pagination works correctly, page navigation responsive, data loads correctly

5. **Concurrent Edits**
   - **Scenario:** Two admins edit same collection simultaneously
   - **Expected:** Last update wins, or proper conflict resolution, activity logged correctly

### 8.9 Browser & Compatibility Edge Cases

1. **localStorage Disabled**
   - **Scenario:** Browser has localStorage disabled
   - **Expected:** Application detects, shows error message, falls back gracefully (if possible)

2. **Old Browser (No Modern Features)**
   - **Scenario:** Access application in browser without Intl API support
   - **Expected:** IST date calculation falls back to manual calculation, or error handled gracefully

3. **Browser Back/Forward Navigation**
   - **Scenario:** Navigate pages, use browser back button, forward button
   - **Expected:** Pages load correctly, session persists, data refreshes if needed

4. **Browser Refresh During Operation**
   - **Scenario:** Start adding collection, refresh page before submit
   - **Expected:** Form data lost (expected behavior), user can re-enter

5. **Multiple Browser Windows**
   - **Scenario:** Open festival in multiple windows, perform actions in different windows
   - **Expected:** All windows stay in sync (if using same session), or handle independently

---

## 9. TEST DATA REQUIREMENTS

### 9.1 Minimum Test Data Set

#### **Festival Test Data**
- At least 3 festivals:
  1. **Festival A:** Password protected, multi-admin enabled, with CE dates, event dates, theme settings
  2. **Festival B:** No password protection, single admin (legacy), minimal data
  3. **Festival C:** Full features: collections, expenses, albums, analytics config, all admins

#### **Collection Test Data**
- At least 50 collections per festival:
  - Various amounts (₹100 to ₹1,00,000+)
  - Various groups (at least 5 different groups)
  - Various modes (Cash, Online, UPI, etc.)
  - Dates spanning full CE date range
  - Some with time (hour/minute), some without
  - Some with notes, some without
  - Some with images, some without
  - Multiple collections from same donor (for top donators chart)

#### **Expense Test Data**
- At least 30 expenses per festival:
  - Various items (at least 10 different items)
  - Various categories (at least 5 different categories)
  - Various modes
  - Various pieces (1 to 100+)
  - Various prices (₹10 to ₹10,000+)
  - Dates spanning full CE date range
  - Some with time, some without
  - Some with notes, some without

#### **Admin Test Data**
- At least 5 admins per festival (for multi-admin testing):
  - Admin 1: max_user_passwords = 3, has 3 active passwords, 1 inactive
  - Admin 2: max_user_passwords = 5, has 2 passwords
  - Admin 3: max_user_passwords = 10, has 0 passwords (new admin)
  - Admin 4: max_user_passwords = 3, is_active = false (deactivated)
  - Admin 5: max_user_passwords = 1, has 1 password at limit

#### **User Password Test Data**
- At least 10 user passwords across all admins:
  - Various labels ("Password 1", "Guest Password", "VIP Access", etc.)
  - Various usage counts (0 to 100+)
  - Mix of active and inactive
  - Some with recent last_used_at, some never used

#### **Access Log Test Data**
- At least 100 access log entries:
  - Various visitor names (including duplicates, Unicode, special characters)
  - Both access methods (password_modal, direct_link)
  - Various passwords used
  - Dates spanning multiple days
  - Mix of current day and previous days (for session expiry testing)

#### **Album & Media Test Data**
- At least 3 albums per festival:
  - Album 1: Images only (10+ images)
  - Album 2: Mixed media (images, videos, PDFs, audio)
  - Album 3: Videos only (5+ videos)
- Storage usage: At least 50MB used (for storage limit testing)

#### **Analytics Config Test Data**
- Analytics config for at least 1 festival:
  - Collection target amount set
  - Target visibility: both "public" and "admin_only" tested
  - Previous year data configured
  - Donation buckets configured (at least 5 buckets)
  - Time of day buckets configured (at least 4 buckets: Morning, Afternoon, Evening, Night)

### 9.2 Test User Accounts

#### **Super Admin Test Accounts**
- Super Admin 1: Password "SuperAdmin123" (for Festival A)
- Super Admin 2: Password "TestSuperAdmin" (for Festival B)

#### **Admin Test Accounts**
- Admin A1: Code "ADM01", Name "Admin One", Password "admin123"
- Admin A2: Code "ADM02", Name "Admin Two", Password "admin456"
- Admin A3: Code "TEST", Name "Test Admin", Password "test123", is_active = false (deactivated)
- Admin B1: Code "LEGACY", Name "Legacy Admin", Password "legacy" (for Festival B - single admin)

#### **Visitor Test Accounts (User Passwords)**
- Password "GUEST123" (Label: "Guest Password", Admin: A1, Active, Usage: 5)
- Password "VIP2024" (Label: "VIP Access", Admin: A1, Active, Usage: 20)
- Password "TESTPW" (Label: "Test Password", Admin: A2, Inactive, Usage: 0)
- Password "SINGLE" (Label: "Single Use", Admin: A5, Active, Usage: 1, at limit)

### 9.3 Edge Case Test Data

#### **Special Characters Test Data**
- Collection name: "Test's Collection ₹1000 & More!"
- Visitor name: "जॉन-डो" (Unicode)
- Admin name: "Admin-O'Neil"
- Festival code: "TEST-CODE"

#### **Boundary Value Test Data**
- Collection amount: ₹0.01 (minimum)
- Collection amount: ₹99,99,99,999.99 (maximum DECIMAL(10,2))
- Expense pieces: 1 (minimum)
- Expense pieces: 999999 (large value)
- Date: CE start date (boundary)
- Date: CE end date (boundary)

#### **Large Dataset Test Data**
- Festival with 1000+ collections (for performance testing)
- Festival with 1000+ expenses (for performance testing)
- Admin with 10 user passwords (at max limit)
- Album with 100+ media items

---

## 10. INTEGRATION TESTING

### 10.1 Database Integration

1. **Supabase Connection**
   - **Test:** Verify Supabase client initializes correctly
   - **Verify:** Environment variables loaded, connection established

2. **Row Level Security (RLS) Policies**
   - **Test:** Verify RLS policies allow public read/write (by design)
   - **Verify:** Data isolation by festival_id in queries

3. **Database Triggers**
   - **Test:** Insert collection with date outside CE range
   - **Verify:** Trigger prevents insertion, error returned

4. **Database Functions (RPC)**
   - **Test:** Call `log_festival_access` with valid parameters
   - **Verify:** Log entry created, UUID returned
   - **Test:** Call `verify_admin_credentials` with valid/invalid credentials
   - **Verify:** Returns correct JSON response

5. **Cascade Deletes**
   - **Test:** Delete festival with related data
   - **Verify:** All related records deleted (admins, collections, expenses, albums, etc.)

### 10.2 API Integration (Supabase)

1. **Collection CRUD Operations**
   - **Test:** Create, read, update, delete collection via Supabase client
   - **Verify:** Operations succeed, data persisted, activity logged

2. **Query Performance**
   - **Test:** Query collections with filters, sorting, pagination
   - **Verify:** Queries complete within acceptable time (< 1 second for 1000 records)

3. **Transaction Support**
   - **Test:** Bulk insert 10 collections in single operation
   - **Verify:** All inserted or all failed (atomicity)

4. **Storage Integration (Supabase Storage)**
   - **Test:** Upload file to Supabase Storage bucket
   - **Verify:** File uploaded, URL returned, accessible

### 10.3 External Service Integration

1. **Date/Time Services (Browser Intl API)**
   - **Test:** Verify IST timezone calculation using Intl.DateTimeFormat
   - **Verify:** Correct date returned for 'Asia/Kolkata' timezone

2. **Clipboard API (Copy to Clipboard)**
   - **Test:** Copy festival code to clipboard
   - **Verify:** Code copied, paste works

3. **File API (Media Upload)**
   - **Test:** Upload file using File API
   - **Verify:** File read, validated, uploaded

---

## 11. ACCESSIBILITY TESTING

### 11.1 Keyboard Navigation

1. **Tab Navigation**
   - **Test:** Navigate through forms using Tab key
   - **Expected:** Focus moves logically, all interactive elements accessible

2. **Form Submission**
   - **Test:** Submit forms using Enter key
   - **Expected:** Forms submit correctly

3. **Modal Navigation**
   - **Test:** Open modal, navigate with Tab, close with ESC
   - **Expected:** Focus trapped in modal, ESC closes modal

4. **Table Navigation**
   - **Test:** Navigate table rows with keyboard
   - **Expected:** Rows accessible, edit/delete actions accessible

### 11.2 Screen Reader Compatibility

1. **ARIA Labels**
   - **Test:** Use screen reader (NVDA/JAWS/VoiceOver) to navigate
   - **Expected:** All interactive elements have labels, tables have headers

2. **Form Labels**
   - **Test:** Verify all form inputs have associated labels
   - **Expected:** Labels properly associated, screen reader announces labels

3. **Error Messages**
   - **Test:** Form validation errors
   - **Expected:** Screen reader announces errors, errors associated with fields

### 11.3 Visual Accessibility

1. **Color Contrast**
   - **Test:** Verify text contrast meets WCAG AA standards
   - **Expected:** Contrast ratio >= 4.5:1 for normal text, >= 3:1 for large text

2. **Color Independence**
   - **Test:** Verify information not conveyed by color alone
   - **Expected:** Error states use icons/text in addition to color

3. **Focus Indicators**
   - **Test:** Verify visible focus indicators on all interactive elements
   - **Expected:** Clear focus outline visible on keyboard navigation

---

## 12. BROWSER COMPATIBILITY TESTING

### 12.1 Supported Browsers

#### **Desktop Browsers**
- Chrome (Latest 2 versions) ✅
- Firefox (Latest 2 versions) ✅
- Safari (Latest 2 versions) ✅
- Edge (Latest 2 versions) ✅

#### **Mobile Browsers**
- Chrome Mobile (Android) ✅
- Safari Mobile (iOS) ✅
- Samsung Internet ✅

### 12.2 Browser-Specific Testing

1. **Chrome**
   - **Test:** All features, localStorage, Intl API
   - **Expected:** Full functionality

2. **Firefox**
   - **Test:** All features, localStorage, Intl API
   - **Expected:** Full functionality

3. **Safari**
   - **Test:** Intl API, localStorage, date handling
   - **Expected:** IST timezone calculation works correctly

4. **Mobile Browsers**
   - **Test:** Touch interactions, responsive design, bottom nav
   - **Expected:** Touch-friendly, responsive, navigation works

### 12.3 Feature Detection

1. **localStorage Support**
   - **Test:** Check if localStorage available before using
   - **Expected:** Graceful fallback or error message if unavailable

2. **Intl API Support**
   - **Test:** Check Intl.DateTimeFormat support
   - **Expected:** Fallback to manual IST calculation if unavailable

3. **File API Support**
   - **Test:** Check File API for media uploads
   - **Expected:** Upload disabled or error message if unavailable

---

## 13. KNOWN ISSUES & LIMITATIONS

### 13.1 Security Considerations

1. **Plain Text Passwords**
   - **Issue:** Passwords stored as plain text in database
   - **Reason:** By design - check-only system, not production-grade security
   - **Impact:** Low (internal use application)
   - **Testing Note:** Verify passwords stored and retrieved correctly

2. **No HTTPS Enforcement (Development)**
   - **Issue:** Application may run on HTTP in development
   - **Impact:** Passwords transmitted in plain text over network
   - **Testing Note:** Verify HTTPS in production deployment

3. **No Rate Limiting**
   - **Issue:** No rate limiting on login attempts or API calls
   - **Impact:** Potential brute force attacks
   - **Testing Note:** Verify application handles rapid requests gracefully

### 13.2 Functional Limitations

1. **Session Duration (Fixed to 1 Day)**
   - **Issue:** Sessions always expire at midnight IST, cannot customize duration
   - **Impact:** Users must re-login daily
   - **Testing Note:** Verify IST midnight expiry works correctly

2. **No Password Reset**
   - **Issue:** No "forgot password" functionality
   - **Impact:** Lost passwords require admin intervention
   - **Testing Note:** Verify admin can reset passwords manually

3. **No Export Functionality**
   - **Issue:** No CSV/Excel export for collections/expenses
   - **Impact:** Manual data extraction required
   - **Testing Note:** Verify data can be accessed via database if needed

4. **Storage Limit (400MB)**
   - **Issue:** Hard-coded 400MB limit per festival
   - **Impact:** Cannot upload more media once limit reached
   - **Testing Note:** Verify limit enforced, error messages clear

5. **No Multi-Language Support**
   - **Issue:** Application only in English
   - **Impact:** Limited accessibility for non-English users
   - **Testing Note:** Verify Unicode characters in data handled correctly

### 13.3 Performance Considerations

1. **Large Dataset Loading**
   - **Issue:** Loading 1000+ records may be slow
   - **Mitigation:** Pagination implemented, filters reduce data
   - **Testing Note:** Verify pagination works, acceptable load times

2. **Chart Rendering (Many Data Points)**
   - **Issue:** Charts may be slow with 1000+ data points
   - **Mitigation:** Date range filtering, aggregation
   - **Testing Note:** Verify charts render within acceptable time

3. **Bulk Entry Limits**
   - **Issue:** Limited to 5 collections or 10 expenses per bulk entry
   - **Impact:** Large imports require multiple operations
   - **Testing Note:** Verify bulk entry limits work correctly

### 13.4 Browser Limitations

1. **localStorage Size Limit**
   - **Issue:** localStorage typically limited to 5-10MB
   - **Impact:** Large session data may exceed limit
   - **Testing Note:** Verify session data size is reasonable (< 10KB)

2. **File Upload Size (Browser)**
   - **Issue:** Browser may have memory limits for large file uploads
   - **Impact:** Very large files (> 50MB) may fail
   - **Testing Note:** Verify file size validation works

---

## 14. TEST ENVIRONMENT SETUP

### 14.1 Prerequisites

#### **Software Requirements**
- Node.js 18+ installed
- pnpm package manager installed
- Git installed
- Supabase account and project created
- Modern web browser (Chrome/Firefox/Safari/Edge)

#### **Environment Variables**
- `.env.local` file with:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon public key

#### **Database Setup**
1. Run all SQL migration files in order:
   - `SQL/supabase-schema.sql` (base schema)
   - `SQL/supabase-migration-multifestive.sql` (multi-festival)
   - `SQL/supabase-migration-date-password-fields.sql` (date fields)
   - `SQL/supabase-migration-access-logging.sql` (access logging)
   - `SQL/supabase-migration-multi-admin-system.sql` (multi-admin)
   - `SQL/supabase-migration-showcase.sql` (media showcase)
   - `SQL/supabase-migration-analytics-config-v2.sql` (analytics)
   - `SQL-new/001-FIX-ADMIN-LOGIN-PASSWORD-VERIFICATION.sql` (admin login fix)

2. Verify tables created:
   - `festivals`, `collections`, `expenses`, `admins`, `user_passwords`, `access_logs`, `admin_activity_log`, `albums`, `media_items`, `groups`, `categories`, `collection_modes`, `expense_modes`, `analytics_config`, `donation_buckets`, `time_of_day_buckets`, `festival_code_history`

3. Verify RPC functions exist:
   - `log_festival_access`
   - `log_admin_activity`
   - `verify_admin_credentials`
   - `get_admin_by_code_or_name`

### 14.2 Test Data Seeding

#### **Script to Create Test Festivals**
```sql
-- Create test festivals
INSERT INTO festivals (code, event_name, ce_start_date, ce_end_date, requires_password, user_password, admin_password, super_admin_password)
VALUES 
  ('TESTFEST', 'Test Festival', '2024-01-01', '2024-12-31', true, 'visitor123', 'admin123', 'super123'),
  ('PUBLIC', 'Public Festival', '2024-01-01', '2024-12-31', false, null, 'admin123', 'super123');
```

#### **Script to Create Test Admins**
```sql
-- Create test admins for TESTFEST
INSERT INTO admins (festival_id, admin_code, admin_name, admin_password_hash, max_user_passwords)
SELECT id, 'ADM01', 'Admin One', 'admin123', 3 FROM festivals WHERE code = 'TESTFEST';
```

#### **Script to Create Test User Passwords**
```sql
-- Create test user passwords
INSERT INTO user_passwords (admin_id, festival_id, password, label, is_active)
SELECT a.admin_id, a.festival_id, 'GUEST123', 'Guest Password', true
FROM admins a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'TESTFEST' AND a.admin_code = 'ADM01';
```

### 14.3 Development Server Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Start Development Server**
   ```bash
   pnpm dev
   ```

3. **Verify Server Running**
   - Open browser: `http://localhost:3000`
   - Verify home page loads
   - Verify no console errors

### 14.4 Test Execution

#### **Manual Testing**
- Follow test scenarios in Section 7
- Document results, note any deviations
- Report bugs with steps to reproduce

#### **Automated Testing (Future)**
- Unit tests: `pnpm test`
- E2E tests: `pnpm run test:e2e`
- E2E UI: `pnpm run test:e2e:ui`

---

## 15. BUG REPORTING TEMPLATE

### 15.1 Bug Report Format

```markdown
**Bug ID:** [Unique identifier]
**Severity:** [Critical/High/Medium/Low]
**Priority:** [P0/P1/P2/P3]
**Status:** [New/In Progress/Fixed/Closed]

**Title:** [Brief description]

**Description:**
[Detailed description of the bug]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]
...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Chrome/Firefox/Safari/Edge] [Version]
- OS: [Windows/Mac/Linux/iOS/Android] [Version]
- Device: [Desktop/Mobile/Tablet]
- Festival Code: [If applicable]
- User Role: [Visitor/Admin/Super Admin]

**Screenshots/Logs:**
[Attach screenshots, console logs, network logs]

**Additional Context:**
[Any other relevant information]
```

### 15.2 Severity Guidelines

#### **Critical (P0)**
- Application crashes or becomes unusable
- Data loss or corruption
- Security vulnerabilities
- Complete feature failure

#### **High (P1)**
- Major feature partially broken
- Significant data integrity issues
- Authentication failures
- Performance degradation (> 5 seconds load time)

#### **Medium (P2)**
- Minor feature issues
- UI/UX problems
- Non-critical validation errors
- Cosmetic issues

#### **Low (P3)**
- Typos in text
- Minor styling issues
- Enhancement suggestions
- Documentation issues

---

## 16. TESTING CHECKLIST

### 16.1 Pre-Testing Checklist

- [ ] Development server running (`pnpm dev`)
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Test data seeded
- [ ] Browser console clear of errors
- [ ] Network tab shows successful API calls

### 16.2 Functional Testing Checklist

#### **Authentication**
- [ ] Visitor login with valid password
- [ ] Visitor login with invalid password
- [ ] Admin login with code
- [ ] Admin login with name
- [ ] Super admin login
- [ ] Session expiry (IST midnight)
- [ ] Session invalidation (password/admin deactivated)

#### **Festival Creation**
- [ ] Create festival with all required fields
- [ ] Create festival with optional fields
- [ ] Validate date ranges
- [ ] Validate password requirements
- [ ] Code generation and uniqueness

#### **Collection Management**
- [ ] Add single collection
- [ ] Add bulk collections (5)
- [ ] Edit collection
- [ ] Delete collection
- [ ] Date validation (CE range)
- [ ] Filter, sort, search, paginate

#### **Expense Management**
- [ ] Add single expense
- [ ] Add bulk expenses (10)
- [ ] Edit expense
- [ ] Delete expense
- [ ] Total amount calculation
- [ ] Date validation

#### **Admin Management (Super Admin)**
- [ ] Create admin
- [ ] Edit admin
- [ ] Delete admin
- [ ] Activate/Deactivate admin
- [ ] Change max_user_passwords

#### **User Password Management**
- [ ] Create password (within limit)
- [ ] Create password (exceeds limit)
- [ ] Edit password
- [ ] Delete password
- [ ] Activate/Deactivate password
- [ ] View visitor usage

#### **Media Showcase**
- [ ] Create album
- [ ] Upload images
- [ ] Upload videos
- [ ] Upload PDFs
- [ ] Upload audio files
- [ ] Delete media
- [ ] Storage limit enforcement

#### **Analytics**
- [ ] View all charts
- [ ] Configure analytics settings
- [ ] Target visibility (public/admin_only)
- [ ] Donation buckets
- [ ] Time of day buckets

### 16.3 Non-Functional Testing Checklist

#### **Performance**
- [ ] Page load time < 3 seconds
- [ ] Chart rendering < 2 seconds
- [ ] Large dataset handling (1000+ records)
- [ ] Bulk entry performance

#### **Security**
- [ ] XSS prevention (name sanitization)
- [ ] SQL injection prevention
- [ ] Session security
- [ ] Password handling
- [ ] Data isolation (festival_id filtering)

#### **Accessibility**
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast
- [ ] Focus indicators

#### **Browser Compatibility**
- [ ] Chrome (desktop & mobile)
- [ ] Firefox (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Edge (desktop)

#### **Responsive Design**
- [ ] Mobile view (< 768px)
- [ ] Tablet view (768px - 1024px)
- [ ] Desktop view (> 1024px)

---

## 17. ACCEPTANCE CRITERIA

### 17.1 Core Functionality

✅ **Festival Management**
- Users can create festivals with unique codes
- Festival code validation and generation works correctly
- Festival settings (dates, passwords, themes) can be configured
- Festival code can be changed (super admin only) with history tracking

✅ **Multi-Admin System**
- Super admin can create multiple admins per festival
- Each admin can create up to `max_user_passwords` user passwords
- Admin credentials verified correctly (code/name + password)
- Admin deactivation works correctly with session invalidation

✅ **Visitor Access**
- Visitors can login with user passwords provided by admins
- Visitor sessions expire at midnight IST
- Visitor access tracked and logged
- Name sanitization and duplicate prevention works

✅ **Collection & Expense Tracking**
- Collections and expenses can be added, edited, deleted (admin only)
- Date validation enforces CE date range
- Bulk entry supports 5 collections or 10 expenses
- All CRUD operations logged in activity log

✅ **Analytics & Charts**
- All charts render correctly with data
- Analytics configuration works
- Target visibility settings enforced
- Custom buckets (donation, time of day) work

✅ **Media Showcase**
- Albums can be created and managed
- Media files can be uploaded (images, videos, PDFs, audio)
- Storage limit (400MB) enforced
- Media viewer works for all file types

### 17.2 Data Integrity

✅ **Database Constraints**
- All foreign key relationships enforced
- Unique constraints enforced (codes, passwords, labels)
- Cascade deletes work correctly
- Date validation triggers work

✅ **Data Isolation**
- Festival data isolated by `festival_id`
- No cross-festival data leakage
- Admin can only manage their own passwords
- Visitor can only see their own activity

### 17.3 Security

✅ **Authentication**
- All authentication flows work correctly
- Sessions validated every 30 seconds
- Session invalidation works on password/admin changes
- IST timezone session expiry works correctly

✅ **Input Validation**
- Name sanitization prevents XSS
- Date validation prevents invalid dates
- Password validation enforces uniqueness
- Form validation prevents invalid data submission

### 17.4 Performance

✅ **Load Times**
- Page load time < 3 seconds (for typical data: 100-500 records)
- Chart rendering < 2 seconds
- Large dataset handling (1000+ records) with pagination
- Bulk operations complete within 5 seconds

✅ **Responsiveness**
- UI remains responsive during data operations
- Loading indicators shown during async operations
- No blocking operations

### 17.5 User Experience

✅ **Responsive Design**
- Application works on mobile, tablet, desktop
- Bottom navigation accessible on mobile
- Tables scrollable on small screens
- Forms usable on touch devices

✅ **Error Handling**
- Clear error messages displayed
- Validation errors shown inline
- Network errors handled gracefully
- User-friendly error messages (not technical)

✅ **Accessibility**
- Keyboard navigation works
- Screen reader compatible (basic)
- Focus indicators visible
- Color contrast meets minimum standards

---

## 18. TESTING DELIVERABLES

### 18.1 Test Reports

1. **Test Execution Report**
   - Test cases executed
   - Pass/fail status
   - Bugs found
   - Test coverage percentage

2. **Bug Report**
   - All bugs documented with severity
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/logs

3. **Performance Report**
   - Load time measurements
   - Chart rendering times
   - Large dataset performance
   - Network request analysis

### 18.2 Test Data

1. **Test Database Snapshot**
   - Test festivals created
   - Test data seeded
   - Known test credentials documented

2. **Test Scripts**
   - SQL scripts for test data
   - Manual test case scripts
   - E2E test scenarios (if automated)

### 18.3 Documentation

1. **Testing Guide**
   - How to set up test environment
   - How to execute tests
   - How to report bugs

2. **Known Issues Log**
   - All known limitations documented
   - Workarounds provided
   - Future enhancements noted

---

## 19. SIGN-OFF CRITERIA

### 19.1 Testing Complete When

✅ **All Critical & High Priority Test Cases Pass**
- 100% of P0 (Critical) test cases pass
- 95%+ of P1 (High) test cases pass
- Remaining P1 issues have workarounds documented

✅ **Core Functionality Verified**
- Festival creation works
- Multi-admin system works
- Authentication works (all three types)
- CRUD operations work
- Analytics & charts work
- Media showcase works

✅ **Data Integrity Verified**
- No data loss or corruption
- All constraints enforced
- Cascade deletes work
- Data isolation verified

✅ **Performance Acceptable**
- Page load times acceptable
- Large dataset handling works
- No memory leaks
- No blocking operations

✅ **Security Verified**
- XSS prevention works
- SQL injection prevention works
- Session security verified
- Authentication security verified

✅ **Browser Compatibility Verified**
- Works on Chrome, Firefox, Safari, Edge
- Works on mobile browsers
- Responsive design verified

### 19.2 Sign-Off Approval

**Tested By:** [Tester Name]  
**Date:** [Date]  
**Status:** [Pass/Fail/With Issues]  
**Notes:** [Any additional notes]

**Approved By:** [Stakeholder Name]  
**Date:** [Date]  
**Status:** [Approved/Not Approved]  
**Comments:** [Any comments]

---

## 20. APPENDIX

### 20.1 Glossary

- **CE Dates:** Collection/Expense date range - Required date range for transactions
- **Festival Code:** Unique 8-letter identifier for each festival
- **Visitor:** User who accesses festival with user password (view-only)
- **Admin:** User who can manage festival data (CRUD operations)
- **Super Admin:** User with full control including admin management
- **User Password:** Password created by admin for visitor access
- **Admin Password:** Password for admin login
- **Session:** Client-side authentication state stored in localStorage
- **IST:** Indian Standard Time (UTC+5:30)
- **RLS:** Row Level Security (Supabase database security)

### 20.2 Abbreviations

- **CRUD:** Create, Read, Update, Delete
- **XSS:** Cross-Site Scripting
- **SQL:** Structured Query Language
- **UUID:** Universally Unique Identifier
- **API:** Application Programming Interface
- **RPC:** Remote Procedure Call
- **JSON:** JavaScript Object Notation
- **JSONB:** Binary JSON (PostgreSQL)
- **HTTPS:** Hypertext Transfer Protocol Secure
- **WCAG:** Web Content Accessibility Guidelines
- **ARIA:** Accessible Rich Internet Applications

### 20.3 File Structure Reference

```
donation-book/
├── app/                      # Next.js App Router pages
│   ├── create/              # Festival creation page
│   ├── view/                # Festival code entry page
│   ├── f/[code]/            # Festival routes (dynamic)
│   │   ├── page.tsx         # Festival home/dashboard
│   │   ├── collection/      # Collections page
│   │   ├── expense/         # Expenses page
│   │   ├── transaction/     # Transactions page
│   │   ├── analytics/       # Analytics page
│   │   ├── showcase/        # Media showcase page
│   │   ├── activity/        # Activity log page
│   │   └── admin/           # Admin routes
│   │       ├── login/       # Admin login
│   │       ├── page.tsx     # Admin dashboard
│   │       ├── activity/    # Admin activity log
│   │       └── sup/         # Super admin routes
│   │           ├── login/   # Super admin login
│   │           ├── dashboard/ # Super admin dashboard
│   │           ├── analytics/ # Super admin analytics
│   │           └── activity/  # Super admin activity log
├── components/              # React components
│   ├── charts/             # Chart components
│   ├── tables/             # Table components
│   ├── modals/             # Modal components
│   ├── ui/                 # shadcn/ui components
│   ├── PasswordGate.tsx    # Visitor authentication
│   ├── AdminPasswordGate.tsx # Admin authentication
│   └── SuperAdminPasswordGate.tsx # Super admin authentication
├── lib/                    # Utilities and helpers
│   ├── hooks/              # Custom React hooks
│   ├── supabase.ts         # Supabase client
│   ├── utils.ts            # Utility functions
│   ├── theme.ts            # Theme utilities
│   ├── sanitize.ts         # Input sanitization
│   ├── sessionValidator.ts # Session validation
│   └── festivalCodeRedirect.ts # Code redirect logic
├── types/                  # TypeScript type definitions
│   └── index.ts            # All type definitions
├── SQL/                    # Database migration files
│   ├── supabase-schema.sql # Base schema
│   └── supabase-migration-*.sql # Migration files
├── SQL-new/                # New migration files
│   └── 001-FIX-ADMIN-LOGIN-PASSWORD-VERIFICATION.sql
└── public/                 # Static assets
```

### 20.4 Key Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `next.config.mjs` - Next.js configuration
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - shadcn/ui configuration
- `.eslintrc.json` - ESLint configuration
- `jest.config.js` - Jest test configuration
- `jest.setup.js` - Jest setup and mocks
- `playwright.config.ts` - Playwright E2E test configuration

### 20.5 Database Migration Order

1. `supabase-schema.sql` - Base tables and structure
2. `supabase-migration-multifestive.sql` - Multi-festival support
3. `supabase-migration-date-password-fields.sql` - Date fields
4. `supabase-migration-access-logging.sql` - Access logging
5. `supabase-migration-showcase.sql` - Media showcase
6. `supabase-migration-multi-admin-system.sql` - Multi-admin system
7. `supabase-migration-analytics-config-v2.sql` - Analytics configuration
8. `SQL-new/001-FIX-ADMIN-LOGIN-PASSWORD-VERIFICATION.sql` - Admin login fix

### 20.6 API Endpoints (Supabase RPC Functions)

- `log_festival_access(p_festival_id, p_visitor_name, p_access_method, p_password_used, p_session_id, p_user_password_id)` → UUID
- `log_admin_activity(p_festival_id, p_admin_id, p_action_type, p_action_details, p_target_type, p_target_id)` → UUID
- `verify_admin_credentials(p_festival_code, p_admin_code_or_name, p_password)` → JSON
- `get_admin_by_code_or_name(p_festival_id, p_admin_code_or_name)` → Admin record

### 20.7 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### 20.8 Default Test Credentials

**Festival Code:** TESTFEST  
**Visitor Password:** GUEST123  
**Admin Code:** ADM01  
**Admin Name:** Admin One  
**Admin Password:** admin123  
**Super Admin Password:** super123

---

## 21. TESTING TIMELINE & MILESTONE

### 21.1 Testing Phases

#### **Phase 1: Setup & Preparation (Day 1)**
- [ ] Environment setup
- [ ] Database migrations applied
- [ ] Test data seeded
- [ ] Test accounts created
- [ ] Test environment verified

#### **Phase 2: Core Functionality Testing (Days 2-3)**
- [ ] Authentication testing (all types)
- [ ] Festival creation testing
- [ ] Collection/Expense CRUD testing
- [ ] Admin management testing
- [ ] User password management testing

#### **Phase 3: Advanced Features Testing (Days 4-5)**
- [ ] Analytics & charts testing
- [ ] Media showcase testing
- [ ] Theme customization testing
- [ ] Activity logging testing
- [ ] Session management testing

#### **Phase 4: Edge Cases & Error Handling (Day 6)**
- [ ] Edge case scenarios
- [ ] Error handling testing
- [ ] Boundary value testing
- [ ] Concurrent operation testing

#### **Phase 5: Non-Functional Testing (Day 7)**
- [ ] Performance testing
- [ ] Security testing
- [ ] Accessibility testing
- [ ] Browser compatibility testing
- [ ] Responsive design testing

#### **Phase 6: Bug Fixes & Retesting (Days 8-10)**
- [ ] Bug fixes applied
- [ ] Regression testing
- [ ] Critical bug retesting
- [ ] Final verification

### 21.2 Milestones

- **Milestone 1:** Test environment ready ✅
- **Milestone 2:** Core functionality tested ✅
- **Milestone 3:** Advanced features tested ✅
- **Milestone 4:** All edge cases covered ✅
- **Milestone 5:** Non-functional testing complete ✅
- **Milestone 6:** All critical bugs fixed ✅
- **Milestone 7:** Sign-off approval ✅

---

## 22. CONTACT & SUPPORT

### 22.1 Testing Support

**For Testing Questions:**
- Refer to this document first
- Check codebase documentation in `docs-new/` folder
- Review SQL migration files for database structure

**For Bug Reports:**
- Use bug reporting template (Section 15)
- Include all required information
- Attach screenshots/logs

**For Technical Issues:**
- Check console logs for errors
- Check network tab for failed requests
- Verify database migrations applied correctly
- Verify environment variables configured

---

## END OF DOCUMENT

**Document Version:** 1.0  
**Last Updated:** 2026-01-09  
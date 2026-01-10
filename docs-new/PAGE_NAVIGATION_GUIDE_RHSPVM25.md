# Page Navigation Guide for Festival Code: RHSPVM25

This document lists all available pages for festival code **RHSPVM25** organized by access level.

---

## 🌐 Public Pages (No Festival Code Required)

### 1. **Landing Page**
- **URL:** `http://localhost:3000/`
- **Path:** `/`
- **Purpose:** Home page with links to view or create festivals
- **Features:**
  - Festival overview and features
  - Links to "View a Festival" and "Create a Festival"
  - No authentication required

### 2. **View Festival Page**
- **URL:** `http://localhost:3000/view`
- **Path:** `/view`
- **Purpose:** Enter festival code to navigate to festival
- **Features:**
  - Festival code input form
  - Code validation
  - Redirects to `/f/{code}` on success
  - No authentication required

### 3. **Create Festival Page**
- **URL:** `http://localhost:3000/create`
- **Path:** `/create`
- **Purpose:** Create a new festival with unique code
- **Features:**
  - Festival creation form
  - Event name, organiser, dates, location
  - Password settings (visitor, admin, super admin)
  - Theme customization (background color, image)
  - Auto-generates 8-letter festival code
  - No authentication required

---

## 👤 Visitor Pages (Festival Code: RHSPVM25)

**Base URL:** `http://localhost:3000/f/RHSPVM25`

**Note:** All visitor pages require festival code 'RHSPVM25' and are protected by `PasswordGate` component. If password is required, users must login with visitor password and name.

### 1. **Festival Dashboard / Home Page** 🏠
- **URL:** `http://localhost:3000/f/RHSPVM25`
- **Path:** `/f/RHSPVM25`
- **Access:** Visitor (password-protected)
- **Features:**
  - Festival basic info (name, organiser, dates, location)
  - Statistics cards (Total Collection, Total Expense, Number of Donators, Balance)
  - Recent transactions (collections + expenses combined)
  - Links to detailed pages
  - Password gate if password required
  - Theme customization support
  - Global session bar at bottom
  - Bottom navigation bar

### 2. **Collection Page** 💰
- **URL:** `http://localhost:3000/f/RHSPVM25/collection`
- **Path:** `/f/RHSPVM25/collection`
- **Access:** Visitor (password-protected)
- **Features:**
  - Full collection history table
  - Filters: Group, Mode
  - Search by donator name
  - Sort options: Latest, Oldest, Highest, Lowest, Name (A-Z)
  - Pagination (default 20 items per page)
  - Charts:
    - Collection vs Expense (line chart, time-filterable)
    - Collections by Group (pie chart)
    - Collections by Mode (pie chart)
    - Daily Collection (bar chart, last 30 days)
    - Top 5 Donators (horizontal bar chart + list)

### 3. **Expense Page** 💸
- **URL:** `http://localhost:3000/f/RHSPVM25/expense`
- **Path:** `/f/RHSPVM25/expense`
- **Access:** Visitor (password-protected)
- **Features:**
  - Full expense history table
  - Filters: Category, Mode
  - Search by item name
  - Sort options: Latest, Oldest, Highest, Lowest, Name (A-Z)
  - Pagination (default 20 items per page)
  - Charts:
    - Collection vs Expense (line chart)
    - Expenses by Category (pie chart)
    - Expenses by Mode (pie chart)
    - Daily Expense (bar chart, last 30 days)
    - Top 8 Most Expensive Items (bar chart)

### 4. **Transaction Page** 📊
- **URL:** `http://localhost:3000/f/RHSPVM25/transaction`
- **Path:** `/f/RHSPVM25/transaction`
- **Access:** Visitor (password-protected)
- **Features:**
  - Combined view of collections and expenses
  - Transaction type badges (Collection/Expense)
  - Filter by mode
  - Search functionality
  - Sort options
  - Pagination
  - All analytics charts from both collection and expense pages
  - Daily net balance chart (collections vs expenses)

### 5. **Analytics Page** 📈
- **URL:** `http://localhost:3000/f/RHSPVM25/analytics`
- **Path:** `/f/RHSPVM25/analytics`
- **Access:** Visitor (password-protected)
- **Features:**
  - Public-facing analytics
  - Configurable display (controlled by `analytics_config`):
    - Donation buckets analysis
    - Time-of-day analysis
    - Top expenses (if enabled)
    - Daily net balance chart
  - Chart visibility based on admin configuration

### 6. **Showcase / Media Gallery Page** 🖼️
- **URL:** `http://localhost:3000/f/RHSPVM25/showcase`
- **Path:** `/f/RHSPVM25/showcase`
- **Access:** Visitor (password-protected)
- **Features:**
  - Album selection and viewing
  - Filter media by type: All, Image, Video, Audio, PDF, Other
  - View media in modal (images, videos, PDFs)
  - Download individual media files
  - Bulk download (multiple files)
  - Storage usage display
  - Thumbnail generation
  - Media viewer modal with navigation

### 7. **Activity Page (Visitor's Own Activity)** 📝
- **URL:** `http://localhost:3000/f/RHSPVM25/activity`
- **Path:** `/f/RHSPVM25/activity`
- **Access:** Visitor (password-protected, shows only visitor's own activity)
- **Features:**
  - Two tabs:
    1. **Login History:** Visitor's own login/logout history
    2. **Transaction Activity:** Collections/expenses created by visitor
  - Search and filter functionality
  - Pagination
  - Note: Admins are automatically redirected to `/f/RHSPVM25/admin/activity`
  - Note: Super admins are automatically redirected to `/f/RHSPVM25/admin/sup/activity`

---

## 🔐 Admin Pages (Festival Code: RHSPVM25)

**Base URL:** `http://localhost:3000/f/RHSPVM25/admin`

**Note:** All admin pages are protected by `AdminPasswordGate` component. Requires admin login with festival code, admin code/name, and admin password.

### 1. **Admin Login Page** 🔑
- **URL:** `http://localhost:3000/f/RHSPVM25/admin/login`
- **Path:** `/f/RHSPVM25/admin/login`
- **Access:** Public (login form)
- **Features:**
  - Festival code input (auto-filled from URL)
  - Admin code or name input
  - Admin password input
  - Login button
  - Error messages for invalid credentials
  - Redirects to admin dashboard on success
  - Creates `AdminSession` in localStorage

### 2. **Admin Dashboard / Management Page** ⚙️
- **URL:** `http://localhost:3000/f/RHSPVM25/admin`
- **Path:** `/f/RHSPVM25/admin`
- **Access:** Admin (password-protected)
- **Features:**
  - **Festival Information:**
    - Edit basic info (name, organiser, dates, location, theme)
    - Theme customization (background color, background image, text colors, dark mode)
    - Password management (visitor passwords)
  
  - **Collection Management:**
    - Add single or bulk collections (up to 5 items)
    - Edit collections
    - Delete collections
    - View all collections with filters, search, sort, pagination
  
  - **Expense Management:**
    - Add single or bulk expenses (up to 10 items)
    - Edit expenses
    - Delete expenses
    - View all expenses with filters, search, sort, pagination
  
  - **Settings Management:**
    - Groups (collection groups) - Add, Delete
    - Categories (expense categories) - Add, Delete
    - Collection Modes - Add, Delete
    - Expense Modes - Add, Delete
  
  - **Media Management:**
    - Albums - Create, Edit, Delete
    - Media items - Upload (images, videos, PDFs), Delete, Bulk download
    - Storage stats and limits (400MB cap)
  
  - **User Password Management:**
    - Add user passwords (up to `max_user_passwords` limit)
    - Edit user passwords
    - Activate/Deactivate user passwords
    - Delete user passwords
    - View password usage statistics
  
  - **Analytics Configuration:**
    - Configure donation buckets
    - Configure time-of-day buckets
    - Show/hide analytics targets
    - Customize public analytics display

### 3. **Admin Activity Page** 📋
- **URL:** `http://localhost:3000/f/RHSPVM25/admin/activity`
- **Path:** `/f/RHSPVM25/admin/activity`
- **Access:** Admin (password-protected)
- **Features:**
  - Admin's own login/logout history
  - Admin's transaction activity (collections/expenses they created)
  - Filter and search functionality
  - Pagination
  - Admin activity logs with metadata

---

## 👑 Super Admin Pages (Festival Code: RHSPVM25)

**Base URL:** `http://localhost:3000/f/RHSPVM25/admin/sup`

**Note:** All super admin pages are protected by `SuperAdminPasswordGate` component. Requires super admin login with festival code and super admin password.

### 1. **Super Admin Login Page** 🔐
- **URL:** `http://localhost:3000/f/RHSPVM25/admin/sup/login`
- **Path:** `/f/RHSPVM25/admin/sup/login`
- **Access:** Public (login form)
- **Features:**
  - Festival code input (auto-filled from URL)
  - Super admin password input
  - Login button
  - Error messages for invalid credentials
  - Redirects to super admin dashboard on success
  - Creates `SuperAdminSession` in localStorage

### 2. **Super Admin Dashboard** 🎯
- **URL:** `http://localhost:3000/f/RHSPVM25/admin/sup/dashboard`
- **Path:** `/f/RHSPVM25/admin/sup/dashboard`
- **Access:** Super Admin (password-protected)
- **Features:**
  - Full admin capabilities plus:
    - Admin management (Create, Edit, Delete admins)
    - Admin activity logs (all admins' activities)
    - System-wide analytics
    - Festival code change with history tracking
    - All super admin exclusive features

### 3. **Super Admin Analytics Page** 📊
- **URL:** `http://localhost:3000/f/RHSPVM25/admin/sup/analytics`
- **Path:** `/f/RHSPVM25/admin/sup/analytics`
- **Access:** Super Admin (password-protected)
- **Features:**
  - Advanced analytics with detailed breakdowns
  - All charts and visualizations
  - Super admin exclusive analytics

### 4. **Super Admin Analytics Overview** 📈
- **URL:** `http://localhost:3000/f/RHSPVM25/admin/sup/analytics-overview`
- **Path:** `/f/RHSPVM25/admin/sup/analytics-overview`
- **Access:** Super Admin (password-protected)
- **Features:**
  - High-level analytics overview
  - Key metrics summary
  - Quick access to detailed analytics

### 5. **Super Admin Expense Analytics** 💸
- **URL:** `http://localhost:3000/f/RHSPVM25/admin/sup/expense-analytics`
- **Path:** `/f/RHSPVM25/admin/sup/expense-analytics`
- **Access:** Super Admin (password-protected)
- **Features:**
  - Detailed expense analytics
  - Expense trends and patterns
  - Category and mode breakdowns
  - Time-based analysis

### 6. **Super Admin Transaction Analytics** 📊
- **URL:** `http://localhost:3000/f/RHSPVM25/admin/sup/transaction-analytics`
- **Path:** `/f/RHSPVM25/admin/sup/transaction-analytics`
- **Access:** Super Admin (password-protected)
- **Features:**
  - Combined transaction analytics
  - Collection vs expense trends
  - Net balance analysis
  - Transaction patterns

### 7. **Super Admin Activity Page** 📋
- **URL:** `http://localhost:3000/f/RHSPVM25/admin/sup/activity`
- **Path:** `/f/RHSPVM25/admin/sup/activity`
- **Access:** Super Admin (password-protected)
- **Features:**
  - Super admin login/logout history
  - All admin activities (system-wide)
  - All transaction activities
  - Comprehensive activity logs with metadata
  - Filter and search functionality
  - Pagination

---

## 📱 Navigation Components

### Bottom Navigation Bar (Visitor Pages Only)
- **Location:** Fixed at bottom of screen (mobile-first)
- **Links:**
  - Home (`/f/RHSPVM25`)
  - Collection (`/f/RHSPVM25/collection`)
  - Transaction (`/f/RHSPVM25/transaction`)
  - Expense (`/f/RHSPVM25/expense`)
  - Analytics (`/f/RHSPVM25/analytics`)
  - Showcase (`/f/RHSPVM25/showcase`)
- **Note:** Only visible on visitor-level pages

### Global Session Bar
- **Location:** Fixed at bottom of screen (above bottom nav)
- **Features:**
  - Shows current session info (visitor/admin/super admin)
  - Login time display
  - Buttons:
    - View Activity (redirects to appropriate activity page)
    - Admin Dashboard (if admin/super admin)
    - Logout
  - Session warning banner (for expiring sessions)

---

## 🔄 Page Access Flow

### Visitor Flow
1. Enter festival code → `/view` → `/f/RHSPVM25`
2. If password required → PasswordGate shows login form
3. Enter name + password → Login → Access dashboard
4. Navigate via BottomNav or direct URLs to:
   - Collection, Expense, Transaction, Analytics, Showcase, Activity

### Admin Flow
1. Navigate to `/f/RHSPVM25/admin/login`
2. Enter festival code, admin code/name, admin password
3. Login → Redirects to `/f/RHSPVM25/admin` (dashboard)
4. Full CRUD access to all data

### Super Admin Flow
1. Navigate to `/f/RHSPVM25/admin/sup/login`
2. Enter festival code, super admin password
3. Login → Redirects to `/f/RHSPVM25/admin/sup/dashboard`
4. Full access + admin management + system settings

---

## 📋 Quick Reference Checklist for Testing

### Public Pages
- [ ] `/` - Landing page
- [ ] `/view` - View festival code input
- [ ] `/create` - Create festival form

### Visitor Pages (with RHSPVM25)
- [ ] `/f/RHSPVM25` - Festival dashboard/home
- [ ] `/f/RHSPVM25/collection` - Collection history + charts
- [ ] `/f/RHSPVM25/expense` - Expense history + charts
- [ ] `/f/RHSPVM25/transaction` - Combined transactions + charts
- [ ] `/f/RHSPVM25/analytics` - Public analytics
- [ ] `/f/RHSPVM25/showcase` - Media gallery
- [ ] `/f/RHSPVM25/activity` - Visitor's own activity

### Admin Pages (with RHSPVM25)
- [ ] `/f/RHSPVM25/admin/login` - Admin login
- [ ] `/f/RHSPVM25/admin` - Admin dashboard (full CRUD)
- [ ] `/f/RHSPVM25/admin/activity` - Admin activity logs

### Super Admin Pages (with RHSPVM25)
- [ ] `/f/RHSPVM25/admin/sup/login` - Super admin login
- [ ] `/f/RHSPVM25/admin/sup/dashboard` - Super admin dashboard
- [ ] `/f/RHSPVM25/admin/sup/analytics` - Super admin analytics
- [ ] `/f/RHSPVM25/admin/sup/analytics-overview` - Analytics overview
- [ ] `/f/RHSPVM25/admin/sup/expense-analytics` - Expense analytics
- [ ] `/f/RHSPVM25/admin/sup/transaction-analytics` - Transaction analytics
- [ ] `/f/RHSPVM25/admin/sup/activity` - Super admin activity logs

---

## 🎯 Key Interactions to Test

### On Each Page:
1. **Navigation** - All links work correctly
2. **Responsive Design** - Test on desktop, tablet, mobile
3. **Loading States** - Verify skeleton loaders appear
4. **Error Handling** - Test with invalid data
5. **Form Validation** - All form fields validate correctly
6. **Theme Customization** - Colors, images, dark mode apply correctly
7. **Session Management** - Global session bar shows correct info
8. **Authentication** - Password gates work correctly

### Specific Features:
- **Tables:** Filter, sort, search, pagination
- **Charts:** Render correctly, respond to filters, show tooltips
- **Modals:** Open/close, form submission, validation
- **Media:** Upload, view, download (single & bulk)
- **CRUD:** Create, Read, Update, Delete operations
- **Date Validation:** CE date range enforcement

---

**Festival Code:** RHSPVM25  
**Base URL:** http://localhost:3000  
**Generated:** 2026-01-10

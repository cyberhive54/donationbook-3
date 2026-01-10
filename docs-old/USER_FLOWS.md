# Donation Book - Complete User Flows

This document outlines the three main user flows in the Donation Book application.

---

## 🎯 Three Main User Flows

1. **Viewing Flow** - Regular users accessing an existing festival
2. **Creating Flow** - Creating a new festival
3. **Admin Flow** - Festival administrators managing data

---

## 1️⃣ VIEWING FLOW (Regular Users)

### Entry Points:
- Direct URL: `https://yourapp.com/f/ABCD1234`
- Via homepage: `https://yourapp.com` → Click "View a Festival"

### Step-by-Step Flow:

#### A. Via Homepage
\`\`\`
1. User lands on: /
   - Sees hero section with app description
   - Two main buttons: "View a Festival" | "Create a Festival"
   - Features section below
   - Footer

2. User clicks "View a Festival"
   - Redirects to: /view

3. On /view page:
   - Simple centered card
   - Input field: "Enter festival code"
   - Placeholder: "Enter festival code (e.g., 8 letters)"
   - Button: "Continue"

4. User enters code (e.g., ABCD1234)
   - Code auto-converts to UPPERCASE
   - Clicks "Continue"
   - Redirects to: /f/ABCD1234
\`\`\`

#### B. Direct URL Access
\`\`\`
1. User receives URL: https://yourapp.com/f/ABCD1234
2. User clicks link
3. Lands directly on: /f/ABCD1234
\`\`\`

### Password Gate (If Required):

\`\`\`
IF festival.requires_user_password = TRUE:
  
  1. PasswordGate component shows:
     - Centered modal overlay
     - Festival name displayed
     - Password input field
     - "Submit" button
     - Error message if wrong password
  
  2. User enters password
  
  3. System checks:
     - Password matches festival.user_password
     - Creates daily session in localStorage
     - Session key: userPasswordAuth:ABCD1234
     - Session includes token from user_password_updated_at
  
  4. If correct:
     - Modal closes
     - Dashboard loads
     - Session valid until:
       * End of day (midnight)
       * OR password is changed by admin
  
  5. If incorrect:
     - Error message: "Incorrect password"
     - User can retry

ELSE (password not required):
  - Dashboard loads immediately
  - No password gate shown
\`\`\`

### Dashboard View (/f/[code]):

\`\`\`
User sees:

1. HEADER SECTION:
   - Festival basic info card
     * Event name (with custom styling)
     * Organiser, Guide, Mentor
     * Location
     * Event dates

2. STATS CARDS (4 cards in grid):
   - Total Collection (green)
   - Total Expense (red)
   - Number of Donators
   - Balance (Collection - Expense)

3. RECENT TRANSACTIONS TABLE:
   - Last 7 transactions (collections + expenses combined)
   - Columns: Type | Name/Item | Amount | Date
   - Type badge: Green for collection, Red for expense
   - "View All" link → /f/ABCD1234/transaction

4. RECENT COLLECTIONS TABLE:
   - Last 7 collections
   - Columns: Name | Amount | Group | Date
   - "View All" link → /f/ABCD1234/collection

5. RECENT EXPENSES TABLE:
   - Last 7 expenses
   - Columns: Item | Total Amount | Category | Date
   - "View All" link → /f/ABCD1234/expense

6. BOTTOM NAVIGATION (Fixed at bottom):
   - Home icon → /f/ABCD1234
   - Collections icon → /f/ABCD1234/collection
   - Expenses icon → /f/ABCD1234/expense
   - Transactions icon → /f/ABCD1234/transaction
   - Showcase icon → /f/ABCD1234/showcase
\`\`\`

### Navigation to Other Pages:

#### Collections Page (/f/[code]/collection):
\`\`\`
Features:
- Full collections table with pagination
- Filters: Group, Mode
- Sort: Latest, Oldest, Highest, Lowest, Name
- Search by name
- Charts:
  * Collection vs Expense timeline
  * Collections by group (pie chart)
  * Collections by mode (pie chart)
  * Daily collection trends (bar chart)
  * Top 5 donators
\`\`\`

#### Expenses Page (/f/[code]/expense):
\`\`\`
Features:
- Full expenses table with pagination
- Filters: Category, Mode
- Sort: Latest, Oldest, Highest, Lowest, Item name
- Search by item
- Charts:
  * Collection vs Expense timeline
  * Expenses by category (pie chart)
  * Expenses by mode (pie chart)
  * Daily expense trends (bar chart)
  * Top 8 most expensive items
\`\`\`

#### Transactions Page (/f/[code]/transaction):
\`\`\`
Features:
- Combined collections + expenses table
- Type badges (Collection/Expense)
- Filter by mode
- Sort options
- Search functionality
- All charts from both collections and expenses
- Daily comparison chart (bidirectional bars)
\`\`\`

#### Showcase Page (/f/[code]/showcase):
\`\`\`
Features:
- Grid of albums
- Each album shows:
  * Cover photo
  * Title
  * Year
  * Description
- Click album → View media items
- Media viewer:
  * Full-screen modal
  * Photos, videos, PDFs, audio
  * Download button for each file
  * Multiple selection for batch download
  * File name and size displayed
\`\`\`

### Session Management:

\`\`\`
Daily Session:
- Valid until midnight (end of day)
- Next day: User must re-enter password

Password Change Detection:
- If admin changes password during the day
- User's session token becomes invalid
- Next page load: Password gate shows again
- User must enter new password

No Session (Password Not Required):
- User can access all pages freely
- No password prompts
\`\`\`

---

## 2️⃣ CREATING FLOW (New Festival)

### Entry Point:
- Homepage: `https://yourapp.com` → Click "Create a Festival"

### Step-by-Step Flow:

\`\`\`
1. User lands on: /
   - Clicks "Create a Festival" button

2. Redirects to: /create

3. Create Festival Form:
   
   BASIC INFORMATION:
   - Event/Festival Name * (required)
   - Organiser
   - Guide
   - Mentor
   - Location
   - Start Date (date picker)
   - End Date (date picker)
   
   PASSWORD SETTINGS:
   - Checkbox: "Requires user password to view pages"
     * Default: CHECKED
   
   IF CHECKED:
     - User Password field (default: "Festive@123")
     - Admin Password field (default: "admin")
   
   THEME SETTINGS:
   - Background Color (color picker, default: #f8fafc)
   - Background Image URL (text input)
   - Checkbox: "Enable dark theme"
   
   SUBMIT BUTTON:
   - "Create Festival"

4. User fills form and clicks "Create Festival"

5. System:
   - Generates unique 8-character code (e.g., XYZABC12)
   - Checks for uniqueness (retries if duplicate)
   - Inserts festival into database
   - Creates default groups/categories/modes for this festival

6. Success Modal Shows:
   
   MODAL CONTENT:
   - Title: "Festival Created"
   - Warning: "Save these details now. If lost, they cannot be recovered."
   
   THREE SECTIONS:
   
   a) Festival Code:
      - Code: XYZABC12
      - Copy button
   
   b) Public URL:
      - URL: https://yourapp.com/f/XYZABC12
      - Copy button
   
   c) Admin URL:
      - URL: https://yourapp.com/f/XYZABC12/admin
      - Copy button
      - Note: "Remember the admin password you set"
   
   AUTO-REDIRECT:
   - Toggle: "Auto redirect" (ON by default)
   - Countdown: "Redirecting in 10s"
   - User can turn off auto-redirect
   
   BUTTONS:
   - "Go to Festival Now" (immediate redirect)
   - "Close" (dismiss modal, stay on create page)

7. After 10 seconds (or clicking "Go to Festival Now"):
   - Redirects to: /f/XYZABC12
   - If password required: Shows password gate
   - User enters password → Dashboard loads

8. User can now:
   - Share public URL with team members
   - Access admin panel via admin URL
   - Start adding collections and expenses
\`\`\`

### What Gets Created:

\`\`\`
Database Records:

1. festivals table:
   - id: UUID
   - code: XYZABC12
   - event_name: "Diwali 2024"
   - organiser, mentor, guide, location
   - event_start_date, event_end_date
   - requires_user_password: true/false
   - user_password: "Festive@123" (or custom)
   - admin_password: "admin" (or custom)
   - theme_bg_color: "#f8fafc"
   - theme_bg_image_url: null
   - theme_dark: false
   - other theme colors (defaults)
   - created_at, updated_at

2. Default groups (linked to festival_id):
   - "Group A"
   - "Group B"
   - "Group C"

3. Default categories (linked to festival_id):
   - "Food"
   - "Decoration"
   - "Entertainment"
   - "Miscellaneous"

4. Default collection_modes (linked to festival_id):
   - "Cash"
   - "Online"

5. Default expense_modes (linked to festival_id):
   - "Cash"
   - "Online"

All data is isolated per festival_id.
\`\`\`

---

## 3️⃣ ADMIN FLOW (Festival Management)

### Entry Point:
- Admin URL: `https://yourapp.com/f/ABCD1234/admin?p=admin`
- OR: `https://yourapp.com/f/ABCD1234/admin` (then enter password in decoy input)

### Authentication:

\`\`\`
AdminPasswordGate Component:

METHOD 1: URL Parameter (Recommended)
- URL: /f/ABCD1234/admin?p=admin
- System reads ?p parameter
- Compares to festival.admin_password
- If match: Creates daily session
- Session key: adminPasswordAuth:ABCD1234
- Session includes token from admin_password_updated_at

METHOD 2: Decoy Input (Fallback)
- Shows password input on screen
- User enters admin password
- System verifies against festival.admin_password
- If correct: Creates daily session
- Note: This is a "decoy" - URL param is the real method

Daily Session:
- Valid until midnight
- Next day: Must re-authenticate
- If admin password changes: Session invalidates immediately
\`\`\`

### Admin Dashboard (/f/[code]/admin):

\`\`\`
FULL PAGE LAYOUT:

1. FESTIVAL CODE CARD (Top):
   - Displays: Festival Code: ABCD1234
   - Button: "Copy URL" (copies public URL)

2. BASIC INFO CARD:
   - Shows festival details
   - Edit button → Opens EditFestivalModal
   - Can edit:
     * Event name, organiser, guide, mentor, location
     * Event dates
     * Title styling (size, weight, alignment, color)

3. STATS CARDS:
   - Same 4 cards as user view
   - Total Collection, Total Expense, Donators, Balance

4. COLLECTIONS SECTION:
   - Header: "Collections"
   - Buttons:
     * "Add Collection" → Opens AddCollectionModal
     * "Export JSON" → Downloads all collections
     * "Export (Import Format)" → Downloads import-ready JSON
     * "Import JSON" → Opens import modal
   
   - Full CollectionTable with:
     * All collections (paginated)
     * Filters: Group, Mode
     * Sort: Latest, Oldest, Highest, Lowest, Name
     * Search by name
     * Actions per row:
       - Edit icon → Opens AddCollectionModal (edit mode)
       - Delete icon → Opens DeleteConfirmModal

5. EXPENSES SECTION:
   - Header: "Expenses"
   - Buttons:
     * "Add Expense" → Opens AddExpenseModal
     * "Export JSON" → Downloads all expenses
     * "Export (Import Format)" → Downloads import-ready JSON
     * "Import JSON" → Opens import modal
   
   - Full ExpenseTable with:
     * All expenses (paginated)
     * Filters: Category, Mode
     * Sort: Latest, Oldest, Highest, Lowest, Item name
     * Search by item
     * Actions per row:
       - Edit icon → Opens AddExpenseModal (edit mode)
       - Delete icon → Opens DeleteConfirmModal

6. SETTINGS SECTION (2 columns):
   
   LEFT COLUMN - Collection Settings:
   
   a) Groups:
      - List of all groups
      - Input + "+" button to add new group
      - Delete icon per group
      - Validation: No duplicates
   
   b) Collection Modes:
      - List of all modes
      - Input + "+" button to add new mode
      - Delete icon per mode
      - Validation: No duplicates
   
   RIGHT COLUMN - Expense Settings:
   
   a) Categories:
      - List of all categories
      - Input + "+" button to add new category
      - Delete icon per category
      - Validation: No duplicates
   
   b) Expense Modes:
      - List of all modes
      - Input + "+" button to add new mode
      - Delete icon per mode
      - Validation: No duplicates

7. USER PASSWORD SECTION:
   - Header: "User Password"
   - Display: Masked password (••••••••)
   - Buttons:
     * Eye icon → Toggle show/hide password
     * Edit icon → Enable edit mode
   
   Edit Mode:
   - Input field with current password
   - "Save" button
   - "Cancel" button
   - On save:
     * Updates festival.user_password
     * Updates user_password_updated_at (auto)
     * All user sessions invalidate immediately
     * Users must re-enter password on next page load

8. ADMIN PASSWORD SECTION:
   - Header: "Admin Password"
   - Display: Masked password (••••••••)
   - Buttons:
     * Eye icon → Toggle show/hide password
     * Edit icon → Enable edit mode
   
   Edit Mode:
   - Input field with current password
   - "Save" button
   - "Cancel" button
   - On save:
     * Updates festival.admin_password
     * Updates admin_password_updated_at (auto)
     * All admin sessions invalidate immediately
     * Admin must re-authenticate on next page load

9. THEME & APPEARANCE SECTION:
   - Header: "Theme & Appearance"
   - Button: "Edit Theme" (toggles editor)
   
   Theme Editor (when expanded):
   
   COLOR PICKERS (7 colors):
   - Primary Color (buttons, accents)
   - Secondary Color (secondary UI)
   - Background Color (page background)
   - Text Color (main text)
   - Border Color (borders)
   - Table Background (table cells)
   - Card Background (card backgrounds)
   
   BACKGROUND IMAGE:
   - Input: Background Image URL
   - Note: "If set, this will override background color"
   
   DARK MODE:
   - Checkbox: "Enable dark theme"
   
   BUTTONS:
   - "Save Theme" → Updates festival theme
   - "Restore Defaults" → Resets to default colors

10. SHOWCASE SECTION:
    
    STORAGE BAR (if media exists):
    - Visual bar showing storage usage
    - Text: "150MB / 400MB (37.5%)"
    - Color:
      * Blue: < 75%
      * Yellow: 75-90%
      * Red: > 90%
    - Click bar → Opens StorageStatsModal
    
    StorageStatsModal shows:
    - Total storage used / max capacity
    - Breakdown by media type:
      * Photos: count + size
      * Videos: count + size
      * PDFs: count + size
      * Audio: count + size
    - Breakdown by album:
      * Album name
      * Media count
      * Total size
    
    ALBUMS GRID:
    - Button: "Add Album" → Opens AddEditAlbumModal
    - Grid of album cards (3 columns)
    
    Each Album Card:
    - Cover photo (if set)
    - Title
    - Year
    - Description (truncated)
    - Buttons:
      * "Edit" → Opens AddEditAlbumModal (edit mode)
      * "Delete" → Deletes album + all media
      * "Manage Media" → Opens ManageAlbumMediaModal
    
    ManageAlbumMediaModal:
    - Upload section:
      * Drag & drop or click to upload
      * Multiple file selection
      * File type validation
      * Size limits: 15MB (images/PDFs/audio), 50MB (videos)
      * Upload queue system
      * Live progress with file count
    
    - Media grid:
      * Thumbnails for all media
      * File name and size
      * Actions per media:
        - View (full-screen)
        - Download
        - Delete
      * Multiple selection:
        - Checkboxes
        - Shows selected count + total size
        - "Download Selected" button

11. DANGER ZONE:
    - Button: "Permanently Delete Festival" (red)
    - Opens DeleteFestivalModal
    
    DeleteFestivalModal:
    - Warning: "This cannot be undone"
    - Checkbox: "Download data (JSON) before delete"
    - Input: "Confirm Admin Password"
    - Buttons:
      * "Cancel"
      * "Delete Permanently" (red)
    
    On delete:
    - If download checked: Exports all data
    - Deletes all collections, expenses, groups, categories, modes
    - Deletes all albums and media
    - Deletes festival record
    - Redirects to homepage

12. BOTTOM NAVIGATION:
    - Same as user view
    - Home, Collections, Expenses, Transactions, Showcase
\`\`\`

### Admin Modals:

#### AddCollectionModal:
\`\`\`
Features:
- Add up to 5 collections at once
- Fields per collection:
  * Name (required)
  * Amount (required)
  * Group (dropdown, required)
  * Mode (dropdown, required)
  * Date (date picker, required)
  * Time (hour + minute, optional)
  * Note (optional)
- Edit mode: Pre-fills single collection
- Validation: All required fields
- On save: Inserts/updates in database
\`\`\`

#### AddExpenseModal:
\`\`\`
Features:
- Add up to 10 expenses at once
- Fields per expense:
  * Item (required)
  * Pieces (required, number)
  * Price per piece (required, number)
  * Total amount (auto-calculated or manual override)
  * Category (dropdown, required)
  * Mode (dropdown, required)
  * Date (date picker, required)
  * Time (hour + minute, optional)
  * Note (optional)
- Edit mode: Pre-fills single expense
- Validation: All required fields
- On save: Inserts/updates in database
\`\`\`

#### EditFestivalModal:
\`\`\`
Features:
- Edit festival basic info
- Fields:
  * Event name
  * Organiser
  * Guide
  * Mentor
  * Location
  * Start date
  * End date
- Title styling:
  * Size (sm, md, lg, xl)
  * Weight (normal, bold)
  * Alignment (left, center, right)
  * Color (default, primary, secondary)
- On save: Updates festival record
\`\`\`

#### AddEditAlbumModal:
\`\`\`
Features:
- Create or edit album
- Fields:
  * Title (required)
  * Description
  * Year (number)
  * Cover URL (text input)
- On save: Inserts/updates album
\`\`\`

#### ManageAlbumMediaModal:
\`\`\`
Features:
- Upload media files
- Drag & drop or click to select
- Multiple file selection
- File type detection (image, video, PDF, audio)
- Size validation:
  * Images/PDFs/Audio: 15MB max
  * Videos: 50MB max
- Upload queue:
  * Shows pending uploads
  * Live progress per file
  * File count updates
- Storage limit check:
  * Total per festival: 400MB
  * Blocks upload if limit exceeded
- Media grid:
  * Thumbnails
  * File name + size
  * View, download, delete actions
- Multiple selection:
  * Checkboxes
  * Selected count + total size
  * Batch download
\`\`\`

#### Import Collections/Expenses Modals:
\`\`\`
Features:
- Paste JSON array
- Example format shown
- Validation:
  * Required fields present
  * Groups/categories/modes exist (case-insensitive match)
  * Valid dates (YYYY-MM-DD)
  * Valid numbers
- Error messages:
  * Row-specific errors
  * Clear instructions
- On success: Imports all rows
\`\`\`

---

## 🔄 Session & Authentication Summary

### User Sessions:
\`\`\`
Storage Key: userPasswordAuth:ABCD1234

Session Object:
{
  "authenticated": true,
  "date": "2024-11-16",
  "token": "2024-11-16T10:30:00.000Z"  // from user_password_updated_at
}

Validation:
1. Check date === today
2. Check token === current user_password_updated_at
3. If both match → authenticated
4. Otherwise → show password gate

Expiration:
- Daily at midnight
- OR when admin changes user password
\`\`\`

### Admin Sessions:
\`\`\`
Storage Key: adminPasswordAuth:ABCD1234

Session Object:
{
  "authenticated": true,
  "date": "2024-11-16",
  "token": "2024-11-16T14:00:00.000Z"  // from admin_password_updated_at
}

Validation:
1. Check date === today
2. Check token === current admin_password_updated_at
3. If both match → authenticated
4. Otherwise → show admin password gate

Expiration:
- Daily at midnight
- OR when admin changes admin password
\`\`\`

---

## 📊 Data Isolation

### Per-Festival Data:
\`\`\`
Each festival has its own:
- Collections (festival_id)
- Expenses (festival_id)
- Groups (festival_id)
- Categories (festival_id)
- Collection modes (festival_id)
- Expense modes (festival_id)
- Albums (festival_id)
- Media items (via album_id → festival_id)

No cross-festival data access.
Deleting festival cascades to all related data.
\`\`\`

---

## 🎨 Theming

### Theme Application:
\`\`\`
Every festival page applies:
- Background color OR background image
- Primary color (buttons, accents)
- Secondary color (secondary UI)
- Text color
- Border color
- Table background
- Card background
- Dark mode toggle

Theme is applied via:
1. Inline styles (background)
2. CSS custom properties (--theme-primary, etc.)
3. Tailwind classes (theme-card, theme-text, etc.)

Users see themed pages.
Admin can customize theme in admin panel.
\`\`\`

---

## 📱 Mobile Experience

### Bottom Navigation:
\`\`\`
Fixed at bottom on all pages:
- Home icon
- Collections icon
- Expenses icon
- Transactions icon
- Showcase icon

Active page highlighted.
Easy thumb access on mobile.
\`\`\`

### Responsive Design:
\`\`\`
- Tables scroll horizontally on mobile
- Cards stack vertically
- Modals adapt to screen size
- Touch-friendly buttons
- Optimized for 320px+ screens
\`\`\`

---

## 🔐 Security Notes

### Current Implementation:
\`\`\`
- Client-side password protection
- Passwords stored in plain text in database
- Public RLS policies (anyone can read/write)
- No rate limiting
- No HTTPS enforcement (depends on hosting)

Suitable for:
- Small communities (hostels, clubs)
- Trusted user groups
- Non-sensitive financial data
\`\`\`

### Production Recommendations:
\`\`\`
- Implement Supabase Auth
- Hash passwords (bcrypt/argon2)
- Server-side API routes
- Row Level Security with user authentication
- Rate limiting on uploads
- HTTPS only
- Environment variable encryption
\`\`\`

---

## 📝 Summary

### Three Flows:

1. **Viewing Flow**: Simple, fast access for regular users
   - Enter code → View data → Navigate pages
   - Optional password protection
   - Daily sessions

2. **Creating Flow**: Quick festival setup
   - Fill form → Get unique code → Share with team
   - Customize passwords and theme
   - Auto-redirect to new festival

3. **Admin Flow**: Comprehensive management
   - Full CRUD on collections/expenses
   - Manage settings (groups, categories, modes)
   - Update passwords (invalidates sessions)
   - Customize theme
   - Manage showcase albums and media
   - Import/export data
   - Delete festival

All flows are designed for:
- Ease of use
- Mobile-first experience
- Data isolation per festival
- Flexible password requirements
- Comprehensive theming

---

**Last Updated**: January 2025  
**Version**: 1.0.0

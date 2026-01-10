# Design Changes & New Features Plan

## 🎯 Requested Changes

### 1. User View Login System Enhancement

**Current Flow:**
- User enters festival code
- If password required → Enter password only
- Access granted

**New Flow:**
- User enters festival code
- If password required → Enter password + **Name (mandatory)**
- System logs: name, date, time (with seconds)
- Save to localStorage: name, date, time
- Access granted

**Database Changes:**
\`\`\`sql
-- New table: festival_access_logs
CREATE TABLE festival_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  access_type TEXT NOT NULL, -- 'password_login', 'url_login', 'dashboard_view'
  password_used TEXT, -- which password was used (for multi-password system)
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_access_logs_festival ON festival_access_logs(festival_id, accessed_at DESC);
CREATE INDEX idx_access_logs_user ON festival_access_logs(festival_id, user_name);
\`\`\`

**localStorage Structure:**
\`\`\`json
{
  "userAuth:ABCD1234": {
    "authenticated": true,
    "name": "John Doe",
    "date": "2024-11-16",
    "time": "14:30:45",
    "token": "2024-11-16T10:30:00.000Z"
  }
}
\`\`\`

---

### 2. Dashboard View Logging

**Requirement:**
- Log every dashboard page view
- Only for authenticated users (who entered password + name)
- Track: name, date, time (seconds)

**Implementation:**
\`\`\`typescript
// On dashboard page load (useEffect)
if (isAuthenticated && userName) {
  await supabase.from('festival_access_logs').insert({
    festival_id: festival.id,
    user_name: userName,
    access_type: 'dashboard_view',
    accessed_at: new Date().toISOString(),
  });
}
\`\`\`

---

### 3. Multiple Passwords System

**Current:**
- One user password per festival
- One admin password per festival

**New:**
- Multiple user passwords per festival
- Each password can have a label/name
- Track which password was used for login

**Database Changes:**
\`\`\`sql
-- New table: festival_passwords
CREATE TABLE festival_passwords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  password TEXT NOT NULL,
  label TEXT, -- e.g., "Team A", "Volunteers", "VIP Access"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT, -- admin who created it
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_festival_passwords ON festival_passwords(festival_id, is_active);

-- Keep festivals.user_password as primary/default password for backward compatibility
-- Or migrate to use festival_passwords table exclusively
\`\`\`

**Admin Panel UI:**
\`\`\`
Passwords Section:
- List of all passwords with labels
- Add new password button
- Toggle active/inactive
- Delete password
- Show last used timestamp
- Show usage count
\`\`\`

---

### 4. Special URL Login System

**URL Format:**
\`\`\`
/f/XXXXXXXX?mode=login&p={password}&name={name}
\`\`\`

**Parameters:**
- `mode=login` (mandatory) - Indicates URL-based login
- `p={password}` (mandatory) - Password to verify
- `name={name}` (mandatory) - User's name

**Name Processing:**
- Case-insensitive storage
- Spaces converted to dashes
- Example: "John Doe" → "john-doe"

**Flow:**
1. User clicks special URL
2. System reads query parameters
3. Validates:
   - mode === 'login'
   - p is not empty
   - name is not empty
4. Verifies password against festival passwords
5. If valid:
   - Creates session in localStorage
   - Logs access in database
   - Redirects to dashboard (removes query params)
6. If invalid:
   - Shows error message
   - Redirects to normal password gate

**Database Log:**
\`\`\`sql
INSERT INTO festival_access_logs (
  festival_id,
  user_name,
  access_type,
  password_used,
  accessed_at
) VALUES (
  'festival-uuid',
  'john-doe',
  'url_login',
  'password123',
  NOW()
);
\`\`\`

**Implementation:**
\`\`\`typescript
// In /f/[code]/page.tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const password = params.get('p');
  const name = params.get('name');
  
  if (mode === 'login' && password && name) {
    handleUrlLogin(password, name);
  }
}, []);

const handleUrlLogin = async (password: string, name: string) => {
  // Normalize name
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
  
  // Verify password
  const isValid = await verifyPassword(password);
  
  if (isValid) {
    // Create session
    localStorage.setItem(`userAuth:${code}`, JSON.stringify({
      authenticated: true,
      name: normalizedName,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      token: festival.user_password_updated_at,
    }));
    
    // Log access
    await supabase.from('festival_access_logs').insert({
      festival_id: festival.id,
      user_name: normalizedName,
      access_type: 'url_login',
      password_used: password,
    });
    
    // Remove query params and reload
    window.history.replaceState({}, '', `/f/${code}`);
    window.location.reload();
  } else {
    toast.error('Invalid password');
  }
};
\`\`\`

---

## 🚀 Additional Feature Suggestions

### 5. Analytics Dashboard (Admin Only)

**New Page:** `/f/[code]/analytics`

**Features:**
- **Access Analytics:**
  - Total unique visitors
  - Total page views
  - Access timeline chart (hourly/daily)
  - Top visitors (by view count)
  - Recent access log table
  - Password usage breakdown

- **Collection Analytics:**
  - Collection trends over time
  - Peak collection days
  - Average donation amount
  - Donation frequency by group
  - Top donors leaderboard

- **Expense Analytics:**
  - Expense trends over time
  - Budget utilization percentage
  - Category-wise spending breakdown
  - Most expensive purchases
  - Spending velocity (per day/week)

- **Financial Health:**
  - Balance trend chart
  - Projected balance (based on trends)
  - Collection vs Expense ratio
  - Burn rate calculation
  - Days until balance zero (if negative trend)

**Cards to Show:**
\`\`\`
1. Unique Visitors Card
   - Icon: Users
   - Number: 45
   - Subtitle: "Total unique visitors"
   - Trend: +12% from yesterday

2. Page Views Card
   - Icon: Eye
   - Number: 234
   - Subtitle: "Total page views"
   - Trend: +8% from yesterday

3. Active Now Card
   - Icon: Activity
   - Number: 3
   - Subtitle: "Viewing right now"
   - Live indicator

4. Most Active User Card
   - Icon: Award
   - Name: "John Doe"
   - Views: 45
   - Last seen: "2 mins ago"
\`\`\`

---

### 6. Real-Time Activity Feed

**Location:** Sidebar or dedicated section on dashboard

**Features:**
- Live feed of recent activities
- Types of activities:
  - User logged in
  - Collection added
  - Expense added
  - Album created
  - Media uploaded
  - Settings changed

**Card Design:**
\`\`\`
Recent Activity
├─ 🟢 John Doe logged in (2 mins ago)
├─ 💰 New collection: ₹500 from Jane (5 mins ago)
├─ 🛒 New expense: Flowers ₹250 (10 mins ago)
├─ 📸 New album created: Diwali 2024 (1 hour ago)
└─ ⚙️ Settings updated by admin (2 hours ago)
\`\`\`

---

### 7. Quick Stats Cards (All Pages)

**Cards to Add:**

1. **Today's Summary Card**
   \`\`\`
   Today's Activity
   ├─ Collections: ₹5,000 (12 donations)
   ├─ Expenses: ₹2,500 (8 items)
   └─ Balance: +₹2,500
   \`\`\`

2. **This Week Card**
   \`\`\`
   This Week
   ├─ Collections: ₹25,000
   ├─ Expenses: ₹18,000
   └─ Net: +₹7,000
   \`\`\`

3. **Progress Card**
   \`\`\`
   Festival Progress
   ├─ Days elapsed: 5 / 10
   ├─ Collection target: 60% (₹60k / ₹100k)
   └─ Budget used: 45%
   \`\`\`

4. **Top Contributor Card**
   \`\`\`
   Top Contributor
   ├─ Name: John Doe
   ├─ Amount: ₹5,000
   └─ Donations: 3
   \`\`\`

5. **Upcoming Expenses Card**
   \`\`\`
   Pending Expenses
   ├─ Catering: ₹10,000 (Tomorrow)
   ├─ Decorations: ₹5,000 (2 days)
   └─ Total: ₹15,000
   \`\`\`

6. **Storage Usage Card** (Showcase)
   \`\`\`
   Storage
   ├─ Used: 150MB / 400MB
   ├─ Photos: 45 (80MB)
   ├─ Videos: 12 (60MB)
   └─ PDFs: 8 (10MB)
   \`\`\`

---

### 8. Notifications System

**Features:**
- Bell icon in header
- Notification count badge
- Dropdown with recent notifications
- Types:
  - New collection added
  - New expense added
  - Low balance warning
  - Storage limit warning
  - Password changed
  - New user logged in (admin only)

**Database:**
\`\`\`sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'collection', 'expense', 'warning', 'info'
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

---

### 9. Export & Backup Features

**Admin Panel Additions:**

1. **Scheduled Exports**
   - Auto-export daily/weekly
   - Email reports (if email configured)
   - Download history

2. **Backup & Restore**
   - One-click full backup
   - Restore from backup
   - Backup history

3. **PDF Reports**
   - Generate PDF summary
   - Include charts and tables
   - Customizable date range

---

### 10. Collaboration Features

**Features:**

1. **Comments System**
   - Add comments to collections/expenses
   - Tag users (@john-doe)
   - Reply to comments
   - Admin can moderate

2. **Approval Workflow**
   - Expenses require admin approval
   - Pending expenses section
   - Approve/Reject buttons
   - Approval history

3. **User Roles** (Future)
   - Admin: Full access
   - Manager: Add/edit data
   - Viewer: Read-only
   - Contributor: Add collections only

---

### 11. Mobile App Features

**PWA Enhancements:**

1. **Install Prompt**
   - "Add to Home Screen" banner
   - Works offline (service worker)
   - Push notifications

2. **Quick Actions**
   - Long-press app icon
   - Quick add collection
   - Quick add expense
   - View balance

---

### 12. Gamification

**Features:**

1. **Badges & Achievements**
   - First donation badge
   - Top contributor badge
   - Consistent donor badge (5+ donations)
   - Early bird badge (first to donate)

2. **Leaderboards**
   - Top donors
   - Most active users
   - Highest single donation

3. **Milestones**
   - ₹10k collected
   - 50 donations
   - 100 page views

---

### 13. Smart Insights

**AI-Powered Features:**

1. **Spending Predictions**
   - Predict when balance will run out
   - Suggest budget adjustments
   - Identify spending patterns

2. **Anomaly Detection**
   - Unusual expense amounts
   - Duplicate entries
   - Missing data

3. **Recommendations**
   - Best time to collect donations
   - Optimal expense categories
   - Budget optimization tips

---

### 14. Integration Features

**External Integrations:**

1. **Payment Gateways**
   - Razorpay integration
   - UPI QR code generation
   - Payment links

2. **WhatsApp Integration**
   - Send festival URL via WhatsApp
   - Share reports
   - Notifications

3. **Google Sheets Sync**
   - Auto-sync to Google Sheets
   - Real-time updates
   - Backup to Drive

---

### 15. Enhanced Showcase

**Additional Features:**

1. **Media Categories**
   - Photos
   - Videos
   - Documents
   - Audio
   - Filter by category

2. **Slideshow Mode**
   - Auto-play photos
   - Fullscreen slideshow
   - Background music

3. **Social Sharing**
   - Share album on social media
   - Generate shareable links
   - Embed albums on websites

---

## 📊 Priority Recommendations

### High Priority (Implement First):
1. ✅ User login with name (Requested)
2. ✅ Dashboard view logging (Requested)
3. ✅ Multiple passwords system (Requested)
4. ✅ Special URL login (Requested)
5. 🆕 Analytics Dashboard
6. 🆕 Quick Stats Cards
7. 🆕 Real-Time Activity Feed

### Medium Priority:
8. Notifications System
9. Export & Backup Features
10. Enhanced Showcase
11. Comments System

### Low Priority (Future):
12. Gamification
13. Smart Insights
14. External Integrations
15. PWA Enhancements

---

## 🗄️ Database Schema Summary

### New Tables:
1. `festival_access_logs` - Track all user access
2. `festival_passwords` - Multiple passwords per festival
3. `notifications` - Notification system
4. `comments` - Comments on collections/expenses
5. `achievements` - User badges and achievements

### Modified Tables:
- `festivals` - Add fields for analytics settings
- `collections` - Add approval status
- `expenses` - Add approval status

---

## 🎨 UI/UX Improvements

### Cards Design:
- Consistent card shadows
- Hover effects
- Loading skeletons
- Empty states with illustrations
- Error states with retry buttons

### Color Scheme:
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Error: Red (#ef4444)
- Info: Blue (#3b82f6)
- Neutral: Gray (#6b7280)

### Typography:
- Headings: Bold, larger
- Body: Regular, readable
- Numbers: Monospace font
- Labels: Uppercase, small

### Spacing:
- Consistent padding (4, 6, 8, 12, 16, 24)
- Card gaps: 16px or 24px
- Section spacing: 32px or 48px

---

## 📱 Responsive Design

### Breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Optimizations:
- Stack cards vertically
- Collapsible sections
- Bottom sheet modals
- Swipe gestures
- Touch-friendly buttons (min 44px)

---

## 🔐 Security Enhancements

1. **Rate Limiting**
   - Max 5 login attempts per minute
   - Temporary lockout after failed attempts

2. **Password Strength**
   - Minimum 8 characters
   - Require special characters (optional)
   - Password strength indicator

3. **Session Management**
   - Auto-logout after inactivity
   - Concurrent session limit
   - Device tracking

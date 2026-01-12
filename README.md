# Donation Book - Developer Documentation

> Multi-festival digital ledger for tracking donations, collections, and expenses in communities and hostels

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38bdf8)](https://tailwindcss.com/)

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Authentication System](#authentication-system)
- [Key Features](#key-features)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Donation Book** is a production-ready Next.js 14 application designed for community-based donation and expense tracking. It provides a comprehensive solution for managing multiple festivals with complete data isolation, custom themes, sophisticated multi-admin system, and extensive activity tracking.

### Key Highlights

- **Multi-Festival Support**: Manage unlimited festivals with unique 8-letter codes
- **Three-Tier Authentication**: Visitor, Admin, and Super Admin roles with granular permissions
- **Multi-Admin System**: Multiple admins per festival with individual password management
- **Real-Time Analytics**: Interactive charts and comprehensive reporting
- **Media Showcase**: Album-based media management with external link support
- **Mobile-First Design**: Responsive UI optimized for all devices
- **Session Management**: IST timezone-aware session validation with concurrent session detection

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS 3.4.1
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts 3.4.1
- **Icons**: Lucide React 0.553.0
- **Forms**: React Hook Form 7.70.0 + Zod 4.3.5
- **Notifications**: React Hot Toast 2.6.0, Sonner 1.7.1
- **Date Management**: date-fns 4.1.0

### Backend & Database
- **Backend**: Next.js 14 API Routes (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom session-based (localStorage)
- **ORM**: Supabase JavaScript Client 2.81.1
- **State Management**: React Hooks

### Development Tools
- **Testing**: Jest 30.2.0, Playwright 1.57.0, Testing Library
- **Linting**: ESLint with next/eslint config
- **Type Checking**: TypeScript 5
- **Package Manager**: npm / pnpm / yarn

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 18.x or later
- **npm**: 10.x or later (or pnpm / yarn)
- **Git**: Latest version
- **Supabase Account**: Free tier is sufficient

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/cyberhive54/donationbook-3.git
cd donationbook-3
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Get Your Supabase Credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Navigate to Settings → API
4. Copy the Project URL and anon/public key

### 4. Set Up Database

Run the SQL migrations in order in your Supabase SQL Editor:

#### Option A: Latest Migrations (Recommended)

Execute these files from the `SQL-new/` folder in sequence:

```bash
001-FIX-ADMIN-LOGIN-PASSWORD-VERIFICATION.sql
002-PHASE2-VERIFY-AND-FIX.sql
003-PHASE3-VERIFY-COMPATIBILITY.sql
004-FIX-ADMIN-CODE-CONSTRAINT-PER-FESTIVAL.sql
005-FIX-ANALYTICS-CONFIG-SCHEMA.sql
006-ADD-DOWNLOAD-CONTROL-AND-LOGOUT-TRACKING.sql
007-ADD-DELETE-FESTIVAL-FUNCTION.sql
008-ADD-ANALYTICS-CARD-CONFIGURATION.sql
009-ADD-NEW-ANALYTICS-CARDS-PART1.sql
009-ADD-NEW-ANALYTICS-CARDS-PART2.sql
010-ADD-BIDIRECTIONAL-CHART-PART1.sql
010-ADD-BIDIRECTIONAL-CHART-PART2.sql
011-ADD-EXTERNAL-MEDIA-LINKS.sql
012-FIX-VISITOR-ACTIVITY-LOGGING.sql
013-FIX-MULTI-FESTIVAL-UNIQUE-CONSTRAINTS.sql
014-ADD-CONFIGURABLE-STORAGE-LIMITS.sql
015-FIX-LOG-FESTIVAL-ACCESS-OVERLOAD.sql
```

#### Option B: Complete Schema (Alternative)

Execute the complete schema from `SQL/supabase-schema.sql` followed by individual migrations.

### 5. Configure Storage

Create a storage bucket named `showcase` in Supabase:

1. Go to Storage in Supabase Dashboard
2. Create new bucket: `showcase`
3. Set to public or configure policies as needed
4. Run `SQL/supabase-storage-fix.sql` for proper RLS policies

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
donationbook-3/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles
│   ├── create/                  # Festival creation
│   ├── view/                    # Festival code entry
│   └── f/[code]/                # Dynamic festival routes
│       ├── page.tsx             # Festival dashboard
│       ├── layout.tsx           # Festival layout
│       ├── collection/          # Collections management
│       ├── expense/             # Expenses management
│       ├── transaction/         # Transaction history
│       ├── analytics/           # Analytics dashboard
│       ├── showcase/            # Media gallery
│       ├── activity/            # Activity logs
│       └── admin/               # Admin panel
│           ├── page.tsx         # Admin dashboard
│           └── sup/             # Super admin routes
│               ├── dashboard/   # Super admin dashboard
│               └── analytics/   # Admin analytics
├── components/                   # React components
│   ├── PasswordGate.tsx         # Visitor authentication
│   ├── AdminPasswordGate.tsx    # Admin authentication
│   ├── SuperAdminPasswordGate.tsx
│   ├── BasicInfo.tsx            # Festival info display
│   ├── StatsCards.tsx           # Statistics cards
│   ├── BottomNav.tsx            # Mobile navigation
│   ├── GlobalSessionBar.tsx     # Session management
│   ├── charts/                  # Chart components
│   ├── modals/                  # Modal dialogs
│   ├── tables/                  # Data tables
│   └── ui/                      # shadcn/ui components
├── lib/                          # Utilities
│   ├── supabase.ts              # Supabase client
│   ├── utils.ts                 # Helper functions
│   ├── theme.ts                 # Theme utilities
│   ├── sanitize.ts              # Input sanitization
│   ├── sessionValidator.ts      # Session validation
│   ├── analyticsUtils.ts        # Analytics helpers
│   ├── festivalCodeRedirect.ts  # Redirect handler
│   └── hooks/                   # Custom React hooks
│       ├── useAdminAuth.ts
│       ├── usePasswordAuth.ts
│       ├── useSession.ts
│       └── useSuperAdminAuth.ts
├── types/
│   └── index.ts                 # TypeScript definitions
├── SQL/                          # Legacy migrations
├── SQL-new/                      # Latest migrations
├── docs-new/                     # Latest documentation
├── docs-old/                     # Legacy documentation
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── README-DEVELOPER.md
```

---

## Architecture

### Application Flow

```
User Request
    ↓
Next.js App Router
    ↓
Layout Wrapper (Root/Festival)
    ↓
Authentication Gate (Visitor/Admin/SuperAdmin)
    ↓
Page Component
    ↓
Supabase Client (Direct Queries)
    ↓
PostgreSQL Database
```

### Authentication Layers

1. **Visitor Level** (`PasswordGate`)
   - Optional password + name entry
   - Session stored in localStorage
   - Device ID tracking
   - Daily expiration (IST timezone)

2. **Admin Level** (`AdminPasswordGate`)
   - Admin code/name + password
   - RPC function verification
   - Admin session tracking

3. **Super Admin Level** (`SuperAdminPasswordGate`)
   - Super admin password
   - Full festival configuration access
   - Admin management capabilities

### Data Flow

```
Component
    ↓
Direct Supabase Query (supabase.from('table'))
    ↓
PostgreSQL with RLS Policies
    ↓
React State Update
    ↓
UI Re-render
```

**Note**: No API routes used for data fetching - all queries are direct from client to Supabase.

---

## Database Schema

### Core Tables

#### festivals
Main festival configuration with theme, passwords, and settings.

**Key Fields:**
- `id` (UUID, PK)
- `code` (TEXT, UNIQUE, 6-12 chars)
- `event_name`, `organiser`, `mentor`, `guide`, `location`
- `event_start_date`, `event_end_date` (optional)
- `ce_start_date`, `ce_end_date` (required)
- `requires_password`, `user_password`, `admin_password`, `super_admin_password`
- Theme fields: `theme_primary_color`, `theme_secondary_color`, etc.
- Storage limits: `max_storage_mb`, `max_video_size_mb`, `max_file_size_mb`

#### collections
Donation records linked to festivals.

**Key Fields:**
- `festival_id` (FK → festivals.id, CASCADE)
- `name` (donor name), `amount`, `group_name`, `mode`
- `date` (validated within CE range), `time_hour`, `time_minute`
- `created_by_admin_id`, `updated_by_admin_id` (multi-admin tracking)

#### expenses
Expense records linked to festivals.

**Key Fields:**
- `festival_id` (FK → festivals.id, CASCADE)
- `item`, `pieces`, `price_per_piece`, `total_amount`
- `category`, `mode`, `date`, `time_hour`, `time_minute`
- Admin tracking fields

#### admins
Multi-admin system for festival management.

**Key Fields:**
- `admin_id` (UUID, PK)
- `festival_id` (FK → festivals.id, CASCADE)
- `admin_code` (UNIQUE per festival), `admin_name` (UNIQUE per festival)
- `admin_password_hash` (plain text - community usage)
- `is_active`, `max_user_passwords`

#### admin_user_passwords
User passwords managed by admins.

**Key Fields:**
- `password_id` (UUID, PK)
- `admin_id` (FK → admins.admin_id)
- `festival_id` (FK → festivals.id)
- `password`, `label`, `is_active`
- `usage_count`, `last_used_at`

#### access_logs
Visitor activity tracking.

**Key Fields:**
- `festival_id`, `visitor_name`, `access_method`
- `password_used`, `accessed_at`, `logout_at`
- `session_duration_seconds`, `logout_method`
- `admin_id`, `user_password_id`

#### admin_activity_logs
Admin action tracking.

**Key Fields:**
- `festival_id`, `admin_id`, `admin_name`
- `action_type`, `action_details` (JSON)
- `target_type`, `target_id`
- `timestamp` (IST aware)

#### albums & media_items
Media showcase management.

**albums:**
- `festival_id`, `title`, `description`, `year`
- `cover_url`, `allow_download`
- Admin tracking fields

**media_items:**
- `album_id` (FK → albums.id)
- `type`, `title`, `url`, `mime_type`
- `size_bytes`, `duration_sec`
- `media_source_type` (upload or link)
- `external_url`, `is_external_link`

### RPC Functions

- `verify_admin_credentials(festival_code, admin_code_or_name, password)` → Admin login
- `verify_super_admin_credentials(festival_code, password)` → Super admin login
- `log_festival_access(...)` → Visitor access logging
- `log_admin_activity(...)` → Admin action logging
- `check_festival_access(festival_id)` → Visitor stats
- `get_out_of_range_transactions(festival_id)` → Date validation
- `delete_festival(festival_code)` → Festival deletion with cascade

---

## Authentication System

### Session Structure

```typescript
// Visitor Session
{
  type: "visitor",
  festivalId: "uuid",
  festivalCode: "CODE123",
  visitorName: "John Doe",
  adminId: "uuid",
  passwordLabel: "Password 1",
  loginTime: "2026-01-12T10:30:00+05:30",
  sessionId: "unique-session-id",
  deviceId: "device-unique-id"
}

// Admin Session
{
  type: "admin",
  festivalId: "uuid",
  festivalCode: "CODE123",
  adminId: "uuid",
  adminCode: "ADMIN01",
  adminName: "Admin Name",
  loginTime: "2026-01-12T10:30:00+05:30",
  sessionId: "unique-session-id"
}

// Super Admin Session
{
  type: "super_admin",
  festivalId: "uuid",
  festivalCode: "CODE123",
  loginTime: "2026-01-12T10:30:00+05:30",
  sessionId: "unique-session-id"
}
```

### Session Validation

Implemented in `lib/sessionValidator.ts`:

- Daily expiration at midnight IST (UTC+5:30)
- Password deactivation detection with 5-minute countdown
- Admin deactivation immediate logout
- Concurrent session detection and warning

---

## Key Features

### 1. Multi-Festival Management
- Unique festival codes (6-12 alphanumeric + hyphens)
- Complete data isolation via `festival_id` foreign keys
- Independent configuration per festival

### 2. Multi-Admin System
- Primary admin auto-created during festival setup
- Additional admins with unique codes/names
- Per-admin user password limits (1-10)
- Activity logging for all admin actions

### 3. Analytics & Reporting
- Festival snapshot (collection, expense, balance, donors)
- Collection target tracking with visibility controls
- Previous year comparison
- Donation buckets (custom amount ranges)
- Time-of-day analysis
- Daily net balance charts
- Top donators/expenses
- Group/category/mode breakdowns

### 4. Media Showcase
- Album-based organization
- Support for images, videos, audio, PDFs
- External link support (Google Drive, YouTube)
- Thumbnail generation for videos
- Configurable storage limits per festival
- Per-album download controls

### 5. Theme Customization
- Custom color schemes per festival
- Dark mode toggle
- Background image support
- CSS variables for dynamic theming

### 6. Session Management
- IST timezone awareness
- Device tracking and name pre-fill
- Concurrent session detection
- Scheduled logout warnings
- Force logout on password/admin deactivation

---

## Development Workflow

### Available Scripts

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run test:watch   # Jest watch mode
npm run test:coverage # Coverage report
npm run test:e2e     # Playwright E2E tests
npm run test:e2e:ui  # Playwright UI mode
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Follow existing code conventions
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Comments**: Use sparingly, prefer self-documenting code

### Adding New Features

1. **Create Component**: Add to `components/` with proper TypeScript types
2. **Add Types**: Define interfaces in `types/index.ts`
3. **Database Changes**: Create new SQL migration in `SQL-new/`
4. **Update Documentation**: Add to relevant docs in `docs-new/`
5. **Test**: Write unit tests (Jest) and E2E tests (Playwright)

---

## Testing

### Unit Tests (Jest)

```bash
npm run test
```

Test files: `*.test.ts`, `*.test.tsx`

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

Test files in `tests/` directory

### Manual Testing Checklist

See `docs-new/PRODUCT_SPECIFICATION_FOR_TESTING.md` for comprehensive testing guide.

**Quick Test:**
1. Create festival
2. Login as super admin
3. Create admin
4. Admin creates user password
5. Visitor logs in with user password
6. Add collection/expense
7. View analytics
8. Upload media to showcase

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Other Platforms

Compatible with any Next.js hosting:
- Netlify
- Railway
- AWS Amplify
- Self-hosted with Node.js

### Pre-Deployment Checklist

- [ ] All SQL migrations executed in production Supabase
- [ ] Storage bucket `showcase` created with proper policies
- [ ] Environment variables configured
- [ ] Build succeeds locally (`npm run build`)
- [ ] RLS policies reviewed and secured
- [ ] Test festival creation and login flows

---

## API Reference

### Supabase Client Usage

```typescript
import { supabase } from '@/lib/supabase';

// Fetch festivals
const { data, error } = await supabase
  .from('festivals')
  .select('*')
  .eq('code', festivalCode)
  .single();

// Insert collection
const { data, error } = await supabase
  .from('collections')
  .insert({
    festival_id: festivalId,
    name: donorName,
    amount: amount,
    // ... other fields
  });

// Call RPC function
const { data, error } = await supabase
  .rpc('verify_admin_credentials', {
    festival_code: code,
    admin_code_or_name: adminInput,
    password_input: password
  });
```

### Custom Hooks

```typescript
import { useSession } from '@/lib/hooks/useSession';
import { useAdminAuth } from '@/lib/hooks/useAdminAuth';

// In component
const { session, loading } = useSession(festivalCode);
const { isAuthenticated, login, logout } = useAdminAuth(festivalCode);
```

---

## Contributing

### Getting Started

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

### Contribution Guidelines

- **Code Quality**: Follow existing patterns and conventions
- **Testing**: Add tests for new features
- **Documentation**: Update relevant docs
- **Commits**: Write clear, descriptive commit messages
- **PR Description**: Explain what, why, and how

### Areas for Contribution

- [ ] Additional chart types for analytics
- [ ] Export options (PDF reports)
- [ ] Email notifications
- [ ] Role-based permissions refinement
- [ ] Performance optimizations
- [ ] Accessibility improvements
- [ ] Mobile app (React Native)
- [ ] API documentation

---

## Troubleshooting

### Common Issues

#### 1. "RPC function does not exist"

**Solution**: Run the required SQL migration in Supabase SQL Editor.

```sql
-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'verify_admin_credentials';
```

#### 2. "Table does not exist"

**Solution**: Ensure all migrations are executed in correct order.

#### 3. Session validation errors

**Solution**: Clear localStorage and login again.

```javascript
localStorage.clear();
window.location.reload();
```

#### 4. Storage upload fails

**Solution**: Verify storage bucket exists and RLS policies are correct.

```sql
-- Run SQL/supabase-storage-fix.sql
```

#### 5. "Cannot read property of null"

**Solution**: Check if data is loaded before accessing properties. Add loading states.

```typescript
if (!festival) return <Loader />;
```

### Debug Mode

Enable verbose logging:

```typescript
// In lib/supabase.ts
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
});
```

### Logs

- **Browser Console**: Client-side errors and logs
- **Supabase Dashboard**: Database logs and queries
- **Vercel Dashboard**: Deployment and runtime logs

---

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Recharts Documentation](https://recharts.org/)

### Internal Documentation
- `docs-new/QUICK_START_GUIDE.md` - 5-minute setup guide
- `docs-new/superdetailed-project-overview-v1.md` - Comprehensive overview
- `docs-new/PRODUCT_SPECIFICATION_FOR_TESTING.md` - Testing specification
- `docs-new/FINAL-IMPLEMENTATION-STATUS.md` - Implementation status (83.3% complete)
- `docs-new/PAGE_NAVIGATION_GUIDE_RHSPVM25.md` - Page navigation reference

### Support
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas

---

## License

This project is private and proprietary. All rights reserved.

---

## Project Status

**Version**: 0.1.0  
**Status**: Production-Ready (83.3% feature complete)  
**Last Updated**: January 12, 2026

### Completed Features (18/18)
- ✅ Festival creation and multi-festival support
- ✅ Three-tier authentication system
- ✅ Multi-admin system with CRUD operations
- ✅ User password management per admin
- ✅ Activity and access logging
- ✅ Analytics dashboard with configurable cards
- ✅ Media showcase with external links
- ✅ Theme customization
- ✅ Session management with IST timezone
- ✅ Mobile-responsive design
- ✅ Download restrictions
- ✅ Storage limits configuration
- ✅ Banner visibility controls
- ✅ Force logout functionality
- ✅ Navigation and UI improvements
- ✅ Analytics config modal saving optimization
- ✅ Visitor password management verification
- ✅ Additional UI refinements

---

**Made with ❤️ for communities and hostels**

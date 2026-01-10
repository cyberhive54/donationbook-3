# Donation Book - Super Detailed Project Overview

## Overall Project Structure

Donation Book is a Next.js 14 (App Router) web application for tracking festive donations, collections, and expenses in communities/hostels. Built with TypeScript, Tailwind CSS, Supabase (PostgreSQL), and Recharts. Supports multi-festival management with unique codes, password protection, theming, media showcase, and analytics.

### Root Directory Structure
\`\`\`
donationbook_capy/
├── app/                          # Next.js App Router pages and layouts
├── components/                   # Reusable React components
├── lib/                          # Utilities, hooks, Supabase client
├── types/                        # TypeScript type definitions
├── public/                       # Static assets (favicon, images)
├── SQL/                          # Database migrations and schema
├── node_modules/                 # Dependencies
├── .env.local                    # Environment variables
├── .env.example                  # Environment template
├── .env.local.example            # Additional env template
├── .eslintrc.json                # ESLint configuration
├── .gitignore                    # Git ignore rules
├── next-env.d.ts                 # Next.js TypeScript declarations
├── next.config.mjs               # Next.js configuration
├── package-lock.json             # NPM lock file
├── package.json                  # NPM dependencies and scripts
├── postcss.config.mjs            # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── docs-old/                     # Legacy documentation
\`\`\`

## App Directory (`app/`)

The `app/` directory contains Next.js 14 App Router pages, layouts, and route-specific components. All routes are dynamic based on festival codes.

### Root App Files
- **`layout.tsx`**: Root layout with metadata, Inter font, and React Hot Toast provider.
- **`page.tsx`**: Home/landing page with festival creation/view links and feature highlights.
- **`globals.css`**: Tailwind CSS with custom theme utilities for dark mode, cards, tables, inputs.
- **`favicon.ico`**: App favicon.

### Create Festival (`app/create/`)
- **`page.tsx`**: Festival creation form with validation, generates 8-letter code, inserts to Supabase `festivals` table.

### View Festival (`app/view/`)
- **`page.tsx`**: Festival code input page, verifies existence, redirects to `/f/{code}`.

### Festival Routes (`app/f/[code]/`)
Dynamic routes for festival-specific pages.

#### Main Dashboard (`app/f/[code]/page.tsx`)
- Displays festival info, stats cards, recent transactions.
- Uses `PasswordGate`, `BasicInfo`, `StatsCards`, `BottomNav`.
- Fetches data from Supabase, logs access via `log_festival_access`.

#### Admin Panel (`app/f/[code]/admin/page.tsx`)
- Full CRUD for collections, expenses, groups, categories, modes.
- Password management, festival settings, theme customization.
- Uses `AdminPasswordGate`, tables, modals.

#### Admin Analytics (`app/f/[code]/admin/sup/analytics/page.tsx`)
- Charts and analytics using Recharts (bar, pie, line charts).
- Displays trends, top contributors, collection vs expense.

#### Admin Layout (`app/f/[code]/admin/sup/layout.tsx`)
- Layout for super admin features, wraps analytics page.

#### Collection Management (`app/f/[code]/collection/page.tsx`)
- View/add/edit collections with filtering, sorting, export.
- Uses `CollectionTable`, `AddCollectionModal`.

#### Expense Management (`app/f/[code]/expense/page.tsx`)
- View/add/edit expenses with filtering, sorting, export.
- Uses `ExpenseTable`, `AddExpenseModal`.

#### Transaction History (`app/f/[code]/transaction/page.tsx`)
- Combined view of collections and expenses.
- Uses `TransactionTable`.

#### Showcase (`app/f/[code]/showcase/page.tsx`)
- Media gallery with albums, upload/download/view media.
- Uses `ManageAlbumMediaModal`, `MediaViewerModal`.

## Components Directory (`components/`)

Reusable React components organized by functionality.

### Core Components
- **`PasswordGate.tsx`**: Protects festival pages, handles user password authentication, localStorage sessions.
- **`AdminPasswordGate.tsx`**: Protects admin pages, handles admin password authentication.
- **`BasicInfo.tsx`**: Displays festival metadata (name, organiser, dates, location).
- **`StatsCards.tsx`**: Dashboard statistics (total collection, expense, balance, donators).
- **`BottomNav.tsx`**: Mobile navigation bar for festival pages.
- **`Loader.tsx`**: Loading skeletons for tables, cards, info sections.

### Tables
- **`CollectionTable.tsx`**: Data table for collections with sorting, filtering, pagination, export.
- **`ExpenseTable.tsx`**: Data table for expenses with sorting, filtering, pagination, export.
- **`TransactionTable.tsx`**: Combined collections/expenses table.

### Charts (`components/charts/`)
- **`BarChart.tsx`**: Bar chart for top contributors/donators.
- **`PieChart.tsx`**: Pie chart for collection/expense breakdown.
- **`CollectionVsExpenseChart.tsx`**: Line chart comparing collections vs expenses over time.
- **`TopDonatorsChart.tsx`**: Bar chart for top donators.

### Modals (`components/modals/`)
- **`AddCollectionModal.tsx`**: Form to add/edit collections with validation.
- **`AddExpenseModal.tsx`**: Form to add/edit expenses with validation.
- **`AddEditAlbumModal.tsx`**: Create/edit media albums.
- **`DeleteConfirmModal.tsx`**: Confirmation dialog for deletions.
- **`EditFestivalModal.tsx`**: Edit festival settings (dates, passwords, theme).
- **`ManageAlbumMediaModal.tsx`**: Upload/manage media files in albums.
- **`MediaViewerModal.tsx`**: View media with navigation, download.
- **`StorageStatsModal.tsx`**: Display storage usage statistics.

## Lib Directory (`lib/`)

Utilities and integrations.

### Core Files
- **`supabase.ts`**: Supabase client configuration with environment variables.
- **`utils.ts`**: Utility functions (formatCurrency, formatDate, calculateStats, combineTransactions, generateThumbnailFromVideo, getFileSizeLimit, formatFileSize).
- **`theme.ts`**: Theme utilities (getThemeStyles, getThemeClasses) for dynamic theming.

### Hooks (`lib/hooks/`)
- **`useAdminAuth.ts`**: Hook for admin authentication state.
- **`usePasswordAuth.ts`**: Hook for user password authentication.

## Types Directory (`types/`)

TypeScript interfaces.

- **`index.ts`**: All type definitions:
  - `Festival`: Festival metadata, passwords, theme, dates.
  - `Collection`: Donation record with time fields.
  - `Expense`: Expenditure record with time fields.
  - `Transaction`: Combined collection/expense for history.
  - `Stats`: Dashboard statistics.
  - `Album`: Media album.
  - `MediaItem`: Media file metadata.
  - `AccessLog`: Visitor access record.
  - `FestivalPassword`: Password with label and usage.

## SQL Directory (`SQL/`)

Database schema and migrations.

### Schema
- **`supabase-schema.sql`**: Initial schema with basic_info, collections, expenses, taxonomy tables, passwords.

### Migrations
- **`supabase-migration-multifestive.sql`**: Adds festivals table, festival_id to transactional/taxonomy tables, unique constraints per festival.
- **`supabase-migration-date-password-fields.sql`**: Adds CE dates, super admin password, requires_password, validation triggers, out-of-range functions, festival_date_info view.
- **`supabase-add-time-fields.sql`**: Adds time_hour/time_minute to collections/expenses.
- **`supabase-migration-basic-info.sql`**: Extends basic_info with location and date ranges.
- **`supabase-migration-access-logging.sql`**: Adds access_logs, festival_passwords tables, log_festival_access/verify_festival_password functions, visitor stats views.
- **`supabase-migration-showcase.sql`**: Adds albums, media_items tables for media management.
- **`supabase-showcase-complete-fix.sql`**: Resets RLS policies for albums/media_items.
- **`supabase-showcase-fix.sql`**: Additional RLS fixes.
- **`supabase-storage-fix.sql`**: Storage bucket policies for showcase uploads.
- **`FINAL_FIX.sql`**: Final RLS and permission fixes.

## Configuration Files

### Package Management
- **`package.json`**: Dependencies (next, react, supabase, recharts, lucide-react, react-hot-toast, date-fns, tailwindcss), scripts (dev, build, start, lint).

### Build/Config
- **`next.config.mjs`**: Next.js config (experimental features if any).
- **`tailwind.config.ts`**: Tailwind config with custom theme colors.
- **`postcss.config.mjs`**: PostCSS for Tailwind.
- **`tsconfig.json`**: TypeScript config with paths.
- **`.eslintrc.json`**: ESLint rules.

### Environment
- **`.env.local`**: Supabase URL and anon key.
- **`.env.example`**: Template for env vars.

## Key Features & Usage

### Multi-Festival Support
- Each festival has unique 8-letter code.
- Isolated data via festival_id foreign keys.
- Per-festival passwords, themes, settings.

### Authentication
- User passwords: Access festival dashboard.
- Admin passwords: Access CRUD operations.
- Super admin: Advanced features (future).
- Multiple passwords per festival with labels.
- Session-based (localStorage), expires daily.

### Date Management
- CE (Collection/Expense) dates: Required range for transactions.
- Festival dates: Optional, must be within CE dates.
- Validation triggers prevent invalid dates.
- Out-of-range transaction detection.

### Media Showcase
- Albums for organizing media.
- Support for images, videos, audio, PDFs.
- Upload to Supabase storage bucket 'showcase'.
- Thumbnails for videos, file size limits.

### Analytics & Charts
- Real-time stats: Total collection/expense/balance/donators.
- Charts: Top contributors, collection vs expense trends, breakdowns.
- Access logging: Visitor tracking, password usage stats.

### Theming
- Custom bg color/image, text/border colors.
- Dark mode toggle.
- CSS variables for dynamic theming.

### Mobile-First
- Responsive design with bottom navigation.
- Touch-friendly modals and forms.
- Optimized charts for small screens.

### Data Export
- CSV export for collections/expenses.
- Print-friendly tables.

### Security
- Client-side password protection (suitable for communities).
- RLS policies for public access.
- Access logging for analytics.

## Component Usage Matrix

| Component | Used In Pages | Purpose |
|-----------|---------------|---------|
| PasswordGate | /f/[code]/page.tsx, /f/[code]/collection, etc. | User authentication |
| AdminPasswordGate | /f/[code]/admin/page.tsx | Admin authentication |
| BasicInfo | /f/[code]/page.tsx | Festival metadata display |
| StatsCards | /f/[code]/page.tsx | Dashboard statistics |
| BottomNav | All /f/[code]/* pages | Navigation |
| CollectionTable | /f/[code]/collection/page.tsx | Data display |
| ExpenseTable | /f/[code]/expense/page.tsx | Data display |
| TransactionTable | /f/[code]/transaction/page.tsx | Combined data |
| AddCollectionModal | Collection pages | Add/edit forms |
| AddExpenseModal | Expense pages | Add/edit forms |
| EditFestivalModal | Admin page | Settings |
| ManageAlbumMediaModal | Showcase page | Media management |
| MediaViewerModal | Showcase page | Media viewing |
| BarChart/PieChart/etc. | Analytics page | Data visualization |

## Database Relationships

- **festivals** (1) → (many) **collections**, **expenses**, **groups**, **categories**, **collection_modes**, **expense_modes**, **albums**, **access_logs**, **festival_passwords**
- **albums** (1) → (many) **media_items**
- **basic_info** (legacy, single-row)

## API Patterns

- Direct Supabase queries in components (client-side).
- RPC functions: log_festival_access, verify_festival_password, get_out_of_range_transactions.
- Real-time subscriptions not used (static data).
- File uploads via Supabase storage.

## State Management

- React useState for local component state.
- localStorage for password sessions.
- No global state library (simple app).

## Performance Optimizations

- Database indexes on festival_id, dates, names.
- Pagination in tables (not implemented, but structure ready).
- Lazy loading for modals.
- Optimized queries with select fields.

## Deployment

- Built for Vercel/Netlify with Next.js.
- Environment variables for Supabase.
- Static export possible for simple hosting.

This covers every file, component, SQL migration, and their interconnections in the Donation Book project.

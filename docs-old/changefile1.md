# Change Log (changefile1.md)

This document explains the changes made based on your feedback.

## 1) Input and Dropdown Text Visibility
- Issue: Text typed into inputs and dropdowns appeared invisible.
- Root cause: Global body/text color and background from the starter template could lead to low contrast, especially across themes.
- Fixes:
  - Updated `app/globals.css` to use a neutral light background and dark text by default.
  - Added explicit default color styles for `input`, `select`, `textarea`, and `option` elements to ensure readability across browsers.
  - File: `app/globals.css`

## 2) Event Information Always Visible + Extended Fields
- Requirement: Show event information on top of every page (and editable by admin). Include fields like event/festive name, duration, organiser, guide, location, etc.
- Changes:
  - Extended the database schema to support `location`, `event_start_date`, and `event_end_date` in `basic_info`.
    - Migration file added: `supabase-migration-basic-info.sql`
  - Updated TypeScript types:
    - File: `types/index.ts` (BasicInfo now includes `location`, `event_start_date`, `event_end_date`)
  - Updated Basic Info edit modal to include new fields and styling controls:
    - File: `components/modals/EditBasicInfoModal.tsx`
    - New inputs: Location, Start Date, End Date
    - Styling controls: Title size/weight/align/color (stored in `other_data`)
  - Updated display component to show:
    - Event/Festival name
    - Organiser, Guide, Mentor, Location
    - Festival date range and computed duration in days
    - File: `components/BasicInfo.tsx`
  - Ensured a default `basic_info` row exists so that some information is always shown even if the table is empty. This auto-seeding occurs in all pages when no row is found:
    - Files:
      - `app/page.tsx`
      - `app/collection/page.tsx`
      - `app/expense/page.tsx`
      - `app/transaction/page.tsx`
      - `app/admin/page.tsx`

## 3) Admin Page Password Hint Removal and Decoy Input
- Requirement: Do not hint using a URL parameter for admin access. Show a simple password input that never works (for distraction only).
- Changes:
  - Updated `components/AdminPasswordGate.tsx` to remove the instructional hint.
  - Added a decoy password input form that always shows an error toast on submit.
  - Real admin auth still works via `useAdminAuth` (URL param or today’s token), but there is no visible hint.

## 4) Schema Migration File
- Added `supabase-migration-basic-info.sql` for extending `basic_info` with:
  - `location TEXT`
  - `event_start_date DATE`
  - `event_end_date DATE`
  - Indexes for the new date fields
  - Backfill logic to copy `event_date` to start/end if needed

## 5) Notes on Usage
- After running the migration SQL in Supabase, the Admin can edit the extended fields in the “Edit Event Information” modal.
- The duration is automatically computed when both `event_start_date` and `event_end_date` are set.
- Styling (title size/weight/align/color) can be adjusted by the Admin and is stored in `other_data`.

## Files Changed
- `app/globals.css` (text visibility fixes)
- `types/index.ts` (extend BasicInfo)
- `components/BasicInfo.tsx` (render new fields and duration)
- `components/modals/EditBasicInfoModal.tsx` (new inputs and styling controls; persist in `other_data`)
- `components/AdminPasswordGate.tsx` (remove hint, decoy input)
- `app/page.tsx` (auto-seed basic_info default)
- `app/collection/page.tsx` (auto-seed basic_info default)
- `app/expense/page.tsx` (auto-seed basic_info default)
- `app/transaction/page.tsx` (auto-seed basic_info default)
- `app/admin/page.tsx` (auto-seed basic_info default)
- `supabase-migration-basic-info.sql` (schema changes)

## What You Need To Do
1. Run the migration in Supabase:
   - Open `supabase-migration-basic-info.sql`
   - Paste into Supabase SQL Editor and run
2. (Optional) Update the default seeded values by editing the auto-seed sections in each page or use the Admin panel to set the exact details you want.

If you want the duration stored explicitly rather than computed, we can add a `duration_days` column and keep it in sync on save — let me know. Also, we can move the auto-seeding to a small onetime script if you prefer not to seed from the client.

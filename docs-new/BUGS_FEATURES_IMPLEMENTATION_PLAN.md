# Bugs & Features Implementation Plan

This document outlines the phased implementation plan for fixing bugs and adding features based on manual testing results.

**Festival Code for Testing:** RHSPVM25

---

## 📋 Phases Overview

- **Phase 1:** Critical Navigation & Authentication (Foundation)
- **Phase 2:** Festival Creation & Default Admin Setup (Data Foundation)
- **Phase 3:** Admin Management & Code Change Handling (Core Features)
- **Phase 4:** Analytics & UI Improvements (Feature Enhancements)

---

## 🔴 Phase 1: Critical Navigation & Authentication (Foundation)

**Priority:** CRITICAL - Must be fixed first as it affects basic navigation and user experience.

### 1.1 Fix Festival Creation Redirect
**Issue:** After creating a new festival, system redirects to `/f/[code]` instead of `/f/[code]/admin/sup`

**Fix:**
- Update `app/create/page.tsx` line 184
- Change redirect from `router.push(\`/f/${postCreate.code}\`)` to `router.push(\`/f/${postCreate.code}/admin/sup\`)`
- Also update "Go to Festival Now" button redirect

**Files to Modify:**
- `app/create/page.tsx`

---

### 1.2 Fix Admin/Sup Route Handling
**Issue:** When accessing `/f/[code]/admin/sup` directly (without `/login` or `/dashboard`), it shows "no page" instead of redirecting to `/sup/login` or `/admin/login` if typo (sp, sip, p, etc.)

**Fix:**
- Create `app/f/[code]/admin/sup/page.tsx` (or `layout.tsx`) to handle redirects
- If user has super_admin session → redirect to `/admin/sup/dashboard`
- If user has admin session → redirect to `/admin/login` (show message they need super admin)
- If no session → redirect to `/admin/sup/login`
- Handle typos: if route is `/admin/sp`, `/admin/sip`, `/admin/p` → redirect to `/admin/sup/login` with message

**Files to Create/Modify:**
- `app/f/[code]/admin/sup/page.tsx` (new file)
- `app/f/[code]/admin/sup/layout.tsx` (if needed)

---

### 1.3 Add Password Visibility Toggles
**Issue:** Password visibility toggle is missing from all password inputs throughout the application

**Fix:**
- Add `Eye`/`EyeOff` icons from `lucide-react` to all password inputs
- Default state: hidden (password type)
- Toggle: show/hide password on icon click
- Apply to:
  - Visitor login page (`components/PasswordGate.tsx`)
  - Admin login page (`app/f/[code]/admin/login/page.tsx`)
  - Super admin login page (`app/f/[code]/admin/sup/login/page.tsx`)
  - Admin password section in admin dashboard
  - Super admin password section in super admin dashboard
  - Edit admin modal password fields (`components/modals/EditAdminModal.tsx`)
  - Manage user passwords modal (`components/modals/ManageUserPasswordsModal.tsx`)
  - Any other password inputs

**Files to Modify:**
- `components/PasswordGate.tsx`
- `app/f/[code]/admin/login/page.tsx`
- `app/f/[code]/admin/sup/login/page.tsx`
- `app/f/[code]/admin/page.tsx` (admin password section)
- `app/f/[code]/admin/sup/dashboard/page.tsx` (super admin password section)
- `components/modals/EditAdminModal.tsx`
- `components/modals/ManageUserPasswordsModal.tsx`

---

### 1.4 Add Navigation Links Between Login Pages
**Issue:** Users need easy navigation between visitor, admin, and super admin login pages

**Fix:**
- **Visitor login page** (`PasswordGate.tsx`): Add link to admin login page at bottom
- **Admin login page**: Already has link to super admin login (keep), add link to visitor login page (back to festival home)
- **Super admin login page**: Already has link to admin login (keep), add link to visitor login page (back to festival home)

**Files to Modify:**
- `components/PasswordGate.tsx`
- `app/f/[code]/admin/login/page.tsx`
- `app/f/[code]/admin/sup/login/page.tsx`

---

### 1.5 Remove Number Input Spinners
**Issue:** Number input spinners increase/decrease on scroll, which is irritating

**Fix:**
- Add CSS to hide spinners from all number inputs
- Apply globally via `globals.css`:
  ```css
  /* Hide number input spinners */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
  ```

**Files to Modify:**
- `app/globals.css` or `styles/globals.css`

---

## 🔵 Phase 2: Festival Creation & Default Admin Setup (Data Foundation)

**Priority:** HIGH - Critical for proper data setup and authentication flow.

### 2.1 Fix Password Section in Festival Creation
**Issue:** Admin password and super admin password should be mandatory regardless of visitor password requirement. Only visitor password should be disabled when checkbox is unchecked.

**Current Behavior:**
- All three passwords are required when `requires_password` is checked
- All three are optional when unchecked

**Required Behavior:**
- Admin password: **ALWAYS REQUIRED** (cannot be empty, always visible)
- Super admin password: **ALWAYS REQUIRED** (cannot be empty, always visible)
- Visitor password: **Only required when `requires_password` checkbox is checked** (can be disabled/removed)

**Fix:**
- Update validation in `app/create/page.tsx`:
  - Admin password and super admin password are always validated (lines 100-105)
  - Visitor password is only validated when `requires_password` is true
- Update form UI:
  - Always show admin password and super admin password fields
  - Only show visitor password field when `requires_password` checkbox is checked
  - Update checkbox label: "Requires visitor password to view pages"

**Files to Modify:**
- `app/create/page.tsx`

---

### 2.2 Add Default Admin Name Input
**Issue:** Need to add a "default admin name" input field. The admin password will be the default admin's password. This admin name/code and password are for super admin/admin role credentials (not for visitor login). Visitor passwords will be set under this default admin.

**Fix:**
- Add new form field: `default_admin_name` (or `default_admin_code`)
- Add validation: Required, must be unique within festival
- During festival creation:
  1. Create festival in `festivals` table
  2. Create default admin in `admins` table with:
     - `admin_code`: Generated from `default_admin_name` (or use as-is if code-like)
     - `admin_name`: `default_admin_name`
     - `admin_password_hash`: `admin_password` from form (hash it if needed, currently plain text)
     - `festival_id`: Festival ID
     - `is_active`: true
     - `max_user_passwords`: Default value (e.g., 3)
  3. If `requires_password` is true, create first user password in `user_passwords` table:
     - `admin_id`: Default admin's ID
     - `festival_id`: Festival ID
     - `password`: `user_password` from form
     - `label`: "Default Password" or "Password 1"
     - `is_active`: true

**Note:** The default admin created during festival creation should NOT be visible in admin management initially (or should be marked as "default" and shown separately). However, requirement #4 says to show it, so we'll add it in Phase 3.

**Files to Modify:**
- `app/create/page.tsx`
- May need SQL function or RPC for creating default admin

---

### 2.3 Visitor Password Requirement Logic
**Issue:** When `requires_password` is false, all visitor pages should be accessible without login (free of password gate).

**Fix:**
- Update `components/PasswordGate.tsx`:
  - Check `festival.requires_password` or `festival.requires_user_password`
  - If false, skip password gate and render children directly
- Update all visitor pages to ensure they use `PasswordGate` correctly:
  - `/f/[code]/page.tsx`
  - `/f/[code]/collection/page.tsx`
  - `/f/[code]/expense/page.tsx`
  - `/f/[code]/transaction/page.tsx`
  - `/f/[code]/analytics/page.tsx`
  - `/f/[code]/showcase/page.tsx`
  - `/f/[code]/activity/page.tsx` (visitor's own activity)

**Files to Modify:**
- `components/PasswordGate.tsx`
- Verify all visitor pages are using `PasswordGate` correctly

---

## 🟡 Phase 3: Admin Management & Code Change Handling (Core Features)

**Priority:** MEDIUM - Important for admin functionality and code management.

### 3.1 Show Default Admin in Admin Management
**Issue:** Default admin created during festival creation is not visible in admin management section of super admin dashboard.

**Fix:**
- Update `app/f/[code]/admin/sup/dashboard/page.tsx`:
  - Ensure query includes all admins (no filter for default)
  - Display default admin in the table
  - Add visual indicator (badge or icon) to mark default admin
  - Allow editing default admin (name, password, max_user_passwords)
  - **Do NOT allow deleting default admin** (or show warning if attempted)

**Files to Modify:**
- `app/f/[code]/admin/sup/dashboard/page.tsx`

---

### 3.2 Show Current Password in Admin Edit Modal
**Issue:** Super admin can change admin password but cannot see the current password, so they have to change it every time.

**Fix:**
- Update `components/modals/EditAdminModal.tsx`:
  - Add password visibility toggle (already planned in Phase 1.3)
  - Fetch current admin password from database (if stored)
  - Display current password in read-only field with show/hide toggle
  - Keep "Change Password" checkbox functionality
  - When checkbox is checked, show new password and confirm password fields
  - Add note: "Current password is displayed above. Check 'Change Password' to update."

**Challenge:** Need to check if password is stored in plain text or hashed. If hashed, cannot display original. Current implementation seems to store in `admin_password_hash` field. Need to check SQL schema.

**Files to Modify:**
- `components/modals/EditAdminModal.tsx`
- May need to check SQL schema for `admins` table

---

### 3.3 Fix Festival Code Change Handling
**Issue:** When super admin changes festival code, system shows "error failed fetching" because page doesn't reload and redirect handler doesn't update URL. Admin/super admin should be logged out and required to re-login.

**Fix:**
- Update `lib/festivalCodeRedirect.ts`:
  - After code change, clear session from localStorage
  - Redirect to `/f/[new_code]/admin/sup/login` for super admin
  - Redirect to `/f/[new_code]/admin/login` for admin (if they had admin session)
- Update `app/f/[code]/admin/sup/dashboard/page.tsx`:
  - After successful code update in `handleUpdateFestivalCode`:
    - Clear session: `localStorage.removeItem('session')` or use `logout()` from `useSession`
    - Show success message with new code
    - Redirect to `/f/[new_code]/admin/sup/login` after short delay (e.g., 2 seconds)
    - Add message: "Festival code updated. Please log in again with the new code."

**Files to Modify:**
- `lib/festivalCodeRedirect.ts`
- `app/f/[code]/admin/sup/dashboard/page.tsx`
- May need to update `lib/hooks/useSession.ts` to add `logout()` function if not exists

---

### 3.4 Remove Duplicate Settings from Edit Festival Modal
**Issue:** Edit festival modal contains duplicate settings that are already available elsewhere:
- Banner Display Settings → Already in super admin dashboard
- Analytics Settings → Already in analytics config modal in admin dashboard
- Password Settings → Already handled:
  - Super admin password change: Section in super admin dashboard
  - Default admin password/name: Admin management section
  - Visitor passwords: Manage user passwords modal in admin dashboard

**Fix:**
- Update `components/modals/EditFestivalModal.tsx`:
  - Remove "Banner Display Settings" section (lines ~66-71, ~186-191)
  - Remove "Analytics Settings" section (if exists, check lines ~192-200)
  - Remove "Password Settings" section (lines ~29-31, ~98-101, ~183-185)
  - Keep only:
    - Basic Information (event name, organiser, mentor, guide, location, dates)
    - Collection/Expense Date Range (CE dates)
    - Festival Event Dates
    - Theme Settings (if applicable)

**Files to Modify:**
- `components/modals/EditFestivalModal.tsx`

---

## 🟢 Phase 4: Analytics & UI Improvements (Feature Enhancements)

**Priority:** MEDIUM-LOW - Enhancements and fixes for better user experience.

### 4.1 Fix Analytics Config Saving
**Issue:** Analytics config modal shows "Failed to save configuration" error. Buckets, previous year, targets are not being saved.

**Investigation Needed:**
- Check `components/modals/AnalyticsConfigModal.tsx`:
  - `handleSaveConfig` function (lines 105-128)
  - Verify database table structure: `analytics_config`, `donation_buckets`, `time_of_day_buckets`
  - Check SQL schema files for these tables
  - Verify RLS policies allow updates
  - Check if `festival_id` is correctly passed

**Possible Issues:**
- Missing `updated_at` field in update
- RLS policy blocking update
- Foreign key constraint issue
- Data type mismatch (e.g., `target_visibility` should be `"public" | "admin_only"` but stored as boolean)

**Fix:**
- Review SQL schema files in `SQL/` directory
- Fix data type issues
- Fix RLS policies if needed
- Update `handleSaveConfig` to handle errors properly
- Add validation before saving

**Files to Modify:**
- `components/modals/AnalyticsConfigModal.tsx`
- May need SQL migration file: `SQL-new/002-FIX-ANALYTICS-CONFIG.sql`

---

### 4.2 Fix Visitor Password Management System
**Issue:** Visitor password management system from admin dashboard is missing or incomplete. Need full functionality: adding allowed passwords, flag (active/inactive), view count of password usage, etc.

**Current State:**
- `components/modals/ManageUserPasswordsModal.tsx` exists (730 lines)
- Need to verify all features are present:
  - ✅ Add password (with label)
  - ✅ Edit password
  - ✅ Delete password
  - ✅ Activate/Deactivate password (is_active flag)
  - ✅ View usage count
  - ✅ View last used date
  - ✅ View visitor usage details (modal)
  - ❓ Max passwords limit enforcement
  - ❓ Password uniqueness within festival

**Fix:**
- Review `components/modals/ManageUserPasswordsModal.tsx`
- Ensure all CRUD operations work correctly
- Verify admin ID is correctly passed from admin dashboard
- Check if modal is properly opened from admin dashboard
- Add missing features if any:
  - Usage statistics display
  - Active/inactive toggle
  - Password validation

**Files to Modify:**
- `components/modals/ManageUserPasswordsModal.tsx`
- `app/f/[code]/admin/page.tsx` (verify modal integration)

---

### 4.3 Add collection_by/expense_by Fields for Super Admin
**Issue:** When super admin is logged in but on admin page, while adding collections/expenses, there should be an extra field for `collection_by` and `expense_by`. This should track who created the transaction.

**Investigation Needed:**
- Check if `collections` and `expenses` tables have `created_by` or similar fields
- Check SQL schema for these tables
- Verify if this field exists but is not shown in the form

**Implementation:**
- If field exists in database:
  - Add input field to `components/modals/AddCollectionModal.tsx`
  - Add input field to `components/modals/AddExpenseModal.tsx`
  - Show only when super admin is logged in
  - Auto-fill with super admin name/code if not provided
- If field doesn't exist:
  - Create SQL migration to add `created_by` or `collection_by`/`expense_by` fields
  - Add columns: `created_by_admin_id`, `created_by_type` (admin/super_admin), `created_by_name`
  - Update modals to include these fields

**Files to Modify:**
- `components/modals/AddCollectionModal.tsx`
- `components/modals/AddExpenseModal.tsx`
- May need SQL migration: `SQL-new/003-ADD-COLLECTION-EXPENSE-BY-FIELDS.sql`

---

### 4.4 Fix Import JSON Modal Height Issue
**Issue:** Import JSON modal (for collections or expenses) height gets too big, making buttons unreachable.

**Fix:**
- Update modal component (check `AddCollectionModal.tsx` or `AddExpenseModal.tsx` for import functionality):
  - Add `max-h-[90vh]` or `max-h-screen` class to modal container
  - Add `overflow-y-auto` to scrollable content area
  - Keep header and footer sticky
  - Ensure buttons are always visible at bottom

**Files to Modify:**
- `components/modals/AddCollectionModal.tsx` (if import is here)
- `components/modals/AddExpenseModal.tsx` (if import is here)
- Or check `app/f/[code]/admin/page.tsx` for import modals

---

### 4.5 Add Bottom Navigation to Analytics Page
**Issue:** `/f/[code]/analytics` page doesn't have the global bottom banner (GlobalSessionBar) with proper navigation back to home and activity page.

**Fix:**
- Update `app/f/[code]/analytics/page.tsx`:
  - Add `GlobalSessionBar` component (if not present)
  - Add `BottomNav` component (if not present)
  - Ensure navigation links work correctly

**Files to Modify:**
- `app/f/[code]/analytics/page.tsx`

---

### 4.6 Fix Code Redirect Handler for /view Page
**Issue:** When festival code is changed, if user tries to view old code in `/view` page, it should show "code has been updated" message instead of error, and redirect to new code.

**Fix:**
- Update `app/view/page.tsx`:
  - After checking if festival exists (line 29-46):
    - If not found, check `festival_code_history` table for old code
    - If found in history, show success message: "Festival code has been updated. Redirecting to new code..."
    - Redirect to `/f/[new_code]`
  - Use `resolveCurrentFestivalCode` from `lib/festivalCodeRedirect.ts`

**Files to Modify:**
- `app/view/page.tsx`
- May leverage `lib/festivalCodeRedirect.ts`

---

## 📝 Notes & Clarifications Needed

### Questions for User:
1. **Default Admin Naming:**
   - Should default admin name be editable after creation?
   - Should default admin have a special indicator in admin management?

2. **Password Storage:**
   - Are passwords stored in plain text or hashed? (Affects showing current password in edit modal)
   - If hashed, we cannot show original password, only allow changing.

3. **collection_by/expense_by Fields:**
   - Do these fields exist in the database schema?
   - Should they be optional or required?
   - Should they auto-fill with session user info?

4. **Analytics Config:**
   - Can you provide the exact error message from browser console when saving fails?
   - Are there any SQL constraint errors?

---

## ✅ Implementation Checklist

### Phase 1
- [ ] 1.1 Fix festival creation redirect
- [ ] 1.2 Fix admin/sup route handling
- [ ] 1.3 Add password visibility toggles
- [ ] 1.4 Add navigation links between login pages
- [ ] 1.5 Remove number input spinners

### Phase 2
- [ ] 2.1 Fix password section in festival creation
- [ ] 2.2 Add default admin name input
- [ ] 2.3 Visitor password requirement logic

### Phase 3
- [ ] 3.1 Show default admin in admin management
- [ ] 3.2 Show current password in admin edit modal
- [ ] 3.3 Fix festival code change handling
- [ ] 3.4 Remove duplicate settings from edit festival modal

### Phase 4
- [ ] 4.1 Fix analytics config saving
- [ ] 4.2 Fix visitor password management system
- [ ] 4.3 Add collection_by/expense_by fields for super admin
- [ ] 4.4 Fix import JSON modal height issue
- [ ] 4.5 Add bottom navigation to analytics page
- [ ] 4.6 Fix code redirect handler for /view page

---

**Total Tasks:** 18  
**Estimated Phases:** 4  
**Estimated Time:** 2-3 days (depending on complexity and testing)

---

**Last Updated:** 2026-01-10  
**Status:** Awaiting Approval

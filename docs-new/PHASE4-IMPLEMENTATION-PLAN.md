# Phase 4 Implementation Plan - Divided into 2 Stages

**Festival Code for Testing:** RHSPVM25

---

## 📋 Phase 4 Overview

**Priority:** MEDIUM-LOW - Enhancements and fixes for better user experience.

---

## ✅ Stage 1: Clear Vision Features (Ready to Implement)

These features have clear requirements and can be implemented immediately.

### 4.4 Fix Import JSON Modal Height Issue
**Issue:** Import JSON modal (for collections or expenses) height gets too big, making buttons unreachable.

**Fix:**
- Update modal component to handle overflow
- Add `max-h-[90vh]` or `max-h-screen` class to modal container
- Add `overflow-y-auto` to scrollable content area
- Keep header and footer sticky
- Ensure buttons are always visible at bottom

**Files to Modify:**
- `components/modals/AddCollectionModal.tsx` (if import is here)
- `components/modals/AddExpenseModal.tsx` (if import is here)

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
  - After checking if festival exists, check `festival_code_history` table for old code
  - If found in history, show success message: "Festival code has been updated. Redirecting to new code..."
  - Redirect to `/f/[new_code]`
  - Use `resolveCurrentFestivalCode` from `lib/festivalCodeRedirect.ts`

**Files to Modify:**
- `app/view/page.tsx`
- Leverage existing `lib/festivalCodeRedirect.ts`

---

## 💬 Stage 2: Features Needing Discussion (After Stage 1)

These features need clarification or investigation before implementation.

### 4.1 Fix Analytics Config Saving
**Issue:** Analytics config modal shows "Failed to save configuration" error. Buckets, previous year, targets are not being saved.

**Needs Discussion:**
- What is the exact error message from browser console when saving fails?
- Are there any SQL constraint errors?
- Can you provide steps to reproduce the issue?
- What specific fields are failing to save?

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

**Files to Modify:**
- `components/modals/AnalyticsConfigModal.tsx`
- May need SQL migration file: `SQL-new/004-FIX-ANALYTICS-CONFIG.sql`

---

### 4.2 Fix Visitor Password Management System
**Issue:** Visitor password management system from admin dashboard is missing or incomplete. Need full functionality: adding allowed passwords, flag (active/inactive), view count of password usage, etc.

**Needs Discussion:**
- Is the modal currently accessible from admin dashboard?
- What specific features are missing or broken?
- Are all CRUD operations (Create, Read, Update, Delete) working?
- Is max passwords limit enforcement working?
- Is password uniqueness within festival enforced?

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

**Files to Modify:**
- `components/modals/ManageUserPasswordsModal.tsx`
- `app/f/[code]/admin/page.tsx` (verify modal integration)

---

### 4.3 Add collection_by/expense_by Fields for Super Admin
**Issue:** When super admin is logged in but on admin page, while adding collections/expenses, there should be an extra field for `collection_by` and `expense_by`. This should track who created the transaction.

**Needs Discussion:**
- Do these fields already exist in the database schema?
- Should they be optional or required?
- Should they auto-fill with session user info?
- What format should the "by" field store? (admin_code, admin_name, or both?)
- Should this be a dropdown of existing admins or free text?
- Should regular admins be able to see/edit this field?

**Investigation Needed:**
- Check if `collections` and `expenses` tables have `created_by` or similar fields
- Check SQL schema for these tables
- Verify if this field exists but is not shown in the form

**Possible Implementation:**
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
- May need SQL migration: `SQL-new/005-ADD-COLLECTION-EXPENSE-BY-FIELDS.sql`

---

## 📊 Summary

### Stage 1 (Ready Now):
- ✅ 4.4 Fix Import JSON Modal Height Issue
- ✅ 4.5 Add Bottom Navigation to Analytics Page
- ✅ 4.6 Fix Code Redirect Handler for /view Page

**Total Tasks:** 3  
**Estimated Time:** 1-2 hours

### Stage 2 (Needs Discussion):
- ❓ 4.1 Fix Analytics Config Saving (needs error details)
- ❓ 4.2 Fix Visitor Password Management System (needs verification)
- ❓ 4.3 Add collection_by/expense_by Fields (needs design decisions)

**Total Tasks:** 3  
**Estimated Time:** TBD (after discussion)

---

**Status:** Stage 1 - READY TO IMPLEMENT  
**Next Step:** Implement Stage 1 features

---

**Last Updated:** 2026-01-10

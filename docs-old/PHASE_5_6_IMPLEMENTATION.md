# Phase 5 & 6 Implementation Guide

## Overview
This document outlines the remaining implementation tasks for the date range and password system. Phases 3 and 4 (Create Festival Form and Edit Festival Modal) have been completed.

---

## ✅ Completed Phases

### Phase 1: Database Migration ✓
- Created `supabase-migration-date-password-fields.sql`
- Added `ce_start_date`, `ce_end_date` columns
- Added `super_admin_password` column
- Added `requires_password` boolean column
- Created validation functions and triggers
- Created helper functions for out-of-range transaction checking

### Phase 2: TypeScript Types ✓
- Updated `Festival` interface with new fields
- Added `OutOfRangeTransactions` interface
- Added `FestivalDateInfo` interface

### Phase 3: Create Festival Form ✓
- Updated `app/create/page.tsx`
- Added CE date fields (required)
- Added Festival date fields (optional, within CE range)
- Added Super Admin password field
- Added password warning modal with "I Understand" button
- Implemented inline validation
- Hide password fields when unchecked

### Phase 4: Edit Festival Modal ✓
- Updated `components/modals/EditFestivalModal.tsx`
- Added CE date fields with validation
- Added out-of-range transaction checking
- Added Super Admin password field
- Added password warning modal
- Implemented inline validation

---

## 🚧 Phase 5: Collection/Expense Modals

### Files to Update:
1. `components/modals/AddCollectionModal.tsx`
2. `components/modals/AddExpenseModal.tsx`

### Requirements:

#### 1. Restrict Date Picker to CE Date Range
- Fetch festival's `ce_start_date` and `ce_end_date`
- Set `min` and `max` attributes on date input
- Show info message about valid date range

#### 2. Date Validation
- Validate selected date is within CE range
- Show inline error if date is outside range
- Prevent submission if validation fails

#### 3. Handle Missing CE Dates
- If festival doesn't have CE dates set, show warning
- Prompt admin to set CE dates first
- Disable date picker until CE dates are set

### Implementation Example:

\`\`\`typescript
// In AddCollectionModal.tsx
const [festival, setFestival] = useState<Festival | null>(null);
const [dateError, setDateError] = useState('');

useEffect(() => {
  // Fetch festival data
  const fetchFestival = async () => {
    const { data } = await supabase
      .from('festivals')
      .select('ce_start_date, ce_end_date')
      .eq('id', festivalId)
      .single();
    setFestival(data);
  };
  fetchFestival();
}, [festivalId]);

// Validate date
const validateDate = (date: string) => {
  if (!festival?.ce_start_date || !festival?.ce_end_date) {
    setDateError('Collection/Expense dates not set for this festival');
    return false;
  }
  
  if (date < festival.ce_start_date || date > festival.ce_end_date) {
    setDateError(`Date must be between ${festival.ce_start_date} and ${festival.ce_end_date}`);
    return false;
  }
  
  setDateError('');
  return true;
};

// In JSX
<div>
  <label>Date *</label>
  {festival?.ce_start_date && festival?.ce_end_date ? (
    <>
      <input
        type="date"
        min={festival.ce_start_date}
        max={festival.ce_end_date}
        value={formData.date}
        onChange={(e) => {
          setFormData({ ...formData, date: e.target.value });
          validateDate(e.target.value);
        }}
        className={dateError ? 'border-red-500' : ''}
      />
      {dateError && <p className="text-red-500 text-xs">{dateError}</p>}
      <p className="text-xs text-gray-500">
        Valid range: {festival.ce_start_date} to {festival.ce_end_date}
      </p>
    </>
  ) : (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
      <p className="text-sm text-yellow-800">
        Collection/Expense date range not set. Please contact admin to set dates first.
      </p>
    </div>
  )}
</div>
\`\`\`

### Testing Checklist:
- [ ] Date picker shows correct min/max range
- [ ] Validation error shows when date is outside range
- [ ] Cannot submit with invalid date
- [ ] Info message shows valid date range
- [ ] Warning shows when CE dates not set
- [ ] Works for both single and bulk entry modes

---

## 🚧 Phase 6: Admin Page Password Management

### Files to Update:
1. `app/f/[code]/admin/page.tsx`

### Requirements:

#### 1. Add Super Admin Password Section
- Add new section after Admin Password
- Show current super admin password (masked)
- Allow editing super admin password
- Update timestamp when changed

#### 2. Update Password Management UI
- Group all three passwords together
- Show last updated timestamp for each
- Add visual hierarchy (User → Admin → Super Admin)
- Add tooltips explaining each password level

#### 3. Validation
- Ensure all three passwords are different
- Minimum length requirements
- Show strength indicator
- Confirm password change with modal

### Implementation Example:

\`\`\`typescript
// In admin page
const [passwords, setPasswords] = useState({
  user_password: '',
  admin_password: '',
  super_admin_password: '',
});

const [editingPassword, setEditingPassword] = useState<'user' | 'admin' | 'super' | null>(null);

// Password update function
const updatePassword = async (type: 'user' | 'admin' | 'super', newPassword: string) => {
  const field = type === 'user' ? 'user_password' : 
                type === 'admin' ? 'admin_password' : 
                'super_admin_password';
  
  const timestampField = `${field}_updated_at`;
  
  const { error } = await supabase
    .from('festivals')
    .update({
      [field]: newPassword,
      [timestampField]: new Date().toISOString(),
    })
    .eq('id', festivalId);
    
  if (error) throw error;
  toast.success(`${type} password updated`);
};

// In JSX
<div className="space-y-6">
  <h3 className="text-lg font-semibold">Password Management</h3>
  
  {/* User Password */}
  <div className="border rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <div>
        <h4 className="font-medium">User Password</h4>
        <p className="text-sm text-gray-600">For viewing festival data</p>
      </div>
      <button onClick={() => setEditingPassword('user')}>Edit</button>
    </div>
    <p className="text-sm text-gray-500">
      Last updated: {formatDate(festival.user_password_updated_at)}
    </p>
  </div>
  
  {/* Admin Password */}
  <div className="border rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <div>
        <h4 className="font-medium">Admin Password</h4>
        <p className="text-sm text-gray-600">For managing collections and expenses</p>
      </div>
      <button onClick={() => setEditingPassword('admin')}>Edit</button>
    </div>
    <p className="text-sm text-gray-500">
      Last updated: {formatDate(festival.admin_password_updated_at)}
    </p>
  </div>
  
  {/* Super Admin Password */}
  <div className="border rounded-lg p-4 border-purple-200 bg-purple-50">
    <div className="flex items-center justify-between mb-2">
      <div>
        <h4 className="font-medium text-purple-900">Super Admin Password</h4>
        <p className="text-sm text-purple-700">For advanced features and analytics</p>
      </div>
      <button onClick={() => setEditingPassword('super')}>Edit</button>
    </div>
    <p className="text-sm text-purple-600">
      Last updated: {formatDate(festival.super_admin_password_updated_at)}
    </p>
  </div>
</div>
\`\`\`

### Testing Checklist:
- [ ] All three passwords display correctly
- [ ] Can edit each password independently
- [ ] Timestamps update correctly
- [ ] Validation works (different passwords, min length)
- [ ] UI clearly shows password hierarchy
- [ ] Tooltips explain each password level
- [ ] Confirmation modal works
- [ ] Password masking works correctly

---

## 📋 Additional Considerations

### 1. Migration for Existing Festivals
- Existing festivals will have NULL CE dates
- Admin must set CE dates before adding new collections/expenses
- Show prominent warning in admin panel if CE dates not set
- Provide quick action button to set CE dates

### 2. Backward Compatibility
- Keep `requires_user_password` field for backward compatibility
- Sync `requires_password` with `requires_user_password`
- Ensure old festivals continue to work

### 3. Error Handling
- Handle database trigger errors gracefully
- Show user-friendly error messages
- Log errors for debugging
- Provide recovery options

### 4. Performance
- Cache festival CE dates in modals
- Minimize database queries
- Use indexes for date range queries
- Optimize out-of-range transaction checks

### 5. User Experience
- Clear error messages
- Helpful tooltips and info boxes
- Visual feedback for validation
- Smooth transitions and animations
- Mobile-responsive design

---

## 🧪 Testing Strategy

### Unit Tests
- Date validation logic
- Password validation logic
- Out-of-range transaction detection

### Integration Tests
- Create festival with CE dates
- Edit CE dates with existing transactions
- Add collection/expense within date range
- Add collection/expense outside date range (should fail)
- Toggle password requirement
- Update all three passwords

### E2E Tests
1. **Happy Path**:
   - Create festival with all fields
   - Add collections within date range
   - Add expenses within date range
   - Edit festival CE dates
   - Update passwords

2. **Error Cases**:
   - Try to add collection outside CE range
   - Try to set festival dates outside CE range
   - Try to set CE end date before start date
   - Try to submit without required passwords

3. **Edge Cases**:
   - Festival with no CE dates
   - Festival with no password requirement
   - Changing CE dates with many transactions
   - Same date for CE start and end

---

## 📝 Documentation Updates Needed

### README.md
- Update with new CE date range feature
- Explain password hierarchy (User/Admin/Super Admin)
- Add migration instructions for existing festivals

### SETUP.md
- Add step to set CE dates when creating festival
- Explain password requirements
- Add troubleshooting for date range issues

### API Documentation
- Document new database fields
- Document validation functions
- Document helper functions

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Run database migration script
- [ ] Test on staging environment
- [ ] Verify existing festivals still work
- [ ] Test all date validations
- [ ] Test password management
- [ ] Update documentation
- [ ] Create backup of database
- [ ] Monitor for errors after deployment
- [ ] Prepare rollback plan

---

## 📞 Support

If you encounter issues during implementation:

1. Check database migration logs
2. Verify all required fields are present
3. Test validation functions in SQL editor
4. Check browser console for errors
5. Review Supabase logs

---

## 🎯 Success Criteria

Phase 5 & 6 will be considered complete when:

- [ ] All collection/expense date pickers respect CE range
- [ ] Inline validation works correctly
- [ ] Super Admin password management is functional
- [ ] All three passwords can be updated independently
- [ ] Timestamps update correctly
- [ ] UI is intuitive and user-friendly
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No regressions in existing functionality

---

**Last Updated**: January 2025  
**Status**: Phases 1-4 Complete, Phases 5-6 Pending Implementation

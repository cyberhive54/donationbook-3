'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { X, User, Lock, Hash, Users, Calendar, LogIn, Eye, EyeOff } from 'lucide-react';
import { Admin } from '@/types';
import { formatDate } from '@/lib/utils';

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admin: Admin | null;
  festivalId: string;
  superAdminId?: string;
}

export default function EditAdminModal({
  isOpen,
  onClose,
  onSuccess,
  admin,
  festivalId,
  superAdminId
}: EditAdminModalProps) {
  const [adminCode, setAdminCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [maxUserPasswords, setMaxUserPasswords] = useState(3);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPasswordCount, setCurrentPasswordCount] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    if (isOpen && admin) {
      setAdminCode(admin.admin_code);
      setAdminName(admin.admin_name);
      setMaxUserPasswords(admin.max_user_passwords);
      setIsActive(admin.is_active);
      setChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword(admin.admin_password_hash || ''); // Passwords are stored as plain text
      setShowCurrentPassword(false);
      fetchPasswordCount();
    }
  }, [isOpen, admin]);

  const fetchPasswordCount = async () => {
    if (!admin) return;
    try {
      const { count } = await supabase
        .from('user_passwords')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', admin.admin_id);
      setCurrentPasswordCount(count || 0);
    } catch (error) {
      console.error('Error fetching password count:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!admin) return;

    // Validation
    if (!adminCode.trim()) {
      toast.error('Admin code is required');
      return;
    }

    if (!adminName.trim()) {
      toast.error('Admin name is required');
      return;
    }

    if (changePassword) {
      if (!newPassword.trim()) {
        toast.error('New password is required');
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    if (maxUserPasswords < 1 || maxUserPasswords > 10) {
      toast.error('Max user passwords must be between 1 and 10');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if admin code already exists (excluding current admin)
      if (adminCode.trim().toUpperCase() !== admin.admin_code) {
        const { data: existingCode } = await supabase
          .from('admins')
          .select('admin_code')
          .eq('festival_id', festivalId)
          .eq('admin_code', adminCode.trim().toUpperCase())
          .neq('admin_id', admin.admin_id)
          .single();

        if (existingCode) {
          toast.error('Admin code already exists. Please use a different code.');
          setIsSubmitting(false);
          return;
        }
      }

      // Check if admin name already exists (excluding current admin)
      if (adminName.trim().toLowerCase() !== admin.admin_name.toLowerCase()) {
        const { data: existingName } = await supabase
          .from('admins')
          .select('admin_name')
          .eq('festival_id', festivalId)
          .ilike('admin_name', adminName.trim())
          .neq('admin_id', admin.admin_id)
          .single();

        if (existingName) {
          toast.error('Admin name already exists. Please use a different name.');
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare update data
      const updateData: any = {
        admin_code: adminCode.trim().toUpperCase(),
        admin_name: adminName.trim(),
        max_user_passwords: maxUserPasswords,
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      // If password is being changed, hash it
      if (changePassword && newPassword.trim()) {
        updateData.admin_password_hash = newPassword.trim(); // TODO: Implement bcrypt hashing
      }

      // Update admin
      const { error: updateError } = await supabase
        .from('admins')
        .update(updateData)
        .eq('admin_id', admin.admin_id);

      if (updateError) throw updateError;

      // If admin is being deactivated, deactivate all their user passwords
      if (!isActive && admin.is_active) {
        await supabase
          .from('user_passwords')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('admin_id', admin.admin_id);
      }

      // Log activity
      await supabase.rpc('log_admin_activity', {
        p_festival_id: festivalId,
        p_admin_id: superAdminId || null,
        p_action_type: 'edit_admin',
        p_action_details: {
          admin_id: admin.admin_id,
          admin_code: adminCode.trim().toUpperCase(),
          admin_name: adminName.trim(),
          max_user_passwords: maxUserPasswords,
          is_active: isActive,
          password_changed: changePassword,
          deactivated_passwords: !isActive && admin.is_active
        }
      });

      toast.success('Admin updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating admin:', error);
      toast.error(error.message || 'Failed to update admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !admin) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Edit Admin</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Admin Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Created: {formatDate(admin.created_at)}</span>
            </div>
            {admin.updated_at && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Last Updated: {formatDate(admin.updated_at)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <LogIn className="w-4 h-4" />
              <span>Current User Passwords: {currentPasswordCount} / {admin.max_user_passwords}</span>
            </div>
          </div>

          {/* Admin Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Code <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
                placeholder="e.g., ADM001"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                maxLength={6}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Admin Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g., John Admin"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                readOnly
                placeholder="Current password"
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
                disabled={true}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-lg transition-colors"
                disabled={isSubmitting}
                title={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current password is displayed above. Check &quot;Change Password&quot; below to update it.
            </p>
          </div>

          {/* Change Password Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="changePassword"
              checked={changePassword}
              onChange={(e) => setChangePassword(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <label htmlFor="changePassword" className="text-sm font-medium text-gray-700">
              Change Password
            </label>
          </div>

          {/* Password Fields (conditional) */}
          {changePassword && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required={changePassword}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required={changePassword}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Max User Passwords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max User Passwords
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={maxUserPasswords}
                onChange={(e) => setMaxUserPasswords(parseInt(e.target.value) || 3)}
                min={1}
                max={10}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Currently using: {currentPasswordCount} / {maxUserPasswords}
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active (admin can login)
            </label>
          </div>

          {!isActive && admin.is_active && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <strong>Warning:</strong> Deactivating this admin will also deactivate all their user passwords immediately.
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

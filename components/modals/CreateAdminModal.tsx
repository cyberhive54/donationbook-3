'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { X, User, Lock, Hash, Users } from 'lucide-react';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  festivalId: string;
  festivalCode: string;
  superAdminId?: string; // For logging who created this admin
}

export default function CreateAdminModal({
  isOpen,
  onClose,
  onSuccess,
  festivalId,
  festivalCode,
  superAdminId
}: CreateAdminModalProps) {
  const [adminCode, setAdminCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [maxUserPasswords, setMaxUserPasswords] = useState(3);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate admin code on mount
  useEffect(() => {
    if (isOpen && !adminCode) {
      generateAdminCode();
    }
  }, [isOpen]);

  const generateAdminCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminCode(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!adminCode.trim()) {
      toast.error('Admin code is required');
      return;
    }

    if (!adminName.trim()) {
      toast.error('Admin name is required');
      return;
    }

    if (!password.trim()) {
      toast.error('Password is required');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (maxUserPasswords < 1 || maxUserPasswords > 10) {
      toast.error('Max user passwords must be between 1 and 10');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if admin code already exists
      const { data: existingCode } = await supabase
        .from('admins')
        .select('admin_code')
        .eq('festival_id', festivalId)
        .eq('admin_code', adminCode.trim().toUpperCase())
        .single();

      if (existingCode) {
        toast.error('Admin code already exists. Please use a different code.');
        setIsSubmitting(false);
        return;
      }

      // Check if admin name already exists
      const { data: existingName } = await supabase
        .from('admins')
        .select('admin_name')
        .eq('festival_id', festivalId)
        .ilike('admin_name', adminName.trim())
        .single();

      if (existingName) {
        toast.error('Admin name already exists. Please use a different name.');
        setIsSubmitting(false);
        return;
      }

      // Hash password using bcrypt (client-side for now, should be server-side in production)
      // For now, we'll store plain text but in production use bcrypt
      const passwordHash = password.trim(); // TODO: Implement bcrypt hashing

      // Insert new admin
      const { data: newAdmin, error: insertError } = await supabase
        .from('admins')
        .insert({
          festival_id: festivalId,
          admin_code: adminCode.trim().toUpperCase(),
          admin_name: adminName.trim(),
          admin_password_hash: passwordHash,
          is_active: isActive,
          max_user_passwords: maxUserPasswords,
          created_by: superAdminId || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log activity
      await supabase.rpc('log_admin_activity', {
        p_festival_id: festivalId,
        p_admin_id: superAdminId || null,
        p_action_type: 'create_admin',
        p_action_details: {
          admin_code: adminCode.trim().toUpperCase(),
          admin_name: adminName.trim(),
          max_user_passwords: maxUserPasswords,
          is_active: isActive
        }
      });

      toast.success(`Admin ${adminCode.trim().toUpperCase()} created successfully!`);
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Failed to create admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAdminCode('');
    setAdminName('');
    setPassword('');
    setConfirmPassword('');
    setMaxUserPasswords(3);
    setIsActive(true);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Create New Admin</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Admin Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Code <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
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
              <button
                type="button"
                onClick={generateAdminCode}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">6 characters, editable</p>
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

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

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
            <p className="text-xs text-gray-500 mt-1">Number of user passwords this admin can create (1-10)</p>
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
              {isSubmitting ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

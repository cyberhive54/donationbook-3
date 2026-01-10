'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { X, AlertTriangle, Lock } from 'lucide-react';
import { Admin } from '@/types';
import { formatDate } from '@/lib/utils';

interface DeleteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admin: Admin | null;
  festivalId: string;
  superAdminId?: string;
}

export default function DeleteAdminModal({
  isOpen,
  onClose,
  onSuccess,
  admin,
  festivalId,
  superAdminId
}: DeleteAdminModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [stats, setStats] = useState({
    userPasswordCount: 0,
    collectionCount: 0,
    expenseCount: 0,
    hasRecords: false
  });

  useEffect(() => {
    if (isOpen && admin) {
      fetchStats();
      setSuperAdminPassword('');
      setUnderstood(false);
    }
  }, [isOpen, admin]);

  const fetchStats = async () => {
    if (!admin) return;

    try {
      // Get user password count
      const { count: passwordCount } = await supabase
        .from('user_passwords')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', admin.admin_id);

      // Get collection count
      const { count: collectionCount } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('created_by_admin_id', admin.admin_id);

      // Get expense count
      const { count: expenseCount } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('created_by_admin_id', admin.admin_id);

      const hasRecords = (collectionCount || 0) > 0 || (expenseCount || 0) > 0;

      setStats({
        userPasswordCount: passwordCount || 0,
        collectionCount: collectionCount || 0,
        expenseCount: expenseCount || 0,
        hasRecords
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeactivate = async () => {
    if (!admin) return;

    setIsSubmitting(true);

    try {
      // Deactivate admin
      const { error: updateError } = await supabase
        .from('admins')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('admin_id', admin.admin_id);

      if (updateError) throw updateError;

      // Deactivate all user passwords
      await supabase
        .from('user_passwords')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('admin_id', admin.admin_id);

      // Log activity
      await supabase.rpc('log_admin_activity', {
        p_festival_id: festivalId,
        p_admin_id: superAdminId || null,
        p_action_type: 'deactivate_admin',
        p_action_details: {
          admin_id: admin.admin_id,
          admin_code: admin.admin_code,
          admin_name: admin.admin_name,
          reason: 'has_existing_records'
        }
      });

      toast.success('Admin deactivated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error deactivating admin:', error);
      toast.error(error.message || 'Failed to deactivate admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!admin) return;

    if (!superAdminPassword.trim()) {
      toast.error('Please enter super admin password');
      return;
    }

    if (!understood) {
      toast.error('Please confirm you understand this action');
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify super admin password
      const { data: festival } = await supabase
        .from('festivals')
        .select('super_admin_password')
        .eq('id', festivalId)
        .single();

      if (!festival || festival.super_admin_password !== superAdminPassword.trim()) {
        toast.error('Invalid super admin password');
        setIsSubmitting(false);
        return;
      }

      // Delete admin (CASCADE will delete user_passwords)
      const { error: deleteError } = await supabase
        .from('admins')
        .delete()
        .eq('admin_id', admin.admin_id);

      if (deleteError) throw deleteError;

      // Log activity
      await supabase.rpc('log_admin_activity', {
        p_festival_id: festivalId,
        p_admin_id: superAdminId || null,
        p_action_type: 'delete_admin',
        p_action_details: {
          admin_id: admin.admin_id,
          admin_code: admin.admin_code,
          admin_name: admin.admin_name,
          user_passwords_deleted: stats.userPasswordCount
        }
      });

      toast.success('Admin deleted successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      toast.error(error.message || 'Failed to delete admin');
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
          <h2 className="text-xl font-bold text-red-600">Delete Admin</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Admin Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="font-semibold text-gray-800">Admin Details:</div>
            <div className="text-gray-600">Code: {admin.admin_code}</div>
            <div className="text-gray-600">Name: {admin.admin_name}</div>
            <div className="text-gray-600">Created: {formatDate(admin.created_at)}</div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone!
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-gray-800">Impact:</div>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>{stats.userPasswordCount} user password(s) will be deleted</li>
              <li>{stats.collectionCount} collection(s) created by this admin</li>
              <li>{stats.expenseCount} expense(s) created by this admin</li>
            </ul>
          </div>

          {/* Conditional: Has Records */}
          {stats.hasRecords ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
              <div className="text-sm text-yellow-800">
                <strong>Cannot Delete:</strong> This admin has created {stats.collectionCount} collection(s) and {stats.expenseCount} expense(s).
              </div>
              <div className="text-sm text-yellow-800">
                You can <strong>deactivate</strong> this admin instead. This will:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 ml-2">
                <li>Prevent admin from logging in</li>
                <li>Deactivate all their user passwords</li>
                <li>Keep all collections and expenses intact</li>
              </ul>
              <button
                onClick={handleDeactivate}
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Deactivating...' : 'Deactivate Admin'}
              </button>
            </div>
          ) : (
            <>
              {/* Confirmation Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="understood"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-0.5"
                  disabled={isSubmitting}
                />
                <label htmlFor="understood" className="text-sm text-gray-700">
                  I understand this action cannot be undone and will delete all user passwords created by this admin.
                </label>
              </div>

              {/* Super Admin Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Super Admin Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={superAdminPassword}
                    onChange={(e) => setSuperAdminPassword(e.target.value)}
                    placeholder="Enter super admin password"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={isSubmitting}
                  />
                </div>
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
                  onClick={handleDelete}
                  disabled={isSubmitting || !understood || !superAdminPassword.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </>
          )}

          {!stats.hasRecords && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

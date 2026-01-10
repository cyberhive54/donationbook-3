'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { X, Plus, Eye, EyeOff, Edit2, Trash2, Users, Calendar } from 'lucide-react';
import { AdminUserPassword } from '@/types';
import { formatDate } from '@/lib/utils';

interface ManageUserPasswordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminId: string;
  festivalId: string;
  maxUserPasswords: number;
}

export default function ManageUserPasswordsModal({
  isOpen,
  onClose,
  onSuccess,
  adminId,
  festivalId,
  maxUserPasswords
}: ManageUserPasswordsModalProps) {
  const [passwords, setPasswords] = useState<AdminUserPassword[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitorUsageModalOpen, setVisitorUsageModalOpen] = useState(false);
  const [selectedPasswordId, setSelectedPasswordId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && adminId && adminId.trim()) {
      fetchPasswords();
    } else if (isOpen && (!adminId || !adminId.trim())) {
      toast.error('Admin ID is required to manage passwords');
      onClose();
    }
  }, [isOpen, adminId]);

  const fetchPasswords = async () => {
    if (!adminId || !adminId.trim()) {
      console.error('[ManageUserPasswordsModal] Cannot fetch passwords: adminId is empty');
      toast.error('Admin ID is required');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_passwords')
        .select('*')
        .eq('admin_id', adminId.trim())
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPasswords(data || []);
    } catch (error) {
      console.error('Error fetching passwords:', error);
      toast.error('Failed to load passwords');
    } finally {
      setLoading(false);
    }
  };

  const generateNextLabel = () => {
    const existingNumbers = passwords
      .map(p => {
        const match = p.label.match(/Password (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);

    // Find the first available number
    for (let i = 1; i <= maxUserPasswords; i++) {
      if (!existingNumbers.includes(i)) {
        return `Password ${i}`;
      }
    }
    return `Password ${passwords.length + 1}`;
  };

  const handleAdd = () => {
    if (passwords.length >= maxUserPasswords) {
      toast.error(`Maximum ${maxUserPasswords} passwords allowed`);
      return;
    }
    setIsAdding(true);
    setNewPassword('');
    setNewLabel(generateNextLabel());
  };

  const handleSaveNew = async () => {
    if (!adminId || !adminId.trim()) {
      toast.error('Admin ID is required');
      return;
    }

    if (!newPassword.trim()) {
      toast.error('Password is required');
      return;
    }

    if (!newLabel.trim()) {
      toast.error('Label is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if password already exists in this festival
      const { data: existing } = await supabase
        .from('user_passwords')
        .select('password')
        .eq('festival_id', festivalId)
        .eq('password', newPassword.trim())
        .single();

      if (existing) {
        toast.error('This password already exists in the festival');
        setIsSubmitting(false);
        return;
      }

      // Check if label already exists for this admin
      const { data: existingLabel } = await supabase
        .from('user_passwords')
        .select('label')
        .eq('admin_id', adminId)
        .eq('label', newLabel.trim())
        .single();

      if (existingLabel) {
        toast.error('This label already exists for your passwords');
        setIsSubmitting(false);
        return;
      }

      // Insert new password
      const { error } = await supabase
        .from('user_passwords')
        .insert({
          admin_id: adminId.trim(),
          festival_id: festivalId,
          password: newPassword.trim(),
          label: newLabel.trim(),
          is_active: true
        });

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_admin_activity', {
        p_festival_id: festivalId,
        p_admin_id: adminId.trim(),
        p_action_type: 'add_user_password',
        p_action_details: {
          label: newLabel.trim()
        },
        p_target_type: null,
        p_target_id: null
      });

      toast.success('User password added successfully!');
      setIsAdding(false);
      setNewPassword('');
      setNewLabel('');
      fetchPasswords();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding password:', error);
      toast.error(error.message || 'Failed to add password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (password: AdminUserPassword) => {
    setEditingId(password.password_id);
    setNewPassword(password.password);
    setNewLabel(password.label);
  };

  const handleSaveEdit = async (passwordId: string) => {
    if (!newPassword.trim()) {
      toast.error('Password is required');
      return;
    }

    if (!newLabel.trim()) {
      toast.error('Label is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const originalPassword = passwords.find(p => p.password_id === passwordId);

      // Check if password already exists (excluding current)
      if (newPassword.trim() !== originalPassword?.password) {
        const { data: existing } = await supabase
          .from('user_passwords')
          .select('password')
          .eq('festival_id', festivalId)
          .eq('password', newPassword.trim())
          .neq('password_id', passwordId)
          .single();

        if (existing) {
          toast.error('This password already exists in the festival');
          setIsSubmitting(false);
          return;
        }
      }

      // Check if label already exists (excluding current)
      if (newLabel.trim() !== originalPassword?.label) {
        if (!adminId || !adminId.trim()) {
          toast.error('Admin ID is required');
          setIsSubmitting(false);
          return;
        }

        const { data: existingLabel } = await supabase
          .from('user_passwords')
          .select('label')
          .eq('admin_id', adminId.trim())
          .eq('label', newLabel.trim())
          .neq('password_id', passwordId)
          .single();

        if (existingLabel) {
          toast.error('This label already exists for your passwords');
          setIsSubmitting(false);
          return;
        }
      }

      // Update password
      const { error } = await supabase
        .from('user_passwords')
        .update({
          password: newPassword.trim(),
          label: newLabel.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('password_id', passwordId);

      if (error) throw error;

      // Log activity
      if (adminId && adminId.trim()) {
      await supabase.rpc('log_admin_activity', {
        p_festival_id: festivalId,
          p_admin_id: adminId.trim(),
        p_action_type: 'edit_user_password',
        p_action_details: {
          password_id: passwordId,
          label: newLabel.trim()
          },
          p_target_type: null,
          p_target_id: null
        });
        }

      toast.success('Password updated successfully!');
      setEditingId(null);
      setNewPassword('');
      setNewLabel('');
      fetchPasswords();
      onSuccess();
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (passwordId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_passwords')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('password_id', passwordId);

      if (error) throw error;

      // Log activity
      if (adminId && adminId.trim()) {
      await supabase.rpc('log_admin_activity', {
        p_festival_id: festivalId,
          p_admin_id: adminId.trim(),
        p_action_type: 'toggle_user_password',
        p_action_details: {
          password_id: passwordId,
          is_active: !currentStatus
          },
          p_target_type: null,
          p_target_id: null
        });
        }

      toast.success(`Password ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchPasswords();
      onSuccess();
    } catch (error: any) {
      console.error('Error toggling password:', error);
      toast.error('Failed to toggle password status');
    }
  };

  const handleDelete = async (passwordId: string, label: string) => {
    if (!confirm(`Delete "${label}"? Visitors using this password will lose access.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_passwords')
        .delete()
        .eq('password_id', passwordId);

      if (error) throw error;

      // Log activity
      if (adminId && adminId.trim()) {
      await supabase.rpc('log_admin_activity', {
        p_festival_id: festivalId,
          p_admin_id: adminId.trim(),
        p_action_type: 'delete_user_password',
        p_action_details: {
          password_id: passwordId,
          label: label
          },
          p_target_type: null,
          p_target_id: null
        });
        }

      toast.success('Password deleted successfully!');
      fetchPasswords();
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting password:', error);
      toast.error('Failed to delete password');
    }
  };

  const handleViewUsage = (passwordId: string) => {
    setSelectedPasswordId(passwordId);
    setVisitorUsageModalOpen(true);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsAdding(false);
      setEditingId(null);
      setNewPassword('');
      setNewLabel('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Manage User Passwords</h2>
              <p className="text-sm text-gray-600 mt-1">
                {passwords.length} of {maxUserPasswords} passwords used
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Add Button */}
            {!isAdding && passwords.length < maxUserPasswords && (
              <button
                onClick={handleAdd}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <Plus className="w-5 h-5" />
                Add New Password
              </button>
            )}

            {/* Add Form */}
            {isAdding && (
              <div className="border border-blue-300 rounded-lg p-4 bg-blue-50 space-y-3">
                <h3 className="font-semibold text-gray-800">Add New Password</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g., Password 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewPassword('');
                      setNewLabel('');
                    }}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNew}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Password List */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading passwords...</div>
            ) : passwords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No user passwords created yet. Add one to allow visitors access.
              </div>
            ) : (
              <div className="space-y-3">
                {passwords.map((pwd) => (
                  <div
                    key={pwd.password_id}
                    className={`border rounded-lg p-4 ${
                      pwd.is_active ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    {editingId === pwd.password_id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                          <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                          <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setNewPassword('');
                              setNewLabel('');
                            }}
                            disabled={isSubmitting}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(pwd.password_id)}
                            disabled={isSubmitting}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                          >
                            {isSubmitting ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-800">{pwd.label}</span>
                              {!pwd.is_active && (
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                                {showPassword[pwd.password_id] ? pwd.password : '•'.repeat(pwd.password.length)}
                              </code>
                              <button
                                onClick={() =>
                                  setShowPassword({ ...showPassword, [pwd.password_id]: !showPassword[pwd.password_id] })
                                }
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                {showPassword[pwd.password_id] ? (
                                  <EyeOff className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <Eye className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(pwd)}
                              className="p-2 hover:bg-gray-100 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(pwd.password_id, pwd.label)}
                              className="p-2 hover:bg-red-100 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created: {formatDate(pwd.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Used: {pwd.usage_count || 0} times
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleActive(pwd.password_id, pwd.is_active)}
                            className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              pwd.is_active
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {pwd.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleViewUsage(pwd.password_id)}
                            className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm transition-colors"
                          >
                            View Usage
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visitor Usage Modal */}
      {visitorUsageModalOpen && selectedPasswordId && (
        <VisitorUsageModal
          isOpen={visitorUsageModalOpen}
          onClose={() => {
            setVisitorUsageModalOpen(false);
            setSelectedPasswordId(null);
          }}
          passwordId={selectedPasswordId}
          festivalId={festivalId}
        />
      )}
    </>
  );
}

// Visitor Usage Modal Component
function VisitorUsageModal({
  isOpen,
  onClose,
  passwordId,
  festivalId
}: {
  isOpen: boolean;
  onClose: () => void;
  passwordId: string;
  festivalId: string;
}) {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [passwordLabel, setPasswordLabel] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchVisitors();
    }
  }, [isOpen]);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      // Get password label
      const { data: pwdData } = await supabase
        .from('user_passwords')
        .select('label')
        .eq('password_id', passwordId)
        .single();

      if (pwdData) {
        setPasswordLabel(pwdData.label);
      }

      // Get access logs for this password
      const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .eq('festival_id', festivalId)
        .eq('user_password_id', passwordId)
        .order('accessed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      toast.error('Failed to load visitor usage');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Visitor Usage</h2>
            <p className="text-sm text-gray-600 mt-1">{passwordLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading visitors...</div>
          ) : visitors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No visitors have used this password yet.</div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                Total logins: {visitors.length} (showing last 50)
              </div>
              {visitors.map((visitor, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{visitor.visitor_name}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(visitor.accessed_at).toLocaleString()}
                      </div>
                    </div>
                    {visitor.session_id && (
                      <div className="text-xs text-gray-500 font-mono">{visitor.session_id.slice(0, 8)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

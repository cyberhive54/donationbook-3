'use client';

import { useState } from 'react';
import { X, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Festival } from '@/types';

interface DeleteFestivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  festival: Festival | null;
}

export default function DeleteFestivalModal({ isOpen, onClose, festival }: DeleteFestivalModalProps) {
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const resetForm = () => {
    setConfirmationPhrase('');
    setSuperAdminPassword('');
    setIsDeleting(false);
    setIsExporting(false);
  };

  const handleExportData = async () => {
    if (!festival) return;
    
    setIsExporting(true);
    try {
      const { data, error } = await supabase.rpc('export_festival_data', {
        p_festival_code: festival.code
      });

      if (error) throw error;

      if (data && data.success) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${festival.code}_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Festival data exported successfully');
      } else {
        throw new Error(data?.error || 'Export failed');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!festival) return;

    if (confirmationPhrase !== 'DELETE FESTIVAL PERMANENTLY') {
      toast.error('Please type the confirmation phrase exactly as shown');
      return;
    }

    if (!superAdminPassword.trim()) {
      toast.error('Super admin password is required');
      return;
    }

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.rpc('delete_festival_with_password', {
        p_festival_code: festival.code,
        p_super_admin_password: superAdminPassword,
        p_confirmation_phrase: confirmationPhrase
      });

      if (error) throw error;

      if (data && data.success) {
        toast.success(`Festival "${festival.event_name}" deleted successfully`);
        resetForm();
        onClose();
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        throw new Error(data?.error || 'Delete failed');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete festival');
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmationPhrase === 'DELETE FESTIVAL PERMANENTLY';
  const canDelete = isConfirmationValid && superAdminPassword.trim().length > 0;

  if (!isOpen || !festival) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-auto">
        <div className="flex items-center justify-between p-6 border-b bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-900">Delete Festival</h2>
              <p className="text-sm text-red-700">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
            disabled={isDeleting}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Warning Section */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Warning: Permanent Deletion</h3>
                <p className="text-sm text-red-800 mb-2">
                  You are about to permanently delete the festival <strong>"{festival.event_name}"</strong> (Code: {festival.code}).
                </p>
                <p className="text-sm text-red-800">
                  This will delete all associated data including:
                </p>
                <ul className="text-sm text-red-800 list-disc list-inside mt-1 space-y-1">
                  <li>All collections and expenses</li>
                  <li>All admins and user passwords</li>
                  <li>All albums and media items</li>
                  <li>All activity logs and access logs</li>
                  <li>All analytics configurations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Export Backup Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Backup Your Data (Recommended)</h3>
                <p className="text-sm text-blue-800">
                  Download a complete backup of your festival data before deletion. This backup can be used for records or future restoration.
                </p>
              </div>
              <button
                onClick={handleExportData}
                disabled={isExporting || isDeleting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </button>
            </div>
          </div>

          {/* Confirmation Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">DELETE FESTIVAL PERMANENTLY</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmationPhrase}
                onChange={(e) => setConfirmationPhrase(e.target.value)}
                placeholder="Type the confirmation phrase"
                disabled={isDeleting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  isConfirmationValid 
                    ? 'border-green-500 focus:ring-green-500 bg-green-50' 
                    : 'border-gray-300 focus:ring-blue-500'
                } disabled:opacity-50`}
              />
              {confirmationPhrase && !isConfirmationValid && (
                <p className="text-sm text-red-600 mt-1">Phrase must match exactly</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Super Admin Password:
              </label>
              <input
                type="password"
                value={superAdminPassword}
                onChange={(e) => setSuperAdminPassword(e.target.value)}
                placeholder="Super admin password"
                disabled={isDeleting || !isConfirmationValid}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete Festival Forever'}
            </button>
          </div>

          {!canDelete && (
            <p className="text-sm text-gray-500 text-center">
              Please complete all fields above to enable deletion
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

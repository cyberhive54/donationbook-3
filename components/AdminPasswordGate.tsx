'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import { supabase } from '@/lib/supabase';
import { AlertTriangle } from 'lucide-react';

interface AdminPasswordGateProps {
  children: React.ReactNode;
  code: string;
}

export default function AdminPasswordGate({ children, code }: AdminPasswordGateProps) {
  const router = useRouter();
  const { session, isLoading, logout } = useSession(code);
  const [isDeactivated, setIsDeactivated] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Check if user has admin or super_admin session
      if (!session || (session.type !== 'admin' && session.type !== 'super_admin')) {
        // Redirect to admin login page
        router.replace(`/f/${code}/admin/login`);
      } else if (session.type === 'admin') {
        // Check if admin is still active
        checkAdminStatus(session.adminId);
      }
    }
  }, [session, isLoading, router, code]);

  const checkAdminStatus = async (adminId: string) => {
    try {
      const { data } = await supabase
        .from('admins')
        .select('is_active')
        .eq('admin_id', adminId)
        .single();

      if (data && !data.is_active) {
        setIsDeactivated(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If admin is deactivated, show message
  if (isDeactivated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-4">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Deactivated</h2>
          <p className="text-gray-600 mb-6">
            Your account has been deactivated. Please contact the super admin for assistance.
          </p>
          <button
            onClick={() => {
              logout();
              router.replace(`/f/${code}`);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Festival Home
          </button>
        </div>
      </div>
    );
  }

  // If no valid admin/super_admin session, show loading (will redirect)
  if (!session || (session.type !== 'admin' && session.type !== 'super_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Valid admin or super_admin session, render children
  return <>{children}</>;
}

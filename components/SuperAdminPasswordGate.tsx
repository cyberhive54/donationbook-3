'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';

interface SuperAdminPasswordGateProps {
  children: React.ReactNode;
  code: string;
}

export default function SuperAdminPasswordGate({ children, code }: SuperAdminPasswordGateProps) {
  const router = useRouter();
  const { session, isLoading } = useSession(code);

  useEffect(() => {
    if (!isLoading) {
      // Check if user has super_admin session
      if (!session || session.type !== 'super_admin') {
        // Redirect to super admin login page
        router.replace(`/f/${code}/admin/sup/login`);
      }
    }
  }, [session, isLoading, router, code]);

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // If no valid super_admin session, show loading (will redirect)
  if (!session || session.type !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Valid super_admin session, render children
  return <>{children}</>;
}

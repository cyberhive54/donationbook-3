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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeBgColor, setThemeBgColor] = useState<string>('#f8fafc');
  const [themeBgImageUrl, setThemeBgImageUrl] = useState<string>('');
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Load festival theme
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data } = await supabase
          .from('festivals')
          .select('theme_dark, theme_bg_color, theme_bg_image_url')
          .eq('code', code)
          .single();
        
        if (data) {
          setIsDarkMode(data.theme_dark || false);
          setThemeBgColor(data.theme_bg_color || '#f8fafc');
          setThemeBgImageUrl(data.theme_bg_image_url || '');
        }
      } catch (error) {
        console.error('Error loading festival theme:', error);
      } finally {
        setThemeLoaded(true);
      }
    };
    if (code) loadTheme();
  }, [code]);

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
  if (isLoading || !themeLoaded) {
    const bgStyle: React.CSSProperties = themeBgImageUrl
      ? { backgroundImage: `url(${themeBgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: themeBgColor };
    
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark' : ''}`} style={bgStyle}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  // If admin is deactivated, show message
  if (isDeactivated) {
    const bgStyle: React.CSSProperties = themeBgImageUrl
      ? { backgroundImage: `url(${themeBgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: themeBgColor };
    
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark' : ''} p-4`} style={bgStyle}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900 rounded-full p-4">
              <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Account Deactivated</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
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
    const bgStyle: React.CSSProperties = themeBgImageUrl
      ? { backgroundImage: `url(${themeBgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: themeBgColor };
    
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark' : ''}`} style={bgStyle}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  // Valid admin or super_admin session, render children
  return <>{children}</>;
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import { supabase } from '@/lib/supabase';

interface SuperAdminPasswordGateProps {
  children: React.ReactNode;
  code: string;
}

export default function SuperAdminPasswordGate({ children, code }: SuperAdminPasswordGateProps) {
  const router = useRouter();
  const { session, isLoading } = useSession(code);
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
      // Check if user has super_admin session
      if (!session || session.type !== 'super_admin') {
        // Redirect to super admin login page
        router.replace(`/f/${code}/admin/sup/login`);
      }
    }
  }, [session, isLoading, router, code]);

  // Show loading state while checking session
  if (isLoading || !themeLoaded) {
    const bgStyle: React.CSSProperties = themeBgImageUrl
      ? { backgroundImage: `url(${themeBgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: themeBgColor };
    
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark' : ''}`} style={bgStyle}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  // If no valid super_admin session, show loading (will redirect)
  if (!session || session.type !== 'super_admin') {
    const bgStyle: React.CSSProperties = themeBgImageUrl
      ? { backgroundImage: `url(${themeBgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: themeBgColor };
    
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark' : ''}`} style={bgStyle}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  // Valid super_admin session, render children
  return <>{children}</>;
}

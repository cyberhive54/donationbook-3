'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function SuperAdminRouteHandler() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';
  const router = useRouter();
  const { session, isLoading } = useSession(code);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeBgColor, setThemeBgColor] = useState<string>('#f8fafc');
  const [themeBgImageUrl, setThemeBgImageUrl] = useState<string>('');

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
      }
    };
    if (code) loadTheme();
  }, [code]);

  useEffect(() => {
    if (isLoading) return; // Wait for session check

    const handleRedirect = async () => {
      // Check if festival exists
      try {
        const { data: festival, error } = await supabase
          .from('festivals')
          .select('id, code')
          .eq('code', code)
          .single();

        if (error || !festival) {
          toast.error('Festival not found');
          router.push('/');
          return;
        }

        // If user has super_admin session, redirect to dashboard
        if (session?.type === 'super_admin') {
          router.replace(`/f/${code}/admin/sup/dashboard`);
          return;
        }

        // If user has admin session, redirect to admin login with message
        if (session?.type === 'admin') {
          toast.error('Super admin access required. Redirecting to admin login.');
          router.replace(`/f/${code}/admin/login`);
          return;
        }

        // If no session, redirect to super admin login
        router.replace(`/f/${code}/admin/sup/login`);
      } catch (error) {
        console.error('Error handling redirect:', error);
        toast.error('An error occurred');
        router.push('/');
      }
    };

    handleRedirect();
  }, [code, session, isLoading, router]);

  // Show loading state while checking session and redirecting
  const bgStyle: React.CSSProperties = themeBgImageUrl
    ? { backgroundImage: `url(${themeBgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: themeBgColor };
  
  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark' : ''}`} style={bgStyle}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Redirecting...</p>
      </div>
    </div>
  );
}

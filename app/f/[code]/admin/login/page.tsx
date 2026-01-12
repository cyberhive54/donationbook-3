'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/hooks/useAdminAuth';
import { useSession } from '@/lib/hooks/useSession';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, ArrowRight, Home, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';
  const router = useRouter();
  const { login, isLoading } = useAdminAuth();
  const { session, saveSession, isLoading: sessionLoading } = useSession(code);

  const [formData, setFormData] = useState({
    adminCodeOrName: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [festivalInfo, setFestivalInfo] = useState<{
    name: string;
    organiser?: string;
    location?: string;
    start?: string;
    end?: string;
  } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Redirect if already logged in as admin or super_admin
  useEffect(() => {
    if (!sessionLoading && session && (session.type === 'admin' || session.type === 'super_admin')) {
      router.replace(`/f/${code}/admin`);
    }
  }, [session, sessionLoading, router, code]);

  // Load festival info
  useEffect(() => {
    const loadInfo = async () => {
      const { data } = await supabase
        .from('festivals')
        .select('event_name, organiser, location, event_start_date, event_end_date, theme_dark')
        .eq('code', code)
        .single();
      if (data) {
        setFestivalInfo({
          name: data.event_name,
          organiser: data.organiser,
          location: data.location,
          start: data.event_start_date,
          end: data.event_end_date
        });
        setIsDarkMode(data.theme_dark || false);
      }
    };
    if (code) loadInfo();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.adminCodeOrName.trim() || !formData.password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const result = await login(code, formData.adminCodeOrName.trim(), formData.password);

    if (result.success && result.session) {
      // Save session to localStorage
      saveSession(result.session);
      
      // Log admin login activity
      console.log('[AdminLogin] Attempting to log login activity:', {
        festival_id: result.session.festivalId,
        admin_id: result.session.adminId,
        action_type: 'login'
      });
      
      try {
        const { data: logData, error: logError } = await supabase.rpc('log_admin_activity', {
          p_festival_id: result.session.festivalId,
          p_admin_id: result.session.adminId,
          p_action_type: 'login',
          p_action_details: { login_time: result.session.loginTime },
          p_target_type: null,
          p_target_id: null
        });
        
        console.log('[AdminLogin] RPC call result:', {
          data: logData,
          error: logError,
          errorMessage: logError?.message,
          errorCode: logError?.code,
          errorDetails: logError?.details,
          errorHint: logError?.hint
        });
        
        if (logError) {
          console.error('[AdminLogin] Error logging admin login activity:', logError);
          toast.error(`Failed to log activity: ${logError.message || 'Unknown error'}`);
          // Continue even if logging fails
        } else {
          console.log('[AdminLogin] Admin login activity logged successfully:', logData);
        }
      } catch (logError: any) {
        console.error('[AdminLogin] Exception logging admin activity:', logError);
        toast.error(`Exception logging activity: ${logError?.message || 'Unknown error'}`);
        // Continue even if logging fails
      }

      toast.success('Admin login successful!');
      router.push(`/f/${code}/admin`);
    } else {
      // Improved error message display
      const errorMsg = result.error || 'Login failed. Please check your credentials and try again.';
      toast.error(errorMsg);
      console.error('Admin login failed:', result.error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'} p-4`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        {festivalInfo && (
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4 text-sm">
            <div className="font-semibold text-gray-800 dark:text-gray-100">{festivalInfo.name}</div>
            <div className="text-gray-600 dark:text-gray-300">{festivalInfo.organiser ? `Organiser: ${festivalInfo.organiser}` : null}</div>
            <div className="text-gray-600 dark:text-gray-300">{festivalInfo.location ? `Location: ${festivalInfo.location}` : null}</div>
            <div className="text-gray-600 dark:text-gray-300">
              {festivalInfo.start || festivalInfo.end ? `Dates: ${festivalInfo.start || '—'} to ${festivalInfo.end || '—'}` : null}
            </div>
          </div>
        )}

        <div className="flex justify-center mb-6">
          <div className="bg-red-100 dark:bg-red-900 rounded-full p-4">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
          Admin Login
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          Enter your admin code/name and password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Admin Code or Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.adminCodeOrName}
              onChange={(e) => handleInputChange('adminCodeOrName', e.target.value)}
              placeholder="Enter admin code or name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-600 rounded-r-lg transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? 'Logging in...' : 'Login as Admin'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Super Admin?{' '}
              <button
                onClick={() => router.push(`/f/${code}/admin/sup/login`)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Login Here
              </button>
            </p>
          </div>
          
          <div className="text-center pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={() => router.push(`/f/${code}`)}
              className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mx-auto"
            >
              <Home className="w-4 h-4" />
              Back to Festival Home
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Visitor?{' '}
              <button
                onClick={() => router.push(`/f/${code}`)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Go to Visitor Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

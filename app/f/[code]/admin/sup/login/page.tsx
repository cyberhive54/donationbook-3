'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSuperAdminAuth } from '@/lib/hooks/useSuperAdminAuth';
import { useSession } from '@/lib/hooks/useSession';
import { supabase } from '@/lib/supabase';
import { Crown, ArrowRight, Home, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SuperAdminLoginPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';
  const router = useRouter();
  const { login, isLoading } = useSuperAdminAuth();
  const { saveSession } = useSession(code);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [festivalInfo, setFestivalInfo] = useState<{
    name: string;
    organiser?: string;
    location?: string;
    start?: string;
    end?: string;
  } | null>(null);

  // Load festival info
  useEffect(() => {
    const loadInfo = async () => {
      const { data } = await supabase
        .from('festivals')
        .select('event_name, organiser, location, event_start_date, event_end_date')
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
      }
    };
    if (code) loadInfo();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error('Please enter super admin password');
      return;
    }

    const result = await login(code, password.trim());

    if (result.success && result.session) {
      saveSession(result.session);
      
      // Log super admin login activity
      try {
        await supabase.rpc('log_admin_activity', {
          p_festival_id: result.session.festivalId,
          p_admin_id: null, // Super admin doesn't have admin_id
          p_action_type: 'super_admin_login',
          p_action_details: { login_time: result.session.loginTime },
          p_target_type: null,
          p_target_id: null
        });
      } catch (logError) {
        console.error('Error logging super admin activity:', logError);
        // Continue even if logging fails
      }

      toast.success('Super Admin login successful!');
      router.push(`/f/${code}/admin/sup/dashboard`);
    } else {
      // Improved error message display
      const errorMsg = result.error || 'Login failed. Please check your password and try again.';
      toast.error(errorMsg);
      console.error('Super admin login failed:', result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {festivalInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm">
            <div className="font-semibold text-gray-800">{festivalInfo.name}</div>
            <div className="text-gray-600">{festivalInfo.organiser ? `Organiser: ${festivalInfo.organiser}` : null}</div>
            <div className="text-gray-600">{festivalInfo.location ? `Location: ${festivalInfo.location}` : null}</div>
            <div className="text-gray-600">
              {festivalInfo.start || festivalInfo.end ? `Dates: ${festivalInfo.start || '—'} to ${festivalInfo.end || '—'}` : null}
            </div>
          </div>
        )}

        <div className="flex justify-center mb-6">
          <div className="bg-purple-100 rounded-full p-4">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Super Admin Login
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Enter super admin password for full access
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Super Admin Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter super admin password"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? 'Logging in...' : 'Login as Super Admin'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Regular Admin?{' '}
              <button
                onClick={() => router.push(`/f/${code}/admin/login`)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Login Here
              </button>
            </p>
          </div>
          
          <div className="text-center pt-3 border-t border-gray-200 space-y-2">
            <button
              onClick={() => router.push(`/f/${code}`)}
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 mx-auto"
            >
              <Home className="w-4 h-4" />
              Back to Festival Home
            </button>
            <p className="text-xs text-gray-500">
              Visitor?{' '}
              <button
                onClick={() => router.push(`/f/${code}`)}
                className="text-blue-600 hover:text-blue-800 underline"
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

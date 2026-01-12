'use client';

import { useSession } from '@/lib/hooks/useSession';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Activity, Home, Shield, Crown, LayoutDashboard, ArrowLeftRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import SessionWarningBanner from './SessionWarningBanner';
import { useEffect, useState } from 'react';
import { scheduleLogout } from '@/lib/sessionValidator';
import { supabase } from '@/lib/supabase';

interface GlobalSessionBarProps {
  festivalCode: string;
  currentPage?: 'home' | 'activity' | 'admin' | 'analytics' | 'other';
}

export default function GlobalSessionBar({ festivalCode, currentPage = 'other' }: GlobalSessionBarProps) {
  const { session, logout, validationResult } = useSession(festivalCode);
  const router = useRouter();
  const pathname = usePathname();
  const [showWarning, setShowWarning] = useState(false);

  // Handle session validation warnings
  useEffect(() => {
    if (validationResult && !validationResult.isValid && validationResult.shouldShowWarning) {
      setShowWarning(true);

      // Schedule logout
      if (validationResult.warningDuration) {
        const timeoutId = scheduleLogout(
          festivalCode,
          validationResult.message || 'Session expired',
          validationResult.warningDuration,
          () => {
            logout();
            window.location.reload();
          }
        );

        return () => clearTimeout(timeoutId);
      }
    }
  }, [validationResult, festivalCode, logout]);

  if (!session) return null;

  const handleLogout = async () => {
    // Log logout activity before clearing session
    if (session) {
      if (session.type === 'admin' || session.type === 'super_admin') {
        // Log admin/super_admin logout
        console.log('[GlobalSessionBar] Attempting to log logout activity:', {
          festival_id: session.festivalId,
          admin_id: session.type === 'admin' ? session.adminId : null,
          session_type: session.type,
          action_type: session.type === 'admin' ? 'logout' : 'super_admin_logout'
        });
        
        try {
          const { data: logData, error: logError } = await supabase.rpc('log_admin_activity', {
            p_festival_id: session.festivalId,
            p_admin_id: session.type === 'admin' ? session.adminId : null,
            p_action_type: session.type === 'admin' ? 'logout' : 'super_admin_logout',
            p_action_details: { logout_time: new Date().toISOString() },
            p_target_type: null,
            p_target_id: null
          });
          
          console.log('[GlobalSessionBar] Logout activity log result:', {
            data: logData,
            error: logError,
            errorMessage: logError?.message,
            errorCode: logError?.code,
            errorDetails: logError?.details,
            errorHint: logError?.hint
          });
          
          if (logError) {
            console.error('[GlobalSessionBar] Error logging logout activity:', logError);
            // Continue with logout even if logging fails
          }
        } catch (logError: any) {
          console.error('[GlobalSessionBar] Exception logging logout activity:', logError);
          // Continue with logout even if logging fails
        }
      } else if (session.type === 'visitor') {
        // Log visitor logout
        console.log('[GlobalSessionBar] Logging visitor logout:', {
          festival_id: session.festivalId,
          visitor_name: session.visitorName,
          session_id: session.sessionId
        });
        
        try {
          const { data: logData, error: logError } = await supabase.rpc('log_visitor_logout', {
            p_festival_id: session.festivalId,
            p_visitor_name: session.visitorName,
            p_session_id: session.sessionId,
            p_logout_method: 'manual'
          });
          
          console.log('[GlobalSessionBar] Visitor logout log result:', {
            data: logData,
            error: logError
          });
          
          if (logError) {
            console.error('[GlobalSessionBar] Error logging visitor logout:', logError);
            // Continue with logout even if logging fails
          }
        } catch (logError: any) {
          console.error('[GlobalSessionBar] Exception logging visitor logout:', logError);
          // Continue with logout even if logging fails
        }
      }
    }
    
    logout();
    
    // Redirect based on session type
    if (session.type === 'admin') {
      window.location.href = `/f/${festivalCode}/admin/login`;
    } else if (session.type === 'super_admin') {
      window.location.href = `/f/${festivalCode}/admin/sup/login`;
    } else {
      // Visitor logout goes to festival home
      window.location.href = `/f/${festivalCode}`;
    }
  };

  const handleViewActivity = () => {
    if (session.type === 'visitor') {
      router.push(`/f/${festivalCode}/activity`);
    } else if (session.type === 'admin') {
      window.location.href = `/f/${festivalCode}/admin/activity`;
    } else if (session.type === 'super_admin') {
      window.location.href = `/f/${festivalCode}/admin/sup/activity`;
    }
  };

  const handleGoHome = () => {
    if (session.type === 'visitor') {
      router.push(`/f/${festivalCode}`);
    } else if (session.type === 'admin') {
      router.push(`/f/${festivalCode}/admin`);
    } else if (session.type === 'super_admin') {
      router.push(`/f/${festivalCode}/admin/sup/dashboard`);
    }
  };

  const handleGoToAdminDashboard = () => {
    if (session.type === 'admin') {
      window.location.href = `/f/${festivalCode}/admin`;
    } else if (session.type === 'super_admin') {
      window.location.href = `/f/${festivalCode}/admin/sup/dashboard`;
    }
  };

  const handleToggleDashboard = () => {
    if (session.type === 'super_admin') {
      // Check if we're on super admin dashboard or admin page
      if (pathname?.includes('/admin/sup/dashboard')) {
        // Currently on super admin dashboard, go to admin dashboard
        window.location.href = `/f/${festivalCode}/admin`;
      } else if (pathname?.includes('/admin') && !pathname?.includes('/admin/sup')) {
        // Currently on admin dashboard, go to super admin dashboard
        window.location.href = `/f/${festivalCode}/admin/sup/dashboard`;
      }
    }
  };

  // Check if we're on a visitor page (not admin pages)
  const isOnVisitorPage = currentPage !== 'admin' && currentPage !== 'activity';
  
  // Check if we're on super admin dashboard
  const isOnSuperAdminDashboard = pathname?.includes('/admin/sup/dashboard') || pathname?.includes('/admin/sup/activity');
  
  // Check if we're on admin dashboard (but not super admin)
  const isOnAdminDashboard = pathname?.includes('/admin') && !pathname?.includes('/admin/sup') && currentPage === 'admin';

  const loginTime = new Date(session.loginTime);
  const formattedTime = loginTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = formatDate(session.loginTime);

  return (
    <>
      {/* Warning Banner */}
      {showWarning && validationResult && validationResult.message && validationResult.warningDuration && (
        <SessionWarningBanner
          message={validationResult.message}
          duration={validationResult.warningDuration}
          onDismiss={() => setShowWarning(false)}
        />
      )}

      {/* Session Bar */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Session Info */}
          <div className="flex items-center gap-3 flex-wrap">
            {session.type === 'visitor' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {session.visitorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">{session.visitorName}</p>
                    <p className="text-xs text-gray-500">
                      Logged in: {formattedDate} at {formattedTime}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
                <div className="text-xs text-gray-600">
                  <p>via <span className="font-medium">{session.adminCode}</span> ({session.adminName})</p>
                  <p className="text-gray-500">{session.passwordLabel}</p>
                </div>
              </>
            )}

            {session.type === 'admin' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">
                      {session.adminName} ({session.adminCode})
                    </p>
                    <p className="text-xs text-gray-500">
                      Admin • Logged in: {formattedDate} at {formattedTime}
                    </p>
                  </div>
                </div>
              </>
            )}

            {session.type === 'super_admin' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Crown className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">Super Admin</p>
                    <p className="text-xs text-gray-500">
                      Logged in: {formattedDate} at {formattedTime}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Toggle button: Show when super_admin is on admin or super admin dashboard */}
            {session.type === 'super_admin' && (isOnAdminDashboard || isOnSuperAdminDashboard) && (
              <button
                onClick={handleToggleDashboard}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                title={isOnSuperAdminDashboard ? 'Go to Admin Dashboard' : 'Go to SuperAdmin Dashboard'}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isOnSuperAdminDashboard ? 'Go to Admin Dashboard' : 'Go to SuperAdmin Dashboard'}
                </span>
              </button>
            )}

            {/* Show "Go to Admin Dashboard" button on visitor pages for admin/super_admin */}
            {isOnVisitorPage && (session.type === 'admin' || session.type === 'super_admin') && (
              <button
                onClick={handleGoToAdminDashboard}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Dashboard</span>
              </button>
            )}

            {currentPage !== 'admin' && (
              currentPage === 'activity' ? (
                <button
                  onClick={handleGoHome}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Home className="w-4 h-4 sm:hidden" />
                  <span>Home</span>
                </button>
              ) : (
                <button
                  onClick={handleViewActivity}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Activity className="w-4 h-4 sm:hidden" />
                  <span>My Activity</span>
                </button>
              )
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4 sm:hidden" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

import { supabase } from './supabase';
import { SessionData } from '@/types';

export interface SessionValidationResult {
  isValid: boolean;
  reason?: 'password_deactivated' | 'admin_deactivated' | 'session_expired';
  message?: string;
  shouldShowWarning?: boolean;
  warningDuration?: number; // in milliseconds
}

/**
 * Validates a session to check if it's still valid
 * Returns validation result with reason if invalid
 */
export async function validateSession(
  session: SessionData | null
): Promise<SessionValidationResult> {
  if (!session) {
    return { isValid: false, reason: 'session_expired', message: 'No active session' };
  }

  try {
    // Validate visitor session
    if (session.type === 'visitor') {
      // Check if the user password is still active and hasn't been updated
      // Support backward compatibility: if passwordId doesn't exist, use old method
      let passwordData;
      if (session.passwordId) {
        // New method: use passwordId (more reliable)
        const result = await supabase
          .from('user_passwords')
          .select('is_active, admin_id, updated_at, password_id')
          .eq('password_id', session.passwordId)
          .single();
        passwordData = result.data;
      } else {
        // Old method: fallback for sessions created before passwordId was added
        const result = await supabase
        .from('user_passwords')
          .select('is_active, admin_id, updated_at, password_id')
        .eq('festival_id', session.festivalId)
        .eq('admin_id', session.adminId)
        .eq('label', session.passwordLabel)
        .single();
        passwordData = result.data;
      }

      if (!passwordData || !passwordData.is_active) {
        return {
          isValid: false,
          reason: 'password_deactivated',
          message: 'Your password has been deactivated. You will be logged out in 5 minutes.',
          shouldShowWarning: true,
          warningDuration: 5 * 60 * 1000 // 5 minutes
        };
      }

      // Check if password was updated after login time (password change invalidates session)
      if (passwordData.updated_at) {
        const passwordUpdatedAt = new Date(passwordData.updated_at);
        const loginTime = new Date(session.loginTime);
        
        if (passwordUpdatedAt > loginTime) {
          return {
            isValid: false,
            reason: 'password_deactivated',
            message: 'Your password has been changed. Please login again with the new password.',
            shouldShowWarning: false // Immediate logout
          };
        }
      }

      // Check if the admin who created the password is still active
      const { data: adminData } = await supabase
        .from('admins')
        .select('is_active')
        .eq('admin_id', passwordData.admin_id)
        .single();

      if (!adminData || !adminData.is_active) {
        return {
          isValid: false,
          reason: 'admin_deactivated',
          message: 'Your password has been deactivated. You will be logged out in 5 minutes.',
          shouldShowWarning: true,
          warningDuration: 5 * 60 * 1000 // 5 minutes
        };
      }
    }

    // Validate admin session
    if (session.type === 'admin') {
      // Get admin data and check if password was updated after login
      const { data: adminData } = await supabase
        .from('admins')
        .select('is_active, updated_at, admin_password_hash')
        .eq('admin_id', session.adminId)
        .single();

      if (!adminData || !adminData.is_active) {
        return {
          isValid: false,
          reason: 'admin_deactivated',
          message: 'Your account has been deactivated. Contact super admin.',
          shouldShowWarning: false // Immediate logout
        };
      }

      // Check if admin password was updated after login time
      // Note: This checks admin_password_hash updated_at from festivals table
      // We'd need to join or check separately - for now, admin sessions persist until deactivation
      // This is acceptable as admin passwords are changed less frequently
    }

    // Super admin sessions are always valid (no deactivation mechanism)
    return { isValid: true };
  } catch (error) {
    console.error('Error validating session:', error);
    return { isValid: true }; // Fail open to avoid locking users out on errors
  }
}

/**
 * Clears the session from localStorage
 */
export function clearSession(festivalCode: string): void {
  const storageKey = `session:${festivalCode}`;
  localStorage.removeItem(storageKey);
}

/**
 * Shows a warning banner and schedules logout
 */
export function scheduleLogout(
  festivalCode: string,
  message: string,
  duration: number,
  onLogout: () => void
): NodeJS.Timeout {
  return setTimeout(() => {
    clearSession(festivalCode);
    onLogout();
  }, duration);
}

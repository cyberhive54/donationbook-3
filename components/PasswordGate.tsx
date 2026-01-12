'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/hooks/useSession';
import { supabase } from '@/lib/supabase';
import { Lock, User, Edit2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { VisitorSession } from '@/types';
import { validateAndSanitizeName, validatePassword } from '@/lib/sanitize';

interface PasswordGateProps {
  children: React.ReactNode;
  code: string;
}

// Generate device ID
const generateDeviceId = (festivalCode: string): string => {
  const now = new Date();
  const ddmmyyhhmmss = 
    String(now.getDate()).padStart(2, '0') +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getFullYear()).slice(-2) +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomCode = '';
  for (let i = 0; i < 6; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${festivalCode}-${ddmmyyhhmmss}-${randomCode}`;
};

// Get or create device ID
const getDeviceId = (festivalCode: string): string => {
  const storageKey = `deviceId:${festivalCode}`;
  let deviceId = localStorage.getItem(storageKey);
  
  if (!deviceId) {
    deviceId = generateDeviceId(festivalCode);
    localStorage.setItem(storageKey, deviceId);
  }
  
  return deviceId;
};

// Get last used name for device
const getLastUsedName = (festivalCode: string): string | null => {
  const storageKey = `lastUsedName:${festivalCode}`;
  return localStorage.getItem(storageKey);
};

// Save last used name for device
const saveLastUsedName = (festivalCode: string, name: string): void => {
  const storageKey = `lastUsedName:${festivalCode}`;
  localStorage.setItem(storageKey, name);
};

export default function PasswordGate({ children, code }: PasswordGateProps) {
  const { session, saveSession, isLoading } = useSession(code);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [isNameEditable, setIsNameEditable] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState<boolean | null>(null); // null = not loaded yet
  const [festivalLoaded, setFestivalLoaded] = useState(false);
  const [info, setInfo] = useState<{ name: string; organiser?: string | null; start?: string | null; end?: string | null; location?: string | null } | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('festivals')
          .select('event_name, organiser, event_start_date, event_end_date, location, requires_password, requires_user_password')
          .eq('code', code)
          .single();
        
        if (error) {
          console.error('Error loading festival info:', error);
          setFestivalLoaded(true);
          setRequiresPassword(true); // Default to requiring password on error
          return;
        }
        
        if (data) {
          setInfo({
            name: data.event_name,
            organiser: data.organiser,
            start: data.event_start_date,
            end: data.event_end_date,
            location: data.location
          });
          // Check both requires_password and requires_user_password (legacy field)
          // If either is explicitly false, password is not required
          const needsPassword = data.requires_password !== false && data.requires_user_password !== false;
          setRequiresPassword(needsPassword);
          setFestivalLoaded(true);
        }
      } catch (error) {
        console.error('Error in loadInfo:', error);
        setFestivalLoaded(true);
        setRequiresPassword(true); // Default to requiring password on error
      }
    };
    if (code) {
      setFestivalLoaded(false);
      loadInfo();
    }
  }, [code]);

  // Initialize device ID and pre-fill name
  useEffect(() => {
    if (code) {
      const devId = getDeviceId(code);
      setDeviceId(devId);
      
      // Pre-fill name from last used name
      const lastUsedName = getLastUsedName(code);
      if (lastUsedName) {
        setName(lastUsedName);
        setIsNameEditable(false); // Lock the name field
      } else {
        setIsNameEditable(true); // Allow editing if no previous name
      }
    }
  }, [code]);

  // Pre-fill name from session
  useEffect(() => {
    if (session?.type === 'visitor') {
      setName(session.visitorName);
      setIsNameEditable(false);
    }
  }, [session]);

  // Show loading state while session is being validated or festival info is loading
  // This prevents race condition where protected content flashes before validation completes
  if (isLoading || !festivalLoaded || requiresPassword === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow admin and super_admin to bypass password gate
  if (session?.type === 'admin' || session?.type === 'super_admin') {
    return <>{children}</>;
  }

  // If password is not required, allow access without authentication
  if (requiresPassword === false) {
    return <>{children}</>;
  }

  // If visitor session exists, allow access
  // Check session type and also verify it matches the current festival code
  if (session?.type === 'visitor' && session.festivalCode === code) {
    return <>{children}</>;
  }

  // If we're verifying, show loading state (prevents form flickering during login)
  // But also check if session was just saved (to prevent infinite loop)
  if (isVerifying) {
    // Double-check if session exists in localStorage (might have been saved)
    const sessionKey = `session:${code}`;
    const storedSession = typeof window !== 'undefined' ? localStorage.getItem(sessionKey) : null;
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        if (parsed.type === 'visitor' && parsed.festivalCode === code) {
          // Session exists, stop verifying and let component detect it
          setIsVerifying(false);
          // Component will re-render and detect session
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
              <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Access granted! Redirecting...</p>
              </div>
            </div>
          );
        }
      } catch (e) {
        // Invalid session, continue with verifying state
      }
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate and sanitize name
    const nameValidation = validateAndSanitizeName(name);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error || 'Please enter a valid name');
      return;
    }
    const sanitizedName = nameValidation.sanitized!;

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.error || 'Please enter a valid password');
      return;
    }

    setIsVerifying(true);

    try {
      // First get festival ID and check if password is required
      const { data: festival } = await supabase
        .from('festivals')
        .select('id, requires_password, requires_user_password')
        .eq('code', code)
        .single();

      if (!festival) {
        toast.error('Festival not found');
        return;
      }

      // Double-check: if festival doesn't require password, allow access
      const needsPassword = festival.requires_password !== false && festival.requires_user_password !== false;
      if (!needsPassword) {
        setRequiresPassword(false);
        setIsVerifying(false);
        return;
      }

      // Check if name already exists (case-insensitive) - use sanitized name
      const { data: existingNames } = await supabase
        .from('access_logs')
        .select('visitor_name')
        .eq('festival_id', festival.id)
        .ilike('visitor_name', sanitizedName);

      if (existingNames && existingNames.length > 0) {
        const exactMatch = existingNames.find(
          (log) => log.visitor_name.toLowerCase() === sanitizedName.toLowerCase()
        );
        if (exactMatch && exactMatch.visitor_name !== sanitizedName) {
          toast.error(`Name "${sanitizedName}" is already in use. Try adding a number or symbol (e.g., "${sanitizedName}2")`);
          setIsVerifying(false);
          return;
        }
      }

      // Check for concurrent session on this device
      const existingSession = session;
      if (existingSession?.type === 'visitor' && existingSession.deviceId === deviceId) {
        const shouldContinue = confirm(
          'Already logged in on this device. Continue will logout previous session.'
        );
        if (!shouldContinue) {
          setIsVerifying(false);
          return;
        }
      }

      // Check if password exists in user_passwords table
      const { data: passwordData, error } = await supabase
        .from('user_passwords')
        .select('password_id, admin_id, password, label')
        .eq('festival_id', festival.id)
        .eq('password', password.trim())
        .eq('is_active', true)
        .single();

      if (error || !passwordData) {
        toast.error('Invalid password');
        setPassword('');
        setIsVerifying(false);
        return;
      }

      // Get admin details
      const { data: adminData } = await supabase
        .from('admins')
        .select('admin_code, admin_name')
        .eq('admin_id', passwordData.admin_id)
        .single();

      if (!adminData) {
        toast.error('Admin not found');
        setIsVerifying(false);
        return;
      }

      // Create visitor session
      const visitorSession: VisitorSession = {
        type: 'visitor',
        festivalId: festival.id,
        festivalCode: code,
        visitorName: sanitizedName,
        adminId: passwordData.admin_id,
        adminCode: adminData.admin_code,
        adminName: adminData.admin_name,
        passwordLabel: passwordData.label,
        passwordId: passwordData.password_id, // Store password ID for validation
        loginTime: new Date().toISOString(),
        sessionId: crypto.randomUUID(),
        deviceId: deviceId
      };

      // Log access - use sanitized name
      console.log('[PasswordGate] Attempting to log visitor access:', {
        festival_id: festival.id,
        visitor_name: sanitizedName,
        admin_id: passwordData.admin_id,
        user_password_id: passwordData.password_id,
        session_id: visitorSession.sessionId
      });
      
      // Log access - simplified to avoid function overload conflict
      // Due to duplicate function signatures in database, use simpler version without UUID params
      let logAccessData, logAccessError;
      try {
        // Use simpler function signature (without admin_id and user_password_id UUIDs)
        // to avoid PGRST203 overload error
        const result = await supabase.rpc('log_festival_access', {
          p_festival_id: festival.id,
          p_visitor_name: sanitizedName,
          p_access_method: 'password_modal',
          p_password_used: password.trim(),
          p_session_id: visitorSession.sessionId
        });
        logAccessData = result.data;
        logAccessError = result.error;
        
        // If successful but admin_id/user_password_id tracking is needed,
        // update the access_logs record directly
        if (!logAccessError && logAccessData) {
          await supabase
            .from('access_logs')
            .update({
              admin_id: passwordData.admin_id,
              user_password_id: passwordData.password_id
            })
            .eq('id', logAccessData);
        }
      } catch (logError: any) {
        console.warn('[PasswordGate] Access logging error:', logError);
        logAccessError = logError;
      }
      
      console.log('[PasswordGate] log_festival_access result:', {
        data: logAccessData,
        error: logAccessError,
        errorMessage: logAccessError?.message,
        errorCode: logAccessError?.code,
        errorDetails: logAccessError?.details
      });
      
      if (logAccessError) {
        console.error('[PasswordGate] ❌ CRITICAL: Failed to log access:', logAccessError);
      } else {
        console.log('[PasswordGate] ✅ Access logged successfully, record ID:', logAccessData);
      }

      // Update password usage count
      await supabase
        .from('user_passwords')
        .update({
          usage_count: (passwordData as any).usage_count ? (passwordData as any).usage_count + 1 : 1,
          last_used_at: new Date().toISOString()
        })
        .eq('password_id', passwordData.password_id);

      // Save last used name for this device - use sanitized name
      saveLastUsedName(code, sanitizedName);

      // Ensure loginTime is set correctly before saving
      visitorSession.loginTime = new Date().toISOString();
      
      // Save session - this will update both localStorage and state
      saveSession(visitorSession);
      
      // Clear password field for security
      setPassword('');
      
      // CRITICAL: Force multiple verification attempts for mobile browsers
      const sessionKey = `session:${code}`;
      let verificationAttempts = 0;
      let savedSession = null;
      
      // Try up to 5 times with increasing delays to ensure write completes
      while (verificationAttempts < 5 && !savedSession) {
        await new Promise(resolve => setTimeout(resolve, 50 + (verificationAttempts * 50)));
        savedSession = localStorage.getItem(sessionKey) || sessionStorage.getItem(sessionKey);
        verificationAttempts++;
        
        if (!savedSession) {
          console.warn(`[PasswordGate] Session verification attempt ${verificationAttempts} failed, retrying...`);
        }
      }
      
      if (!savedSession) {
        throw new Error('Failed to save session after multiple attempts. Please try again.');
      }
      
      // Parse and verify the saved session
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.type !== 'visitor' || parsed.festivalCode !== code) {
          throw new Error('Session saved incorrectly');
        }
        console.log('[PasswordGate] ✅ Session verified successfully after', verificationAttempts, 'attempts');
      } catch (verifyError) {
        console.error('Session verification failed:', verifyError);
        throw new Error('Session verification failed. Please try again.');
      }
      
      // Show success message only if logging succeeded
      if (logAccessError) {
        toast('Access granted! (Warning: Login not recorded, contact admin)', {
          duration: 5000,
          icon: '⚠️'
        });
      } else {
        toast.success('Access granted!');
      }
      
      // Give a final moment for state to propagate (already verified above)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear verifying state - component will re-render and detect the session
      setIsVerifying(false);
      
      console.log('[PasswordGate] ✅ Login complete, rendering children');
      
    } catch (error: any) {
      console.error('Login error:', error);
      setIsVerifying(false);
      setPassword(''); // Clear password on error
      
      // Improved error messages
      if (error.code === 'PGRST116') {
        toast.error('Festival not found. Please check the festival code.');
      } else if (error.message?.includes('JWT')) {
        toast.error('Authentication error. Please try again.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (error.message?.includes('Failed to save session') || error.message?.includes('Session verification failed')) {
        toast.error(error.message || 'Failed to save session. Please try logging in again.');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {info && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm">
            <div className="font-semibold text-gray-800">{info.name || 'Festival Information'}</div>
            {info.organiser && <div className="text-gray-600">Organiser: {info.organiser}</div>}
            {info.location && <div className="text-gray-600">Location: {info.location}</div>}
            {(info.start || info.end) && (
              <div className="text-gray-600">
                Dates: {info.start || '—'} to {info.end || '—'}
              </div>
            )}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 rounded-full p-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Enter Your Details
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Please provide your name and password to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isVerifying || !isNameEditable}
                required
                maxLength={50}
              />
              {!isNameEditable && name && (
                <button
                  type="button"
                  onClick={() => setIsNameEditable(true)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                  title="Edit name"
                >
                  <Edit2 className="h-5 w-5 text-gray-400 hover:text-blue-600" />
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {!isNameEditable && name
                ? 'Click the pencil icon to edit your name'
                : 'Max 50 characters. Letters, numbers, and symbols allowed.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isVerifying}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                disabled={isVerifying}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Ask admin for password
            </p>
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Continue'}
          </button>
        </form>

        <div className="mt-6 space-y-3 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-600">
              Admin?{' '}
              <button
                onClick={() => window.location.href = `/f/${code}/admin/login`}
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Go to Admin Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

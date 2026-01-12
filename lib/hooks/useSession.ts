'use client';

import { useState, useEffect } from 'react';
import { SessionData, VisitorSession, AdminSession, SuperAdminSession } from '@/types';
import { validateSession, SessionValidationResult } from '../sessionValidator';

// Get today's date in IST timezone (UTC+5:30)
// Uses Intl API for proper timezone handling
function getTodayIST() {
  const now = new Date();
  
  // Use Intl.DateTimeFormat with 'en-CA' locale which gives YYYY-MM-DD format
  // and 'Asia/Kolkata' timezone which is IST
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return formatter.format(now);
}

// Get midnight IST timestamp for today (returns UTC timestamp)
function getMidnightISTTimestamp() {
  const now = new Date();
  
  // Get today's date in IST timezone
  const todayIST = getTodayIST(); // Format: YYYY-MM-DD
  
  // Parse the date components
  const [year, month, day] = todayIST.split('-').map(Number);
  
  // Create a date string representing midnight IST today
  // Format: "YYYY-MM-DDTHH:mm:ss+05:30" for IST
  // Then convert to UTC timestamp
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  // Create UTC timestamp for midnight IST
  const midnightISTUTC = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  // Subtract IST offset to get actual UTC timestamp
  return midnightISTUTC - istOffset;
}

export function useSession(festivalCode: string) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationResult, setValidationResult] = useState<SessionValidationResult | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const loadSession = () => {
      const todayIST = getTodayIST();
      const sessionKey = `session:${festivalCode}`;
      const now = Date.now();
      const timeSinceLastSave = now - lastSaveTime;

      // If we just saved the session (within 2 seconds), don't reload from storage yet
      // This prevents race conditions where we read before write completes on mobile
      if (lastSaveTime > 0 && timeSinceLastSave < 2000) {
        console.log('[useSession] ⏭️ Skipping load - just saved session', timeSinceLastSave, 'ms ago');
        setIsLoading(false);
        return;
      }

      try {
        // Try localStorage first, fall back to sessionStorage
        let stored = localStorage.getItem(sessionKey);
        if (!stored) {
          console.log('[useSession] localStorage empty, checking sessionStorage');
          stored = sessionStorage.getItem(sessionKey);
          if (stored) {
            // Restore to localStorage if found in sessionStorage
            localStorage.setItem(sessionKey, stored);
            console.log('[useSession] Restored session from sessionStorage to localStorage');
          }
        }
        console.log('[useSession] Loading session for:', festivalCode);
        console.log('[useSession] Stored session:', stored ? 'found' : 'not found');
        
        if (stored) {
          try {
            const parsedSession: SessionData = JSON.parse(stored);
            console.log('[useSession] Parsed session type:', parsedSession.type);

            // Validate session - check if it's from today (IST)
            if (parsedSession.type === 'visitor' || parsedSession.type === 'admin' || parsedSession.type === 'super_admin') {
              // Ensure loginTime exists and is valid
              if (!parsedSession.loginTime) {
                console.warn('[useSession] Session missing loginTime, setting to now');
                parsedSession.loginTime = new Date().toISOString();
                // Update stored session with loginTime
                localStorage.setItem(sessionKey, JSON.stringify(parsedSession));
                // Set session immediately without date validation (just saved)
                setSession(parsedSession);
                setIsLoading(false);
                return;
              }
              
              const loginTime = new Date(parsedSession.loginTime);
              
              // Validate date
              if (isNaN(loginTime.getTime())) {
                console.error('[useSession] Invalid loginTime:', parsedSession.loginTime);
                // Fix invalid date by setting to now
                parsedSession.loginTime = new Date().toISOString();
                localStorage.setItem(sessionKey, JSON.stringify(parsedSession));
                setSession(parsedSession);
                setIsLoading(false);
                return;
              }
              
              // More lenient date validation - check if session is from today OR within last 30 seconds
              // This handles timezone issues and fresh logins on mobile devices
              const now = new Date();
              const sessionAge = now.getTime() - loginTime.getTime();
              const thirtySecondsInMs = 30 * 1000;
              
              // If session was just created (within 30 seconds), consider it valid
              if (sessionAge < thirtySecondsInMs) {
                console.log('[useSession] ✅ Fresh session detected (age:', sessionAge, 'ms), bypassing date validation');
                console.log('[useSession] Session details:', {
                  loginTime: parsedSession.loginTime,
                  type: parsedSession.type,
                  festivalCode: parsedSession.festivalCode || parsedSession.type
                });
                setSession(parsedSession);
                setIsLoading(false);
                return;
              }
              
              // For older sessions, check if from today using IST timezone
              try {
                const formatter = new Intl.DateTimeFormat('en-CA', {
                  timeZone: 'Asia/Kolkata',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                });
                const sessionDateIST = formatter.format(loginTime);
                
                console.log('[useSession] Today IST:', todayIST);
                console.log('[useSession] Session Date IST:', sessionDateIST);
                console.log('[useSession] Session age (hours):', (sessionAge / 1000 / 60 / 60).toFixed(2));
                
                // Check if session is from today (IST)
                if (sessionDateIST === todayIST) {
                  console.log('[useSession] Session valid (same day), setting session');
                  setSession(parsedSession);
                } else {
                  console.log('[useSession] ⚠️ Session expired (not from today), removing');
                  console.log('[useSession] Session details:', {
                    loginTime: parsedSession.loginTime,
                    sessionDateIST,
                    todayIST,
                    festivalCode,
                    type: parsedSession.type
                  });
                  // Session expired (not from today in IST), remove it
                  localStorage.removeItem(sessionKey);
                  sessionStorage.removeItem(sessionKey);
                  setSession(null);
                }
              } catch (dateError) {
                // If date formatting fails (old browsers), fall back to 24-hour check
                console.warn('[useSession] Date formatting failed, using 24h fallback:', dateError);
                const twentyFourHours = 24 * 60 * 60 * 1000;
                if (sessionAge < twentyFourHours) {
                  console.log('[useSession] Session within 24h, setting session');
                  setSession(parsedSession);
                } else {
                  console.log('[useSession] Session older than 24h, removing');
                  localStorage.removeItem(sessionKey);
                  sessionStorage.removeItem(sessionKey);
                  setSession(null);
                }
              }
            } else {
              console.warn('[useSession] Invalid session type:', parsedSession);
              localStorage.removeItem(sessionKey);
              sessionStorage.removeItem(sessionKey);
              setSession(null);
            }
          } catch (parseError) {
            console.error('[useSession] Error parsing session:', parseError);
            try {
              localStorage.removeItem(sessionKey);
              sessionStorage.removeItem(sessionKey);
            } catch (e) {
              // Ignore errors removing item
            }
            setSession(null);
          }
        } else {
          console.log('[useSession] No stored session found');
          setSession(null);
        }
      } catch (error) {
        console.error('[useSession] Error loading session:', error);
        try {
          localStorage.removeItem(sessionKey);
          sessionStorage.removeItem(sessionKey);
        } catch (e) {
          // Ignore errors removing item
        }
        setSession(null);
      }

      setIsLoading(false);
    };

    if (festivalCode) {
      loadSession();
    } else {
      setIsLoading(false);
      setSession(null);
    }
  }, [festivalCode]);

  const saveSession = (newSession: SessionData) => {
    const sessionKey = `session:${festivalCode}`;
    const saveTimestamp = Date.now();
    console.log('[useSession] Saving session:', sessionKey, newSession);
    try {
      // Ensure loginTime is set and is a valid ISO string
      if (!newSession.loginTime || !new Date(newSession.loginTime).getTime()) {
        newSession.loginTime = new Date().toISOString();
      }
      
      // Use both localStorage and sessionStorage for redundancy on mobile
      const sessionData = JSON.stringify(newSession);
      localStorage.setItem(sessionKey, sessionData);
      sessionStorage.setItem(sessionKey, sessionData);
      
      // Set state and save timestamp
      setSession(newSession);
      setLastSaveTime(saveTimestamp);
      console.log('[useSession] Session saved successfully to localStorage and sessionStorage');
      
      // Verify it was saved correctly
      const verified = localStorage.getItem(sessionKey);
      if (verified) {
        console.log('[useSession] Session verification: saved correctly');
      } else {
        console.error('[useSession] Session verification: FAILED - not found in localStorage');
      }
    } catch (error) {
      console.error('[useSession] Error saving session:', error);
      throw error;
    }
  };

  const logout = () => {
    const sessionKey = `session:${festivalCode}`;
    console.log('[useSession] LOGOUT called for:', festivalCode);
    console.trace('[useSession] Logout stack trace');
    localStorage.removeItem(sessionKey);
    sessionStorage.removeItem(sessionKey);
    setSession(null);
    setValidationResult(null);
    setLastSaveTime(0);
  };

  // Periodic session validation (every 30 seconds)
  // Only validate if session exists and festivalCode matches
  // DISABLED for visitor sessions to prevent mobile issues - they use date-based expiry instead
  useEffect(() => {
    if (!session || !festivalCode) return;
    
    // Skip validation for visitor sessions - they already have:
    // 1. 30-second grace period for fresh sessions
    // 2. Daily expiry check on page load
    // 3. No need for real-time password validation
    if (session.type === 'visitor') {
      console.log('[useSession] Skipping validation for visitor session (using date-based expiry)');
      return;
    }
    
    // Don't validate if session's festivalCode doesn't match current code
    if (session.type === 'admin' && session.festivalCode !== festivalCode) {
      return; // Skip validation for mismatched festival codes
    }
    if (session.type === 'super_admin' && session.festivalCode !== festivalCode) {
      return; // Skip validation for mismatched festival codes
    }
    
    // Prevent concurrent validations
    if (isValidating) {
      console.log('[useSession] Validation already in progress, skipping');
      return;
    }

    const checkSession = async () => {
      try {
        setIsValidating(true);
        const result = await validateSession(session);
        setValidationResult(result);

        if (!result.isValid && !result.shouldShowWarning) {
          // Immediate logout for admin deactivation
          logout();
          window.location.reload();
        }
      } catch (error) {
        console.error('[useSession] Error validating session:', error);
        // Don't clear session on validation errors - just log them
      } finally {
        setIsValidating(false);
      }
    };

    // Initial check - delay to avoid race conditions, especially on mobile
    const timeoutId = setTimeout(checkSession, 5000);

    // Periodic checks every 30 seconds
    const interval = setInterval(checkSession, 30000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [session, festivalCode, isValidating]);

  return {
    session,
    isLoading,
    saveSession,
    logout,
    isVisitor: session?.type === 'visitor',
    isAdmin: session?.type === 'admin',
    isSuperAdmin: session?.type === 'super_admin',
    validationResult,
  };
}

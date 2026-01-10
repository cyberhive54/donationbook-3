'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function usePasswordAuth(code: string) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(true);
  const [festivalId, setFestivalId] = useState<string | null>(null);
  const [storedName, setStoredName] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { data: festival, error } = await supabase
          .from('festivals')
          .select('id, requires_user_password, user_password_updated_at, updated_at')
          .eq('code', code)
          .single();
        if (error) throw error;

        setFestivalId(festival?.id || null);
        const needPass = !!festival?.requires_user_password;
        setRequiresPassword(needPass);

        if (!needPass) {
          setIsAuthenticated(true);
          return;
        }

        const key = `userPasswordAuth:${code}`;
        const auth = localStorage.getItem(key);
        if (auth) {
          try {
            const parsed = JSON.parse(auth);
            const validToday = parsed.date === todayStr();
            const token = parsed.token;
            const currentToken = festival.user_password_updated_at || festival.updated_at;
            
            // Store the name for pre-filling
            if (parsed.visitorName) {
              setStoredName(parsed.visitorName);
            }
            
            if (validToday && token === currentToken) {
              setIsAuthenticated(true);
              return;
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
        setIsAuthenticated(false);
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    if (code) checkAuth();
  }, [code]);

  const verifyPassword = async (password: string, name: string): Promise<boolean> => {
    try {
      const { data: festival, error } = await supabase
        .from('festivals')
        .select('id, user_password, user_password_updated_at, updated_at, requires_user_password')
        .eq('code', code)
        .single();
      if (error) throw error;

      if (!festival?.requires_user_password) {
        setIsAuthenticated(true);
        return true;
      }

      if (festival && festival.user_password === password) {
        const formattedName = formatName(name);
        const sessionId = generateSessionId();
        const loggedAt = new Date().toISOString();

        // Log access to database
        try {
          await supabase.rpc('log_festival_access', {
            p_festival_id: festival.id,
            p_visitor_name: formattedName,
            p_access_method: 'password_modal',
            p_password_used: password,
            p_session_id: sessionId,
          });
        } catch (logError) {
          console.error('Error logging access:', logError);
          // Continue even if logging fails
        }

        // Store session in localStorage
        const session = {
          authenticated: true,
          date: todayStr(),
          token: festival.user_password_updated_at || festival.updated_at,
          visitorName: formattedName,
          sessionId,
          accessMethod: 'password_modal',
          passwordUsed: password,
          loggedAt,
        };

        localStorage.setItem(`userPasswordAuth:${code}`, JSON.stringify(session));
        setIsAuthenticated(true);
        setStoredName(formattedName);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  };

  return { 
    isAuthenticated, 
    isLoading, 
    requiresPassword, 
    verifyPassword,
    storedName,
    festivalId,
  };
}

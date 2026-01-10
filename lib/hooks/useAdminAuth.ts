'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminSession } from '@/types';

export function useAdminAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (festivalCode: string, adminCodeOrName: string, password: string): Promise<{ success: boolean; session?: AdminSession; error?: string }> => {
    setIsLoading(true);

    try {
      console.log('[useAdminAuth] Login attempt:', {
        festivalCode,
        adminCodeOrName,
        passwordLength: password.length
      });

      // Call RPC function to verify admin credentials
      const { data, error } = await supabase.rpc('verify_admin_credentials', {
        p_festival_code: festivalCode,
        p_admin_code_or_name: adminCodeOrName,
        p_password: password
      });

      console.log('[useAdminAuth] RPC Response:', { data, error });

      if (error) {
        console.error('[useAdminAuth] RPC Error:', error);
        
        // Improved error messages
        if (error.code === 'PGRST301' || error.message?.includes('No rows')) {
          throw new Error('Festival not found. Please check the festival code.');
        } else if (error.code === '42501' || error.message?.includes('permission')) {
          throw new Error('You do not have permission to access this festival.');
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        throw error;
      }

      if (data && data.success) {
        console.log('[useAdminAuth] Login successful, creating session');
        const session: AdminSession = {
          type: 'admin',
          festivalId: data.festival_id,
          festivalCode,
          adminId: data.admin_id,
          adminCode: data.admin_code,
          adminName: data.admin_name,
          loginTime: new Date().toISOString(),
          sessionId: crypto.randomUUID()
        };

        console.log('[useAdminAuth] Session created:', session);
        return { success: true, session };
      } else {
        console.log('[useAdminAuth] Login failed - data.success is false');
        const errorMessage = data?.error || 'Invalid admin code/name or password';
        return { 
          success: false, 
          error: errorMessage.includes('Invalid') 
            ? errorMessage 
            : `Authentication failed: ${errorMessage}. Please check your admin code/name and password.`
        };
      }
    } catch (error: any) {
      console.error('[useAdminAuth] Admin login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please check your credentials and try again.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading
  };
}

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SuperAdminSession } from '@/types';

export function useSuperAdminAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (festivalCode: string, password: string): Promise<{ success: boolean; session?: SuperAdminSession; error?: string }> => {
    setIsLoading(true);

    try {
      // Verify super admin password
      const { data, error } = await supabase
        .from('festivals')
        .select('id, super_admin_password')
        .eq('code', festivalCode)
        .single();

      if (error) {
        // Improved error messages
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          throw new Error('Festival not found. Please check the festival code.');
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        throw error;
      }

      if (!data) {
        return { success: false, error: 'Festival not found. Please check the festival code.' };
      }

      if (data.super_admin_password === password) {
        const session: SuperAdminSession = {
          type: 'super_admin',
          festivalId: data.id,
          festivalCode,
          loginTime: new Date().toISOString(),
          sessionId: crypto.randomUUID()
        };

        return { success: true, session };
      } else {
        return { 
          success: false, 
          error: 'Invalid super admin password. Please check your password and try again.' 
        };
      }
    } catch (error: any) {
      console.error('Super admin login error:', error);
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

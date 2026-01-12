'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { resolveCurrentFestivalCode } from '@/lib/festivalCodeRedirect';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle, Users, Shield } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

export default function ViewFestival() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirectTo, setRedirectTo] = useState<'visitor' | 'admin'>('visitor');
  const router = useRouter();

  // Validate code format: 6-12 chars, alphanumeric and dash only
  const validateCode = (value: string): string | null => {
    if (!value || value.trim().length === 0) {
      return null; // No error for empty input
    }

    const trimmed = value.trim();
    
    // Check length
    if (trimmed.length < 6) {
      return 'Festival code must be at least 6 characters long';
    }
    
    if (trimmed.length > 12) {
      return 'Festival code must be at most 12 characters long';
    }

    // Check format: only alphanumeric and dash
    if (!/^[A-Z0-9-]+$/.test(trimmed.toUpperCase())) {
      return 'Festival code can only contain letters, numbers, and dashes (-)';
    }

    return null;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Auto-convert to uppercase and filter out invalid characters (keep only alphanumeric and dash)
    const filtered = inputValue.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    // Limit to 12 characters
    const limited = filtered.substring(0, 12);
    
    setCode(limited);
    
    // Clear errors and success messages when user types
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    
    // Validate code format
    const validationError = validateCode(c);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use resolveCurrentFestivalCode to handle both current and old codes
      const resolvedCode = await resolveCurrentFestivalCode(c);

      if (!resolvedCode) {
        setError('This festival code does not exist. Please check the code and try again.');
        setLoading(false);
        return;
      }

      // If code was resolved to a different code, it means the code was changed
      if (resolvedCode !== c) {
        setSuccess('Festival code has been updated. Redirecting to new code...');
        toast.success('Festival code has been updated. Redirecting to new code...');
        
        // Wait 1.5 seconds to show the message, then redirect
        setTimeout(() => {
          if (redirectTo === 'admin') {
            router.push(`/f/${resolvedCode}/admin/login`);
          } else {
            router.push(`/f/${resolvedCode}`);
          }
        }, 1500);
        return;
      }

      // Code is current, redirect based on user selection
      if (redirectTo === 'admin') {
        router.push(`/f/${resolvedCode}/admin/login`);
      } else {
        router.push(`/f/${resolvedCode}`);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const validationError = validateCode(code);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors relative">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
          Home
        </Link>
        <ThemeToggle />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-md p-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">Access Festival</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">Enter the festival code to continue</p>
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Code Updated</p>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Invalid Festival Code</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">I want to access as:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRedirectTo('visitor')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                redirectTo === 'visitor'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <Users className={`w-8 h-8 mb-2 ${redirectTo === 'visitor' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${redirectTo === 'visitor' ? 'text-blue-900' : 'text-gray-600'}`}>
                Visitor
              </span>
              <span className="text-xs text-gray-500 mt-1 text-center">View festival data</span>
            </button>
            
            <button
              type="button"
              onClick={() => setRedirectTo('admin')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                redirectTo === 'admin'
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              <Shield className={`w-8 h-8 mb-2 ${redirectTo === 'admin' ? 'text-purple-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${redirectTo === 'admin' ? 'text-purple-900' : 'text-gray-600'}`}>
                Admin
              </span>
              <span className="text-xs text-gray-500 mt-1 text-center">Manage festival</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="Enter festival code (6-12 characters, e.g., RHSPVM25)"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 uppercase ${
                validationError 
                  ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                  : error
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              disabled={loading}
              maxLength={12}
            />
            {validationError && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationError}
              </p>
            )}
            {!validationError && code.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {code.length < 6 ? `${6 - code.length} more characters needed` : `Valid format (${code.length}/12)`}
              </p>
            )}
          </div>
          <button 
            type="submit"
            disabled={loading || !!validationError}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              redirectTo === 'admin'
                ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
            } disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Verifying...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {redirectTo === 'admin' ? <Shield className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                {redirectTo === 'admin' ? 'Continue to Admin Login' : 'Continue as Visitor'}
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Don't have a festival code?{' '}
            <a href="/" className="text-blue-600 hover:underline">
              Create a new festival
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

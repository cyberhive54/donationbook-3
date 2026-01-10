'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { resolveCurrentFestivalCode } from '@/lib/festivalCodeRedirect';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function ViewFestival() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
          router.push(`/f/${resolvedCode}`);
        }, 1500);
        return;
      }

      // Code is current, redirect normally
      router.push(`/f/${resolvedCode}`);
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const validationError = validateCode(code);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">View a Festival</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">Enter the festival code shared by your admin</p>
        
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
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Verifying...
              </span>
            ) : (
              'Continue'
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

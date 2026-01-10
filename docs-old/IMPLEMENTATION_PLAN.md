# Implementation Plan - Access Logging & Multiple Passwords

## ✅ Phase 1: Database Setup (COMPLETED)

**File Created**: `supabase-migration-access-logging.sql`

### What Was Created:

1. **`access_logs` Table**
   - Tracks every festival access
   - Fields: festival_id, visitor_name, access_method, password_used, accessed_at, user_agent, ip_address, session_id
   - Indexes for performance

2. **`festival_passwords` Table**
   - Multiple passwords per festival
   - Fields: festival_id, password, password_label, is_active, created_at, last_used_at, usage_count
   - Unique constraint per festival

3. **Helper Functions**
   - `log_festival_access()` - Log visitor access
   - `verify_festival_password()` - Check password validity
   - `get_festival_passwords()` - Get all passwords for festival

4. **Views**
   - `festival_visitor_stats` - Visitor statistics
   - `recent_festival_visitors` - Recent visitors
   - `password_usage_stats` - Password usage analytics

5. **Migration**
   - Existing `user_password` migrated to `festival_passwords` as "Main Password"
   - Backward compatible

---

## 📋 Phase 2: TypeScript Types (NEXT)

### File to Update: `types/index.ts`

Add these interfaces:

\`\`\`typescript
// Access Log
export interface AccessLog {
  id: string;
  festival_id: string;
  visitor_name: string;
  access_method: 'password_modal' | 'direct_link';
  password_used: string | null;
  accessed_at: string;
  user_agent: string | null;
  ip_address: string | null;
  session_id: string | null;
}

// Festival Password
export interface FestivalPassword {
  id: string;
  festival_id: string;
  password: string;
  password_label: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  last_used_at: string | null;
  usage_count: number;
}

// Visitor Stats
export interface VisitorStats {
  festival_id: string;
  festival_code: string;
  event_name: string;
  unique_visitors: number;
  total_visits: number;
  last_visit: string | null;
  total_visitors: number;
  last_visitor_name: string | null;
  last_visitor_at: string | null;
}

// Update Festival interface
export interface Festival {
  // ... existing fields ...
  total_visitors: number;
  last_visitor_name: string | null;
  last_visitor_at: string | null;
}

// Session structure for localStorage
export interface UserSession {
  authenticated: boolean;
  date: string;
  token: string;
  visitorName: string;
  sessionId: string;
  accessMethod: 'password_modal' | 'direct_link';
  passwordUsed: string;
  loggedAt: string;
}
\`\`\`

---

## 🔧 Phase 3: Update usePasswordAuth Hook

### File: `lib/hooks/usePasswordAuth.ts`

**Changes Needed:**

1. Add name parameter to verifyPassword function
2. Call log_festival_access() on successful auth
3. Update localStorage structure
4. Generate session ID

\`\`\`typescript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid'; // Add uuid package

export function usePasswordAuth(code: string) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(true);
  const [festivalId, setFestivalId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [code]);

  const checkAuth = async () => {
    try {
      // Fetch festival
      const { data: festival } = await supabase
        .from('festivals')
        .select('id, requires_user_password, user_password_updated_at')
        .eq('code', code)
        .single();

      if (!festival) {
        setIsLoading(false);
        return;
      }

      setFestivalId(festival.id);
      setRequiresPassword(festival.requires_user_password);

      if (!festival.requires_user_password) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Check localStorage
      const stored = localStorage.getItem(`userPasswordAuth:${code}`);
      if (stored) {
        const session = JSON.parse(stored);
        const today = new Date().toISOString().split('T')[0];
        
        // Validate session
        if (
          session.authenticated &&
          session.date === today &&
          session.token === festival.user_password_updated_at
        ) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      }

      setIsAuthenticated(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsLoading(false);
    }
  };

  const verifyPassword = async (password: string, name: string): Promise<boolean> => {
    try {
      if (!festivalId) return false;

      // Verify password using database function
      const { data, error } = await supabase.rpc('verify_festival_password', {
        p_festival_id: festivalId,
        p_password: password,
      });

      if (error) throw error;
      if (!data) return false;

      // Format name
      const formattedName = name.trim().toLowerCase().replace(/\s+/g, '-');
      const sessionId = uuidv4();

      // Log access
      await supabase.rpc('log_festival_access', {
        p_festival_id: festivalId,
        p_visitor_name: formattedName,
        p_access_method: 'password_modal',
        p_password_used: password,
        p_session_id: sessionId,
      });

      // Get updated token
      const { data: festival } = await supabase
        .from('festivals')
        .select('user_password_updated_at')
        .eq('id', festivalId)
        .single();

      // Create session
      const session = {
        authenticated: true,
        date: new Date().toISOString().split('T')[0],
        token: festival?.user_password_updated_at || '',
        visitorName: formattedName,
        sessionId,
        accessMethod: 'password_modal',
        passwordUsed: password,
        loggedAt: new Date().toISOString(),
      };

      localStorage.setItem(`userPasswordAuth:${code}`, JSON.stringify(session));
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  return {
    isAuthenticated,
    isLoading,
    requiresPassword,
    verifyPassword,
  };
}
\`\`\`

---

## 🎨 Phase 4: Update PasswordGate Component

### File: `components/PasswordGate.tsx`

**Changes Needed:**

1. Add name input field
2. Make name required
3. Update verifyPassword call

\`\`\`typescript
'use client';

import { useState } from 'react';
import { usePasswordAuth } from '@/lib/hooks/usePasswordAuth';
import toast from 'react-hot-toast';

interface PasswordGateProps {
  code: string;
  children: React.ReactNode;
}

export default function PasswordGate({ code, children }: PasswordGateProps) {
  const { isAuthenticated, isLoading, requiresPassword, verifyPassword } = usePasswordAuth(code);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Please enter password');
      return;
    }
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setSubmitting(true);
    const isValid = await verifyPassword(password, name);
    setSubmitting(false);

    if (isValid) {
      toast.success('Access granted!');
    } else {
      toast.error('Invalid password');
      setPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!requiresPassword || isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Access Required
        </h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Enter your name and password to continue
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Verifying...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
\`\`\`

---

## 🔗 Phase 5: Direct Link Authentication

### File: `app/f/[code]/page.tsx`

**Add URL parameter handling:**

\`\`\`typescript
// Add at the top of the component
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const password = params.get('p');
  const name = params.get('name');
  
  if (mode === 'login' && password && name) {
    handleDirectLinkAuth(password, name);
  }
}, []);

const handleDirectLinkAuth = async (password: string, name: string) => {
  try {
    if (!festival) return;
    
    // Format name
    const formattedName = name.trim().toLowerCase().replace(/\s+/g, '-');
    const sessionId = uuidv4();
    
    // Verify password
    const { data: isValid } = await supabase.rpc('verify_festival_password', {
      p_festival_id: festival.id,
      p_password: password,
    });
    
    if (!isValid) {
      toast.error('Invalid password in URL');
      // Remove query params
      window.history.replaceState({}, '', `/f/${code}`);
      return;
    }
    
    // Log access
    await supabase.rpc('log_festival_access', {
      p_festival_id: festival.id,
      p_visitor_name: formattedName,
      p_access_method: 'direct_link',
      p_password_used: password,
      p_session_id: sessionId,
    });
    
    // Create session
    const session = {
      authenticated: true,
      date: new Date().toISOString().split('T')[0],
      token: festival.user_password_updated_at || '',
      visitorName: formattedName,
      sessionId,
      accessMethod: 'direct_link',
      passwordUsed: password,
      loggedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(`userPasswordAuth:${code}`, JSON.stringify(session));
    
    // Remove query params and reload
    window.history.replaceState({}, '', `/f/${code}`);
    toast.success(`Welcome, ${formattedName}!`);
    window.location.reload();
  } catch (error) {
    console.error('Direct link auth error:', error);
    toast.error('Authentication failed');
  }
};
\`\`\`

---

## 👨‍💼 Phase 6: Admin Panel - Manage Passwords

### Add to `app/f/[code]/admin/page.tsx`

**New Section:**

\`\`\`typescript
// State
const [passwords, setPasswords] = useState<FestivalPassword[]>([]);
const [newPassword, setNewPassword] = useState('');
const [newPasswordLabel, setNewPasswordLabel] = useState('');

// Fetch passwords
const fetchPasswords = async () => {
  if (!festival) return;
  const { data } = await supabase.rpc('get_festival_passwords', {
    p_festival_id: festival.id,
  });
  setPasswords(data || []);
};

// Add password
const handleAddPassword = async () => {
  if (!newPassword.trim() || !festival) return;
  
  try {
    const { error } = await supabase.from('festival_passwords').insert({
      festival_id: festival.id,
      password: newPassword.trim(),
      password_label: newPasswordLabel.trim() || null,
      is_active: true,
    });
    
    if (error) throw error;
    toast.success('Password added');
    setNewPassword('');
    setNewPasswordLabel('');
    fetchPasswords();
  } catch (error: any) {
    if (error.code === '23505') {
      toast.error('Password already exists');
    } else {
      toast.error('Failed to add password');
    }
  }
};

// Toggle password active status
const handleTogglePassword = async (id: string, currentStatus: boolean) => {
  try {
    const { error } = await supabase
      .from('festival_passwords')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    if (error) throw error;
    toast.success(currentStatus ? 'Password deactivated' : 'Password activated');
    fetchPasswords();
  } catch (error) {
    toast.error('Failed to update password');
  }
};

// Delete password
const handleDeletePassword = async (id: string) => {
  if (!confirm('Delete this password?')) return;
  
  try {
    const { error } = await supabase
      .from('festival_passwords')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    toast.success('Password deleted');
    fetchPasswords();
  } catch (error) {
    toast.error('Failed to delete password');
  }
};

// JSX
<div className="theme-card bg-white rounded-lg shadow-md p-6">
  <h3 className="text-lg font-bold text-gray-800 mb-4">Manage Passwords</h3>
  
  {/* Add New Password */}
  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
    <h4 className="font-semibold text-gray-700 mb-3">Add New Password</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <input
        type="text"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Password"
        className="px-3 py-2 border rounded-lg"
      />
      <input
        type="text"
        value={newPasswordLabel}
        onChange={(e) => setNewPasswordLabel(e.target.value)}
        placeholder="Label (e.g., Guest, VIP)"
        className="px-3 py-2 border rounded-lg"
      />
    </div>
    <button
      onClick={handleAddPassword}
      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Add Password
    </button>
  </div>
  
  {/* Password List */}
  <div className="space-y-3">
    {passwords.map((pwd) => (
      <div key={pwd.id} className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">{pwd.password}</span>
            {pwd.password_label && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {pwd.password_label}
              </span>
            )}
            {!pwd.is_active && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                Inactive
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Used {pwd.usage_count} times
            {pwd.last_used_at && ` • Last used: ${new Date(pwd.last_used_at).toLocaleString()}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTogglePassword(pwd.id, pwd.is_active)}
            className={`px-3 py-1 rounded text-sm ${
              pwd.is_active
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {pwd.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => handleDeletePassword(pwd.id)}
            className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    ))}
  </div>
</div>
\`\`\`

---

## 📊 Phase 7: Visitor Logs View (Admin)

**Add new section in admin panel:**

\`\`\`typescript
// State
const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);

// Fetch logs
const fetchAccessLogs = async () => {
  if (!festival) return;
  
  const { data: logs } = await supabase
    .from('access_logs')
    .select('*')
    .eq('festival_id', festival.id)
    .order('accessed_at', { ascending: false })
    .limit(50);
  
  const { data: stats } = await supabase
    .from('festival_visitor_stats')
    .select('*')
    .eq('festival_id', festival.id)
    .single();
  
  setAccessLogs(logs || []);
  setVisitorStats(stats);
};

// JSX
<div className="theme-card bg-white rounded-lg shadow-md p-6">
  <h3 className="text-lg font-bold text-gray-800 mb-4">Visitor Logs</h3>
  
  {/* Stats Cards */}
  {visitorStats && (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">
          {visitorStats.unique_visitors}
        </div>
        <div className="text-sm text-gray-600">Unique Visitors</div>
      </div>
      <div className="p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {visitorStats.total_visits}
        </div>
        <div className="text-sm text-gray-600">Total Visits</div>
      </div>
      <div className="p-4 bg-purple-50 rounded-lg">
        <div className="text-sm font-semibold text-purple-600">
          {visitorStats.last_visitor_name || 'N/A'}
        </div>
        <div className="text-sm text-gray-600">Last Visitor</div>
      </div>
      <div className="p-4 bg-orange-50 rounded-lg">
        <div className="text-sm font-semibold text-orange-600">
          {visitorStats.last_visit ? new Date(visitorStats.last_visit).toLocaleString() : 'N/A'}
        </div>
        <div className="text-sm text-gray-600">Last Visit</div>
      </div>
    </div>
  )}
  
  {/* Logs Table */}
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
            Visitor
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
            Method
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
            Password Used
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
            Time
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {accessLogs.map((log) => (
          <tr key={log.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm text-gray-900">{log.visitor_name}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                log.access_method === 'password_modal'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {log.access_method === 'password_modal' ? 'Password Modal' : 'Direct Link'}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 font-mono">
              {log.password_used || 'N/A'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">
              {new Date(log.accessed_at).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
\`\`\`

---

## ✅ Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Verify tables created
- [ ] Test password modal with name field
- [ ] Test name formatting (spaces to dashes)
- [ ] Test access logging
- [ ] Test multiple passwords
- [ ] Test direct link: `/f/CODE?mode=login&p=pass&name=john`
- [ ] Test invalid direct link parameters
- [ ] Test admin password management
- [ ] Test visitor logs view
- [ ] Test password usage stats
- [ ] Test session expiration
- [ ] Test mobile responsiveness

---

## 📚 Documentation

Update these files:
- [ ] README.md - Add new features
- [ ] USER_FLOWS.md - Add direct link flow
- [ ] PROJECT_OVERVIEW.md - Add new tables

---

**Status**: Phase 1 Complete ✅  
**Next**: Phase 2 - Update TypeScript Types  
**Last Updated**: January 2025

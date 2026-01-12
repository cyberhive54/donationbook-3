'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AlertCircle, Info } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let c = '';
  for (let i = 0; i < 8; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export default function CreateFestival() {
  const [form, setForm] = useState({
    event_name: '',
    organiser: '',
    mentor: '',
    guide: '',
    location: '',
    event_start_date: '',
    event_end_date: '',
    ce_start_date: '', // Collection/Expense start date (required)
    ce_end_date: '', // Collection/Expense end date (required)
    requires_password: true, // Default checked (only for visitor password)
    user_password: 'Festive@123',
    default_admin_name: 'Default Admin',
    admin_password: 'admin',
    super_admin_password: 'Super Admin', // Auto-filled
    theme_bg_color: '#f8fafc',
    theme_bg_image_url: '',
    theme_dark: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPasswordWarning, setShowPasswordWarning] = useState(false);
  const router = useRouter();

  const [postCreate, setPostCreate] = useState<{ open: boolean; code: string; countdown: number; auto: boolean }>(
    { open: false, code: '', countdown: 10, auto: true }
  );

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!form.event_name.trim()) {
      newErrors.event_name = 'Festival name is required';
    }

    if (!form.ce_start_date) {
      newErrors.ce_start_date = 'Collection/Expense start date is required';
    }

    if (!form.ce_end_date) {
      newErrors.ce_end_date = 'Collection/Expense end date is required';
    }

    // Date validations
    if (form.ce_start_date && form.ce_end_date) {
      const ceStart = new Date(form.ce_start_date);
      const ceEnd = new Date(form.ce_end_date);

      if (ceStart > ceEnd) {
        newErrors.ce_end_date = 'End date must be after start date';
      }

      // Festival dates validation (if provided)
      if (form.event_start_date) {
        const eventStart = new Date(form.event_start_date);
        if (eventStart < ceStart) {
          newErrors.event_start_date = 'Festival start date must be within Collection/Expense date range';
        }
      }

      if (form.event_end_date) {
        const eventEnd = new Date(form.event_end_date);
        if (eventEnd > ceEnd) {
          newErrors.event_end_date = 'Festival end date must be within Collection/Expense date range';
        }
      }

      if (form.event_start_date && form.event_end_date) {
        const eventStart = new Date(form.event_start_date);
        const eventEnd = new Date(form.event_end_date);
        if (eventStart > eventEnd) {
          newErrors.event_end_date = 'Festival end date must be after start date';
        }
      }
    }

    // Admin password and Super Admin password are ALWAYS REQUIRED
    if (!form.admin_password.trim()) {
      newErrors.admin_password = 'Admin password is required';
    }
    if (!form.super_admin_password.trim()) {
      newErrors.super_admin_password = 'Super Admin password is required';
    }
    
    // Default admin name is ALWAYS REQUIRED
    if (!form.default_admin_name.trim()) {
      newErrors.default_admin_name = 'Default admin name is required';
    }

    // Visitor password is only required if requires_password is true
    if (form.requires_password) {
      if (!form.user_password.trim()) {
        newErrors.user_password = 'Visitor password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle password checkbox change
  const handlePasswordToggle = (checked: boolean) => {
    if (!checked) {
      // Show warning when unchecking
      setShowPasswordWarning(true);
    } else {
      setForm({ ...form, requires_password: true });
      setShowPasswordWarning(false);
    }
  };

  // Handle "I Understand" button
  const handleUnderstandWarning = () => {
    setForm({ ...form, requires_password: false });
    setShowPasswordWarning(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);
    try {
      let code = genCode();
      // ensure unique
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.from('festivals').select('id').eq('code', code).maybeSingle();
        if (!data) break;
        code = genCode();
      }

      // Insert festival and get the ID
      const { data: festivalData, error: festivalError } = await supabase.from('festivals').insert({
        code,
        event_name: form.event_name.trim(),
        organiser: form.organiser.trim() || null,
        mentor: form.mentor.trim() || null,
        guide: form.guide.trim() || null,
        location: form.location.trim() || null,
        event_start_date: form.event_start_date || null,
        event_end_date: form.event_end_date || null,
        ce_start_date: form.ce_start_date, // Required
        ce_end_date: form.ce_end_date, // Required
        requires_password: form.requires_password,
        requires_user_password: form.requires_password, // Legacy field
        user_password: form.requires_password ? form.user_password.trim() : null,
        admin_password: form.admin_password.trim(), // Always save admin password
        super_admin_password: form.super_admin_password.trim(), // Always save super admin password
        theme_bg_color: form.theme_bg_color || null,
        theme_bg_image_url: form.theme_bg_image_url || null,
        theme_dark: form.theme_dark,
        other_data: { title_size: 'md', title_weight: 'bold', title_align: 'center', title_color: 'default' },
      }).select('id').single();

      if (festivalError) throw festivalError;
      if (!festivalData) throw new Error('Failed to create festival');

      const festivalId = festivalData.id;

      // Generate unique admin_code from default_admin_name (uppercase first 6 chars, pad if needed)
      let adminCode = form.default_admin_name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
      if (adminCode.length < 6) {
        // Pad with random letters/numbers if too short
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        while (adminCode.length < 6) {
          adminCode += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      // Ensure admin_code is unique (check globally in case of global unique constraint)
      // Also check within festival if constraint is per-festival
      let attempts = 0;
      let finalAdminCode = adminCode;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      
      while (attempts < 50) {
        // Check globally first (in case of global unique constraint)
        const { data: existingGlobal } = await supabase
          .from('admins')
          .select('admin_code, festival_id')
          .eq('admin_code', finalAdminCode)
          .maybeSingle();
        
        // Also check within festival (in case of per-festival unique constraint)
        const { data: existingFestival } = await supabase
          .from('admins')
          .select('admin_code')
          .eq('festival_id', festivalId)
          .eq('admin_code', finalAdminCode)
          .maybeSingle();
        
        // If not found in either check, code is unique
        if (!existingGlobal && !existingFestival) break;
        
        // Generate new code: use first 3 chars from name, then 3 random chars
        // This ensures better uniqueness while maintaining readability
        const randomPart = chars[Math.floor(Math.random() * chars.length)] + 
                          chars[Math.floor(Math.random() * chars.length)] + 
                          chars[Math.floor(Math.random() * chars.length)];
        finalAdminCode = (adminCode.substring(0, 3) + randomPart).substring(0, 6);
        
        // If still not unique after many attempts, use timestamp-based approach
        if (attempts >= 30) {
          const timestamp = Date.now().toString(36).toUpperCase().slice(-3); // Last 3 chars of timestamp
          const randomPart2 = chars[Math.floor(Math.random() * chars.length)] + 
                             chars[Math.floor(Math.random() * chars.length)] + 
                             chars[Math.floor(Math.random() * chars.length)];
          finalAdminCode = (timestamp + randomPart2).substring(0, 6);
        }
        
        attempts++;
      }
      
      if (attempts >= 50) {
        throw new Error('Failed to generate unique admin code after multiple attempts. Please try a different admin name.');
      }
      
      // Final validation: ensure code is exactly 6 uppercase alphanumeric characters
      if (!/^[A-Z0-9]{6}$/.test(finalAdminCode)) {
        throw new Error('Generated admin code does not meet format requirements. Please try again.');
      }

      // Create default admin in admins table
      const { data: adminData, error: adminError } = await supabase.from('admins').insert({
        festival_id: festivalId,
        admin_code: finalAdminCode,
        admin_name: form.default_admin_name.trim(),
        admin_password_hash: form.admin_password.trim(), // Store as plain text (as per current implementation)
        is_active: true,
        max_user_passwords: 3,
        created_by: null, // Default admin is created during festival creation, no creator
      }).select('admin_id').single();

      if (adminError) {
        console.error('Error creating default admin:', adminError);
        throw new Error('Failed to create default admin: ' + adminError.message);
      }

      // If visitor password is required, create first user password
      if (form.requires_password && adminData) {
        const { error: passwordError } = await supabase.from('user_passwords').insert({
          admin_id: adminData.admin_id,
          festival_id: festivalId,
          password: form.user_password.trim(),
          label: 'Default Password',
          is_active: true,
        });

        if (passwordError) {
          console.error('Error creating user password:', passwordError);
          // Don't throw - festival and admin are already created
          toast.error('Festival created but failed to create visitor password');
        }
      }

      toast.success('Festival created successfully!');
      setPostCreate({ open: true, code, countdown: 10, auto: true });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to create festival');
    } finally {
      setLoading(false);
    }
  };

  // handle countdown auto-redirect
  useEffect(() => {
    if (!postCreate.open || !postCreate.auto) return;
    if (postCreate.countdown <= 0) {
      router.push(`/f/${postCreate.code}/admin/sup`);
      return;
    }
    const t = setTimeout(() => setPostCreate((s) => ({ ...s, countdown: s.countdown - 1 })), 1000);
    return () => clearTimeout(t);
  }, [postCreate.open, postCreate.auto, postCreate.countdown, postCreate.code, router]);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success('Copied'); } catch { toast.error('Copy failed'); }
  };

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/f/${postCreate.code}` : '';
  const adminUrl = typeof window !== 'undefined' ? `${window.location.origin}/f/${postCreate.code}/admin` : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors relative">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
          Home
        </Link>
        <ThemeToggle />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-2xl p-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">Create a Festival</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">Fill in the details below. A unique 8-letter code will be generated.</p>
        
        <form onSubmit={submit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event/Festival Name <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full px-3 py-2 border rounded-lg ${errors.event_name ? 'border-red-500' : 'border-gray-300'}`}
                value={form.event_name} 
                onChange={(e) => {
                  setForm({ ...form, event_name: e.target.value });
                  if (errors.event_name) setErrors({ ...errors, event_name: '' });
                }}
              />
              {errors.event_name && <p className="text-red-500 text-xs mt-1">{errors.event_name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organiser</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.organiser} onChange={(e) => setForm({ ...form, organiser: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guide</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.guide} onChange={(e) => setForm({ ...form, guide: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mentor</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.mentor} onChange={(e) => setForm({ ...form, mentor: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Collection/Expense Date Range */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Collection/Expense Date Range</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                This defines the valid date range for adding collections and expenses. All transactions must fall within this range.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  className={`w-full px-3 py-2 border rounded-lg ${errors.ce_start_date ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.ce_start_date} 
                  onChange={(e) => {
                    setForm({ ...form, ce_start_date: e.target.value });
                    if (errors.ce_start_date) setErrors({ ...errors, ce_start_date: '' });
                  }}
                />
                {errors.ce_start_date && <p className="text-red-500 text-xs mt-1">{errors.ce_start_date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  className={`w-full px-3 py-2 border rounded-lg ${errors.ce_end_date ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.ce_end_date} 
                  onChange={(e) => {
                    setForm({ ...form, ce_end_date: e.target.value });
                    if (errors.ce_end_date) setErrors({ ...errors, ce_end_date: '' });
                  }}
                />
                {errors.ce_end_date && <p className="text-red-500 text-xs mt-1">{errors.ce_end_date}</p>}
              </div>
            </div>
          </div>

          {/* Festival Event Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Festival Event Dates (Optional)</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                If provided, festival dates must be within the Collection/Expense date range above.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Festival Start Date</label>
                <input 
                  type="date" 
                  className={`w-full px-3 py-2 border rounded-lg ${errors.event_start_date ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.event_start_date} 
                  onChange={(e) => {
                    setForm({ ...form, event_start_date: e.target.value });
                    if (errors.event_start_date) setErrors({ ...errors, event_start_date: '' });
                  }}
                  min={form.ce_start_date}
                  max={form.ce_end_date}
                />
                {errors.event_start_date && <p className="text-red-500 text-xs mt-1">{errors.event_start_date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Festival End Date</label>
                <input 
                  type="date" 
                  className={`w-full px-3 py-2 border rounded-lg ${errors.event_end_date ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.event_end_date} 
                  onChange={(e) => {
                    setForm({ ...form, event_end_date: e.target.value });
                    if (errors.event_end_date) setErrors({ ...errors, event_end_date: '' });
                  }}
                  min={form.ce_start_date}
                  max={form.ce_end_date}
                />
                {errors.event_end_date && <p className="text-red-500 text-xs mt-1">{errors.event_end_date}</p>}
              </div>
            </div>
          </div>

          {/* Password Protection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Password Protection</h3>
            
            {/* Default Admin Name - Always Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Admin Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                className={`w-full px-3 py-2 border rounded-lg ${errors.default_admin_name ? 'border-red-500' : 'border-gray-300'}`}
                value={form.default_admin_name} 
                onChange={(e) => {
                  setForm({ ...form, default_admin_name: e.target.value });
                  if (errors.default_admin_name) setErrors({ ...errors, default_admin_name: '' });
                }}
                placeholder="e.g., Default Admin"
              />
              {errors.default_admin_name && <p className="text-red-500 text-xs mt-1">{errors.default_admin_name}</p>}
              <p className="text-xs text-gray-500 mt-1">This admin will be created automatically. Admin password below will be used for this admin.</p>
            </div>

            {/* Admin Password - Always Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                className={`w-full px-3 py-2 border rounded-lg ${errors.admin_password ? 'border-red-500' : 'border-gray-300'}`}
                value={form.admin_password} 
                onChange={(e) => {
                  setForm({ ...form, admin_password: e.target.value });
                  if (errors.admin_password) setErrors({ ...errors, admin_password: '' });
                }}
                placeholder="Enter admin password"
              />
              {errors.admin_password && <p className="text-red-500 text-xs mt-1">{errors.admin_password}</p>}
              <p className="text-xs text-gray-500 mt-1">Password for default admin (admin role credentials)</p>
            </div>

            {/* Super Admin Password - Always Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Super Admin Password <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                className={`w-full px-3 py-2 border rounded-lg ${errors.super_admin_password ? 'border-red-500' : 'border-gray-300'}`}
                value={form.super_admin_password} 
                onChange={(e) => {
                  setForm({ ...form, super_admin_password: e.target.value });
                  if (errors.super_admin_password) setErrors({ ...errors, super_admin_password: '' });
                }}
                placeholder="Enter super admin password"
              />
              {errors.super_admin_password && <p className="text-red-500 text-xs mt-1">{errors.super_admin_password}</p>}
              <p className="text-xs text-gray-500 mt-1">Password for super admin access</p>
            </div>

            {/* Visitor Password - Only when checkbox is checked */}
            <div className="border-t pt-4 mt-4">
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.requires_password} 
                    onChange={(e) => handlePasswordToggle(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Requires visitor password to view pages
                </label>
              </div>

              {form.requires_password && (
                <div className="pl-6 border-l-2 border-blue-500">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visitor Password <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      className={`w-full px-3 py-2 border rounded-lg ${errors.user_password ? 'border-red-500' : 'border-gray-300'}`}
                      value={form.user_password} 
                      onChange={(e) => {
                        setForm({ ...form, user_password: e.target.value });
                        if (errors.user_password) setErrors({ ...errors, user_password: '' });
                      }}
                      placeholder="Enter visitor password"
                    />
                    {errors.user_password && <p className="text-red-500 text-xs mt-1">{errors.user_password}</p>}
                    <p className="text-xs text-gray-500 mt-1">Password for visitors to access festival pages</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Theme Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Theme Settings (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <input type="color" className="w-full h-10 border border-gray-300 rounded-lg" value={form.theme_bg_color} onChange={(e) => setForm({ ...form, theme_bg_color: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.theme_bg_image_url} onChange={(e) => setForm({ ...form, theme_bg_image_url: e.target.value })} placeholder="https://example.com/image.jpg" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.theme_dark} onChange={(e) => setForm({ ...form, theme_dark: e.target.checked })} className="w-4 h-4" />
              Enable dark theme
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading} 
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Festival...' : 'Create Festival'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Warning Modal */}
      {showPasswordWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Warning: No Password Protection</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Anyone with the festival code can view festival data, and you can't view the visitors analytics.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Without password protection, visitor tracking and analytics will not be available.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleUnderstandWarning}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
              >
                I Understand
              </button>
              <button
                onClick={() => {
                  setShowPasswordWarning(false);
                  setForm({ ...form, requires_password: true });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {postCreate.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Festival Created Successfully!</h2>
            <p className="text-sm text-red-600 font-semibold mb-3">⚠️ Warning: Save these details now. If lost, they cannot be recovered.</p>

            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Festival Code</p>
                    <p className="font-mono text-lg font-bold">{postCreate.code}</p>
                  </div>
                  <button onClick={() => copy(postCreate.code)} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">Copy</button>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs text-gray-500">Public URL</p>
                    <p className="font-mono text-sm truncate">{publicUrl}</p>
                  </div>
                  <button onClick={() => copy(publicUrl)} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 ml-2">Copy</button>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs text-gray-500">Admin URL</p>
                    <p className="font-mono text-sm truncate">{adminUrl}</p>
                  </div>
                  <button onClick={() => copy(adminUrl)} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 ml-2">Copy</button>
                </div>
                <p className="text-xs text-gray-600 mt-2">💡 Remember your admin password and use this URL to manage the festival.</p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Auto redirect</label>
                  <button
                    onClick={() => setPostCreate((s) => ({ ...s, auto: !s.auto }))}
                    className={`px-3 py-1 rounded text-sm font-medium ${postCreate.auto ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {postCreate.auto ? 'On' : 'Off'}
                  </button>
                </div>
                <div className="text-sm text-gray-700">
                  Redirecting in <span className="font-semibold text-blue-600">{postCreate.countdown}s</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => router.push(`/f/${postCreate.code}/admin/sup`)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Go to Super Admin Dashboard
                </button>
                <button
                  onClick={() => {
                    setPostCreate({ open: false, code: '', countdown: 10, auto: true });
                    setForm({
                      event_name: '',
                      organiser: '',
                      mentor: '',
                      guide: '',
                      location: '',
                      event_start_date: '',
                      event_end_date: '',
                      ce_start_date: '',
                      ce_end_date: '',
                      requires_password: true,
                      user_password: 'Festive@123',
                      default_admin_name: 'Default Admin',
                      admin_password: 'admin',
                      super_admin_password: 'Super Admin',
                      theme_bg_color: '#f8fafc',
                      theme_bg_image_url: '',
                      theme_dark: false,
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


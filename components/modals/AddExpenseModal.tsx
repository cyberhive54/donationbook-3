'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Info, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Expense, Admin } from '@/types';
import { useSession } from '@/lib/hooks/useSession';

interface ExpenseForm {
  item: string;
  pieces: string;
  price_per_piece: string;
  total_amount: string;
  category: string;
  mode: string;
  note: string;
  date: string;
  time_hour: string;
  time_minute: string;
  manualTotal: boolean;
  expense_by_admin_id: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: string[];
  modes: string[];
  editData?: Expense | null;
  festivalId: string;
  festivalStartDate?: string;
  festivalEndDate?: string;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  modes,
  editData,
  festivalId,
  festivalStartDate,
  festivalEndDate,
}: AddExpenseModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [festivalCode, setFestivalCode] = useState<string>('');
  const { session } = useSession(festivalCode);
  
  const now = new Date();
  const currentHour = now.getHours().toString();
  const currentMinute = now.getMinutes().toString();
  
  const emptyForm: ExpenseForm = {
    item: '',
    pieces: '1',
    price_per_piece: '',
    total_amount: '',
    category: categories[0] || '',
    mode: modes[0] || '',
    note: '',
    date: today,
    time_hour: currentHour,
    time_minute: currentMinute,
    manualTotal: false,
    expense_by_admin_id: '',
  };

  const [forms, setForms] = useState<ExpenseForm[]>([emptyForm]);
  const [isLoading, setIsLoading] = useState(false);
  const [festival, setFestival] = useState<{ ce_start_date?: string; ce_end_date?: string; event_name?: string; admin_display_preference?: string } | null>(null);
  const [loadingFestival, setLoadingFestival] = useState(true);
  const [dateErrors, setDateErrors] = useState<Record<number, string>>({});
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string>('');

  // Fetch festival CE dates
  useEffect(() => {
    const fetchFestival = async () => {
      if (!festivalId) return;
      
      setLoadingFestival(true);
      try {
        const { data, error } = await supabase
          .from('festivals')
          .select('code, ce_start_date, ce_end_date, event_name, admin_display_preference')
          .eq('id', festivalId)
          .single();

        if (error) throw error;
        setFestival(data as { ce_start_date?: string; ce_end_date?: string; event_name?: string; admin_display_preference?: string });
        setFestivalCode(data.code || '');

        // Fetch all active admins
        const { data: adminsData } = await supabase
          .from('admins')
          .select('*')
          .eq('festival_id', festivalId)
          .eq('is_active', true)
          .order('admin_name');

        setAdmins(adminsData || []);

        if (session?.type === 'admin') {
          setCurrentAdminId(session.adminId);
          // Set default for expense_by_admin_id in forms
          setForms(prevForms => prevForms.map(form => ({
            ...form,
            expense_by_admin_id: session.adminId || ''
          })));
        } else if (session?.type === 'super_admin') {
          // Super admin can select any admin, default to the default admin (oldest with created_by = null)
          const nullCreatedByAdmins = (adminsData || []).filter((a: Admin) => !a.created_by || a.created_by === null || a.created_by === '');
          const defaultAdmin = nullCreatedByAdmins.length > 0 
            ? nullCreatedByAdmins.reduce((oldest: Admin, current: Admin) => 
                new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest
              )
            : adminsData?.[0];
          const defaultAdminId = defaultAdmin?.admin_id || '';
          setCurrentAdminId(defaultAdminId);
          // Set default for expense_by_admin_id in forms
          setForms(prevForms => prevForms.map(form => ({
            ...form,
            expense_by_admin_id: defaultAdminId
          })));
        }
      } catch (error) {
        console.error('Error fetching festival:', error);
        toast.error('Failed to load festival information');
      } finally {
        setLoadingFestival(false);
      }
    };

    if (isOpen) {
      fetchFestival();
    }
  }, [festivalId, isOpen, session]);

  // Reset forms when modal opens or editData changes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setForms([{
          item: editData.item,
          pieces: editData.pieces.toString(),
          price_per_piece: editData.price_per_piece.toString(),
          total_amount: editData.total_amount.toString(),
          category: editData.category,
          mode: editData.mode,
          note: editData.note || '',
          date: editData.date,
          time_hour: editData.time_hour?.toString() || '0',
          time_minute: editData.time_minute?.toString() || '0',
          manualTotal: false,
          expense_by_admin_id: editData.created_by_admin_id || currentAdminId,
        }]);
      } else {
        setForms([{ ...emptyForm, expense_by_admin_id: currentAdminId }]);
      }
      setDateErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData, currentAdminId]);

  // Validate date against CE range
  const validateDate = (index: number, date: string): boolean => {
    if (!festival?.ce_start_date || !festival?.ce_end_date) {
      setDateErrors(prev => ({
        ...prev,
        [index]: 'Collection/Expense date range not set for this festival'
      }));
      return false;
    }

    const selectedDate = new Date(date);
    const ceStart = new Date(festival.ce_start_date);
    const ceEnd = new Date(festival.ce_end_date);

    if (selectedDate < ceStart || selectedDate > ceEnd) {
      setDateErrors(prev => ({
        ...prev,
        [index]: `Date must be between ${festival.ce_start_date} and ${festival.ce_end_date}`
      }));
      return false;
    }

    setDateErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
    return true;
  };

  const addForm = () => {
    if (forms.length < 10) {
      setForms([...forms, { ...emptyForm }]);
    }
  };

  const removeForm = (index: number) => {
    if (forms.length > 1) {
      setForms(forms.filter((_, i) => i !== index));
      setDateErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const updateForm = (index: number, field: keyof ExpenseForm, value: string | boolean) => {
    const newForms = [...forms];
    newForms[index] = { ...newForms[index], [field]: value };

    if (field === 'pieces' || field === 'price_per_piece') {
      if (!newForms[index].manualTotal) {
        const pieces = Number(newForms[index].pieces) || 0;
        const pricePerPiece = Number(newForms[index].price_per_piece) || 0;
        newForms[index].total_amount = (pieces * pricePerPiece).toFixed(2);
      }
    }

    if (field === 'total_amount') {
      newForms[index].manualTotal = true;
    }

    // Validate date when it changes
    if (field === 'date' && typeof value === 'string') {
      validateDate(index, value);
    }

    setForms(newForms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if CE dates are set
    if (!festival?.ce_start_date || !festival?.ce_end_date) {
      toast.error('Collection/Expense date range not set. Please contact admin.');
      return;
    }

    // Validate all forms
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      if (
        !form.item.trim() ||
        !form.pieces ||
        !form.price_per_piece ||
        !form.total_amount ||
        !form.category ||
        !form.mode ||
        !form.date
      ) {
        toast.error(`Form ${i + 1}: Please fill all required fields`);
        return;
      }
      if (
        isNaN(Number(form.pieces)) ||
        Number(form.pieces) <= 0 ||
        isNaN(Number(form.price_per_piece)) ||
        Number(form.price_per_piece) < 0 ||
        isNaN(Number(form.total_amount)) ||
        Number(form.total_amount) <= 0
      ) {
        toast.error(`Form ${i + 1}: Please enter valid numbers`);
        return;
      }

      // Validate date is within CE range
      if (!validateDate(i, form.date)) {
        toast.error(`Form ${i + 1}: Date is outside the valid range`);
        return;
      }
    }

    setIsLoading(true);

    try {
      if (editData) {
        const { error } = await supabase
          .from('expenses')
          .update({
            item: forms[0].item.trim(),
            pieces: Number(forms[0].pieces),
            price_per_piece: Number(forms[0].price_per_piece),
            total_amount: Number(forms[0].total_amount),
            category: forms[0].category,
            mode: forms[0].mode,
            note: forms[0].note.trim() || null,
            date: forms[0].date,
            time_hour: parseInt(forms[0].time_hour) || 0,
            time_minute: parseInt(forms[0].time_minute) || 0,
            updated_by_admin_id: (forms[0].expense_by_admin_id || currentAdminId)?.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editData.id);

        if (error) throw error;

        // Log admin activity - use session.adminId directly for admin, null for super_admin
        await supabase.rpc('log_admin_activity', {
          p_festival_id: festivalId,
          p_admin_id: session?.type === 'admin' ? session.adminId : null,
          p_action_type: 'edit_expense',
          p_action_details: {
            expense_id: editData.id,
            item: forms[0].item.trim(),
            total_amount: Number(forms[0].total_amount),
          }
        });

        toast.success('Expense updated successfully');
      } else {
        const insertData = forms.map((form) => {
          const adminId = form.expense_by_admin_id || currentAdminId;
          return {
          festival_id: festivalId,
          item: form.item.trim(),
          pieces: Number(form.pieces),
          price_per_piece: Number(form.price_per_piece),
          total_amount: Number(form.total_amount),
          category: form.category,
          mode: form.mode,
          note: form.note.trim() || null,
          date: form.date,
          time_hour: parseInt(form.time_hour) || 0,
          time_minute: parseInt(form.time_minute) || 0,
            created_by_admin_id: adminId && adminId.trim() ? adminId : null,
          };
        });

        const { error } = await supabase.from('expenses').insert(insertData);

        if (error) throw error;

        // Log admin activity - use session.adminId directly for admin, null for super_admin
        console.log('[AddExpense] Attempting to log activity:', {
          festival_id: festivalId,
          admin_id: session?.type === 'admin' ? session.adminId : null,
          session_type: session?.type,
          action_type: 'add_expense'
        });
        
        const { data: logData, error: logError } = await supabase.rpc('log_admin_activity', {
          p_festival_id: festivalId,
          p_admin_id: session?.type === 'admin' ? session.adminId : null,
          p_action_type: 'add_expense',
          p_action_details: {
            count: forms.length,
            total_amount: forms.reduce((sum, form) => sum + Number(form.total_amount), 0),
          },
          p_target_type: null,
          p_target_id: null
        });
        
        console.log('[AddExpense] Activity log result:', {
          data: logData,
          error: logError,
          errorMessage: logError?.message,
          errorCode: logError?.code,
          errorDetails: logError?.details,
          errorHint: logError?.hint
        });
        
        if (logError) {
          console.error('[AddExpense] Failed to log activity:', logError);
          // Don't throw - expense was saved successfully
        }

        toast.success('Expense(s) added successfully');
      }

      onSuccess();
      onClose();
      setForms([emptyForm]);
      setDateErrors({});
    } catch (error: any) {
      console.error('Error saving expense:', error);
      // Show detailed error message
      if (error.message) {
        toast.error(`Failed to save expense(s): ${error.message}`);
      } else if (error.code) {
        toast.error(`Database error (${error.code}): ${error.message || 'Failed to save expense(s)'}`);
      } else {
        toast.error('Failed to save expense(s). Please check console for details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {editData ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <div className="flex items-center gap-2">
            {!editData && forms.length < 10 && (
              <button
                onClick={addForm}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add More
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          {/* CE Date Range Info/Warning */}
          {loadingFestival ? (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Loading festival information...</p>
            </div>
          ) : !festival?.ce_start_date || !festival?.ce_end_date ? (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Collection/Expense date range not set</p>
                <p>Please contact the admin to set the valid date range before adding expenses.</p>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Valid Date Range</p>
                <p>Expenses must be dated between <strong>{festival.ce_start_date}</strong> and <strong>{festival.ce_end_date}</strong></p>
              </div>
            </div>
          )}

          {forms.map((form, index) => (
            <div
              key={index}
              className="mb-6 p-4 border border-gray-200 rounded-lg relative"
            >
              {forms.length > 1 && !editData && (
                <button
                  type="button"
                  onClick={() => removeForm(index)}
                  className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <h3 className="font-semibold text-gray-700 mb-3">
                {forms.length > 1 ? `Expense ${index + 1}` : 'Expense Details'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.item}
                    onChange={(e) => updateForm(index, 'item', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pieces/Packet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.pieces}
                    onChange={(e) => updateForm(index, 'pieces', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Piece/Packet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price_per_piece}
                    onChange={(e) => updateForm(index, 'price_per_piece', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.total_amount}
                    onChange={(e) => updateForm(index, 'total_amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated, but can be edited</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => updateForm(index, 'category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.mode}
                    onChange={(e) => updateForm(index, 'mode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {modes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expense By Dropdown - Only for Super Admin */}
                {session?.type === 'super_admin' && admins.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expense By <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.expense_by_admin_id || currentAdminId || ''}
                      onChange={(e) => updateForm(index, 'expense_by_admin_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Admin</option>
                      {admins.map((admin) => (
                        <option key={admin.admin_id} value={admin.admin_id}>
                          {admin.admin_name} ({admin.admin_code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateForm(index, 'date', e.target.value)}
                    min={festival?.ce_start_date || ''}
                    max={festival?.ce_end_date || ''}
                    disabled={!festival?.ce_start_date || !festival?.ce_end_date}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      dateErrors[index] ? 'border-red-500' : 'border-gray-300'
                    } ${!festival?.ce_start_date || !festival?.ce_end_date ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    required
                  />
                  {dateErrors[index] && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {dateErrors[index]}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hour
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={form.time_hour}
                      onChange={(e) => updateForm(index, 'time_hour', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minute
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={form.time_minute}
                      onChange={(e) => updateForm(index, 'time_minute', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={form.note}
                    onChange={(e) => updateForm(index, 'note', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !festival?.ce_start_date || !festival?.ce_end_date || Object.keys(dateErrors).length > 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

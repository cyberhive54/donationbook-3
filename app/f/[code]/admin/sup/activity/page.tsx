'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Festival, AdminActivityLog, AccessLog, Admin } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import SuperAdminPasswordGate from '@/components/SuperAdminPasswordGate';
import BottomNav from '@/components/BottomNav';
import GlobalSessionBar from '@/components/GlobalSessionBar';
import { getThemeStyles, getThemeClasses } from '@/lib/theme';
import { Search, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from '@/lib/hooks/useSession';

type TransactionWithAdmin = {
  id: string;
  type: 'collection' | 'expense';
  date: string;
  time_hour?: number;
  time_minute?: number;
  amount: number;
  name: string;
  collected_by?: string;
  created_by_admin_id?: string;
  admin_code?: string;
  admin_name?: string;
  created_at: string;
};

function SuperAdminActivityPageContent() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';
  const router = useRouter();
  const { session } = useSession(code);

  const [festival, setFestival] = useState<Festival | null>(null);
  const [activeTab, setActiveTab] = useState<'own' | 'transactions' | 'visitors' | 'admins'>('own');
  const [loading, setLoading] = useState(true);

  // Own Activity
  const [ownActivity, setOwnActivity] = useState<AdminActivityLog[]>([]);
  const [ownSearchTerm, setOwnSearchTerm] = useState('');
  const [ownActionFilter, setOwnActionFilter] = useState('all');
  const [ownCurrentPage, setOwnCurrentPage] = useState(1);
  const [ownRecordsPerPage] = useState(10);

  // Transactions
  const [transactions, setTransactions] = useState<TransactionWithAdmin[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [txnSearchTerm, setTxnSearchTerm] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState<'all' | 'collection' | 'expense'>('all');
  const [txnCurrentPage, setTxnCurrentPage] = useState(1);
  const [txnRecordsPerPage] = useState(10);

  // Visitors
  const [visitors, setVisitors] = useState<AccessLog[]>([]);
  const [visitorSearchTerm, setVisitorSearchTerm] = useState('');
  const [visitorCurrentPage, setVisitorCurrentPage] = useState(1);
  const [visitorRecordsPerPage] = useState(10);

  // Admin Activity
  const [adminActivity, setAdminActivity] = useState<AdminActivityLog[]>([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminActionFilter, setAdminActionFilter] = useState('all');
  const [adminFilterByAdmin, setAdminFilterByAdmin] = useState('all');
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);
  const [adminRecordsPerPage] = useState(10);

  useEffect(() => {
    if (code && session?.type === 'super_admin') {
      fetchData();
    } else if (session && session.type !== 'super_admin') {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, session]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch festival
      const { data: fest, error: festErr } = await supabase
        .from('festivals')
        .select('*')
        .eq('code', code)
        .single();
      if (festErr) throw festErr;
      setFestival(fest);

      // Fetch all admins
      const { data: adminsData, error: adminsErr } = await supabase
        .from('admins')
        .select('*')
        .eq('festival_id', fest.id);
      if (adminsErr) throw adminsErr;
      setAdmins(adminsData || []);

      // Fetch super admin's own activity (activities without admin_id or system activities)
      const { data: ownActivityData, error: ownActivityErr } = await supabase
        .from('admin_activity_log')
        .select('*')
        .eq('festival_id', fest.id)
        .is('admin_id', null)
        .order('timestamp', { ascending: false });
      if (ownActivityErr) throw ownActivityErr;
      setOwnActivity(ownActivityData || []);

      // Fetch all admin activity
      const { data: allAdminActivity, error: allAdminErr } = await supabase
        .from('admin_activity_log')
        .select('*')
        .eq('festival_id', fest.id)
        .not('admin_id', 'is', null)
        .order('timestamp', { ascending: false });
      if (allAdminErr) throw allAdminErr;
      setAdminActivity(allAdminActivity || []);

      // Fetch collections and expenses
      const { data: collections, error: collErr } = await supabase
        .from('collections')
        .select('*')
        .eq('festival_id', fest.id)
        .order('date', { ascending: false });
      if (collErr) throw collErr;

      const { data: expenses, error: expErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('festival_id', fest.id)
        .order('date', { ascending: false });
      if (expErr) throw expErr;

      // Combine transactions with admin info
      const adminMap = new Map(adminsData?.map(a => [a.admin_id, a]) || []);
      
      const enrichedCollections: TransactionWithAdmin[] = (collections || []).map(c => ({
        id: c.id,
        type: 'collection' as const,
        date: c.date,
        time_hour: c.time_hour,
        time_minute: c.time_minute,
        amount: c.amount,
        name: c.name,
        collected_by: c.name,
        created_by_admin_id: c.created_by_admin_id,
        admin_code: c.created_by_admin_id ? adminMap.get(c.created_by_admin_id)?.admin_code : undefined,
        admin_name: c.created_by_admin_id ? adminMap.get(c.created_by_admin_id)?.admin_name : undefined,
        created_at: c.created_at,
      }));

      const enrichedExpenses: TransactionWithAdmin[] = (expenses || []).map(e => ({
        id: e.id,
        type: 'expense' as const,
        date: e.date,
        time_hour: e.time_hour,
        time_minute: e.time_minute,
        amount: e.total_amount,
        name: e.item,
        collected_by: e.item,
        created_by_admin_id: e.created_by_admin_id,
        admin_code: e.created_by_admin_id ? adminMap.get(e.created_by_admin_id)?.admin_code : undefined,
        admin_name: e.created_by_admin_id ? adminMap.get(e.created_by_admin_id)?.admin_name : undefined,
        created_at: e.created_at,
      }));

      const combined = [...enrichedCollections, ...enrichedExpenses].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTransactions(combined);

      // Fetch all visitors
      console.log('[Super Admin Activity] Fetching visitor logs for festival:', fest.id);
      const { data: visitorsData, error: visitorsErr } = await supabase
        .from('access_logs')
        .select('*')
        .eq('festival_id', fest.id)
        .order('accessed_at', { ascending: false });
      
      console.log('[Super Admin Activity] Visitor logs fetched:', {
        count: visitorsData?.length || 0,
        error: visitorsErr,
        sample: visitorsData?.slice(0, 3)
      });
      
      if (visitorsErr) {
        console.error('[Super Admin Activity] Error fetching visitors:', visitorsErr);
        throw visitorsErr;
      }
      setVisitors(visitorsData || []);

    } catch (error) {
      console.error('Error fetching activity data:', error);
      toast.error('Failed to fetch activity data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hour?: number, minute?: number) => {
    if (hour === undefined || minute === undefined) return '';
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getAdminDisplay = (adminCode?: string, adminName?: string) => {
    if (!adminCode && !adminName) return 'N/A';
    const preference = festival?.admin_display_preference || 'code';
    return preference === 'code' ? adminCode : adminName;
  };

  // Filter own activity
  const filteredOwnActivity = useMemo(() => {
    let result = [...ownActivity];

    if (ownSearchTerm) {
      result = result.filter(log => 
        log.action_type.toLowerCase().includes(ownSearchTerm.toLowerCase()) ||
        log.target_type?.toLowerCase().includes(ownSearchTerm.toLowerCase())
      );
    }

    if (ownActionFilter !== 'all') {
      result = result.filter(log => log.action_type === ownActionFilter);
    }

    return result;
  }, [ownActivity, ownSearchTerm, ownActionFilter]);

  const paginatedOwnActivity = useMemo(() => {
    const startIndex = (ownCurrentPage - 1) * ownRecordsPerPage;
    return filteredOwnActivity.slice(startIndex, startIndex + ownRecordsPerPage);
  }, [filteredOwnActivity, ownCurrentPage, ownRecordsPerPage]);

  const ownTotalPages = Math.ceil(filteredOwnActivity.length / ownRecordsPerPage);

  const ownActionTypes = useMemo(() => {
    return Array.from(new Set(ownActivity.map(a => a.action_type)));
  }, [ownActivity]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (txnSearchTerm) {
      result = result.filter(txn => 
        txn.name.toLowerCase().includes(txnSearchTerm.toLowerCase()) ||
        txn.admin_code?.toLowerCase().includes(txnSearchTerm.toLowerCase()) ||
        txn.admin_name?.toLowerCase().includes(txnSearchTerm.toLowerCase())
      );
    }

    if (txnTypeFilter !== 'all') {
      result = result.filter(txn => txn.type === txnTypeFilter);
    }

    return result;
  }, [transactions, txnSearchTerm, txnTypeFilter]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (txnCurrentPage - 1) * txnRecordsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + txnRecordsPerPage);
  }, [filteredTransactions, txnCurrentPage, txnRecordsPerPage]);

  const txnTotalPages = Math.ceil(filteredTransactions.length / txnRecordsPerPage);

  // Filter visitors
  const filteredVisitors = useMemo(() => {
    let result = [...visitors];

    if (visitorSearchTerm) {
      result = result.filter(log => 
        log.visitor_name.toLowerCase().includes(visitorSearchTerm.toLowerCase())
      );
    }

    return result;
  }, [visitors, visitorSearchTerm]);

  const paginatedVisitors = useMemo(() => {
    const startIndex = (visitorCurrentPage - 1) * visitorRecordsPerPage;
    return filteredVisitors.slice(startIndex, startIndex + visitorRecordsPerPage);
  }, [filteredVisitors, visitorCurrentPage, visitorRecordsPerPage]);

  const visitorTotalPages = Math.ceil(filteredVisitors.length / visitorRecordsPerPage);

  // Filter admin activity
  const filteredAdminActivity = useMemo(() => {
    let result = [...adminActivity];

    if (adminSearchTerm) {
      result = result.filter(log => 
        log.action_type.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
        log.admin_name?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
        log.target_type?.toLowerCase().includes(adminSearchTerm.toLowerCase())
      );
    }

    if (adminActionFilter !== 'all') {
      result = result.filter(log => log.action_type === adminActionFilter);
    }

    if (adminFilterByAdmin !== 'all') {
      result = result.filter(log => log.admin_id === adminFilterByAdmin);
    }

    return result;
  }, [adminActivity, adminSearchTerm, adminActionFilter, adminFilterByAdmin]);

  const paginatedAdminActivity = useMemo(() => {
    const startIndex = (adminCurrentPage - 1) * adminRecordsPerPage;
    return filteredAdminActivity.slice(startIndex, startIndex + adminRecordsPerPage);
  }, [filteredAdminActivity, adminCurrentPage, adminRecordsPerPage]);

  const adminTotalPages = Math.ceil(filteredAdminActivity.length / adminRecordsPerPage);

  const adminActionTypes = useMemo(() => {
    return Array.from(new Set(adminActivity.map(a => a.action_type)));
  }, [adminActivity]);

  const handleDeleteTransaction = async (txnId: string, type: 'collection' | 'expense') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const tableName = type === 'collection' ? 'collections' : 'expenses';
      const { error } = await supabase.from(tableName).delete().eq('id', txnId);
      if (error) throw error;
      toast.success(`${type === 'collection' ? 'Collection' : 'Expense'} deleted successfully`);
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const bgStyle: React.CSSProperties = festival?.theme_bg_image_url
    ? { backgroundImage: `url(${festival.theme_bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: festival?.theme_bg_color || '#f8fafc' };

  const themeStyles = getThemeStyles(festival);
  const themeClasses = getThemeClasses(festival);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-700">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${themeClasses}`} style={{ ...bgStyle, ...themeStyles }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="theme-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Super Admin Activity</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Complete activity overview and management</p>
        </div>

        {/* Tabs */}
        <div className="theme-card bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('own')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'own'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                My Activity
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'transactions'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                All Transactions
              </button>
              <button
                onClick={() => setActiveTab('visitors')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'visitors'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                All Visitors
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'admins'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Admin Activity
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Tab 1: Own Activity */}
            {activeTab === 'own' && (
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search activity..."
                      value={ownSearchTerm}
                      onChange={(e) => {
                        setOwnSearchTerm(e.target.value);
                        setOwnCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <select
                    value={ownActionFilter}
                    onChange={(e) => {
                      setOwnActionFilter(e.target.value);
                      setOwnCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="all">All Actions</option>
                    {ownActionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date & Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Target</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedOwnActivity.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No activity found
                          </td>
                        </tr>
                      ) : (
                        paginatedOwnActivity.map((log) => (
                          <tr key={log.log_id} className="hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {formatDate(log.timestamp)}
                              <br />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                {log.action_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {log.target_type || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {log.action_details ? JSON.stringify(log.action_details).substring(0, 50) + '...' : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {ownTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Showing {((ownCurrentPage - 1) * ownRecordsPerPage) + 1} to{' '}
                      {Math.min(ownCurrentPage * ownRecordsPerPage, filteredOwnActivity.length)} of{' '}
                      {filteredOwnActivity.length} entries
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOwnCurrentPage(p => Math.max(1, p - 1))}
                        disabled={ownCurrentPage === 1}
                        className="p-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Page {ownCurrentPage} of {ownTotalPages}
                      </span>
                      <button
                        onClick={() => setOwnCurrentPage(p => Math.min(ownTotalPages, p + 1))}
                        disabled={ownCurrentPage === ownTotalPages}
                        className="p-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: All Transactions with Edit/Delete */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={txnSearchTerm}
                      onChange={(e) => {
                        setTxnSearchTerm(e.target.value);
                        setTxnCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <select
                    value={txnTypeFilter}
                    onChange={(e) => {
                      setTxnTypeFilter(e.target.value as any);
                      setTxnCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="collection">Collections Only</option>
                    <option value="expense">Expenses Only</option>
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Name/Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Transaction To</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">By Admin</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        paginatedTransactions.map((txn) => (
                          <tr key={txn.id} className="hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700">
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                txn.type === 'collection'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {txn.type === 'collection' ? 'Collection' : 'Expense'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{formatDate(txn.date)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {formatTime(txn.time_hour, txn.time_minute) || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{txn.name}</td>
                            <td className={`px-4 py-3 text-sm font-semibold ${
                              txn.type === 'collection' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(txn.amount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{txn.collected_by}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {getAdminDisplay(txn.admin_code, txn.admin_name)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toast('Edit functionality coming soon')}
                                  className="p-1 hover:bg-blue-100 dark:bg-blue-900 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTransaction(txn.id, txn.type)}
                                  className="p-1 hover:bg-red-100 dark:bg-red-900 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {txnTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Showing {((txnCurrentPage - 1) * txnRecordsPerPage) + 1} to{' '}
                      {Math.min(txnCurrentPage * txnRecordsPerPage, filteredTransactions.length)} of{' '}
                      {filteredTransactions.length} entries
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTxnCurrentPage(p => Math.max(1, p - 1))}
                        disabled={txnCurrentPage === 1}
                        className="p-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Page {txnCurrentPage} of {txnTotalPages}
                      </span>
                      <button
                        onClick={() => setTxnCurrentPage(p => Math.min(txnTotalPages, p + 1))}
                        disabled={txnCurrentPage === txnTotalPages}
                        className="p-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: All Visitors */}
            {activeTab === 'visitors' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search visitors..."
                    value={visitorSearchTerm}
                    onChange={(e) => {
                      setVisitorSearchTerm(e.target.value);
                      setVisitorCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Visitor Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Login Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Login Using</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Access Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedVisitors.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No visitors found
                          </td>
                        </tr>
                      ) : (
                        paginatedVisitors.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{log.visitor_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {formatDate(log.accessed_at)}
                              <br />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(log.accessed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {log.admin_id ? (
                                <div>
                                  <div className="font-medium">
                                    {getAdminDisplay(
                                      admins.find(a => a.admin_id === log.admin_id)?.admin_code,
                                      admins.find(a => a.admin_id === log.admin_id)?.admin_name
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{log.password_used}</div>
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                log.access_method === 'password_modal' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {log.access_method === 'password_modal' ? 'Login Page' : 'Direct Link'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {visitorTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Showing {((visitorCurrentPage - 1) * visitorRecordsPerPage) + 1} to{' '}
                      {Math.min(visitorCurrentPage * visitorRecordsPerPage, filteredVisitors.length)} of{' '}
                      {filteredVisitors.length} entries
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVisitorCurrentPage(p => Math.max(1, p - 1))}
                        disabled={visitorCurrentPage === 1}
                        className="p-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Page {visitorCurrentPage} of {visitorTotalPages}
                      </span>
                      <button
                        onClick={() => setVisitorCurrentPage(p => Math.min(visitorTotalPages, p + 1))}
                        disabled={visitorCurrentPage === visitorTotalPages}
                        className="p-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Admin Activity */}
            {activeTab === 'admins' && (
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search admin activity..."
                      value={adminSearchTerm}
                      onChange={(e) => {
                        setAdminSearchTerm(e.target.value);
                        setAdminCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <select
                    value={adminActionFilter}
                    onChange={(e) => {
                      setAdminActionFilter(e.target.value);
                      setAdminCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="all">All Actions</option>
                    {adminActionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <select
                    value={adminFilterByAdmin}
                    onChange={(e) => {
                      setAdminFilterByAdmin(e.target.value);
                      setAdminCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="all">All Admins</option>
                    {admins.map(admin => (
                      <option key={admin.admin_id} value={admin.admin_id}>
                        {getAdminDisplay(admin.admin_code, admin.admin_name)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Admin</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date & Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Target</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedAdminActivity.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No admin activity found
                          </td>
                        </tr>
                      ) : (
                        paginatedAdminActivity.map((log) => (
                          <tr key={log.log_id} className="hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {log.admin_name || 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {formatDate(log.timestamp)}
                              <br />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 rounded-full text-xs font-medium">
                                {log.action_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {log.target_type || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {log.action_details ? JSON.stringify(log.action_details).substring(0, 50) + '...' : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {adminTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Showing {((adminCurrentPage - 1) * adminRecordsPerPage) + 1} to{' '}
                      {Math.min(adminCurrentPage * adminRecordsPerPage, filteredAdminActivity.length)} of{' '}
                      {filteredAdminActivity.length} entries
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAdminCurrentPage(p => Math.max(1, p - 1))}
                        disabled={adminCurrentPage === 1}
                        className="p-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Page {adminCurrentPage} of {adminTotalPages}
                      </span>
                      <button
                        onClick={() => setAdminCurrentPage(p => Math.min(adminTotalPages, p + 1))}
                        disabled={adminCurrentPage === adminTotalPages}
                        className="p-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav code={code} />
      <GlobalSessionBar festivalCode={code} currentPage="activity" />
    </div>
  );
}

export default function SuperAdminActivityPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';

  return (
    <SuperAdminPasswordGate code={code}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        }
      >
        <SuperAdminActivityPageContent />
      </Suspense>
    </SuperAdminPasswordGate>
  );
}

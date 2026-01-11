'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Festival, AccessLog, Collection, Expense, Admin } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import PasswordGate from '@/components/PasswordGate';
import BottomNav from '@/components/BottomNav';
import GlobalSessionBar from '@/components/GlobalSessionBar';
import { useSession } from '@/lib/hooks/useSession';
import { getThemeStyles, getThemeClasses } from '@/lib/theme';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

type TransactionWithAdmin = {
  id: string;
  type: 'collection' | 'expense';
  date: string;
  time_hour?: number;
  time_minute?: number;
  amount: number;
  name: string;
  created_by_admin_id?: string;
  admin_code?: string;
  admin_name?: string;
  created_at: string;
};

export default function VisitorActivityPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';
  const router = useRouter();
  const { session } = useSession(code);

  const [festival, setFestival] = useState<Festival | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'transactions'>('login');
  const [loading, setLoading] = useState(true);

  // Login/Logout History
  const [loginHistory, setLoginHistory] = useState<AccessLog[]>([]);
  const [loginSearchTerm, setLoginSearchTerm] = useState('');
  const [loginCurrentPage, setLoginCurrentPage] = useState(1);
  const [loginRecordsPerPage] = useState(10);

  // Transaction Activity
  const [transactions, setTransactions] = useState<TransactionWithAdmin[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [txnSearchTerm, setTxnSearchTerm] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState<'all' | 'collection' | 'expense'>('all');
  const [txnCurrentPage, setTxnCurrentPage] = useState(1);
  const [txnRecordsPerPage] = useState(10);

  useEffect(() => {
    // Redirect admin to admin activity page
    if (session?.type === 'admin') {
      router.replace(`/f/${code}/admin/activity`);
      return;
    }
    
    // Redirect super_admin to super admin activity page
    if (session?.type === 'super_admin') {
      router.replace(`/f/${code}/admin/sup/activity`);
      return;
    }

    if (code && session?.type === 'visitor') {
      fetchData();
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

      // Fetch visitor's login history
      if (session?.type === 'visitor') {
        console.log('[Activity Page] Fetching visitor logs:', {
          festival_id: fest.id,
          visitor_name: session.visitorName,
          session_type: session.type
        });
        
        // Query visitor logs - use exact match (name is already sanitized and trimmed)
        const { data: logs, error: logsErr } = await supabase
          .from('access_logs')
          .select('*')
          .eq('festival_id', fest.id)
          .eq('visitor_name', session.visitorName)
          .order('accessed_at', { ascending: false });
        
        console.log('[Activity Page] Visitor logs fetched:', {
          count: logs?.length || 0,
          error: logsErr,
          sample: logs?.[0]
        });
        
        if (logsErr) {
          console.error('[Activity Page] Error fetching visitor logs:', logsErr);
          throw logsErr;
        }
        setLoginHistory(logs || []);
      }

      // Fetch all admins for the festival
      const { data: adminsData, error: adminsErr } = await supabase
        .from('admins')
        .select('*')
        .eq('festival_id', fest.id);
      if (adminsErr) throw adminsErr;
      setAdmins(adminsData || []);

      // Fetch collections and expenses with admin info
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

      // Combine and enrich with admin info
      const adminMap = new Map(adminsData?.map(a => [a.admin_id, a]) || []);
      
      const enrichedCollections: TransactionWithAdmin[] = (collections || []).map(c => ({
        id: c.id,
        type: 'collection' as const,
        date: c.date,
        time_hour: c.time_hour,
        time_minute: c.time_minute,
        amount: c.amount,
        name: c.name,
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
        created_by_admin_id: e.created_by_admin_id,
        admin_code: e.created_by_admin_id ? adminMap.get(e.created_by_admin_id)?.admin_code : undefined,
        admin_name: e.created_by_admin_id ? adminMap.get(e.created_by_admin_id)?.admin_name : undefined,
        created_at: e.created_at,
      }));

      const combined = [...enrichedCollections, ...enrichedExpenses].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTransactions(combined);
    } catch (error) {
      console.error('Error fetching activity data:', error);
      toast.error('Failed to fetch activity data');
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate login history
  const filteredLoginHistory = useMemo(() => {
    let result = [...loginHistory];

    if (loginSearchTerm) {
      result = result.filter(log => 
        log.visitor_name.toLowerCase().includes(loginSearchTerm.toLowerCase()) ||
        log.password_used?.toLowerCase().includes(loginSearchTerm.toLowerCase())
      );
    }

    return result;
  }, [loginHistory, loginSearchTerm]);

  const paginatedLoginHistory = useMemo(() => {
    const startIndex = (loginCurrentPage - 1) * loginRecordsPerPage;
    return filteredLoginHistory.slice(startIndex, startIndex + loginRecordsPerPage);
  }, [filteredLoginHistory, loginCurrentPage, loginRecordsPerPage]);

  const loginTotalPages = Math.ceil(filteredLoginHistory.length / loginRecordsPerPage);

  // Filter and paginate transactions
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

  const bgStyle: React.CSSProperties = festival?.theme_bg_image_url
    ? { backgroundImage: `url(${festival.theme_bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: festival?.theme_bg_color || '#f8fafc' };

  const themeStyles = getThemeStyles(festival);
  const themeClasses = getThemeClasses(festival);

  const formatTime = (hour?: number, minute?: number) => {
    if (hour === undefined || minute === undefined) return '';
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getAdminDisplay = (adminCode?: string, adminName?: string) => {
    if (!adminCode && !adminName) return 'N/A';
    const preference = festival?.admin_display_preference || 'code';
    return preference === 'code' ? adminCode : adminName;
  };

  return (
    <PasswordGate code={code}>
      <div className={`min-h-screen pb-24 ${themeClasses}`} style={{ ...bgStyle, ...themeStyles }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="theme-card bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">My Activity</h1>
            <p className="text-sm text-gray-600">View your login history and transaction activity</p>
          </div>

          {/* Tabs */}
          <div className="theme-card bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'login'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Login History
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'transactions'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Transaction Activity
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Tab 1: Login History */}
              {activeTab === 'login' && (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by name or password..."
                        value={loginSearchTerm}
                        onChange={(e) => {
                          setLoginSearchTerm(e.target.value);
                          setLoginCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date & Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Admin Used</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Password Label</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Access Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedLoginHistory.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                              No login history found
                            </td>
                          </tr>
                        ) : (
                          paginatedLoginHistory.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatDate(log.accessed_at)}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {new Date(log.accessed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {log.admin_id ? (
                                  <div>
                                    <div className="font-medium">
                                      {getAdminDisplay(
                                        admins.find(a => a.admin_id === log.admin_id)?.admin_code,
                                        admins.find(a => a.admin_id === log.admin_id)?.admin_name
                                      )}
                                    </div>
                                  </div>
                                ) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {log.password_used || 'N/A'}
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
                  {loginTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-600">
                        Showing {((loginCurrentPage - 1) * loginRecordsPerPage) + 1} to{' '}
                        {Math.min(loginCurrentPage * loginRecordsPerPage, filteredLoginHistory.length)} of{' '}
                        {filteredLoginHistory.length} entries
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLoginCurrentPage(p => Math.max(1, p - 1))}
                          disabled={loginCurrentPage === 1}
                          className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {loginCurrentPage} of {loginTotalPages}
                        </span>
                        <button
                          onClick={() => setLoginCurrentPage(p => Math.min(loginTotalPages, p + 1))}
                          disabled={loginCurrentPage === loginTotalPages}
                          className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Transaction Activity */}
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <select
                      value={txnTypeFilter}
                      onChange={(e) => {
                        setTxnTypeFilter(e.target.value as any);
                        setTxnCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="collection">Collections Only</option>
                      <option value="expense">Expenses Only</option>
                    </select>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name/Item</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">By Admin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No transactions found
                            </td>
                          </tr>
                        ) : (
                          paginatedTransactions.map((txn) => (
                            <tr key={txn.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  txn.type === 'collection'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {txn.type === 'collection' ? 'Collection' : 'Expense'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatDate(txn.date)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {formatTime(txn.time_hour, txn.time_minute) || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{txn.name}</td>
                              <td className={`px-4 py-3 text-sm font-semibold ${
                                txn.type === 'collection' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(txn.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {getAdminDisplay(txn.admin_code, txn.admin_name)}
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
                      <p className="text-sm text-gray-600">
                        Showing {((txnCurrentPage - 1) * txnRecordsPerPage) + 1} to{' '}
                        {Math.min(txnCurrentPage * txnRecordsPerPage, filteredTransactions.length)} of{' '}
                        {filteredTransactions.length} entries
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTxnCurrentPage(p => Math.max(1, p - 1))}
                          disabled={txnCurrentPage === 1}
                          className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {txnCurrentPage} of {txnTotalPages}
                        </span>
                        <button
                          onClick={() => setTxnCurrentPage(p => Math.min(txnTotalPages, p + 1))}
                          disabled={txnCurrentPage === txnTotalPages}
                          className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </PasswordGate>
  );
}

'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Festival, AdminActivityLog, AccessLog, Admin } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useSession } from '@/lib/hooks/useSession';
import AdminPasswordGate from '@/components/AdminPasswordGate';
import BottomNav from '@/components/BottomNav';
import GlobalSessionBar from '@/components/GlobalSessionBar';
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
  collected_by?: string;
  created_by_admin_id?: string;
  admin_code?: string;
  admin_name?: string;
  created_at: string;
};

function AdminActivityPageContent() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useSession(code);

  const [festival, setFestival] = useState<Festival | null>(null);
  const [activeTab, setActiveTab] = useState<'own' | 'transactions' | 'visitors'>('own');
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

  useEffect(() => {
    // Wait for session to load before checking
    if (sessionLoading) {
      return;
    }

    // Redirect super_admin to super admin activity page (AdminPasswordGate allows both admin and super_admin)
    if (session?.type === 'super_admin') {
      router.replace(`/f/${code}/admin/sup/activity`);
      return;
    }

    // AdminPasswordGate already handles redirecting non-admin users
    // Just fetch data if session is valid admin
    if (session && session.type === 'admin' && code) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, session, sessionLoading]);

  const fetchData = async () => {
    if (!session || session.type !== 'admin') return;

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

      // Fetch admin's own activity
      console.log('[ActivityPage] Fetching activity for session:', {
        type: session?.type,
        adminId: session?.adminId,
        festivalId: fest.id,
        session: session
      });

      if (session && session.type === 'admin' && session.adminId) {
        // First, let's check what's actually in the database
        const { data: allLogs, error: allLogsErr } = await supabase
          .from('admin_activity_log')
          .select('*')
          .eq('festival_id', fest.id)
          .order('timestamp', { ascending: false })
          .limit(50);
        
        console.log('[ActivityPage] All logs in festival:', {
          count: allLogs?.length || 0,
          logs: allLogs,
          error: allLogsErr
        });

        // Now get logs for this specific admin
      const { data: activityData, error: activityErr } = await supabase
        .from('admin_activity_log')
        .select('*')
        .eq('festival_id', fest.id)
        .eq('admin_id', session.adminId)
        .order('timestamp', { ascending: false });
        
        console.log('[ActivityPage] Admin-specific logs:', {
          adminId: session.adminId,
          count: activityData?.length || 0,
          logs: activityData,
          error: activityErr
        });

        if (activityErr) {
          console.error('[ActivityPage] Error fetching admin activity:', activityErr);
          throw activityErr;
        }
        
        console.log('[ActivityPage] Setting activity:', activityData?.length || 0, 'records');
      setOwnActivity(activityData || []);
      } else {
        console.warn('[ActivityPage] Cannot fetch activity: session.adminId is missing', {
          session,
          hasSession: !!session,
          sessionType: session?.type,
          hasAdminId: !!session?.adminId,
          adminId: session?.adminId
        });
        setOwnActivity([]);
      }

      // Fetch all admins
      const { data: adminsData, error: adminsErr } = await supabase
        .from('admins')
        .select('*')
        .eq('festival_id', fest.id);
      if (adminsErr) throw adminsErr;
      setAdmins(adminsData || []);

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
      console.log('[Admin Activity] Fetching visitor logs for festival:', fest.id);
      const { data: visitorsData, error: visitorsErr } = await supabase
        .from('access_logs')
        .select('*')
        .eq('festival_id', fest.id)
        .order('accessed_at', { ascending: false });
      
      console.log('[Admin Activity] Visitor logs fetched:', {
        count: visitorsData?.length || 0,
        error: visitorsErr,
        sample: visitorsData?.slice(0, 3)
      });
      
      if (visitorsErr) {
        console.error('[Admin Activity] Error fetching visitors:', visitorsErr);
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

  // Get unique action types for filter
  const actionTypes = useMemo(() => {
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

  const bgStyle: React.CSSProperties = festival?.theme_bg_image_url
    ? { backgroundImage: `url(${festival.theme_bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: festival?.theme_bg_color || '#f8fafc' };

  const themeStyles = getThemeStyles(festival);
  const themeClasses = getThemeClasses(festival);

  // Show loading state while session is loading or data is loading
  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${themeClasses}`} style={{ ...bgStyle, ...themeStyles }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="theme-card bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Activity</h1>
          <p className="text-sm text-gray-600">View your activity, transactions, and visitor logs</p>
        </div>

        {/* Tabs */}
        <div className="theme-card bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('own')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'own'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                My Activity
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'transactions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('visitors')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'visitors'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Visitors
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <select
                    value={ownActionFilter}
                    onChange={(e) => {
                      setOwnActionFilter(e.target.value);
                      setOwnCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Actions</option>
                    {actionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date & Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Target</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedOwnActivity.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No activity found
                          </td>
                        </tr>
                      ) : (
                        paginatedOwnActivity.map((log) => (
                          <tr key={log.log_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatDate(log.timestamp)}
                              <br />
                              <span className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {log.action_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {log.target_type || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
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
                    <p className="text-sm text-gray-600">
                      Showing {((ownCurrentPage - 1) * ownRecordsPerPage) + 1} to{' '}
                      {Math.min(ownCurrentPage * ownRecordsPerPage, filteredOwnActivity.length)} of{' '}
                      {filteredOwnActivity.length} entries
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOwnCurrentPage(p => Math.max(1, p - 1))}
                        disabled={ownCurrentPage === 1}
                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {ownCurrentPage} of {ownTotalPages}
                      </span>
                      <button
                        onClick={() => setOwnCurrentPage(p => Math.min(ownTotalPages, p + 1))}
                        disabled={ownCurrentPage === ownTotalPages}
                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Transactions */}
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Transaction To</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">By Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
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
                            <td className="px-4 py-3 text-sm text-gray-900">{txn.collected_by}</td>
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

            {/* Tab 3: Visitors */}
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Visitor Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Login Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Login Using</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Access Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedVisitors.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No visitors found
                          </td>
                        </tr>
                      ) : (
                        paginatedVisitors.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{log.visitor_name}</td>
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
                                  <div className="text-xs text-gray-500">{log.password_used}</div>
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
                    <p className="text-sm text-gray-600">
                      Showing {((visitorCurrentPage - 1) * visitorRecordsPerPage) + 1} to{' '}
                      {Math.min(visitorCurrentPage * visitorRecordsPerPage, filteredVisitors.length)} of{' '}
                      {filteredVisitors.length} entries
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVisitorCurrentPage(p => Math.max(1, p - 1))}
                        disabled={visitorCurrentPage === 1}
                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {visitorCurrentPage} of {visitorTotalPages}
                      </span>
                      <button
                        onClick={() => setVisitorCurrentPage(p => Math.min(visitorTotalPages, p + 1))}
                        disabled={visitorCurrentPage === visitorTotalPages}
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
  );
}

export default function AdminActivityPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';

  return (
    <AdminPasswordGate code={code}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <AdminActivityPageContent />
      </Suspense>
    </AdminPasswordGate>
  );
}

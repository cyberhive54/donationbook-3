'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Festival, Collection, Expense, Transaction, Stats } from '@/types';
import { calculateStats, combineTransactions, formatCurrency, formatDate } from '@/lib/utils';
import PasswordGate from '@/components/PasswordGate';
import BasicInfo from '@/components/BasicInfo';
import StatsCards from '@/components/StatsCards';
import BottomNav from '@/components/BottomNav';
import GlobalSessionBar from '@/components/GlobalSessionBar';
import { InfoSkeleton, CardSkeleton, TableSkeleton } from '@/components/Loader';
import Link from 'next/link';
import { ArrowRight, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getThemeStyles, getThemeClasses } from '@/lib/theme';
import { useRouter } from 'next/navigation';

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function FestivalHomePage() {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const code = (params?.code as string) || '';
  const router = useRouter();

  const [festival, setFestival] = useState<Festival | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCollection: 0, totalExpense: 0, numDonators: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle direct link authentication
  useEffect(() => {
    const mode = searchParams.get('mode');
    const password = searchParams.get('p');
    const name = searchParams.get('name');

    if (mode === 'login' && password && name) {
      handleDirectLinkAuth(password, name);
    }
  }, [searchParams, code]);

  useEffect(() => {
    if (code) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleDirectLinkAuth = async (password: string, name: string) => {
    try {
      // Fetch festival
      const { data: fest, error: festErr } = await supabase
        .from('festivals')
        .select('id, user_password, user_password_updated_at, updated_at, requires_user_password')
        .eq('code', code)
        .single();

      if (festErr) throw festErr;
      if (!fest) {
        toast.error('Festival not found');
        window.history.replaceState({}, '', `/f/${code}`);
        return;
      }

      // Check if password is required
      if (!fest.requires_user_password) {
        // No password needed, just remove query params
        window.history.replaceState({}, '', `/f/${code}`);
        return;
      }

      // Verify password
      if (fest.user_password !== password) {
        toast.error('Invalid password in URL');
        window.history.replaceState({}, '', `/f/${code}`);
        return;
      }

      // Format name
      const formattedName = formatName(name);
      const sessionId = generateSessionId();
      const loggedAt = new Date().toISOString();

      // Log access to database
      try {
        await supabase.rpc('log_festival_access', {
          p_festival_id: fest.id,
          p_visitor_name: formattedName,
          p_access_method: 'direct_link',
          p_password_used: password,
          p_session_id: sessionId,
        });
      } catch (logError) {
        console.error('Error logging access:', logError);
        // Continue even if logging fails
      }

      // Create session in localStorage
      const session = {
        authenticated: true,
        date: todayStr(),
        token: fest.user_password_updated_at || fest.updated_at,
        visitorName: formattedName,
        sessionId,
        accessMethod: 'direct_link',
        passwordUsed: password,
        loggedAt,
      };

      localStorage.setItem(`userPasswordAuth:${code}`, JSON.stringify(session));

      // Remove query params and reload
      window.history.replaceState({}, '', `/f/${code}`);
      toast.success(`Welcome, ${formattedName}!`);
      window.location.reload();
    } catch (error) {
      console.error('Direct link auth error:', error);
      toast.error('Authentication failed');
      window.history.replaceState({}, '', `/f/${code}`);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: fest, error: festErr } = await supabase
        .from('festivals')
        .select('*')
        .eq('code', code)
        .single();
      if (festErr) throw festErr;

      const [collectionsRes, expensesRes] = await Promise.all([
        supabase.from('collections').select('*').eq('festival_id', fest.id).order('date', { ascending: false }),
        supabase.from('expenses').select('*').eq('festival_id', fest.id).order('date', { ascending: false }),
      ]);

      if (collectionsRes.error) throw collectionsRes.error;
      if (expensesRes.error) throw expensesRes.error;

      const fetchedCollections = collectionsRes.data || [];
      const fetchedExpenses = expensesRes.data || [];

      setFestival(fest);
      setCollections(fetchedCollections);
      setExpenses(fetchedExpenses);

      const calculatedStats = calculateStats(fetchedCollections, fetchedExpenses);
      setStats(calculatedStats);

      const transactions = combineTransactions(fetchedCollections, fetchedExpenses);
      setRecentTransactions(transactions.slice(0, 7));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const recentCollections = collections.slice(0, 7);
  const recentExpenses = expenses.slice(0, 7);

  const bgStyle: React.CSSProperties = festival
    ? festival.theme_bg_image_url
      ? { backgroundImage: `url(${festival.theme_bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: festival.theme_bg_color || '#f8fafc' }
    : {};

  const themeStyles = getThemeStyles(festival);
  const themeClasses = getThemeClasses(festival);

  return (
    <PasswordGate code={code}>
      <div className={`min-h-screen pb-24 ${themeClasses}`} style={{ ...bgStyle, ...themeStyles }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <>
              <InfoSkeleton />
              <CardSkeleton />
              <TableSkeleton rows={7} />
            </>
          ) : !festival ? (
            <div className="theme-card bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-700">Festival not found. Please check the code.</p>
              <Link href="/view" className="mt-4 inline-block text-blue-600 hover:text-blue-700">Go back</Link>
            </div>
          ) : (
            <>
              <BasicInfo 
                basicInfo={{
                  id: festival.id,
                  event_name: festival.event_name,
                  organiser: festival.organiser || '',
                  mentor: festival.mentor || '',
                  guide: festival.guide || '',
                  event_start_date: festival.event_start_date,
                  event_end_date: festival.event_end_date,
                  location: festival.location,
                  other_data: festival.other_data,
                } as any}
                festival={festival}
              />
              <StatsCards stats={stats} />

              <div className="space-y-6">
                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
                    <Link
                      href={`/f/${code}/transaction`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {recentTransactions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No transactions yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Name/Item
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {recentTransactions.map((txn) => (
                            <tr key={txn.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    txn.type === 'collection'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {txn.type === 'collection' ? 'Collection' : 'Expense'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{txn.name}</td>
                              <td
                                className={`px-4 py-3 text-sm font-semibold ${
                                  txn.type === 'collection' ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {formatCurrency(txn.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatDate(txn.date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Recent Collections</h2>
                    <Link
                      href={`/f/${code}/collection`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {collections.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No collections yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Group
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {collections.slice(0, 7).map((col) => (
                            <tr key={col.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{col.name}</td>
                              <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                                {formatCurrency(col.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{col.group_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatDate(col.date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Recent Expenses</h2>
                    <Link
                      href={`/f/${code}/expense`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {expenses.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No expenses yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Item
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Total Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Category
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {expenses.slice(0, 7).map((exp) => (
                            <tr key={exp.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{exp.item}</td>
                              <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                                {formatCurrency(exp.total_amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{exp.category}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatDate(exp.date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* View Analytics Button */}
              <div className="flex justify-center mt-8 mb-6">
                <button
                  onClick={() => router.push(`/f/${code}/analytics`)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg font-semibold"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>View Analytics</span>
                </button>
              </div>
            </>
          )}
        </div>

        <BottomNav code={code} />
        <GlobalSessionBar festivalCode={code} currentPage="home" />
      </div>
    </PasswordGate>
  );
}

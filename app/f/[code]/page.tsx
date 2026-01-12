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

export default function FestivalHomePage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';
  const router = useRouter();

  const [festival, setFestival] = useState<Festival | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCollection: 0, totalExpense: 0, numDonators: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (code) fetchData();
  }, [code]);

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
                <div className="theme-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Transactions</h2>
                    <Link
                      href={`/f/${code}/transaction`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {recentTransactions.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No transactions yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Name/Item
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {recentTransactions.map((txn) => (
                            <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{txn.name}</td>
                              <td
                                className={`px-4 py-3 text-sm font-semibold ${
                                  txn.type === 'collection' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {formatCurrency(txn.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                {formatDate(txn.date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="theme-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Collections</h2>
                    <Link
                      href={`/f/${code}/collection`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {collections.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No collections yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Group
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {collections.slice(0, 7).map((col) => (
                            <tr key={col.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{col.name}</td>
                              <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 font-semibold">
                                {formatCurrency(col.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{col.group_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                {formatDate(col.date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="theme-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Expenses</h2>
                    <Link
                      href={`/f/${code}/expense`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {expenses.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No expenses yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Item
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Total Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Category
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {expenses.slice(0, 7).map((exp) => (
                            <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{exp.item}</td>
                              <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 font-semibold">
                                {formatCurrency(exp.total_amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{exp.category}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
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

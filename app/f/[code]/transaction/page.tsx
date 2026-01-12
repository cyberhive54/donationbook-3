'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Festival, Collection, Expense, Stats, Transaction } from '@/types';
import { calculateStats, combineTransactions, groupBy, groupByDateBetween } from '@/lib/utils';
import PasswordGate from '@/components/PasswordGate';
import StatsCards from '@/components/StatsCards';
import BottomNav from '@/components/BottomNav';
import GlobalSessionBar from '@/components/GlobalSessionBar';
import TransactionTable from '@/components/tables/TransactionTable';
import CollectionVsExpenseChart from '@/components/charts/CollectionVsExpenseChart';
import PieChart from '@/components/charts/PieChart';
import DateRangeDualBarChart from '@/components/charts/DateRangeDualBarChart';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from '@/components/Loader';
import toast from 'react-hot-toast';
import { getThemeStyles, getThemeClasses } from '@/lib/theme';
import { BarChart3 } from 'lucide-react';

export default function TransactionPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';
  const router = useRouter();

  const [festival, setFestival] = useState<Festival | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCollection: 0, totalExpense: 0, numDonators: 0, balance: 0 });
  const [allModes, setAllModes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (code) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const [collectionsRes, expensesRes, collectionModesRes, expenseModesRes] = await Promise.all([
        supabase.from('collections').select('*').eq('festival_id', fest.id).order('date', { ascending: false }),
        supabase.from('expenses').select('*').eq('festival_id', fest.id).order('date', { ascending: false }),
        supabase.from('collection_modes').select('name').eq('festival_id', fest.id).order('name'),
        supabase.from('expense_modes').select('name').eq('festival_id', fest.id).order('name'),
      ]);

      if (collectionsRes.error) throw collectionsRes.error;
      if (expensesRes.error) throw expensesRes.error;

      const fetchedCollections = collectionsRes.data || [];
      const fetchedExpenses = expensesRes.data || [];

      const collectionModes = collectionModesRes.data?.map((m) => m.name) || [];
      const expenseModes = expenseModesRes.data?.map((m) => m.name) || [];
      const uniqueModes = Array.from(new Set([...collectionModes, ...expenseModes]));

      setFestival(fest);
      setCollections(fetchedCollections);
      setExpenses(fetchedExpenses);
      setAllModes(uniqueModes);

      const calculatedStats = calculateStats(fetchedCollections, fetchedExpenses);
      setStats(calculatedStats);

      const combinedTransactions = combineTransactions(fetchedCollections, fetchedExpenses);
      setTransactions(combinedTransactions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const collectionsByGroup = useMemo(() => {
    const grouped = groupBy(collections, 'group_name');
    return Object.entries(grouped).map(([name, items]) => ({
      name,
      value: items.reduce((sum, item) => sum + Number(item.amount), 0),
    }));
  }, [collections]);

  const expensesByCategory = useMemo(() => {
    const grouped = groupBy(expenses, 'category');
    return Object.entries(grouped).map(([name, items]) => ({
      name,
      value: items.reduce((sum, item) => sum + Number(item.total_amount), 0),
    }));
  }, [expenses]);

  const collectionsByMode = useMemo(() => {
    const grouped = groupBy(collections, 'mode');
    return Object.entries(grouped).map(([name, items]) => ({
      name,
      value: items.reduce((sum, item) => sum + Number(item.amount), 0),
    }));
  }, [collections]);

  const expensesByMode = useMemo(() => {
    const grouped = groupBy(expenses, 'mode');
    return Object.entries(grouped).map(([name, items]) => ({
      name,
      value: items.reduce((sum, item) => sum + Number(item.total_amount), 0),
    }));
  }, [expenses]);

  const bgStyle: React.CSSProperties = festival?.theme_bg_image_url
    ? { backgroundImage: `url(${festival.theme_bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: festival?.theme_bg_color || '#f8fafc' };

  const themeStyles = getThemeStyles(festival);
  const themeClasses = getThemeClasses(festival);

  return (
    <PasswordGate code={code}>
      <div className={`min-h-screen pb-24 ${themeClasses}`} style={{ ...bgStyle, ...themeStyles }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <>
              <CardSkeleton />
              <TableSkeleton rows={10} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </>
          ) : !festival ? (
            <div className="theme-card bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-700">Festival not found.</p>
            </div>
          ) : (
            <>
              <StatsCards stats={stats} />

              <h2 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h2>
              <TransactionTable transactions={transactions} modes={allModes} />

              <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6">Statistics</h2>
              <div className="space-y-6">
                <CollectionVsExpenseChart collections={collections} expenses={expenses} festivalStartDate={festival.ce_start_date} festivalEndDate={festival.ce_end_date} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PieChart data={collectionsByGroup} title="Collections by Group" />
                  <PieChart data={expensesByCategory} title="Expenses by Category" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PieChart data={collectionsByMode} title="Collections by Mode" />
                  <PieChart data={expensesByMode} title="Expenses by Mode" />
                </div>

                <DateRangeDualBarChart
                  collections={collections}
                  expenses={expenses}
                  title="Daily Collection & Expense (Dynamic Range)"
                />

                {/* View Full Analytics Button */}
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => router.push(`/f/${code}/analytics`)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>View Full Analytics</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <BottomNav code={code} />
        <GlobalSessionBar festivalCode={code} currentPage="other" />
      </div>
    </PasswordGate>
  );
}

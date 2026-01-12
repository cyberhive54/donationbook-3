'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Festival, Collection, Expense, Stats } from '@/types';
import { calculateStats, groupBy, groupByDateBetween } from '@/lib/utils';
import PasswordGate from '@/components/PasswordGate';
import StatsCards from '@/components/StatsCards';
import BottomNav from '@/components/BottomNav';
import GlobalSessionBar from '@/components/GlobalSessionBar';
import ExpenseTable from '@/components/tables/ExpenseTable';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from '@/components/Loader';
import toast from 'react-hot-toast';
import { getThemeStyles, getThemeClasses } from '@/lib/theme';
import { BarChart3 } from 'lucide-react';

export default function ExpensePage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';
  const router = useRouter();

  const [festival, setFestival] = useState<Festival | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCollection: 0, totalExpense: 0, numDonators: 0, balance: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
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

      const [collectionsRes, expensesRes, categoriesRes, modesRes] = await Promise.all([
        supabase.from('collections').select('*').eq('festival_id', fest.id).order('date', { ascending: false }),
        supabase.from('expenses').select('*').eq('festival_id', fest.id).order('date', { ascending: false }),
        supabase.from('categories').select('name').eq('festival_id', fest.id).order('name'),
        supabase.from('expense_modes').select('name').eq('festival_id', fest.id).order('name'),
      ]);

      if (collectionsRes.error) throw collectionsRes.error;
      if (expensesRes.error) throw expensesRes.error;

      const fetchedCollections = collectionsRes.data || [];
      const fetchedExpenses = expensesRes.data || [];
      const fetchedCategories = categoriesRes.data?.map((c) => c.name) || [];
      const fetchedModes = modesRes.data?.map((m) => m.name) || [];

      setFestival(fest);
      setCollections(fetchedCollections);
      setExpenses(fetchedExpenses);
      setCategories(fetchedCategories);
      setModes(fetchedModes);

      const calculatedStats = calculateStats(fetchedCollections, fetchedExpenses);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const expensesByCategory = useMemo(() => {
    const grouped = groupBy(expenses, 'category');
    return Object.entries(grouped).map(([name, items]) => ({
      name,
      value: items.reduce((sum, item) => sum + Number(item.total_amount), 0),
    }));
  }, [expenses]);

  const expensesByMode = useMemo(() => {
    const grouped = groupBy(expenses, 'mode');
    return Object.entries(grouped).map(([name, items]) => ({
      name,
      value: items.reduce((sum, item) => sum + Number(item.total_amount), 0),
    }));
  }, [expenses]);

  const dailyExpenses = useMemo(() => {
    return groupByDateBetween(expenses, festival?.ce_start_date || null, festival?.ce_end_date || null);
  }, [expenses, festival]);

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

              <h2 className="text-2xl font-bold text-gray-800 mb-6">Expense History</h2>
              <ExpenseTable expenses={expenses} categories={categories} modes={modes} />

              <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6">Statistics</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PieChart data={expensesByCategory} title="Expenses by Category" />
                  <PieChart data={expensesByMode} title="Expenses by Mode" />
                </div>

                <BarChart
                  data={dailyExpenses}
                  title="Daily Expense (Festival Month Range)"
                  dataKey="amount"
                  xAxisKey="date"
                  color="#ef4444"
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

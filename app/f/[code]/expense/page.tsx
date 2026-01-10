'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Festival, Collection, Expense, Stats } from '@/types';
import { calculateStats, groupBy, groupByDateBetween } from '@/lib/utils';
import PasswordGate from '@/components/PasswordGate';
import BasicInfo from '@/components/BasicInfo';
import StatsCards from '@/components/StatsCards';
import BottomNav from '@/components/BottomNav';
import GlobalSessionBar from '@/components/GlobalSessionBar';
import ExpenseTable from '@/components/tables/ExpenseTable';
import CollectionVsExpenseChart from '@/components/charts/CollectionVsExpenseChart';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import { InfoSkeleton, CardSkeleton, TableSkeleton, ChartSkeleton } from '@/components/Loader';
import toast from 'react-hot-toast';
import { getThemeStyles, getThemeClasses } from '@/lib/theme';

export default function ExpensePage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';

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
    return groupByDateBetween(expenses, festival?.event_start_date || null, festival?.event_end_date || null);
  }, [expenses, festival]);

  const topExpensiveItems = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => Number(b.total_amount) - Number(a.total_amount));
    const topAmount = sorted.length > 0 ? sorted[Math.min(7, sorted.length - 1)]?.total_amount : 0;
    return sorted
      .filter((item, index) => index < 8 || Number(item.total_amount) === Number(topAmount))
      .map((item) => ({
        name: item.item,
        amount: Number(item.total_amount),
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
              <InfoSkeleton />
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

              <h2 className="text-2xl font-bold text-gray-800 mb-6">Expense History</h2>
              <ExpenseTable expenses={expenses} categories={categories} modes={modes} />

              <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6">Statistics</h2>
              <div className="space-y-6">
                <CollectionVsExpenseChart collections={collections} expenses={expenses} festivalStartDate={festival.event_start_date} festivalEndDate={festival.event_end_date} />

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

                <BarChart
                  data={topExpensiveItems}
                  title="Top 8 Most Expensive Items"
                  dataKey="amount"
                  xAxisKey="name"
                  color="#f59e0b"
                />
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

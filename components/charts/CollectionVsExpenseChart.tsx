'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Collection, Expense } from '@/types';
import { groupByDate, filterByTimeRange, groupByDateBetween } from '@/lib/utils';

interface CollectionVsExpenseChartProps {
  collections: Collection[];
  expenses: Expense[];
  festivalStartDate?: string | null;
  festivalEndDate?: string | null;
}

export default function CollectionVsExpenseChart({
  collections,
  expenses,
  festivalStartDate,
  festivalEndDate,
}: CollectionVsExpenseChartProps) {
  const [timeRange, setTimeRange] = useState<'all' | '7days' | '14days' | '1month'>('1month');

  const chartData = useMemo(() => {
    let filteredCollections = filterByTimeRange(collections, timeRange);
    let filteredExpenses = filterByTimeRange(expenses, timeRange);

    let collectionsByDate = groupByDate(filteredCollections, timeRange === '7days' ? 7 : timeRange === '14days' ? 14 : 30);
    let expensesByDate = groupByDate(filteredExpenses, timeRange === '7days' ? 7 : timeRange === '14days' ? 14 : 30);

    if (festivalStartDate && festivalEndDate) {
      collectionsByDate = groupByDateBetween(collections, festivalStartDate, festivalEndDate);
      expensesByDate = groupByDateBetween(expenses, festivalStartDate, festivalEndDate);
    }

    const dateMap = new Map<string, { collection: number; expense: number }>();

    collectionsByDate.forEach((item) => {
      dateMap.set(item.date, { collection: item.amount, expense: 0 });
    });

    expensesByDate.forEach((item) => {
      const existing = dateMap.get(item.date);
      if (existing) {
        existing.expense = item.amount;
      } else {
        dateMap.set(item.date, { collection: 0, expense: item.amount });
      }
    });

    return Array.from(dateMap.entries()).map(([date, values]) => ({
      date,
      Collection: values.collection,
      Expense: values.expense,
    }));
  }, [collections, expenses, timeRange]);

  return (
    <div className="theme-card bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h3 className="text-lg font-semibold text-gray-800">Collection vs Expense</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">All Time</option>
          <option value="7days">Last 7 Days</option>
          <option value="14days">Last 14 Days</option>
          <option value="1month">Last 1 Month</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number | undefined) => `₹${(value ?? 0).toFixed(2)}`} />
          <Legend />
          <Line
            type="monotone"
            dataKey="Collection"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981' }}
          />
          <Line
            type="monotone"
            dataKey="Expense"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

}

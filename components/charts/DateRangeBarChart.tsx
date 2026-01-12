'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

interface DateRangeBarChartProps {
  data: { date: string; amount?: number; total_amount?: number }[];
  title: string;
  color?: string;
}

export default function DateRangeBarChart({
  data,
  title,
  color = '#3b82f6',
}: DateRangeBarChartProps) {
  const [rangeType, setRangeType] = useState<'all' | '7days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const { minDate, maxDate } = useMemo(() => {
    if (data.length === 0) {
      return { minDate: null, maxDate: null };
    }

    const dates = data.map(d => new Date(d.date));
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      minDate: format(min, 'yyyy-MM-dd'),
      maxDate: format(max, 'yyyy-MM-dd')
    };
  }, [data]);

  const chartData = useMemo(() => {
    if (!minDate || !maxDate || data.length === 0) return [];

    let startDate: Date;
    let endDate: Date;

    if (rangeType === 'all') {
      startDate = parseISO(minDate);
      endDate = parseISO(maxDate);
    } else if (rangeType === '7days') {
      endDate = parseISO(maxDate);
      startDate = subDays(endDate, 6);
    } else {
      if (!customStartDate || !customEndDate) return [];
      startDate = parseISO(customStartDate);
      endDate = parseISO(customEndDate);
    }

    const dateMap = new Map<string, number>();
    
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = format(current, 'yyyy-MM-dd');
      dateMap.set(dateStr, 0);
      current.setDate(current.getDate() + 1);
    }

    data.forEach((item) => {
      const itemDate = format(new Date(item.date), 'yyyy-MM-dd');
      if (dateMap.has(itemDate)) {
        const amount = item.amount ?? item.total_amount ?? 0;
        dateMap.set(itemDate, dateMap.get(itemDate)! + Number(amount));
      }
    });

    return Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({
        date: format(parseISO(date), 'dd MMM'),
        amount,
      }));
  }, [data, rangeType, customStartDate, customEndDate, minDate, maxDate]);

  return (
    <div className="theme-card bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          <select
            value={rangeType}
            onChange={(e) => {
              const value = e.target.value as 'all' | '7days' | 'custom';
              setRangeType(value);
              if (value === 'custom' && minDate && maxDate) {
                setCustomStartDate(minDate);
                setCustomEndDate(maxDate);
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full xs:w-auto"
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {rangeType === 'custom' && (
            <div className="flex gap-2 flex-wrap">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                min={minDate || undefined}
                max={customEndDate || maxDate || undefined}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate || minDate || undefined}
                max={maxDate || undefined}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available for selected range
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number | undefined) => `₹${(value ?? 0).toFixed(2)}`} />
                <Bar dataKey="amount" fill={color} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

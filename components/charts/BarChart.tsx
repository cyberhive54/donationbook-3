'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data: any[];
  title: string;
  dataKey: string;
  xAxisKey: string;
  color?: string;
}

export default function BarChart({
  data,
  title,
  dataKey,
  xAxisKey,
  color = '#3b82f6',
}: BarChartProps) {
  return (
    <div className="theme-card bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number | undefined) => `₹${(value ?? 0).toFixed(2)}`} />
            <Bar dataKey={dataKey} fill={color} />
          </RechartsBarChart>
        </ResponsiveContainer>
      )}
    </div>
  );

}

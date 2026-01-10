'use client';

import { RadialBarChart as RechartsRadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';

interface RadialBarChartProps {
  data: { name: string; value: number }[];
  title: string;
  colors?: string[];
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function RadialBarChart({ data, title, colors = DEFAULT_COLORS }: RadialBarChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...data.map(item => item.value));

  const chartData = data.map((item, index) => ({
    name: item.name,
    value: item.value,
    fill: colors[index % colors.length],
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0',
  }));

  return (
    <div className="theme-card bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <RechartsRadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="20%" 
              outerRadius="90%" 
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                minAngle={15}
                background
                clockWise
                dataKey="value"
                cornerRadius={10}
              />
              <Tooltip 
                formatter={(value: number) => `₹${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
              />
            </RechartsRadialBarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></div>
                    <span className="text-gray-700 font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{item.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

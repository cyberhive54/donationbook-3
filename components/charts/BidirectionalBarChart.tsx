'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface BidirectionalBarChartProps {
  data: { date: string; collection: number; expense: number }[];
  title: string;
}

export default function BidirectionalBarChart({ data, title }: BidirectionalBarChartProps) {
  const chartData = data.map(item => ({
    date: item.date,
    collection: item.collection,
    expense: -item.expense,
  }));

  const maxCollection = Math.max(...data.map(d => d.collection));
  const maxExpense = Math.max(...data.map(d => d.expense));
  const maxValue = Math.max(maxCollection, maxExpense);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const date = payload[0].payload.date;
      const collection = payload[0].payload.collection;
      const expense = Math.abs(payload[0].payload.expense);
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{date}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">Collection:</span>
              <span className="text-sm font-semibold text-gray-900">₹{collection.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-700">Expense:</span>
              <span className="text-sm font-semibold text-gray-900">₹{expense.toLocaleString()}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Net Balance:</span>
                <span className={`text-sm font-bold ${collection - expense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{(collection - expense).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="theme-card bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">Collection (Above)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-700">Expense (Below)</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${Math.abs(value)}`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#666" strokeWidth={2} />
              <Bar dataKey="collection" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" radius={[0, 0, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Collection } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface TopDonatorsChartProps {
  collections: Collection[];
  topN?: number;
}

export default function TopDonatorsChart({ collections, topN = 5 }: TopDonatorsChartProps) {
  const topDonators = useMemo(() => {
    const donatorMap = new Map<string, { name: string; amount: number; image_url?: string }>();

    collections.forEach((collection) => {
      const existing = donatorMap.get(collection.name);
      if (existing) {
        existing.amount += Number(collection.amount);
      } else {
        donatorMap.set(collection.name, {
          name: collection.name,
          amount: Number(collection.amount),
          image_url: collection.image_url,
        });
      }
    });

    const sorted = Array.from(donatorMap.values()).sort((a, b) => b.amount - a.amount);
    
    const topAmount = sorted.length > 0 ? sorted[Math.min(topN - 1, sorted.length - 1)]?.amount : 0;
    const result = sorted.filter((item, index) => index < topN || item.amount === topAmount);

    return result;
  }, [collections, topN]);

  return (
    <div className="theme-card bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Top {topN} Donators</h3>
      
      {topDonators.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topDonators} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip formatter={(value: number | undefined) => formatCurrency(value ?? 0)} />
              <Bar dataKey="amount" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {topDonators.map((donator, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {donator.image_url ? (
                    <img
                      src={donator.image_url}
                      alt={donator.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {donator.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{donator.name}</p>
                    <p className="text-xs text-gray-500">Rank #{index + 1}</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">{formatCurrency(donator.amount)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

}

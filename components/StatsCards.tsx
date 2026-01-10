'use client';

import { Stats } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, Wallet } from 'lucide-react';

interface StatsCardsProps {
  stats: Stats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Collection',
      value: formatCurrency(stats.totalCollection),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Total Expense',
      value: formatCurrency(stats.totalExpense),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'No of Donators',
      value: stats.numDonators.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Balance',
      value: formatCurrency(stats.balance),
      icon: Wallet,
      color: stats.balance >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.balance >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} rounded-lg shadow-md p-4 transition-transform hover:scale-105`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <p className="text-xs md:text-sm text-gray-600 mb-1">{card.label}</p>
            <p className={`text-lg md:text-xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

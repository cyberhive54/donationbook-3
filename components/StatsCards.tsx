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
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      labelColor: 'text-gray-600 dark:text-gray-300',
    },
    {
      label: 'Total Expense',
      value: formatCurrency(stats.totalExpense),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      labelColor: 'text-gray-600 dark:text-gray-300',
    },
    {
      label: 'No of Donators',
      value: stats.numDonators.toString(),
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      labelColor: 'text-gray-600 dark:text-gray-300',
    },
    {
      label: 'Balance',
      value: formatCurrency(stats.balance),
      icon: Wallet,
      color: stats.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      bgColor: stats.balance >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30',
      labelColor: 'text-gray-600 dark:text-gray-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} rounded-lg shadow-md p-4 transition-transform hover:scale-105 border border-transparent dark:border-gray-700`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs md:text-sm font-medium ${card.labelColor}`}>{card.label}</p>
              <Icon className={`w-5 h-5 md:w-6 md:h-6 ${card.color} flex-shrink-0`} />
            </div>
            <p className={`text-lg md:text-2xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

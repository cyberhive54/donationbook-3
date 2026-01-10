import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Collection, Expense, Stats, Transaction, MediaItem } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string): string => {
  try {
    return format(new Date(date), 'dd MMM yyyy');
  } catch (error) {
    return date;
  }
};


export const formatDateTime = (date: string, hour?: number, minute?: number): string => {
  try {
    const dateStr = format(new Date(date), 'dd MMM yyyy');
    if (hour !== undefined && minute !== undefined) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      return `${dateStr} ${timeStr}`;
    }
    return dateStr;
  } catch (error) {
    return date;
  }
};

export const formatTimeOnly = (hour?: number, minute?: number): string => {
  if (hour === undefined || minute === undefined) return '';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export const getFileSizeLimit = (type: string): { bytes: number; label: string } => {
  if (type.startsWith('video/')) return { bytes: 50 * 1024 * 1024, label: '50MB' };
  return { bytes: 15 * 1024 * 1024, label: '15MB' };
};

export const calculateStorageStats = (items: MediaItem[]) => {
  const totalBytes = items.reduce((sum, item) => sum + (item.size_bytes || 0), 0);
  const maxBytes = 400 * 1024 * 1024;
  const percentage = (totalBytes / maxBytes) * 100;
  
  const byType = items.reduce((acc, item) => {
    const type = item.type;
    if (!acc[type]) {
      acc[type] = { count: 0, bytes: 0 };
    }
    acc[type].count++;
    acc[type].bytes += item.size_bytes || 0;
    return acc;
  }, {} as Record<string, { count: number; bytes: number }>);
  
  return {
    totalBytes,
    maxBytes,
    percentage: Math.min(percentage, 100),
    availableBytes: Math.max(maxBytes - totalBytes, 0),
    byType
  };
};

export const calculateStats = (
  collections: Collection[],
  expenses: Expense[]
): Stats => {
  const totalCollection = collections.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.total_amount), 0);
  const numDonators = new Set(collections.map(c => c.name)).size;
  const balance = totalCollection - totalExpense;
  
  return { totalCollection, totalExpense, numDonators, balance };
};

export const combineTransactions = (
  collections: Collection[],
  expenses: Expense[]
): Transaction[] => {
  const collectionTxns: Transaction[] = collections.map(c => ({
    id: c.id,
    type: 'collection' as const,
    name: c.name,
    amount: c.amount,
    group_category: c.group_name,
    mode: c.mode,
    note: c.note,
    date: c.date,
    time_hour: c.time_hour,
    time_minute: c.time_minute,
    created_at: c.created_at,
  }));
  
  const expenseTxns: Transaction[] = expenses.map(e => ({
    id: e.id,
    type: 'expense' as const,
    name: e.item,
    amount: e.total_amount,
    group_category: e.category,
    mode: e.mode,
    note: e.note,
    date: e.date,
    time_hour: e.time_hour,
    time_minute: e.time_minute,
    created_at: e.created_at,
  }));
  
  return [...collectionTxns, ...expenseTxns].sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    
    const aHour = a.time_hour || 0;
    const bHour = b.time_hour || 0;
    if (bHour !== aHour) return bHour - aHour;
    
    const aMinute = a.time_minute || 0;
    const bMinute = b.time_minute || 0;
    return bMinute - aMinute;
  });
};

export const filterByTimeRange = <T extends { date: string }>(
  data: T[],
  range: 'all' | '7days' | '14days' | '1month'
): T[] => {
  if (range === 'all') return data;
  
  const now = new Date();
  const cutoff = new Date();
  
  switch (range) {
    case '7days':
      cutoff.setDate(now.getDate() - 7);
      break;
    case '14days':
      cutoff.setDate(now.getDate() - 14);
      break;
    case '1month':
      cutoff.setMonth(now.getMonth() - 1);
      break;
  }
  
  return data.filter(item => new Date(item.date) >= cutoff);
};

export const groupByDate = <T extends { date: string; amount?: number; total_amount?: number }>(
  data: T[],
  days: number = 30
): { date: string; amount: number }[] => {
  const result: { [key: string]: number } = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = format(date, 'yyyy-MM-dd');
    result[key] = 0;
  }
  data.forEach(item => {
    const key = format(new Date(item.date), 'yyyy-MM-dd');
    if (key in result) {
      const amount = 'amount' in item ? Number(item.amount) : Number(item.total_amount);
      result[key] += amount;
    }
  });
  return Object.entries(result).map(([key, amount]) => ({
    date: format(new Date(key), 'dd MMM'),
    amount,
  }));
};

export const groupByDateBetween = <T extends { date: string; amount?: number; total_amount?: number }>(
  data: T[],
  startDate?: string | null,
  endDate?: string | null
): { date: string; amount: number }[] => {
  if (!startDate || !endDate) return groupByDate(data, 30);
  const start = startOfMonth(new Date(startDate));
  const end = endOfMonth(new Date(endDate));
  const days = eachDayOfInterval({ start, end });
  const result: Record<string, number> = {};
  days.forEach(d => { result[format(d, 'yyyy-MM-dd')] = 0; });
  data.forEach(item => {
    const key = format(new Date(item.date), 'yyyy-MM-dd');
    if (key in result) {
      const amount = 'amount' in item ? Number(item.amount) : Number(item.total_amount);
      result[key] += amount;
    }
  });
  return Object.entries(result).map(([key, amount]) => ({
    date: format(new Date(key), 'dd MMM'),
    amount,
  }));
};

export const groupBy = <T extends Record<string, any>>(
  data: T[],
  key: keyof T
): { [key: string]: T[] } => {
  return data.reduce((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as { [key: string]: T[] });
};

export const generateThumbnailFromVideo = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      video.currentTime = 1;
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        }, 'image/jpeg', 0.7);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const generatePDFThumbnail = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    resolve('');
  });
};

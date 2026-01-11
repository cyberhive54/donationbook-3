import type { Collection, Expense, DonationBucket, TimeOfDayBucket } from "@/types"

export function getCollectionsByBuckets(
  collections: Collection[],
  buckets: DonationBucket[],
): Array<{ bucket_label: string; total_amount: number; donation_count: number }> {
  const result = buckets.map((bucket) => {
    const matchingCollections = collections.filter((c) => {
      const amount = c.amount
      const meetsMin = amount >= bucket.min_amount
      const meetsMax = bucket.max_amount === null || bucket.max_amount === undefined || amount <= bucket.max_amount
      return meetsMin && meetsMax
    })

    return {
      bucket_label: bucket.bucket_label,
      total_amount: matchingCollections.reduce((sum, c) => sum + (c.amount || 0), 0),
      donation_count: matchingCollections.length,
    }
  })

  return result
}

export function getCollectionsByTimeOfDay(
  collections: Collection[],
  buckets: TimeOfDayBucket[],
): Array<{ bucket_label: string; total_amount: number; collection_count: number }> {
  const result = buckets.map((bucket) => {
    const matchingCollections = collections.filter((c) => {
      const hour = c.time_hour || 0
      const minute = c.time_minute || 0
      const timeInMinutes = hour * 60 + minute
      const bucketStartMinutes = bucket.start_hour * 60 + bucket.start_minute
      const bucketEndMinutes = bucket.end_hour * 60 + bucket.end_minute

      if (bucketEndMinutes < bucketStartMinutes) {
        // Handle overnight buckets (e.g., 20:00 - 06:00)
        return timeInMinutes >= bucketStartMinutes || timeInMinutes < bucketEndMinutes
      }
      return timeInMinutes >= bucketStartMinutes && timeInMinutes < bucketEndMinutes
    })

    return {
      bucket_label: bucket.bucket_label,
      total_amount: matchingCollections.reduce((sum, c) => sum + (c.amount || 0), 0),
      collection_count: matchingCollections.length,
    }
  })

  return result
}

export function getDailyNetBalance(
  collections: Collection[],
  expenses: Expense[],
  startDate: string,
  endDate: string,
): Array<{ date: string; collection_total: number; expense_total: number; net_balance: number }> {
  const dateMap = new Map<string, { collection: number; expense: number }>()

  collections.forEach((c) => {
    if (!dateMap.has(c.date)) {
      dateMap.set(c.date, { collection: 0, expense: 0 })
    }
    const entry = dateMap.get(c.date)!
    entry.collection += c.amount || 0
  })

  expenses.forEach((e) => {
    if (!dateMap.has(e.date)) {
      dateMap.set(e.date, { collection: 0, expense: 0 })
    }
    const entry = dateMap.get(e.date)!
    entry.expense += e.total_amount || 0
  })

  const result = Array.from(dateMap.entries())
    .map(([date, { collection, expense }]) => ({
      date,
      collection_total: collection,
      expense_total: expense,
      net_balance: collection - expense,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return result
}

export function getTransactionCountByDay(
  collections: Collection[],
  expenses: Expense[],
  startDate: string,
  endDate: string,
): Array<{ date: string; collection_count: number; expense_count: number; total_count: number }> {
  const dateMap = new Map<string, { collection: number; expense: number }>()

  collections.forEach((c) => {
    if (!dateMap.has(c.date)) {
      dateMap.set(c.date, { collection: 0, expense: 0 })
    }
    const entry = dateMap.get(c.date)!
    entry.collection += 1
  })

  expenses.forEach((e) => {
    if (!dateMap.has(e.date)) {
      dateMap.set(e.date, { collection: 0, expense: 0 })
    }
    const entry = dateMap.get(e.date)!
    entry.expense += 1
  })

  const result = Array.from(dateMap.entries())
    .map(([date, { collection, expense }]) => ({
      date,
      collection_count: collection,
      expense_count: expense,
      total_count: collection + expense,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return result
}

export function getTopExpenses(
  expenses: Expense[],
  limit = 3,
): Array<{ item: string; amount: number; percentage: number }> {
  const totalExpense = expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0)

  const result = expenses
    .map((e) => ({
      item: e.item,
      amount: e.total_amount || 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
    .map((e) => ({
      item: e.item,
      amount: e.amount,
      percentage: totalExpense > 0 ? (e.amount / totalExpense) * 100 : 0,
    }))

  return result
}

export function getAverageDonationPerDonor(
  collections: Collection[],
): { averageDonation: number; totalDonors: number; totalAmount: number } {
  const uniqueDonors = new Set(collections.map((c) => c.name))
  const totalAmount = collections.reduce((sum, c) => sum + (c.amount || 0), 0)
  const totalDonors = uniqueDonors.size
  const averageDonation = totalDonors > 0 ? totalAmount / totalDonors : 0

  return {
    averageDonation,
    totalDonors,
    totalAmount,
  }
}

export function getCollectionVsExpenseComparison(
  collections: Collection[],
  expenses: Expense[],
  startDate: string,
  endDate: string,
): Array<{ date: string; collection: number; expense: number }> {
  const dateMap = new Map<string, { collection: number; expense: number }>()

  collections.forEach((c) => {
    if (!dateMap.has(c.date)) {
      dateMap.set(c.date, { collection: 0, expense: 0 })
    }
    const entry = dateMap.get(c.date)!
    entry.collection += c.amount || 0
  })

  expenses.forEach((e) => {
    if (!dateMap.has(e.date)) {
      dateMap.set(e.date, { collection: 0, expense: 0 })
    }
    const entry = dateMap.get(e.date)!
    entry.expense += e.total_amount || 0
  })

  const result = Array.from(dateMap.entries())
    .map(([date, { collection, expense }]) => ({
      date,
      collection,
      expense,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return result
}

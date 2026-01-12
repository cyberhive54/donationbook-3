"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Festival, Collection, Expense, AnalyticsConfig, AnalyticsCard, DonationBucket, TimeOfDayBucket } from "@/types"
import PasswordGate from "@/components/PasswordGate"
import BottomNav from "@/components/BottomNav"
import GlobalSessionBar from "@/components/GlobalSessionBar"
import { useSession } from "@/lib/hooks/useSession"
import { TrendingUp, TrendingDown, Target, Calendar, Users, FileText, BarChart3, ArrowUp, ArrowDown } from "lucide-react"
import toast from "react-hot-toast"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCollectionsByBuckets, getCollectionsByTimeOfDay, getDailyNetBalance, getTransactionCountByDay, getTopExpenses, getAverageDonationPerDonor, getCollectionVsExpenseComparison } from "@/lib/analyticsUtils"
import { groupBy } from "@/lib/utils"
import PieChart from "@/components/charts/PieChart"
import TopDonatorsChart from "@/components/charts/TopDonatorsChart"
import HorizontalBarChart from "@/components/charts/HorizontalBarChart"
import DonutChart from "@/components/charts/DonutChart"
import TreemapChart from "@/components/charts/TreemapChart"
import RadialBarChart from "@/components/charts/RadialBarChart"
import BidirectionalBarChart from "@/components/charts/BidirectionalBarChart"

function PublicAnalyticsContent() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""
  const { session } = useSession(code)

  const [festival, setFestival] = useState<Festival | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig | null>(null)
  const [analyticsCards, setAnalyticsCards] = useState<AnalyticsCard[]>([])
  const [donationBuckets, setDonationBuckets] = useState<DonationBucket[]>([])
  const [timeOfDayBuckets, setTimeOfDayBuckets] = useState<TimeOfDayBucket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (code) fetchData()
  }, [code])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: fest, error: festErr } = await supabase.from("festivals").select("*").eq("code", code).single()
      if (festErr) throw festErr

      const [collectionsRes, expensesRes, configRes, cardsRes, bucketsRes, timeBucketsRes] = await Promise.all([
        supabase.from("collections").select("*").eq("festival_id", fest.id),
        supabase.from("expenses").select("*").eq("festival_id", fest.id),
        supabase.from("analytics_config").select("*").eq("festival_id", fest.id).single(),
        supabase.from("analytics_cards").select("*").eq("festival_id", fest.id).eq("is_visible", true).order("sort_order"),
        supabase.from("donation_buckets").select("*").eq("festival_id", fest.id).order("sort_order"),
        supabase.from("time_of_day_buckets").select("*").eq("festival_id", fest.id).order("sort_order"),
      ])

      setFestival(fest)
      setCollections(collectionsRes.data || [])
      setExpenses(expensesRes.data || [])
      setAnalyticsConfig(configRes.data || null)
      setAnalyticsCards((cardsRes.data as AnalyticsCard[]) || [])
      setDonationBuckets(bucketsRes.data || [])
      setTimeOfDayBuckets(timeBucketsRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  const uniqueDonors = useMemo(() => new Set(collections.map((c) => c.name)).size, [collections])
  const totalCollection = useMemo(() => collections.reduce((sum, c) => sum + (c.amount || 0), 0), [collections])
  const totalExpense = useMemo(() => expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0), [expenses])
  const netBalance = totalCollection - totalExpense
  const totalTransactions = collections.length + expenses.length

  const targetProgress = analyticsConfig?.collection_target_amount
    ? (totalCollection / analyticsConfig.collection_target_amount) * 100
    : 0

  const prevYearNetBalance =
    (analyticsConfig?.previous_year_total_collection || 0) - (analyticsConfig?.previous_year_total_expense || 0)

  const collectionsByBuckets = useMemo(() => {
    return donationBuckets.length > 0 ? getCollectionsByBuckets(collections, donationBuckets) : []
  }, [collections, donationBuckets])

  const collectionsByTime = useMemo(() => {
    return timeOfDayBuckets.length > 0 ? getCollectionsByTimeOfDay(collections, timeOfDayBuckets) : []
  }, [collections, timeOfDayBuckets])

  const dailyNetBalance = useMemo(() => {
    if (!festival?.ce_start_date || !festival?.ce_end_date) return []
    return getDailyNetBalance(collections, expenses, festival.ce_start_date, festival.ce_end_date)
  }, [collections, expenses, festival])

  const transactionCounts = useMemo(() => {
    if (!festival?.ce_start_date || !festival?.ce_end_date) return []
    return getTransactionCountByDay(collections, expenses, festival.ce_start_date, festival.ce_end_date)
  }, [collections, expenses, festival])

  const collectionsByGroup = useMemo(() => {
    const grouped = groupBy(collections, 'group_name')
    return Object.entries(grouped).map(([name, items]) => ({
      name,
      value: items.reduce((sum, item) => sum + Number(item.amount), 0),
    }))
  }, [collections])

  const collectionsByMode = useMemo(() => {
    const grouped = groupBy(collections, 'mode')
    return Object.entries(grouped).map(([name, items]) => ({
      name,
      value: items.reduce((sum, item) => sum + Number(item.amount), 0),
    }))
  }, [collections])

  const expensesByCategory = useMemo(() => {
    const grouped = groupBy(expenses, 'category')
    return Object.entries(grouped).map(([name, items]) => ({
      name,
      value: items.reduce((sum, item) => sum + Number(item.total_amount), 0),
    }))
  }, [expenses])

  const expensesByMode = useMemo(() => {
    const grouped = groupBy(expenses, 'mode')
    return Object.entries(grouped).map(([name, items]) => ({
      name,
      value: items.reduce((sum, item) => sum + Number(item.total_amount), 0),
    }))
  }, [expenses])

  const averageDonationData = useMemo(() => {
    return getAverageDonationPerDonor(collections)
  }, [collections])

  const collectionVsExpenseData = useMemo(() => {
    if (!festival?.ce_start_date || !festival?.ce_end_date) return []
    return getCollectionVsExpenseComparison(collections, expenses, festival.ce_start_date, festival.ce_end_date)
  }, [collections, expenses, festival])

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

  const renderCard = (card: AnalyticsCard) => {
    const topExpensesCount = card.card_config?.top_count || 3
    const topDonatorsCount = card.card_config?.top_count || 5
    const topExpensesData = getTopExpenses(expenses, topExpensesCount)

    switch (card.card_type) {
      case 'festival_snapshot':
        const prevYearCollection = analyticsConfig?.previous_year_total_collection || 0
        const prevYearExpense = analyticsConfig?.previous_year_total_expense || 0
        
        const hasPrevYearData = prevYearCollection > 0 || prevYearExpense > 0
        
        const collectionChange = prevYearCollection > 0 ? ((totalCollection - prevYearCollection) / prevYearCollection) * 100 : 0
        const expenseChange = prevYearExpense > 0 ? ((totalExpense - prevYearExpense) / prevYearExpense) * 100 : 0
        const netBalanceChange = prevYearNetBalance !== 0 ? ((netBalance - prevYearNetBalance) / Math.abs(prevYearNetBalance)) * 100 : 0
        
        return (
          <div key={card.id} className="col-span-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Collection</h3>
                  <div className="bg-green-100 rounded-full p-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">₹{totalCollection.toLocaleString()}</p>
                {hasPrevYearData && prevYearCollection > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    {collectionChange >= 0 ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-semibold ${collectionChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(collectionChange).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">vs last year</span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Expense</h3>
                  <div className="bg-red-100 rounded-full p-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">₹{totalExpense.toLocaleString()}</p>
                {hasPrevYearData && prevYearExpense > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    {expenseChange >= 0 ? (
                      <ArrowUp className="w-4 h-4 text-red-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-green-600" />
                    )}
                    <span className={`text-sm font-semibold ${expenseChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.abs(expenseChange).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">vs last year</span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Net Balance</h3>
                  <div className={`rounded-full p-2 ${netBalance >= 0 ? "bg-blue-100" : "bg-orange-100"}`}>
                    <FileText className={`w-5 h-5 ${netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                  ₹{netBalance.toLocaleString()}
                </p>
                {hasPrevYearData && prevYearNetBalance !== 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    {netBalanceChange >= 0 ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-semibold ${netBalanceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(netBalanceChange).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">vs last year</span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Unique Donors</h3>
                  <div className="bg-purple-100 rounded-full p-2">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{uniqueDonors}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Transactions</h3>
                  <div className="bg-indigo-100 rounded-full p-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalTransactions}</p>
              </div>
            </div>
          </div>
        )

      case 'collection_target':
        if (!analyticsConfig?.collection_target_amount) return null
        if (analyticsConfig.target_visibility === 'admin_only' && session?.type === 'visitor') return null
        
        return (
          <div key={card.id} className="col-span-full">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Collection Target</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600">Target: ₹{analyticsConfig.collection_target_amount.toLocaleString()}</p>
                    <p className="text-lg font-bold text-gray-900">{targetProgress.toFixed(1)}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(targetProgress, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    ₹{totalCollection.toLocaleString()} of ₹{analyticsConfig.collection_target_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'previous_year_summary':
        if (!analyticsConfig?.previous_year_total_collection && !analyticsConfig?.previous_year_total_expense) return null
        
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Previous Year Summary</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Collection</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ₹{(analyticsConfig.previous_year_total_collection || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Expense</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ₹{(analyticsConfig.previous_year_total_expense || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Net Balance</span>
                  <span className={`text-lg font-bold ${prevYearNetBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                    ₹{prevYearNetBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'donation_buckets':
        if (collectionsByBuckets.length === 0) return null
        
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Collections by Donation Amount</CardTitle>
                <CardDescription className="text-xs md:text-sm">Distribution across amount ranges</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ChartContainer
                  config={Object.fromEntries(
                    collectionsByBuckets.map((item, idx) => [
                      item.bucket_label,
                      { color: COLORS[idx % COLORS.length] },
                    ]),
                  )}
                  className="h-[350px] sm:h-[300px] min-w-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                    <BarChart data={collectionsByBuckets} margin={{ top: 5, right: 10, left: 0, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="bucket_label" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100} 
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="total_amount" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-6 space-y-3">
                  {collectionsByBuckets.map((item, idx) => (
                    <div
                      key={item.bucket_label}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        ></div>
                        <span className="text-gray-700 text-sm">{item.bucket_label}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">₹{item.total_amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">{item.donation_count} donations</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'time_of_day':
        if (collectionsByTime.length === 0) return null
        
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Collections by Time of Day</CardTitle>
                <CardDescription className="text-xs md:text-sm">When collections happen throughout the day</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ChartContainer
                  config={Object.fromEntries(
                    collectionsByTime.map((item, idx) => [item.bucket_label, { color: COLORS[idx % COLORS.length] }]),
                  )}
                  className="h-[350px] sm:h-[300px] min-w-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                    <BarChart data={collectionsByTime} margin={{ top: 5, right: 10, left: 0, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="bucket_label" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="total_amount" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-6 space-y-3">
                  {collectionsByTime.map((item, idx) => (
                    <div
                      key={item.bucket_label}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        ></div>
                        <span className="text-gray-700 text-sm">{item.bucket_label}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">₹{item.total_amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">{item.collection_count} collections</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'daily_net_balance':
        if (dailyNetBalance.length === 0) return null
        
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Daily Net Balance</CardTitle>
                <CardDescription className="text-xs md:text-sm">Collection minus expense per day</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ChartContainer
                  config={{
                    net_balance: { label: "Net Balance", color: "#3b82f6" },
                  }}
                  className="h-[350px] sm:h-[300px] min-w-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                    <BarChart data={dailyNetBalance} margin={{ top: 5, right: 10, left: 0, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="net_balance"
                        fill="#3b82f6"
                        shape={({ x, y, width, height, value }: any) => {
                          const color = value >= 0 ? "#10b981" : "#ef4444"
                          return (
                            <rect
                              x={x}
                              y={value >= 0 ? y : y + height}
                              width={width}
                              height={Math.abs(height)}
                              fill={color}
                              rx={4}
                            />
                          )
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )

      case 'top_expenses':
        if (topExpensesData.length === 0) return null
        
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 h-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                Top {topExpensesCount} Expenses
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {topExpensesData.map((expense, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600 text-sm">{expense.item}</span>
                        <span className="text-sm font-semibold text-gray-900">{expense.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${expense.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">₹{expense.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'transaction_count_by_day':
        if (transactionCounts.length === 0) return null
        
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Transactions Per Day</CardTitle>
                <CardDescription className="text-xs md:text-sm">Number of collections and expenses daily</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ChartContainer
                  config={{
                    collection_count: { label: "Collections", color: "#10b981" },
                    expense_count: { label: "Expenses", color: "#ef4444" },
                  }}
                  className="h-[350px] sm:h-[300px] min-w-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                    <BarChart data={transactionCounts} margin={{ top: 5, right: 10, left: 0, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="collection_count" fill="#10b981" name="Collections" />
                      <Bar dataKey="expense_count" fill="#ef4444" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )

      case 'collections_by_group':
        if (collectionsByGroup.length === 0) return null
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <DonutChart data={collectionsByGroup} title="Collections by Group" colors={COLORS} />
          </div>
        )

      case 'collections_by_mode':
        if (collectionsByMode.length === 0) return null
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <HorizontalBarChart data={collectionsByMode} title="Collections by Mode" colors={COLORS} />
          </div>
        )

      case 'expenses_by_category':
        if (expensesByCategory.length === 0) return null
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <PieChart data={expensesByCategory} title="Expenses by Category" colors={COLORS} />
          </div>
        )

      case 'expenses_by_mode':
        if (expensesByMode.length === 0) return null
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <RadialBarChart data={expensesByMode} title="Expenses by Mode" colors={COLORS} />
          </div>
        )

      case 'top_donators':
        if (collections.length === 0) return null
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <TopDonatorsChart collections={collections} topN={topDonatorsCount} />
          </div>
        )

      case 'average_donation_per_donor':
        if (collections.length === 0) return null
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 h-full">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Average Donation Per Donor
              </h2>
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">Average per Donor</p>
                  <p className="text-4xl font-bold text-blue-600">₹{averageDonationData.averageDonation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Total Donors</p>
                    <p className="text-2xl font-bold text-gray-900">{averageDonationData.totalDonors}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">₹{averageDonationData.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Collection per Donor Ratio</span>
                    <span className="text-lg font-semibold text-green-600">
                      {averageDonationData.totalDonors > 0 
                        ? `1:${(averageDonationData.totalAmount / averageDonationData.totalDonors / 100).toFixed(1)}`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'collection_vs_expense_comparison':
        if (collectionVsExpenseData.length === 0) return null
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Collection vs Expense Over Time</CardTitle>
                <CardDescription className="text-xs md:text-sm">Daily comparison of collections and expenses</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ChartContainer
                  config={{
                    collection: { label: "Collection", color: "#10b981" },
                    expense: { label: "Expense", color: "#ef4444" },
                  }}
                  className="h-[350px] sm:h-[300px] min-w-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                    <LineChart data={collectionVsExpenseData} margin={{ top: 5, right: 10, left: 0, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="collection" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Collection"
                        dot={{ fill: "#10b981", r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expense" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Expense"
                        dot={{ fill: "#ef4444", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )

      case 'daily_collection_expense_bidirectional':
        if (collectionVsExpenseData.length === 0) return null
        return (
          <div key={card.id} className="col-span-full lg:col-span-1">
            <BidirectionalBarChart 
              data={collectionVsExpenseData} 
              title="Daily Collection & Expense" 
            />
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Festival Analytics</h1>
          {festival && (
            <p className="text-gray-600">
              Collection Period:{" "}
              {festival.ce_start_date ? new Date(festival.ce_start_date).toLocaleDateString() : "N/A"} to{" "}
              {festival.ce_end_date ? new Date(festival.ce_end_date).toLocaleDateString() : "N/A"}
            </p>
          )}
        </div>

        {analyticsCards.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">No analytics cards configured. Contact admin to set up analytics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analyticsCards.map(card => renderCard(card))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PublicAnalyticsPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || "";
  
  return (
    <PasswordGate code={code}>
      <>
        <PublicAnalyticsContent />
        <BottomNav code={code} />
        <GlobalSessionBar festivalCode={code} currentPage="analytics" />
      </>
    </PasswordGate>
  )
}

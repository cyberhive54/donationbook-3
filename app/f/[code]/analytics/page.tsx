"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Festival, Collection, Expense, AnalyticsConfig } from "@/types"
import PasswordGate from "@/components/PasswordGate"
import BottomNav from "@/components/BottomNav"
import GlobalSessionBar from "@/components/GlobalSessionBar"
import { useSession } from "@/lib/hooks/useSession"
import { TrendingUp, TrendingDown, Target, Calendar, Users, FileText, BarChart3 } from "lucide-react"
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

function PublicAnalyticsContent() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""
  const { session } = useSession(code)

  const [festival, setFestival] = useState<Festival | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [donationBucketData, setDonationBucketData] = useState<any[]>([])
  const [timeOfDayData, setTimeOfDayData] = useState<any[]>([])
  const [topExpenses, setTopExpenses] = useState<any[]>([])
  const [dailyNetBalance, setDailyNetBalance] = useState<any[]>([])

  useEffect(() => {
    if (code) fetchData()
  }, [code])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: fest, error: festErr } = await supabase.from("festivals").select("*").eq("code", code).single()
      if (festErr) throw festErr

      const [collectionsRes, expensesRes, configRes] = await Promise.all([
        supabase.from("collections").select("*").eq("festival_id", fest.id),
        supabase.from("expenses").select("*").eq("festival_id", fest.id),
        supabase.from("analytics_config").select("*").eq("festival_id", fest.id).single(),
      ])

      setFestival(fest)
      setCollections(collectionsRes.data || [])
      setExpenses(expensesRes.data || [])
      setAnalyticsConfig(configRes.data || null)

      // Process data for charts
      processAnalyticsData(collectionsRes.data || [], expensesRes.data || [], configRes.data || null)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (
    collectionsList: Collection[],
    expensesList: Expense[],
    config: AnalyticsConfig | null,
  ) => {
    // Process donation buckets
    if (config?.donation_buckets && Array.isArray(config.donation_buckets)) {
      const bucketData = (config.donation_buckets as any[]).map((bucket) => {
        const count = collectionsList.filter((c) => {
          const min = bucket.min_amount || 0
          const max = bucket.max_amount || Number.POSITIVE_INFINITY
          return c.amount >= min && c.amount <= max
        }).length
        return {
          name: bucket.name,
          count: count,
          range: `₹${bucket.min_amount}-${bucket.max_amount}`,
        }
      })
      setDonationBucketData(bucketData)
    }

    // Process time-of-day data
    if (config?.time_of_day_buckets && Array.isArray(config.time_of_day_buckets)) {
      const timeData = (config.time_of_day_buckets as any[]).map((bucket) => {
        const count = collectionsList.filter((c) => {
          const hour = c.time_hour || 0
          const startHour = bucket.start_hour || 0
          const endHour = bucket.end_hour || 24

          if (startHour <= endHour) {
            return hour >= startHour && hour < endHour
          } else {
            // Handle overnight buckets
            return hour >= startHour || hour < endHour
          }
        }).length
        return {
          name: bucket.name,
          count: count,
          time: `${bucket.start_hour}:00 - ${bucket.end_hour}:00`,
        }
      })
      setTimeOfDayData(timeData)
    }

    // Process top 3 expenses
    const topThree = expensesList
      .sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
      .slice(0, 3)
      .map((exp) => ({
        name: exp.item,
        amount: exp.total_amount || 0,
        percentage: 0,
      }))

    const totalExpenseAmount = topThree.reduce((sum, exp) => sum + exp.amount, 0)
    topThree.forEach((exp) => {
      exp.percentage = totalExpenseAmount > 0 ? (exp.amount / totalExpenseAmount) * 100 : 0
    })
    setTopExpenses(topThree)

    // Process daily net balance
    const dailyData: Record<string, { collections: number; expenses: number }> = {}

    collectionsList.forEach((c) => {
      const date = c.date || new Date().toISOString().split("T")[0]
      if (!dailyData[date]) dailyData[date] = { collections: 0, expenses: 0 }
      dailyData[date].collections += c.amount || 0
    })

    expensesList.forEach((e) => {
      const date = e.date || new Date().toISOString().split("T")[0]
      if (!dailyData[date]) dailyData[date] = { collections: 0, expenses: 0 }
      dailyData[date].expenses += e.total_amount || 0
    })

    const dailyBalance = Object.entries(dailyData)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(),
        netBalance: data.collections - data.expenses,
        collections: data.collections,
        expenses: data.expenses,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    setDailyNetBalance(dailyBalance)
  }

  const uniqueDonors = new Set(collections.map((c) => c.name)).size
  const totalCollection = collections.reduce((sum, c) => sum + (c.amount || 0), 0)
  const totalExpense = expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0)
  const netBalance = totalCollection - totalExpense
  const totalTransactions = collections.length + expenses.length

  const targetProgress = analyticsConfig?.collection_target_amount
    ? (totalCollection / analyticsConfig.collection_target_amount) * 100
    : 0

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]

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
        {/* Header with Festival Dates */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Festival Analytics</h1>
          {festival && (
            <p className="text-gray-600">
              Collection Period:{" "}
              {festival.event_start_date ? new Date(festival.event_start_date).toLocaleDateString() : "N/A"} to{" "}
              {festival.event_end_date ? new Date(festival.event_end_date).toLocaleDateString() : "N/A"}
            </p>
          )}
        </div>

        {/* Festival Snapshot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Collection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Collection</h3>
              <div className="bg-green-100 rounded-full p-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">₹{totalCollection.toLocaleString()}</p>
          </div>

          {/* Total Expense */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Expense</h3>
              <div className="bg-red-100 rounded-full p-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">₹{totalExpense.toLocaleString()}</p>
          </div>

          {/* Net Balance */}
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
          </div>

          {/* Total Donors */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Unique Donors</h3>
              <div className="bg-purple-100 rounded-full p-2">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{uniqueDonors}</p>
          </div>

          {/* Total Transactions */}
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

        {/* Collection Target */}
        {analyticsConfig?.collection_target_amount && analyticsConfig?.target_visibility === "public" && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
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
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Donation Buckets */}
          {donationBucketData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Donations by Amount
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={donationBucketData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Time of Day Distribution */}
          {timeOfDayData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Donations by Time
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeOfDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Daily Net Balance and Top Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Net Balance */}
          {dailyNetBalance.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Daily Net Balance
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyNetBalance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="netBalance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top 3 Expenses */}
          {topExpenses.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                Top 3 Expenses
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {topExpenses.map((expense, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600 text-sm">{expense.name}</span>
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
          )}
        </div>
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

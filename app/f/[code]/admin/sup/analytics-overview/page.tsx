"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Festival, Collection, Expense, AnalyticsConfig } from "@/types"
import SuperAdminPasswordGate from "@/components/SuperAdminPasswordGate"
import { TrendingUp, TrendingDown, Target, Calendar, Users, FileText } from "lucide-react"
import toast from "react-hot-toast"

function FestivalOverviewAnalyticsContent() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""

  const [festival, setFestival] = useState<Festival | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig | null>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch analytics data")
    } finally {
      setLoading(false)
    }
  }

  // Calculate unique donors based on donor name
  const uniqueDonors = new Set(collections.map((c) => c.name)).size

  // Calculate totals
  const totalCollection = collections.reduce((sum, c) => sum + (c.amount || 0), 0)
  const totalExpense = expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0)
  const netBalance = totalCollection - totalExpense
  const totalTransactions = collections.length + expenses.length

  // Calculate previous year net balance
  const prevYearNetBalance =
    (analyticsConfig?.previous_year_total_collection || 0) - (analyticsConfig?.previous_year_total_expense || 0)

  // Calculate target progress
  const targetProgress = analyticsConfig?.collection_target_amount
    ? (totalCollection / analyticsConfig.collection_target_amount) * 100
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Festival Overview</h1>
          <p className="text-gray-600">Summary of your festival's collection and expense analytics</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Collection Target */}
          {analyticsConfig?.collection_target_amount && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Collection Target</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600">
                      Target: ₹{analyticsConfig.collection_target_amount.toLocaleString()}
                    </p>
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

          {/* Previous Year Summary */}
          {(analyticsConfig?.previous_year_total_collection || analyticsConfig?.previous_year_total_expense) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
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
                  <span
                    className={`text-lg font-bold ${prevYearNetBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}
                  >
                    ₹{prevYearNetBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Note:</span> All entries are added by admins. This page
            provides a read-only view of your festival's overall performance.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FestivalOverviewAnalyticsPage() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""

  return (
    <SuperAdminPasswordGate code={code}>
      <FestivalOverviewAnalyticsContent />
    </SuperAdminPasswordGate>
  )
}

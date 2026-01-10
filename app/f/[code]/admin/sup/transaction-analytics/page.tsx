"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Collection, Expense } from "@/types"
import SuperAdminPasswordGate from "@/components/SuperAdminPasswordGate"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDailyNetBalance, getTransactionCountByDay } from "@/lib/analyticsUtils"
import toast from "react-hot-toast"

function TransactionAnalyticsContent() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""

  const [festival, setFestival] = useState<any>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (code) fetchData()
  }, [code])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: fest, error: festErr } = await supabase.from("festivals").select("*").eq("code", code).single()
      if (festErr) throw festErr

      const [collectionsRes, expensesRes] = await Promise.all([
        supabase.from("collections").select("*").eq("festival_id", fest.id),
        supabase.from("expenses").select("*").eq("festival_id", fest.id),
      ])

      setFestival(fest)
      setCollections(collectionsRes.data || [])
      setExpenses(expensesRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch analytics data")
    } finally {
      setLoading(false)
    }
  }

  // Calculate daily net balance
  const dailyNetBalance = useMemo(() => {
    if (!festival) return []
    return getDailyNetBalance(collections, expenses, festival.ce_start_date, festival.ce_end_date)
  }, [collections, expenses, festival])

  // Calculate transaction count by day
  const transactionCounts = useMemo(() => {
    if (!festival) return []
    return getTransactionCountByDay(collections, expenses, festival.ce_start_date, festival.ce_end_date)
  }, [collections, expenses, festival])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Transaction Analytics</h1>
        <p className="text-gray-600 mb-8">Daily transaction metrics and net balance trends</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Net Balance */}
          {dailyNetBalance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Net Balance</CardTitle>
                <CardDescription>Collection minus expense per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    net_balance: { label: "Net Balance", color: "#3b82f6" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyNetBalance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
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
          )}

          {/* Transaction Count by Day */}
          {transactionCounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Transactions Per Day</CardTitle>
                <CardDescription>Number of collections and expenses daily</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    collection_count: { label: "Collections", color: "#10b981" },
                    expense_count: { label: "Expenses", color: "#ef4444" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transactionCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="collection_count" fill="#10b981" name="Collections" />
                      <Bar dataKey="expense_count" fill="#ef4444" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {dailyNetBalance.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center">No transactions recorded yet.</p>
              </CardContent>
            </Card>
          )}

          {transactionCounts.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center">No transactions recorded yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TransactionAnalyticsPage() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""

  return (
    <SuperAdminPasswordGate code={code}>
      <TransactionAnalyticsContent />
    </SuperAdminPasswordGate>
  )
}

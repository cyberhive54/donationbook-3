"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Expense } from "@/types"
import SuperAdminPasswordGate from "@/components/SuperAdminPasswordGate"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTopExpenses } from "@/lib/analyticsUtils"
import toast from "react-hot-toast"
import { TrendingDown } from "lucide-react"

function ExpenseAnalyticsContent() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""

  const [festival, setFestival] = useState<any>(null)
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

      const { data: expensesData } = await supabase.from("expenses").select("*").eq("festival_id", fest.id)

      setFestival(fest)
      setExpenses(expensesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch analytics data")
    } finally {
      setLoading(false)
    }
  }

  // Get top 3 expenses
  const topExpenses = useMemo(() => {
    return getTopExpenses(expenses, 3)
  }, [expenses])

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0)
  }, [expenses])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Expense Analytics</h1>
        <p className="text-gray-600 mb-8">Top expenses and distribution breakdown</p>

        {topExpenses.length > 0 ? (
          <div className="space-y-6">
            {/* Top 3 Expenses */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <div>
                    <CardTitle>Top 3 Expenses by Amount</CardTitle>
                    <CardDescription>Largest individual expense items</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topExpenses.map((expense, index) => (
                    <div key={expense.item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                          <span className="font-bold text-red-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{expense.item}</p>
                          <p className="text-sm text-gray-600">{expense.percentage.toFixed(1)}% of total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">₹{expense.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Top 3 Total:</span> ₹
                    {topExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()} out of ₹
                    {totalExpense.toLocaleString()} total expenses
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Expenses Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={Object.fromEntries(
                    topExpenses.map((item, idx) => [item.item, { color: ["#ef4444", "#f97316", "#fbbf24"][idx] }]),
                  )}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={topExpenses} dataKey="amount" nameKey="item" cx="50%" cy="50%" outerRadius={100} label>
                        {topExpenses.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={["#ef4444", "#f97316", "#fbbf24"][index]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600 text-center">No expenses recorded yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function ExpenseAnalyticsPage() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""

  return (
    <SuperAdminPasswordGate code={code}>
      <ExpenseAnalyticsContent />
    </SuperAdminPasswordGate>
  )
}

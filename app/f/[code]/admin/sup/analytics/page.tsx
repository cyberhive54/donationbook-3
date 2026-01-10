"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Collection, DonationBucket, TimeOfDayBucket } from "@/types"
import SuperAdminPasswordGate from "@/components/SuperAdminPasswordGate"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCollectionsByBuckets, getCollectionsByTimeOfDay } from "@/lib/analyticsUtils"
import toast from "react-hot-toast"

function CollectionAnalyticsContent() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""

  const [festival, setFestival] = useState<any>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [donationBuckets, setDonationBuckets] = useState<DonationBucket[]>([])
  const [timeOfDayBuckets, setTimeOfDayBuckets] = useState<TimeOfDayBucket[]>([])
  const [loading, setLoading] = useState(true)

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

  useEffect(() => {
    if (code) fetchData()
  }, [code])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: fest, error: festErr } = await supabase.from("festivals").select("*").eq("code", code).single()
      if (festErr) throw festErr

      const [collectionsRes, bucketsRes, timeBucketsRes] = await Promise.all([
        supabase.from("collections").select("*").eq("festival_id", fest.id),
        supabase.from("donation_buckets").select("*").eq("festival_id", fest.id).order("sort_order"),
        supabase.from("time_of_day_buckets").select("*").eq("festival_id", fest.id).order("sort_order"),
      ])

      setFestival(fest)
      setCollections(collectionsRes.data || [])
      setDonationBuckets(bucketsRes.data || [])
      setTimeOfDayBuckets(timeBucketsRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch analytics data")
    } finally {
      setLoading(false)
    }
  }

  // Calculate collection by buckets
  const collectionsByBuckets = useMemo(() => {
    return donationBuckets.length > 0 ? getCollectionsByBuckets(collections, donationBuckets) : []
  }, [collections, donationBuckets])

  // Calculate collection by time of day
  const collectionsByTime = useMemo(() => {
    return timeOfDayBuckets.length > 0 ? getCollectionsByTimeOfDay(collections, timeOfDayBuckets) : []
  }, [collections, timeOfDayBuckets])

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
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Collection Analytics</h1>
        <p className="text-gray-600 mb-8">Detailed breakdown of collections by donation amount and time of day</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donation Amount Buckets */}
          {collectionsByBuckets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Collections by Donation Amount</CardTitle>
                <CardDescription>Distribution of donations across configured amount ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={Object.fromEntries(
                    collectionsByBuckets.map((item, idx) => [
                      item.bucket_label,
                      { color: COLORS[idx % COLORS.length] },
                    ]),
                  )}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collectionsByBuckets}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket_label" angle={-45} textAnchor="end" height={80} interval={0} />
                      <YAxis />
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
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        ></div>
                        <span className="text-gray-700">{item.bucket_label}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{item.total_amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">{item.donation_count} donations</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time of Day Buckets */}
          {collectionsByTime.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Collections by Time of Day</CardTitle>
                <CardDescription>When collections happen throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={Object.fromEntries(
                    collectionsByTime.map((item, idx) => [item.bucket_label, { color: COLORS[idx % COLORS.length] }]),
                  )}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collectionsByTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket_label" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
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
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        ></div>
                        <span className="text-gray-700">{item.bucket_label}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{item.total_amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">{item.collection_count} collections</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {donationBuckets.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center">
                  No donation amount buckets configured. Configure them in Analytics Settings.
                </p>
              </CardContent>
            </Card>
          )}

          {timeOfDayBuckets.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center">
                  No time of day buckets configured. Configure them in Analytics Settings.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CollectionAnalyticsPage() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""

  return (
    <SuperAdminPasswordGate code={code}>
      <CollectionAnalyticsContent />
    </SuperAdminPasswordGate>
  )
}

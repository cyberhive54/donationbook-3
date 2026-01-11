"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { AnalyticsConfig, DonationBucket, TimeOfDayBucket } from "@/types"
import { X, Plus, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { useSession } from "@/lib/hooks/useSession"

interface AnalyticsConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  festival: any
}

export default function AnalyticsConfigModal({ isOpen, onClose, onSuccess, festival }: AnalyticsConfigModalProps) {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""
  const { session } = useSession(code)

  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig | null>(null)
  const [donationBuckets, setDonationBuckets] = useState<DonationBucket[]>([])
  const [timeOfDayBuckets, setTimeOfDayBuckets] = useState<TimeOfDayBucket[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [collectionTarget, setCollectionTarget] = useState("")
  const [targetVisibility, setTargetVisibility] = useState<"public" | "admin_only">("public")
  const [prevYearCollection, setPrevYearCollection] = useState("")
  const [prevYearExpense, setPrevYearExpense] = useState("")

  // Donation bucket form
  const [newBucketLabel, setNewBucketLabel] = useState("")
  const [newBucketMin, setNewBucketMin] = useState("")
  const [newBucketMax, setNewBucketMax] = useState("")

  // Time of day bucket form
  const [newTimeBucketLabel, setNewTimeBucketLabel] = useState("")
  const [newTimeStartHour, setNewTimeStartHour] = useState("")
  const [newTimeStartMinute, setNewTimeStartMinute] = useState("0")
  const [newTimeEndHour, setNewTimeEndHour] = useState("")
  const [newTimeEndMinute, setNewTimeEndMinute] = useState("0")

  useEffect(() => {
    if (isOpen && festival) {
      fetchAnalyticsConfig()
    }
  }, [isOpen, festival])

  const fetchAnalyticsConfig = async () => {
    try {
      setIsLoading(true)

      // Fetch analytics config
      const { data: config } = await supabase
        .from("analytics_config")
        .select("*")
        .eq("festival_id", festival.id)
        .single()

      if (config) {
        setAnalyticsConfig(config)
        setCollectionTarget(config.collection_target_amount?.toString() || "")
        setTargetVisibility(config.target_visibility || "public")
        setPrevYearCollection(config.previous_year_total_collection?.toString() || "")
        setPrevYearExpense(config.previous_year_total_expense?.toString() || "")
      } else {
        // Create new config if doesn't exist
        const { data: newConfig } = await supabase
          .from("analytics_config")
          .insert({
            festival_id: festival.id,
            target_visibility: "public",
          })
          .select()
          .single()
        if (newConfig) setAnalyticsConfig(newConfig)
      }

      // Fetch donation buckets
      const { data: buckets, error: bucketsError } = await supabase
        .from("donation_buckets")
        .select("*")
        .eq("festival_id", festival.id)
        .order("sort_order", { ascending: true })
      
      if (bucketsError) {
        console.error("Error fetching donation buckets:", bucketsError)
        // Don't fail completely, just log the error
        setDonationBuckets([])
      } else {
        setDonationBuckets(buckets || [])
      }

      // Fetch time of day buckets
      const { data: timeBuckets, error: timeBucketsError } = await supabase
        .from("time_of_day_buckets")
        .select("*")
        .eq("festival_id", festival.id)
        .order("sort_order", { ascending: true })
      
      if (timeBucketsError) {
        console.error("Error fetching time of day buckets:", timeBucketsError)
        // Don't fail completely, just log the error
        setTimeOfDayBuckets([])
      } else {
        setTimeOfDayBuckets(timeBuckets || [])
      }
    } catch (error) {
      console.error("Error fetching analytics config:", error)
      toast.error("Failed to load analytics configuration")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      setIsLoading(true)

      // Ensure analytics_config record exists before updating
      if (!analyticsConfig) {
        // Create record if it doesn't exist
        const { data: newConfig, error: createError } = await supabase
          .from("analytics_config")
          .insert({
            festival_id: festival.id,
            collection_target_amount: collectionTarget ? Number.parseFloat(collectionTarget) : null,
            target_visibility: targetVisibility,
            previous_year_total_collection: prevYearCollection ? Number.parseFloat(prevYearCollection) : null,
            previous_year_total_expense: prevYearExpense ? Number.parseFloat(prevYearExpense) : null,
          })
          .select()
          .single()

        if (createError) {
          console.error("Error creating analytics config:", createError)
          toast.error(`Failed to save configuration: ${createError.message}`)
          return
        }

        setAnalyticsConfig(newConfig)
        toast.success("Analytics configuration saved")
        onSuccess()
        return
      }

      // Update existing record
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      // Only include fields that have valid values
      if (collectionTarget && collectionTarget.trim() !== '') {
        const parsedAmount = Number.parseFloat(collectionTarget)
        if (!isNaN(parsedAmount)) {
          updateData.collection_target_amount = parsedAmount
        } else {
          updateData.collection_target_amount = null
        }
      } else {
        updateData.collection_target_amount = null
      }

      updateData.target_visibility = targetVisibility || "public"

      if (prevYearCollection && prevYearCollection.trim() !== '') {
        const parsedCollection = Number.parseFloat(prevYearCollection)
        if (!isNaN(parsedCollection)) {
          updateData.previous_year_total_collection = parsedCollection
        } else {
          updateData.previous_year_total_collection = null
        }
      } else {
        updateData.previous_year_total_collection = null
      }

      if (prevYearExpense && prevYearExpense.trim() !== '') {
        const parsedExpense = Number.parseFloat(prevYearExpense)
        if (!isNaN(parsedExpense)) {
          updateData.previous_year_total_expense = parsedExpense
        } else {
          updateData.previous_year_total_expense = null
        }
      } else {
        updateData.previous_year_total_expense = null
      }

      const { error } = await supabase
        .from("analytics_config")
        .update(updateData)
        .eq("festival_id", festival.id)

      if (error) {
        console.error("Error saving analytics config:", error)
        toast.error(`Failed to save configuration: ${error.message || 'Unknown error'}`)
        return
      }

      await fetchAnalyticsConfig()
      
      toast.success("Analytics configuration saved")
      onSuccess()
    } catch (error: any) {
      console.error("Error saving analytics config:", error)
      toast.error(`Failed to save configuration: ${error?.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDonationBucket = async () => {
    if (!newBucketLabel.trim() || !newBucketMin) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const { error } = await supabase.from("donation_buckets").insert({
        festival_id: festival.id,
        bucket_label: newBucketLabel.trim(),
        min_amount: Number.parseFloat(newBucketMin),
        max_amount: newBucketMax ? Number.parseFloat(newBucketMax) : null,
        sort_order: donationBuckets.length,
      })

      if (error) throw error
      setNewBucketLabel("")
      setNewBucketMin("")
      setNewBucketMax("")
      toast.success("Donation bucket added")
      fetchAnalyticsConfig()
    } catch (error) {
      console.error("Error adding bucket:", error)
      toast.error("Failed to add bucket")
    }
  }

  const handleDeleteDonationBucket = async (id: string) => {
    try {
      const { error } = await supabase.from("donation_buckets").delete().eq("id", id)

      if (error) throw error
      toast.success("Bucket deleted")
      fetchAnalyticsConfig()
    } catch (error) {
      console.error("Error deleting bucket:", error)
      toast.error("Failed to delete bucket")
    }
  }

  const handleAddTimeOfDayBucket = async () => {
    if (!newTimeBucketLabel.trim() || !newTimeStartHour || !newTimeEndHour) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const { error } = await supabase.from("time_of_day_buckets").insert({
        festival_id: festival.id,
        bucket_label: newTimeBucketLabel.trim(),
        start_hour: Number.parseInt(newTimeStartHour),
        start_minute: Number.parseInt(newTimeStartMinute),
        end_hour: Number.parseInt(newTimeEndHour),
        end_minute: Number.parseInt(newTimeEndMinute),
        sort_order: timeOfDayBuckets.length,
      })

      if (error) throw error
      setNewTimeBucketLabel("")
      setNewTimeStartHour("")
      setNewTimeStartMinute("0")
      setNewTimeEndHour("")
      setNewTimeEndMinute("0")
      toast.success("Time of day bucket added")
      fetchAnalyticsConfig()
    } catch (error) {
      console.error("Error adding time bucket:", error)
      toast.error("Failed to add bucket")
    }
  }

  const handleDeleteTimeOfDayBucket = async (id: string) => {
    try {
      const { error } = await supabase.from("time_of_day_buckets").delete().eq("id", id)

      if (error) throw error
      toast.success("Time bucket deleted")
      fetchAnalyticsConfig()
    } catch (error) {
      console.error("Error deleting bucket:", error)
      toast.error("Failed to delete bucket")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Analytics Configuration</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Collection Target Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Collection Target</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
                  <input
                    type="number"
                    value={collectionTarget}
                    onChange={(e) => setCollectionTarget(e.target.value)}
                    placeholder="e.g., 50000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Visibility</label>
                  <select
                    value={targetVisibility}
                    onChange={(e) => setTargetVisibility(e.target.value as "public" | "admin_only")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="public">Public</option>
                    <option value="admin_only">Admin Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Previous Year Summary Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Previous Year Summary (Read-Only)</h3>
              <p className="text-sm text-gray-600">
                These values are entered manually and displayed as read-only in the Festival Overview analytics page.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Collection</label>
                  <input
                    type="number"
                    value={prevYearCollection}
                    onChange={(e) => setPrevYearCollection(e.target.value)}
                    placeholder="e.g., 45000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Expense</label>
                  <input
                    type="number"
                    value={prevYearExpense}
                    onChange={(e) => setPrevYearExpense(e.target.value)}
                    placeholder="e.g., 25000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Donation Amount Buckets */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Donation Amount Buckets</h3>
              <div className="space-y-3">
                {donationBuckets.map((bucket) => (
                  <div key={bucket.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{bucket.bucket_label}</p>
                      <p className="text-sm text-gray-600">
                        ₹{bucket.min_amount} {bucket.max_amount ? `- ₹${bucket.max_amount}` : "+"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteDonationBucket(bucket.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-gray-900">Add New Bucket</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newBucketLabel}
                    onChange={(e) => setNewBucketLabel(e.target.value)}
                    placeholder="e.g., ₹1–₹750"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={newBucketMin}
                      onChange={(e) => setNewBucketMin(e.target.value)}
                      placeholder="Min Amount"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={newBucketMax}
                      onChange={(e) => setNewBucketMax(e.target.value)}
                      placeholder="Max Amount (optional)"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddDonationBucket}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Bucket
                  </button>
                </div>
              </div>
            </div>

            {/* Time of Day Buckets */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Time of Day Buckets</h3>
              <div className="space-y-3">
                {timeOfDayBuckets.map((bucket) => (
                  <div key={bucket.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{bucket.bucket_label}</p>
                      <p className="text-sm text-gray-600">
                        {String(bucket.start_hour).padStart(2, "0")}:{String(bucket.start_minute).padStart(2, "0")} -{" "}
                        {String(bucket.end_hour).padStart(2, "0")}:{String(bucket.end_minute).padStart(2, "0")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTimeOfDayBucket(bucket.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-gray-900">Add New Time Bucket</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newTimeBucketLabel}
                    onChange={(e) => setNewTimeBucketLabel(e.target.value)}
                    placeholder="e.g., Morning (06:00–11:00)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={newTimeStartHour}
                      onChange={(e) => setNewTimeStartHour(e.target.value)}
                      placeholder="Hour"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={newTimeStartMinute}
                      onChange={(e) => setNewTimeStartMinute(e.target.value)}
                      placeholder="Min"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={newTimeEndHour}
                      onChange={(e) => setNewTimeEndHour(e.target.value)}
                      placeholder="Hour"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={newTimeEndMinute}
                      onChange={(e) => setNewTimeEndMinute(e.target.value)}
                      placeholder="Min"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddTimeOfDayBucket}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Time Bucket
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
            Close
          </button>
          <button
            onClick={handleSaveConfig}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  )
}

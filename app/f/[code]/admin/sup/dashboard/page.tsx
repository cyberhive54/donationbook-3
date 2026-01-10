"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Festival, Collection, Expense, Stats, Admin } from "@/types"
import { calculateStats, formatDate } from "@/lib/utils"
import SuperAdminPasswordGate from "@/components/SuperAdminPasswordGate"
import BasicInfo from "@/components/BasicInfo"
import StatsCards from "@/components/StatsCards"
import BottomNav from "@/components/BottomNav"
import GlobalSessionBar from "@/components/GlobalSessionBar"
import CreateAdminModal from "@/components/modals/CreateAdminModal"
import EditAdminModal from "@/components/modals/EditAdminModal"
import DeleteAdminModal from "@/components/modals/DeleteAdminModal"
import EditFestivalModal from "@/components/modals/EditFestivalModal"
import DeleteFestivalModal from "@/components/modals/DeleteFestivalModal"
import AnalyticsCardsManagementModal from "@/components/modals/AnalyticsCardsManagementModal"
import { InfoSkeleton, CardSkeleton, TableSkeleton } from "@/components/Loader"
import toast from "react-hot-toast"
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Users, Activity, Calendar, Shield, Settings } from "lucide-react"
import { getThemeStyles, getThemeClasses } from "@/lib/theme"
import Toggle from "@/components/Toggle"
import { updateFestivalCode } from "@/lib/festivalCodeRedirect"

function SuperAdminDashboardContent() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""

  const [festival, setFestival] = useState<Festival | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<Stats>({ totalCollection: 0, totalExpense: 0, numDonators: 0, balance: 0 })
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)

  const [isFestivalModalOpen, setIsFestivalModalOpen] = useState(false)
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false)
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false)
  const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all")
  const [sortBy, setSortBy] = useState<"created" | "name" | "last_login">("created")

  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false)
  const [editingSuperAdminPassword, setEditingSuperAdminPassword] = useState(false)
  const [newSuperAdminPassword, setNewSuperAdminPassword] = useState("")

  // Banner visibility settings
  const [bannerSettings, setBannerSettings] = useState({
    banner_show_organiser: true,
    banner_show_guide: true,
    banner_show_mentor: true,
    banner_show_location: true,
    banner_show_dates: true,
    banner_show_duration: true,
    admin_display_preference: "code" as "code" | "name",
  })

  const [isFestivalCodeModalOpen, setIsFestivalCodeModalOpen] = useState(false)
  const [editingFestivalCode, setEditingFestivalCode] = useState(false)
  const [newFestivalCode, setNewFestivalCode] = useState("")
  const [codeEditLoading, setCodeEditLoading] = useState(false)
  const [isDeleteFestivalOpen, setIsDeleteFestivalOpen] = useState(false)
  const [isAnalyticsCardsOpen, setIsAnalyticsCardsOpen] = useState(false)

  useEffect(() => {
    if (code) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: fest, error: festErr } = await supabase.from("festivals").select("*").eq("code", code).single()
      if (festErr) throw festErr

      const [collectionsRes, expensesRes, adminsRes] = await Promise.all([
        supabase.from("collections").select("*").eq("festival_id", fest.id).order("date", { ascending: false }),
        supabase.from("expenses").select("*").eq("festival_id", fest.id).order("date", { ascending: false }),
        supabase.from("admins").select("*").eq("festival_id", fest.id).order("created_at", { ascending: false }),
      ])

      const fetchedCollections = collectionsRes.data || []
      const fetchedExpenses = expensesRes.data || []
      const fetchedAdmins = adminsRes.data || []

      setFestival(fest)
      setCollections(fetchedCollections)
      setExpenses(fetchedExpenses)
      setAdmins(fetchedAdmins)

      setBannerSettings({
        banner_show_organiser: fest.banner_show_organiser !== false,
        banner_show_guide: fest.banner_show_guide !== false,
        banner_show_mentor: fest.banner_show_mentor !== false,
        banner_show_location: fest.banner_show_location !== false,
        banner_show_dates: fest.banner_show_dates !== false,
        banner_show_duration: fest.banner_show_duration !== false,
        admin_display_preference: fest.admin_display_preference || "code",
      })

      const calculatedStats = calculateStats(fetchedCollections, fetchedExpenses)
      setStats(calculatedStats)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSuperAdminPassword = async () => {
    if (!newSuperAdminPassword.trim() || !festival) return
    try {
      const { error } = await supabase
        .from("festivals")
        .update({
          super_admin_password: newSuperAdminPassword.trim(),
          super_admin_password_updated_at: new Date().toISOString(),
        })
        .eq("id", festival.id)
      if (error) throw error

      // Log activity
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: null,
        p_action_type: "update_super_admin_password",
        p_action_details: {},
      })

      toast.success("Super Admin password updated")
      setNewSuperAdminPassword("")
      setEditingSuperAdminPassword(false)
      fetchData()
    } catch (error) {
      toast.error("Failed to update password")
    }
  }

  const handleUpdateFestivalCode = async () => {
    if (!newFestivalCode.trim() || !festival) return

    try {
      setCodeEditLoading(true)
      const newCode = newFestivalCode.trim().toUpperCase()
      const result = await updateFestivalCode(festival.id, newCode)

      if (!result.success) {
        toast.error(result.error || "Failed to update festival code")
        return
      }

      // Log activity
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: null,
        p_action_type: "update_festival_code",
        p_action_details: { old_code: festival.code, new_code: newCode },
      })

      // Clear all sessions for this festival (old code)
      const sessionKey = `session:${festival.code}`
      localStorage.removeItem(sessionKey)

      // Also clear for new code if it exists
      const newSessionKey = `session:${newCode}`
      localStorage.removeItem(newSessionKey)

      // Show success message with redirect info
      toast.success(`Festival code updated to ${newCode}. Redirecting to login...`, { duration: 3000 })

      // Wait 2 seconds for user to see the message, then redirect
      setTimeout(() => {
        // Use window.location for full page reload to ensure clean state
        window.location.href = `/f/${newCode}/admin/sup/login`
      }, 2000)
    } catch (error) {
      console.error("Error updating festival code:", error)
      toast.error("Failed to update festival code")
      setCodeEditLoading(false)
    }
  }

  const handleUpdateBannerSettings = async () => {
    if (!festival) return
    try {
      const { error } = await supabase
        .from("festivals")
        .update({
          banner_show_organiser: bannerSettings.banner_show_organiser,
          banner_show_guide: bannerSettings.banner_show_guide,
          banner_show_mentor: bannerSettings.banner_show_mentor,
          banner_show_location: bannerSettings.banner_show_location,
          banner_show_dates: bannerSettings.banner_show_dates,
          banner_show_duration: bannerSettings.banner_show_duration,
          admin_display_preference: bannerSettings.admin_display_preference,
          updated_at: new Date().toISOString(),
        })
        .eq("id", festival.id)

      if (error) throw error

      // Log activity
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: null,
        p_action_type: "update_banner_visibility",
        p_action_details: bannerSettings,
      })

      toast.success("Banner settings updated")
      fetchData()
    } catch (error) {
      toast.error("Failed to update banner settings")
    }
  }

  const handleEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsEditAdminOpen(true)
  }

  const handleDeleteAdmin = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsDeleteAdminOpen(true)
  }

  const bgStyle: React.CSSProperties = festival?.theme_bg_image_url
    ? { backgroundImage: `url(${festival.theme_bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: festival?.theme_bg_color || "#f8fafc" }

  const themeStyles = getThemeStyles(festival)
  const themeClasses = getThemeClasses(festival)

  // Filter and sort admins
  const filteredAdmins = admins
    .filter((admin) => {
      const matchesSearch =
        admin.admin_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.admin_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter =
        filterActive === "all" ||
        (filterActive === "active" && admin.is_active) ||
        (filterActive === "inactive" && !admin.is_active)
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === "created") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === "name") {
        return a.admin_name.localeCompare(b.admin_name)
      } else {
        // last_login - handle null values
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
        return bTime - aTime
      }
    })

  return (
    <div className={`min-h-screen pb-24 ${themeClasses}`} style={{ ...bgStyle, ...themeStyles }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <>
            <InfoSkeleton />
            <CardSkeleton />
            <TableSkeleton rows={5} />
          </>
        ) : !festival ? (
          <div className="theme-card bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-700">Festival not found.</p>
          </div>
        ) : (
          <>
            {/* Festival Code */}
            <div className="theme-card bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Festival Code</p>
                  <p className="text-xl font-bold text-gray-900">{festival.code}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/f/${festival.code}`)
                    toast.success("Festival URL copied!")
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Copy URL
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <BasicInfo
              basicInfo={
                {
                  id: festival.id,
                  event_name: festival.event_name,
                  organiser: festival.organiser || "",
                  mentor: festival.mentor || "",
                  guide: festival.guide || "",
                  event_start_date: festival.event_start_date,
                  event_end_date: festival.event_end_date,
                  location: festival.location,
                  other_data: festival.other_data,
                } as any
              }
              festival={festival}
              showEditButton
              onEdit={() => setIsFestivalModalOpen(true)}
            />

            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Admin Management Section */}
            <div className="theme-card bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Admin Management</h2>
                </div>
                <button
                  onClick={() => setIsCreateAdminOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Admin
                </button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by code or name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Admins</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="created">Sort by Created</option>
                  <option value="name">Sort by Name</option>
                  <option value="last_login">Sort by Last Activity</option>
                </select>
              </div>

              {/* Admin Count */}
              <div className="text-sm text-gray-600 mb-4">
                Total Admins: {admins.length} | Active: {admins.filter((a) => a.is_active).length} | Inactive:{" "}
                {admins.filter((a) => !a.is_active).length}
              </div>

              {/* Admin Table */}
              {filteredAdmins.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery || filterActive !== "all" ? "No admins match your filters" : "No admins created yet"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Max Passwords
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAdmins.map((admin) => {
                        const isDefaultAdmin = !admin.created_by || admin.created_by === null;
                        return (
                          <tr key={admin.admin_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">{admin.admin_code}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{admin.admin_name}</td>
                            <td className="px-4 py-3 text-sm">
                              {isDefaultAdmin ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  Default
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  Regular
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {admin.is_active ? (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Inactive</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{admin.max_user_passwords}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(admin.created_at)}</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditAdmin(admin)}
                                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(admin)}
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Super Admin Password */}
            <div className="theme-card bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-bold text-purple-900">Super Admin Password</h3>
                <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">Advanced</span>
              </div>
              <p className="text-sm text-purple-700 mb-3">For super admin dashboard access</p>
              {editingSuperAdminPassword ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSuperAdminPassword}
                    onChange={(e) => setNewSuperAdminPassword(e.target.value)}
                    placeholder="Enter new super admin password"
                    className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleUpdateSuperAdminPassword}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingSuperAdminPassword(false)
                      setNewSuperAdminPassword("")
                    }}
                    className="px-4 py-2 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-2 bg-purple-50 rounded-lg font-mono border border-purple-200">
                    {showSuperAdminPassword
                      ? festival.super_admin_password
                      : "•".repeat(festival.super_admin_password?.length || 0)}
                  </div>
                  <button
                    onClick={() => setShowSuperAdminPassword(!showSuperAdminPassword)}
                    className="p-2 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    {showSuperAdminPassword ? (
                      <EyeOff className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-purple-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingSuperAdminPassword(true)}
                    className="p-2 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <Edit className="w-5 h-5 text-purple-600" />
                  </button>
                </div>
              )}
              {festival.super_admin_password_updated_at && (
                <p className="text-xs text-purple-600 mt-2">
                  Last updated: {new Date(festival.super_admin_password_updated_at).toLocaleString()}
                </p>
              )}
            </div>

            {/* Banner Visibility Settings */}
            <div className="theme-card bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Banner Visibility Settings</h3>
              <p className="text-sm text-gray-600 mb-4">Control what information is displayed in the festival banner</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <span className="text-sm text-gray-700">
                    Festival Name <span className="text-xs text-gray-500">(always shown)</span>
                  </span>
                  <Toggle id="banner_name" checked={true} onChange={() => {}} disabled={true} />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-700">Organiser</span>
                  <Toggle
                    id="banner_organiser"
                    checked={bannerSettings.banner_show_organiser}
                    onChange={(checked) => setBannerSettings({ ...bannerSettings, banner_show_organiser: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-700">Guide</span>
                  <Toggle
                    id="banner_guide"
                    checked={bannerSettings.banner_show_guide}
                    onChange={(checked) => setBannerSettings({ ...bannerSettings, banner_show_guide: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-700">Mentor</span>
                  <Toggle
                    id="banner_mentor"
                    checked={bannerSettings.banner_show_mentor}
                    onChange={(checked) => setBannerSettings({ ...bannerSettings, banner_show_mentor: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-700">Location</span>
                  <Toggle
                    id="banner_location"
                    checked={bannerSettings.banner_show_location}
                    onChange={(checked) => setBannerSettings({ ...bannerSettings, banner_show_location: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-700">Festival Dates</span>
                  <Toggle
                    id="banner_dates"
                    checked={bannerSettings.banner_show_dates}
                    onChange={(checked) => setBannerSettings({ ...bannerSettings, banner_show_dates: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-700">Duration</span>
                  <Toggle
                    id="banner_duration"
                    checked={bannerSettings.banner_show_duration}
                    onChange={(checked) => setBannerSettings({ ...bannerSettings, banner_show_duration: checked })}
                  />
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Display Preference</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="admin_display"
                        value="code"
                        checked={bannerSettings.admin_display_preference === "code"}
                        onChange={(e) => setBannerSettings({ ...bannerSettings, admin_display_preference: "code" })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Show Admin Code</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="admin_display"
                        value="name"
                        checked={bannerSettings.admin_display_preference === "name"}
                        onChange={(e) => setBannerSettings({ ...bannerSettings, admin_display_preference: "name" })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Show Admin Name</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleUpdateBannerSettings}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Banner Settings
                </button>
              </div>
            </div>

            {/* Festival Code Management Section */}
            <div className="theme-card bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Festival Code Management</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Festival Code</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded px-3 py-2 font-mono font-bold">{festival?.code}</div>
                    <button
                      onClick={() => {
                        setNewFestivalCode(festival?.code || "")
                        setEditingFestivalCode(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Code
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Format: 6-12 characters, alphanumeric and hyphens only. Old code links will redirect automatically.
                  </p>
                </div>

                {/* Code Edit Form */}
                {editingFestivalCode && (
                  <div className="border-t pt-4 mt-4">
                    <label className="block text-sm font-medium mb-2">New Festival Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFestivalCode}
                        onChange={(e) => setNewFestivalCode(e.target.value.toUpperCase())}
                        placeholder="e.g., SUMMER-2024"
                        className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={12}
                      />
                      <button
                        onClick={handleUpdateFestivalCode}
                        disabled={codeEditLoading || !newFestivalCode.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {codeEditLoading ? "Updating..." : "Update"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingFestivalCode(false)
                          setNewFestivalCode("")
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      <p>• Must be 6-12 characters long</p>
                      <p>• Can contain letters, numbers, and hyphens only</p>
                      <p>• All old links will automatically redirect to the new code</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Analytics Configuration */}
            <div className="theme-card bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Analytics Cards Configuration</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage which analytics cards are shown on the visitor analytics page</p>
                </div>
                <button
                  onClick={() => setIsAnalyticsCardsOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Manage Cards
                </button>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <p className="text-sm text-indigo-800">
                  Control visibility, order, and configuration of analytics cards shown to visitors. 
                  You can show/hide cards and reorder them to customize the analytics page layout.
                </p>
              </div>
            </div>

            {/* Danger Zone - Delete Festival */}
            <div className="theme-card bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">Destructive</span>
              </div>
              <p className="text-sm text-red-700 mb-4">
                Permanently delete this festival and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setIsDeleteFestivalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Festival
              </button>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <a
                href={`/f/${code}/admin`}
                className="theme-card bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
              >
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Admin Dashboard</h3>
                <p className="text-xs text-gray-600 mt-1">Manage collections, expenses, settings</p>
              </a>
              <a
                href={`/f/${code}/analytics`}
                className="theme-card bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
              >
                <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Analytics</h3>
                <p className="text-xs text-gray-600 mt-1">View comprehensive analytics and charts</p>
              </a>
              <a
                href={`/f/${code}/admin/sup/activity`}
                className="theme-card bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
              >
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Activity Logs</h3>
                <p className="text-xs text-gray-600 mt-1">Track all admin actions</p>
              </a>
            </div>
          </>
        )}
      </div>

      <BottomNav code={code} />
      <GlobalSessionBar festivalCode={code} currentPage="admin" />

      {/* Modals */}
      <EditFestivalModal
        isOpen={isFestivalModalOpen}
        onClose={() => setIsFestivalModalOpen(false)}
        onSuccess={fetchData}
        festival={festival}
      />

      <CreateAdminModal
        isOpen={isCreateAdminOpen}
        onClose={() => setIsCreateAdminOpen(false)}
        onSuccess={fetchData}
        festivalId={festival?.id || ""}
        festivalCode={festival?.code || ""}
      />

      <EditAdminModal
        isOpen={isEditAdminOpen}
        onClose={() => {
          setIsEditAdminOpen(false)
          setSelectedAdmin(null)
        }}
        onSuccess={fetchData}
        admin={selectedAdmin}
        festivalId={festival?.id || ""}
      />

      <DeleteAdminModal
        isOpen={isDeleteAdminOpen}
        onClose={() => {
          setIsDeleteAdminOpen(false)
          setSelectedAdmin(null)
        }}
        onSuccess={fetchData}
        admin={selectedAdmin}
        festivalId={festival?.id || ""}
      />

      <DeleteFestivalModal
        isOpen={isDeleteFestivalOpen}
        onClose={() => setIsDeleteFestivalOpen(false)}
        festival={festival}
      />

      <AnalyticsCardsManagementModal
        isOpen={isAnalyticsCardsOpen}
        onClose={() => setIsAnalyticsCardsOpen(false)}
        festivalId={festival?.id || ""}
      />
    </div>
  )
}

export default function SuperAdminDashboardPage() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""

  return (
    <SuperAdminPasswordGate code={code}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <SuperAdminDashboardContent />
      </Suspense>
    </SuperAdminPasswordGate>
  )
}

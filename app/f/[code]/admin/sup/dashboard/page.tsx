"use client"

import type React from "react"

import { useEffect, useState, Suspense, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Festival, Collection, Expense, Stats, Admin, AdminActivityLog, AccessLog } from "@/types"
import { calculateStats, formatDate, formatCurrency } from "@/lib/utils"
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
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Users, Shield, ExternalLink, LogOut, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { getThemeStyles, getThemeClasses } from "@/lib/theme"
import Toggle from "@/components/Toggle"
import { updateFestivalCode } from "@/lib/festivalCodeRedirect"
import { useSession } from "@/lib/hooks/useSession"

type TransactionWithAdmin = {
  id: string
  type: 'collection' | 'expense'
  date: string
  time_hour?: number
  time_minute?: number
  amount: number
  name: string
  collected_by?: string
  created_by_admin_id?: string
  admin_code?: string
  admin_name?: string
  created_at: string
}

function SuperAdminDashboardContent() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, logout: clearSession } = useSession(code)

  const currentTab = searchParams?.get("tab") || "home"
  const currentSubTab = searchParams?.get("sub-tab") || ""

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

  // Storage limit settings
  const [storageSettings, setStorageSettings] = useState({
    max_storage_mb: 400,
    max_video_size_mb: 50,
    max_file_size_mb: 15,
  })
  const [editingStorageSettings, setEditingStorageSettings] = useState(false)

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

  // Activity Tab States
  const [ownActivity, setOwnActivity] = useState<AdminActivityLog[]>([])
  const [ownSearchTerm, setOwnSearchTerm] = useState("")
  const [ownActionFilter, setOwnActionFilter] = useState("all")
  const [ownCurrentPage, setOwnCurrentPage] = useState(1)
  const [ownRecordsPerPage] = useState(10)

  const [transactions, setTransactions] = useState<TransactionWithAdmin[]>([])
  const [txnSearchTerm, setTxnSearchTerm] = useState("")
  const [txnTypeFilter, setTxnTypeFilter] = useState<"all" | "collection" | "expense">("all")
  const [txnCurrentPage, setTxnCurrentPage] = useState(1)
  const [txnRecordsPerPage] = useState(10)

  const [visitors, setVisitors] = useState<AccessLog[]>([])
  const [visitorSearchTerm, setVisitorSearchTerm] = useState("")
  const [visitorCurrentPage, setVisitorCurrentPage] = useState(1)
  const [visitorRecordsPerPage] = useState(10)

  const [adminActivity, setAdminActivity] = useState<AdminActivityLog[]>([])
  const [adminSearchTerm, setAdminSearchTerm] = useState("")
  const [adminActionFilter, setAdminActionFilter] = useState("all")
  const [adminFilterByAdmin, setAdminFilterByAdmin] = useState("all")
  const [adminCurrentPage, setAdminCurrentPage] = useState(1)
  const [adminRecordsPerPage] = useState(10)

  useEffect(() => {
    if (code) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, currentTab])

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

      setStorageSettings({
        max_storage_mb: fest.max_storage_mb || 400,
        max_video_size_mb: fest.max_video_size_mb || 50,
        max_file_size_mb: fest.max_file_size_mb || 15,
      })

      const calculatedStats = calculateStats(fetchedCollections, fetchedExpenses)
      setStats(calculatedStats)

      // Fetch activity data for Activity tab
      if (currentTab === "activity") {
        // Fetch super admin's own activity (activities without admin_id)
        const { data: ownActivityData, error: ownActivityErr } = await supabase
          .from("admin_activity_log")
          .select("*")
          .eq("festival_id", fest.id)
          .is("admin_id", null)
          .order("timestamp", { ascending: false })
        if (ownActivityErr) throw ownActivityErr
        setOwnActivity(ownActivityData || [])

        // Fetch all admin activity
        const { data: allAdminActivity, error: allAdminErr } = await supabase
          .from("admin_activity_log")
          .select("*")
          .eq("festival_id", fest.id)
          .not("admin_id", "is", null)
          .order("timestamp", { ascending: false })
        if (allAdminErr) throw allAdminErr
        setAdminActivity(allAdminActivity || [])

        // Combine transactions with admin info
        const adminMap = new Map(fetchedAdmins.map((a: Admin) => [a.admin_id, a]))
        
        const enrichedCollections: TransactionWithAdmin[] = fetchedCollections.map((c: Collection) => ({
          id: c.id,
          type: 'collection' as const,
          date: c.date,
          time_hour: c.time_hour,
          time_minute: c.time_minute,
          amount: c.amount,
          name: c.name,
          collected_by: c.name,
          created_by_admin_id: c.created_by_admin_id,
          admin_code: c.created_by_admin_id ? adminMap.get(c.created_by_admin_id)?.admin_code : undefined,
          admin_name: c.created_by_admin_id ? adminMap.get(c.created_by_admin_id)?.admin_name : undefined,
          created_at: c.created_at,
        }))

        const enrichedExpenses: TransactionWithAdmin[] = fetchedExpenses.map((e: Expense) => ({
          id: e.id,
          type: 'expense' as const,
          date: e.date,
          time_hour: e.time_hour,
          time_minute: e.time_minute,
          amount: e.total_amount,
          name: e.item,
          collected_by: e.item,
          created_by_admin_id: e.created_by_admin_id,
          admin_code: e.created_by_admin_id ? adminMap.get(e.created_by_admin_id)?.admin_code : undefined,
          admin_name: e.created_by_admin_id ? adminMap.get(e.created_by_admin_id)?.admin_name : undefined,
          created_at: e.created_at,
        }))

        const combined = [...enrichedCollections, ...enrichedExpenses].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setTransactions(combined)

        // Fetch all visitors
        const { data: visitorsData, error: visitorsErr } = await supabase
          .from("access_logs")
          .select("*")
          .eq("festival_id", fest.id)
          .order("accessed_at", { ascending: false })
        if (visitorsErr) throw visitorsErr
        setVisitors(visitorsData || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams()
    params.set("tab", tab)
    router.push(`/f/${code}/admin/sup/dashboard?${params.toString()}`, { scroll: false })
  }

  const handleSubTabChange = (subTab: string) => {
    const params = new URLSearchParams()
    params.set("tab", currentTab)
    params.set("sub-tab", subTab)
    router.push(`/f/${code}/admin/sup/dashboard?${params.toString()}`, { scroll: false })
  }

  const handleLogout = () => {
    clearSession()
    toast.success("Logged out successfully")
    router.push(`/f/${code}/admin/sup/login`)
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

  const handleUpdateStorageSettings = async () => {
    if (!festival) return
    try {
      const { error } = await supabase
        .from("festivals")
        .update({
          max_storage_mb: storageSettings.max_storage_mb,
          max_video_size_mb: storageSettings.max_video_size_mb,
          max_file_size_mb: storageSettings.max_file_size_mb,
          storage_settings_updated_at: new Date().toISOString(),
        })
        .eq("id", festival.id)
      if (error) throw error

      // Log activity
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: null,
        p_action_type: "update_storage_settings",
        p_action_details: storageSettings,
      })

      toast.success("Storage settings updated")
      setEditingStorageSettings(false)
      fetchData()
    } catch (error) {
      toast.error("Failed to update storage settings")
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

  const formatTime = (hour?: number, minute?: number) => {
    if (hour === undefined || minute === undefined) return ""
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  }

  const getAdminDisplay = (adminCode?: string, adminName?: string) => {
    if (!adminCode && !adminName) return "N/A"
    const preference = festival?.admin_display_preference || "code"
    return preference === "code" ? adminCode : adminName
  }

  const handleDeleteTransaction = async (txnId: string, type: "collection" | "expense") => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return

    try {
      const tableName = type === "collection" ? "collections" : "expenses"
      const { error } = await supabase.from(tableName).delete().eq("id", txnId)
      if (error) throw error
      toast.success(`${type === "collection" ? "Collection" : "Expense"} deleted successfully`)
      fetchData()
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast.error("Failed to delete transaction")
    }
  }

  // Filter own activity
  const filteredOwnActivity = useMemo(() => {
    let result = [...ownActivity]

    if (ownSearchTerm) {
      result = result.filter(log => 
        log.action_type.toLowerCase().includes(ownSearchTerm.toLowerCase()) ||
        log.target_type?.toLowerCase().includes(ownSearchTerm.toLowerCase())
      )
    }

    if (ownActionFilter !== "all") {
      result = result.filter(log => log.action_type === ownActionFilter)
    }

    return result
  }, [ownActivity, ownSearchTerm, ownActionFilter])

  const paginatedOwnActivity = useMemo(() => {
    const startIndex = (ownCurrentPage - 1) * ownRecordsPerPage
    return filteredOwnActivity.slice(startIndex, startIndex + ownRecordsPerPage)
  }, [filteredOwnActivity, ownCurrentPage, ownRecordsPerPage])

  const ownTotalPages = Math.ceil(filteredOwnActivity.length / ownRecordsPerPage)

  const ownActionTypes = useMemo(() => {
    return Array.from(new Set(ownActivity.map((a: AdminActivityLog) => a.action_type)))
  }, [ownActivity])

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions]

    if (txnSearchTerm) {
      result = result.filter(txn => 
        txn.name.toLowerCase().includes(txnSearchTerm.toLowerCase()) ||
        txn.admin_code?.toLowerCase().includes(txnSearchTerm.toLowerCase()) ||
        txn.admin_name?.toLowerCase().includes(txnSearchTerm.toLowerCase())
      )
    }

    if (txnTypeFilter !== "all") {
      result = result.filter(txn => txn.type === txnTypeFilter)
    }

    return result
  }, [transactions, txnSearchTerm, txnTypeFilter])

  const paginatedTransactions = useMemo(() => {
    const startIndex = (txnCurrentPage - 1) * txnRecordsPerPage
    return filteredTransactions.slice(startIndex, startIndex + txnRecordsPerPage)
  }, [filteredTransactions, txnCurrentPage, txnRecordsPerPage])

  const txnTotalPages = Math.ceil(filteredTransactions.length / txnRecordsPerPage)

  // Filter visitors
  const filteredVisitors = useMemo(() => {
    let result = [...visitors]

    if (visitorSearchTerm) {
      result = result.filter(log => 
        log.visitor_name.toLowerCase().includes(visitorSearchTerm.toLowerCase())
      )
    }

    return result
  }, [visitors, visitorSearchTerm])

  const paginatedVisitors = useMemo(() => {
    const startIndex = (visitorCurrentPage - 1) * visitorRecordsPerPage
    return filteredVisitors.slice(startIndex, startIndex + visitorRecordsPerPage)
  }, [filteredVisitors, visitorCurrentPage, visitorRecordsPerPage])

  const visitorTotalPages = Math.ceil(filteredVisitors.length / visitorRecordsPerPage)

  // Filter admin activity
  const filteredAdminActivity = useMemo(() => {
    let result = [...adminActivity]

    if (adminSearchTerm) {
      result = result.filter(log => 
        log.action_type.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
        log.admin_name?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
        log.target_type?.toLowerCase().includes(adminSearchTerm.toLowerCase())
      )
    }

    if (adminActionFilter !== "all") {
      result = result.filter(log => log.action_type === adminActionFilter)
    }

    if (adminFilterByAdmin !== "all") {
      result = result.filter(log => log.admin_id === adminFilterByAdmin)
    }

    return result
  }, [adminActivity, adminSearchTerm, adminActionFilter, adminFilterByAdmin])

  const paginatedAdminActivity = useMemo(() => {
    const startIndex = (adminCurrentPage - 1) * adminRecordsPerPage
    return filteredAdminActivity.slice(startIndex, startIndex + adminRecordsPerPage)
  }, [filteredAdminActivity, adminCurrentPage, adminRecordsPerPage])

  const adminTotalPages = Math.ceil(filteredAdminActivity.length / adminRecordsPerPage)

  const adminActionTypes = useMemo(() => {
    return Array.from(new Set(adminActivity.map((a: AdminActivityLog) => a.action_type)))
  }, [adminActivity])

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
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <InfoSkeleton />
          <CardSkeleton />
          <TableSkeleton rows={5} />
        </div>
      ) : !festival ? (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="theme-card bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-700">Festival not found.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Fixed Top Navbar - 2 Lines */}
          <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
              {/* Line 1: Festival Code, Login Info, Switch to Admin, Logout */}
              <div className="py-3 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Festival Code</p>
                      <p className="text-sm font-bold text-gray-900">{festival.code}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-600">
                      Logged in as <span className="font-semibold text-purple-600">Super Admin</span>
                    </span>
                    
                    <button
                      onClick={() => router.push(`/f/${code}/admin`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                    >
                      Admin Dashboard
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Line 2: Main Tabs */}
              <div className="overflow-x-auto">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => handleTabChange("home")}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      currentTab === "home"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => handleTabChange("settings")}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      currentTab === "settings"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => handleTabChange("activity")}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      currentTab === "activity"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Activity
                  </button>
                  <button
                    onClick={() => handleTabChange("navigation")}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      currentTab === "navigation"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Navigation
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* HOME TAB */}
            {currentTab === "home" && (
              <div className="space-y-6">
                {/* Sub-tabs for Home */}
                <div className="bg-white border-b border-gray-200 rounded-t-lg">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => handleSubTabChange("info")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        (currentSubTab === "info" || !currentSubTab)
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Info
                    </button>
                    <button
                      onClick={() => handleSubTabChange("banner")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "banner"
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Banner
                    </button>
                    <button
                      onClick={() => handleSubTabChange("festival-code")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "festival-code"
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Festival Code
                    </button>
                  </div>
                </div>

                {/* Info Sub-tab */}
                {(currentSubTab === "info" || !currentSubTab) && (
                  <div className="space-y-6">
                    <div className="theme-card bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Festival Information</h3>
                        <div className="group relative">
                          <HelpCircle className="w-5 h-5 text-gray-400 hover:text-purple-600 cursor-help" />
                          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            To edit the festival, switch to Admin Dashboard
                            <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>
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
                        showEditButton={false}
                      />
                    </div>

                    <StatsCards stats={stats} />
                  </div>
                )}

                {/* Banner Sub-tab */}
                {currentSubTab === "banner" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
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
                              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
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
                              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Show Admin Name</span>
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={handleUpdateBannerSettings}
                        className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Save Banner Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* Festival Code Sub-tab */}
                {currentSubTab === "festival-code" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
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
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition flex items-center gap-2"
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
                              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {currentTab === "settings" && (
              <div className="space-y-6">
                {/* Sub-tabs for Settings */}
                <div className="bg-white border-b border-gray-200 rounded-t-lg">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => handleSubTabChange("personal")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        (currentSubTab === "personal" || !currentSubTab)
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      onClick={() => handleSubTabChange("admin-management")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "admin-management"
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Admin Management
                    </button>
                    <button
                      onClick={() => handleSubTabChange("media-storage")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "media-storage"
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Media Storage
                    </button>
                    <button
                      onClick={() => handleSubTabChange("analytics")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "analytics"
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Analytics
                    </button>
                    <button
                      onClick={() => handleSubTabChange("danger")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "danger"
                          ? "border-red-600 text-red-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Danger
                    </button>
                  </div>
                </div>

                {/* Personal (Super Admin Password) Sub-tab */}
                {(currentSubTab === "personal" || !currentSubTab) && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
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
                )}

                {/* Admin Management Sub-tab */}
                {currentSubTab === "admin-management" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
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
                              // Find the oldest admin with null created_by - that's the default admin
                              const nullCreatedByAdmins = admins.filter(a => !a.created_by || a.created_by === null || a.created_by === '');
                              const oldestNullAdmin = nullCreatedByAdmins.length > 0 
                                ? nullCreatedByAdmins.reduce((oldest, current) => 
                                    new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest
                                  )
                                : null;
                              
                              const isDefaultAdmin = oldestNullAdmin?.admin_id === admin.admin_id;
                              const isSuperAdminCreated = (!admin.created_by || admin.created_by === null || admin.created_by === '') && !isDefaultAdmin;
                              
                              return (
                                <tr key={admin.admin_id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{admin.admin_code}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{admin.admin_name}</td>
                                  <td className="px-4 py-3 text-sm">
                                    {isDefaultAdmin ? (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                        Default
                                      </span>
                                    ) : isSuperAdminCreated ? (
                                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                        Super Admin
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
                )}

                {/* Media Storage Sub-tab */}
                {currentSubTab === "media-storage" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-bold text-blue-900">Storage Limit Settings</h3>
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">Media</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-4">Configure storage limits for festival media uploads</p>
                    
                    {editingStorageSettings ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Storage Limit (MB) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="100"
                            max="10000"
                            value={storageSettings.max_storage_mb}
                            onChange={(e) => setStorageSettings({...storageSettings, max_storage_mb: Number(e.target.value)})}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Range: 100MB - 10000MB (10GB). Default: 400MB</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Video File Size (MB) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="500"
                            value={storageSettings.max_video_size_mb}
                            onChange={(e) => setStorageSettings({...storageSettings, max_video_size_mb: Number(e.target.value)})}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Range: 10MB - 500MB. Default: 50MB</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max File Size (MB) - Images, Audio, PDFs <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={storageSettings.max_file_size_mb}
                            onChange={(e) => setStorageSettings({...storageSettings, max_file_size_mb: Number(e.target.value)})}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Range: 1MB - 100MB. Default: 15MB</p>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleUpdateStorageSettings}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Save Storage Settings
                          </button>
                          <button
                            onClick={() => {
                              setEditingStorageSettings(false)
                              setStorageSettings({
                                max_storage_mb: festival?.max_storage_mb || 400,
                                max_video_size_mb: festival?.max_video_size_mb || 50,
                                max_file_size_mb: festival?.max_file_size_mb || 15,
                              })
                            }}
                            className="px-4 py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-sm font-medium text-gray-700">Total Storage Limit</span>
                          <span className="text-sm font-bold text-blue-900">{festival.max_storage_mb || 400} MB</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-sm font-medium text-gray-700">Max Video File Size</span>
                          <span className="text-sm font-bold text-blue-900">{festival.max_video_size_mb || 50} MB</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-sm font-medium text-gray-700">Max Other File Size</span>
                          <span className="text-sm font-bold text-blue-900">{festival.max_file_size_mb || 15} MB</span>
                        </div>
                        <button
                          onClick={() => setEditingStorageSettings(true)}
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Storage Limits
                        </button>
                      </div>
                    )}
                    {festival.storage_settings_updated_at && (
                      <p className="text-xs text-blue-600 mt-3">
                        Last updated: {new Date(festival.storage_settings_updated_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Analytics Sub-tab */}
                {currentSubTab === "analytics" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">Analytics Cards Configuration</h3>
                        <p className="text-sm text-gray-600 mt-1">Manage which analytics cards are shown on the visitor analytics page</p>
                      </div>
                      <button
                        onClick={() => setIsAnalyticsCardsOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
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
                )}

                {/* Danger Sub-tab */}
                {currentSubTab === "danger" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6 border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
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
                )}
              </div>
            )}

            {/* ACTIVITY TAB */}
            {currentTab === "activity" && (
              <div className="space-y-6">
                {/* Sub-tabs for Activity */}
                <div className="bg-white border-b border-gray-200 rounded-t-lg">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => handleSubTabChange("own")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        (currentSubTab === "own" || !currentSubTab)
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      My Activity
                    </button>
                    <button
                      onClick={() => handleSubTabChange("transactions")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "transactions"
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      All Transactions
                    </button>
                    <button
                      onClick={() => handleSubTabChange("visitors")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "visitors"
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      All Visitors
                    </button>
                    <button
                      onClick={() => handleSubTabChange("admins")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "admins"
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Admin Activity
                    </button>
                  </div>
                </div>

                {/* Own Activity Sub-tab */}
                {(currentSubTab === "own" || !currentSubTab) && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">My Activity</h3>
                    <p className="text-sm text-gray-600 mb-4">Super admin actions and system activities</p>
                    
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search activity..."
                          value={ownSearchTerm}
                          onChange={(e) => {
                            setOwnSearchTerm(e.target.value)
                            setOwnCurrentPage(1)
                          }}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                      </div>
                      <select
                        value={ownActionFilter}
                        onChange={(e) => {
                          setOwnActionFilter(e.target.value)
                          setOwnCurrentPage(1)
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        <option value="all">All Actions</option>
                        {ownActionTypes.map((type: string) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date & Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Target</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedOwnActivity.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                No activity found
                              </td>
                            </tr>
                          ) : (
                            paginatedOwnActivity.map((log) => (
                              <tr key={log.log_id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {formatDate(log.timestamp)}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                    {log.action_type}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {log.target_type || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {log.action_details ? JSON.stringify(log.action_details).substring(0, 50) + "..." : "N/A"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {ownTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-600">
                          Showing {((ownCurrentPage - 1) * ownRecordsPerPage) + 1} to{" "}
                          {Math.min(ownCurrentPage * ownRecordsPerPage, filteredOwnActivity.length)} of{" "}
                          {filteredOwnActivity.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setOwnCurrentPage(p => Math.max(1, p - 1))}
                            disabled={ownCurrentPage === 1}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-600">
                            Page {ownCurrentPage} of {ownTotalPages}
                          </span>
                          <button
                            onClick={() => setOwnCurrentPage(p => Math.min(ownTotalPages, p + 1))}
                            disabled={ownCurrentPage === ownTotalPages}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Transactions Sub-tab */}
                {currentSubTab === "transactions" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">All Transactions</h3>
                    <p className="text-sm text-gray-600 mb-4">Complete collection and expense history with management</p>
                    
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search transactions..."
                          value={txnSearchTerm}
                          onChange={(e) => {
                            setTxnSearchTerm(e.target.value)
                            setTxnCurrentPage(1)
                          }}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                      </div>
                      <select
                        value={txnTypeFilter}
                        onChange={(e) => {
                          setTxnTypeFilter(e.target.value as any)
                          setTxnCurrentPage(1)
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        <option value="all">All Types</option>
                        <option value="collection">Collections Only</option>
                        <option value="expense">Expenses Only</option>
                      </select>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name/Item</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Transaction To</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">By Admin</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedTransactions.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                No transactions found
                              </td>
                            </tr>
                          ) : (
                            paginatedTransactions.map((txn) => (
                              <tr key={txn.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    txn.type === "collection"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}>
                                    {txn.type === "collection" ? "Collection" : "Expense"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(txn.date)}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {formatTime(txn.time_hour, txn.time_minute) || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{txn.name}</td>
                                <td className={`px-4 py-3 text-sm font-semibold ${
                                  txn.type === "collection" ? "text-green-600" : "text-red-600"
                                }`}>
                                  {formatCurrency(txn.amount)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{txn.collected_by}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {getAdminDisplay(txn.admin_code, txn.admin_name)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toast("Edit functionality coming soon")}
                                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4 text-blue-600" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTransaction(txn.id, txn.type)}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {txnTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-600">
                          Showing {((txnCurrentPage - 1) * txnRecordsPerPage) + 1} to{" "}
                          {Math.min(txnCurrentPage * txnRecordsPerPage, filteredTransactions.length)} of{" "}
                          {filteredTransactions.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setTxnCurrentPage(p => Math.max(1, p - 1))}
                            disabled={txnCurrentPage === 1}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-600">
                            Page {txnCurrentPage} of {txnTotalPages}
                          </span>
                          <button
                            onClick={() => setTxnCurrentPage(p => Math.min(txnTotalPages, p + 1))}
                            disabled={txnCurrentPage === txnTotalPages}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Visitors Sub-tab */}
                {currentSubTab === "visitors" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">All Visitors</h3>
                    <p className="text-sm text-gray-600 mb-4">Complete visitor access log and authentication history</p>
                    
                    {/* Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search visitors..."
                        value={visitorSearchTerm}
                        onChange={(e) => {
                          setVisitorSearchTerm(e.target.value)
                          setVisitorCurrentPage(1)
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Visitor Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Login Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Login Using</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Access Method</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedVisitors.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                No visitors found
                              </td>
                            </tr>
                          ) : (
                            paginatedVisitors.map((log) => (
                              <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{log.visitor_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {formatDate(log.accessed_at)}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {new Date(log.accessed_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {log.admin_id ? (
                                    <div>
                                      <div className="font-medium">
                                        {getAdminDisplay(
                                          admins.find((a: Admin) => a.admin_id === log.admin_id)?.admin_code,
                                          admins.find((a: Admin) => a.admin_id === log.admin_id)?.admin_name
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">{log.password_used}</div>
                                    </div>
                                  ) : "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    log.access_method === "password_modal" 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-green-100 text-green-800"
                                  }`}>
                                    {log.access_method === "password_modal" ? "Login Page" : "Direct Link"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {visitorTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-600">
                          Showing {((visitorCurrentPage - 1) * visitorRecordsPerPage) + 1} to{" "}
                          {Math.min(visitorCurrentPage * visitorRecordsPerPage, filteredVisitors.length)} of{" "}
                          {filteredVisitors.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setVisitorCurrentPage(p => Math.max(1, p - 1))}
                            disabled={visitorCurrentPage === 1}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-600">
                            Page {visitorCurrentPage} of {visitorTotalPages}
                          </span>
                          <button
                            onClick={() => setVisitorCurrentPage(p => Math.min(visitorTotalPages, p + 1))}
                            disabled={visitorCurrentPage === visitorTotalPages}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Activity Sub-tab */}
                {currentSubTab === "admins" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Admin Activity</h3>
                    <p className="text-sm text-gray-600 mb-4">Track all admin actions and operations</p>
                    
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search admin activity..."
                          value={adminSearchTerm}
                          onChange={(e) => {
                            setAdminSearchTerm(e.target.value)
                            setAdminCurrentPage(1)
                          }}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                      </div>
                      <select
                        value={adminActionFilter}
                        onChange={(e) => {
                          setAdminActionFilter(e.target.value)
                          setAdminCurrentPage(1)
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        <option value="all">All Actions</option>
                        {adminActionTypes.map((type: string) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <select
                        value={adminFilterByAdmin}
                        onChange={(e) => {
                          setAdminFilterByAdmin(e.target.value)
                          setAdminCurrentPage(1)
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        <option value="all">All Admins</option>
                        {admins.map((admin: Admin) => (
                          <option key={admin.admin_id} value={admin.admin_id}>
                            {getAdminDisplay(admin.admin_code, admin.admin_name)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Admin</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date & Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Target</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedAdminActivity.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                No admin activity found
                              </td>
                            </tr>
                          ) : (
                            paginatedAdminActivity.map((log) => (
                              <tr key={log.log_id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                  {log.admin_name || "Unknown"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {formatDate(log.timestamp)}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                    {log.action_type}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {log.target_type || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {log.action_details ? JSON.stringify(log.action_details).substring(0, 50) + "..." : "N/A"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {adminTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-600">
                          Showing {((adminCurrentPage - 1) * adminRecordsPerPage) + 1} to{" "}
                          {Math.min(adminCurrentPage * adminRecordsPerPage, filteredAdminActivity.length)} of{" "}
                          {filteredAdminActivity.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAdminCurrentPage(p => Math.max(1, p - 1))}
                            disabled={adminCurrentPage === 1}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-600">
                            Page {adminCurrentPage} of {adminTotalPages}
                          </span>
                          <button
                            onClick={() => setAdminCurrentPage(p => Math.min(adminTotalPages, p + 1))}
                            disabled={adminCurrentPage === adminTotalPages}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* NAVIGATION TAB */}
            {currentTab === "navigation" && (
              <div className="space-y-6">
                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Navigation</h3>
                  <p className="text-sm text-gray-600 mb-4">Coming soon - Quick access to important pages</p>
                  <div className="text-center py-12 text-gray-500">
                    <ExternalLink className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Navigation shortcuts will be implemented here</p>
                  </div>
                </div>
              </div>
            )}


          </div>
        </>
      )}

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        }
      >
        <SuperAdminDashboardContent />
      </Suspense>
    </SuperAdminPasswordGate>
  )
}

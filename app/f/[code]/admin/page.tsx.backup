"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Festival, Collection, Expense, Stats, Album, MediaItem } from "@/types"
import { calculateStats, calculateStorageStats, formatFileSize } from "@/lib/utils"
import AdminPasswordGate from "@/components/AdminPasswordGate"
import BasicInfo from "@/components/BasicInfo"
import StatsCards from "@/components/StatsCards"
import BottomNav from "@/components/BottomNav"
import GlobalSessionBar from "@/components/GlobalSessionBar"
import CollectionTable from "@/components/tables/CollectionTable"
import ExpenseTable from "@/components/tables/ExpenseTable"
import AddCollectionModal from "@/components/modals/AddCollectionModal"
import AddExpenseModal from "@/components/modals/AddExpenseModal"
import EditFestivalModal from "@/components/modals/EditFestivalModal"
import AddEditAlbumModal from "@/components/modals/AddEditAlbumModal"
import ManageAlbumMediaModal from "@/components/modals/ManageAlbumMediaModal"
import StorageStatsModal from "@/components/modals/StorageStatsModal"
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal"
import ManageUserPasswordsModal from "@/components/modals/ManageUserPasswordsModal"
import AnalyticsConfigModal from "@/components/modals/AnalyticsConfigModal"
import { InfoSkeleton, CardSkeleton, TableSkeleton } from "@/components/Loader"
import toast from "react-hot-toast"
import { Plus, Edit, Trash2, Eye, EyeOff, HardDrive, Key } from "lucide-react"

import { getThemeStyles, getThemeClasses } from "@/lib/theme"
import { useSession } from "@/lib/hooks/useSession"

function AdminPageContent() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""
  const { session } = useSession(code)

  const [festival, setFestival] = useState<Festival | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<Stats>({ totalCollection: 0, totalExpense: 0, numDonators: 0, balance: 0 })
  const [groups, setGroups] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [collectionModes, setCollectionModes] = useState<string[]>([])
  const [expenseModes, setExpenseModes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [isFestivalModalOpen, setIsFestivalModalOpen] = useState(false)
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [albums, setAlbums] = useState<Album[]>([])
  const [allMediaItems, setAllMediaItems] = useState<MediaItem[]>([])
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false)
  const [isStorageStatsOpen, setIsStorageStatsOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [isManageMediaOpen, setIsManageMediaOpen] = useState(false)
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null)
  const [isImportCollectionsOpen, setIsImportCollectionsOpen] = useState(false)
  const [isImportExpensesOpen, setIsImportExpensesOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "collection" | "expense"; id: string } | null>(null)
  const [isManagePasswordsOpen, setIsManagePasswordsOpen] = useState(false)
  const [adminId, setAdminId] = useState<string>("")
  const [maxUserPasswords, setMaxUserPasswords] = useState(3)
  const [currentPasswordCount, setCurrentPasswordCount] = useState(0)

  const [newGroup, setNewGroup] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newCollectionMode, setNewCollectionMode] = useState("")
  const [newExpenseMode, setNewExpenseMode] = useState("")

  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [editingAdminPassword, setEditingAdminPassword] = useState(false)
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [isAnalyticsConfigOpen, setIsAnalyticsConfigOpen] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState<{ admin_id: string; admin_code: string; admin_name: string; admin_password_hash: string } | null>(null)

  useEffect(() => {
    if (code) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  // Update adminId when session changes (separate effect to handle race condition)
  useEffect(() => {
    if (session?.type === "admin" && session.adminId) {
      setAdminId(session.adminId)
      
      // Fetch admin data for password management
      const fetchAdminData = async () => {
        try {
          const { data: adminData } = await supabase
            .from("admins")
            .select("*")
            .eq("admin_id", session.adminId)
            .single()

          if (adminData) {
            setMaxUserPasswords(adminData.max_user_passwords || 3)
            // Store current admin data for password section
            setCurrentAdmin({
              admin_id: adminData.admin_id,
              admin_code: adminData.admin_code,
              admin_name: adminData.admin_name,
              admin_password_hash: adminData.admin_password_hash || ''
            })

            // Get current password count
            const { count } = await supabase
              .from("user_passwords")
              .select("*", { count: "exact", head: true })
              .eq("admin_id", session.adminId)
            setCurrentPasswordCount(count || 0)
          }
        } catch (error) {
          console.error("Error fetching admin data:", error)
        }
      }
      
      fetchAdminData()
    } else if (session?.type === "super_admin") {
      // Super admin doesn't have admin_id
      setAdminId("")
      setMaxUserPasswords(3)
      setCurrentPasswordCount(0)
      setCurrentAdmin(null)
    } else if (!session || session.type !== "admin") {
      // Session not ready or not admin - clear adminId
      setAdminId("")
      setCurrentAdmin(null)
    }
  }, [session])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: fest, error: festErr } = await supabase.from("festivals").select("*").eq("code", code).single()
      if (festErr) throw festErr

      const [collectionsRes, expensesRes, groupsRes, categoriesRes, collectionModesRes, expenseModesRes, albumsRes] =
        await Promise.all([
          supabase.from("collections").select("*").eq("festival_id", fest.id).order("date", { ascending: false }),
          supabase.from("expenses").select("*").eq("festival_id", fest.id).order("date", { ascending: false }),
          supabase.from("groups").select("*").eq("festival_id", fest.id).order("name"),
          supabase.from("categories").select("*").eq("festival_id", fest.id).order("name"),
          supabase.from("collection_modes").select("*").eq("festival_id", fest.id).order("name"),
          supabase.from("expense_modes").select("*").eq("festival_id", fest.id).order("name"),
          supabase.from("albums").select("*").eq("festival_id", fest.id).order("year", { ascending: false }),
        ])

      const fetchedCollections = collectionsRes.data || []
      const fetchedExpenses = expensesRes.data || []
      const fetchedGroups = groupsRes.data?.map((g) => g.name) || []
      const fetchedCategories = categoriesRes.data?.map((c) => c.name) || []
      const fetchedCollectionModes = collectionModesRes.data?.map((m) => m.name) || []
      const fetchedExpenseModes = expenseModesRes.data?.map((m) => m.name) || []

      setFestival(fest)
      setCollections(fetchedCollections)
      setExpenses(fetchedExpenses)
      setGroups(fetchedGroups)
      setCategories(fetchedCategories)
      setCollectionModes(fetchedCollectionModes)
      setExpenseModes(fetchedExpenseModes)
      setAlbums(albumsRes.data || [])

      const albumIds = (albumsRes.data || []).map((a: Album) => a.id)
      if (albumIds.length > 0) {
        const { data: mediaData } = await supabase.from("media_items").select("*").in("album_id", albumIds)
        setAllMediaItems((mediaData as MediaItem[]) || [])
      } else {
        setAllMediaItems([])
      }

      // Admin ID is now handled in separate useEffect that watches session
      // This prevents race condition issues

      const calculatedStats = calculateStats(fetchedCollections, fetchedExpenses)
      setStats(calculatedStats)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection)
    setIsCollectionModalOpen(true)
  }

  const handleDeleteCollection = (collection: Collection) => {
    setDeleteTarget({ type: "collection", id: collection.id })
    setIsDeleteModalOpen(true)
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setIsExpenseModalOpen(true)
  }

  const handleDeleteExpense = (expense: Expense) => {
    setDeleteTarget({ type: "expense", id: expense.id })
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    try {
      const tableName = deleteTarget.type === "collection" ? "collections" : "expenses"
      const { error } = await supabase.from(tableName).delete().eq("id", deleteTarget.id)

      if (error) throw error

      // Log activity - use session.adminId directly for admin, null for super_admin
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival?.id || "",
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: deleteTarget.type === "collection" ? "delete_collection" : "delete_expense",
        p_action_details: {
          id: deleteTarget.id,
          type: deleteTarget.type,
        },
      })

      toast.success(`${deleteTarget.type === "collection" ? "Collection" : "Expense"} deleted successfully`)
      fetchData()
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Failed to delete")
    } finally {
      setIsDeleteModalOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleAddGroup = async () => {
    if (!newGroup.trim() || !festival) return
    try {
      const { error } = await supabase.from("groups").insert({ name: newGroup.trim(), festival_id: festival.id })
      if (error) throw error

      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "add_group",
        p_action_details: { name: newGroup.trim() },
      })

      toast.success("Group added")
      setNewGroup("")
      fetchData()
    } catch (error: any) {
      if (error.code === "23505") toast.error("Group already exists")
      else toast.error("Failed to add group")
    }
  }

  const handleDeleteGroup = async (groupName: string) => {
    if (!festival) return
    try {
      const { error } = await supabase.from("groups").delete().eq("name", groupName).eq("festival_id", festival.id)
      if (error) throw error

      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "delete_group",
        p_action_details: { name: groupName },
      })

      toast.success("Group deleted")
      fetchData()
    } catch (error) {
      toast.error("Failed to delete group")
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !festival) return
    try {
      const { error } = await supabase.from("categories").insert({ name: newCategory.trim(), festival_id: festival.id })
      if (error) throw error

      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "add_category",
        p_action_details: { name: newCategory.trim() },
      })

      toast.success("Category added")
      setNewCategory("")
      fetchData()
    } catch (error: any) {
      if (error.code === "23505") toast.error("Category already exists")
      else toast.error("Failed to add category")
    }
  }

  const handleDeleteCategory = async (categoryName: string) => {
    if (!festival) return
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("name", categoryName)
        .eq("festival_id", festival.id)
      if (error) throw error

      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "delete_category",
        p_action_details: { name: categoryName },
      })

      toast.success("Category deleted")
      fetchData()
    } catch (error) {
      toast.error("Failed to delete category")
    }
  }

  const handleAddCollectionMode = async () => {
    if (!newCollectionMode.trim() || !festival) return
    try {
      const { error } = await supabase
        .from("collection_modes")
        .insert({ name: newCollectionMode.trim(), festival_id: festival.id })
      if (error) throw error

      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "add_collection_mode",
        p_action_details: { name: newCollectionMode.trim() },
      })

      toast.success("Collection mode added")
      setNewCollectionMode("")
      fetchData()
    } catch (error: any) {
      if (error.code === "23505") toast.error("Mode already exists")
      else toast.error("Failed to add mode")
    }
  }

  const handleDeleteCollectionMode = async (modeName: string) => {
    if (!festival) return
    try {
      const { error } = await supabase
        .from("collection_modes")
        .delete()
        .eq("name", modeName)
        .eq("festival_id", festival.id)
      if (error) throw error

      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "delete_collection_mode",
        p_action_details: { name: modeName },
      })

      toast.success("Mode deleted")
      fetchData()
    } catch (error) {
      toast.error("Failed to delete mode")
    }
  }

  const handleAddExpenseMode = async () => {
    if (!newExpenseMode.trim() || !festival) return
    try {
      const { error } = await supabase
        .from("expense_modes")
        .insert({ name: newExpenseMode.trim(), festival_id: festival.id })
      if (error) throw error

      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "add_expense_mode",
        p_action_details: { name: newExpenseMode.trim() },
      })

      toast.success("Expense mode added")
      setNewExpenseMode("")
      fetchData()
    } catch (error: any) {
      if (error.code === "23505") toast.error("Mode already exists")
      else toast.error("Failed to add mode")
    }
  }

  const handleDeleteExpenseMode = async (modeName: string) => {
    if (!festival) return
    try {
      const { error } = await supabase
        .from("expense_modes")
        .delete()
        .eq("name", modeName)
        .eq("festival_id", festival.id)
      if (error) throw error

      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "delete_expense_mode",
        p_action_details: { name: modeName },
      })

      toast.success("Mode deleted")
      fetchData()
    } catch (error) {
      toast.error("Failed to delete mode")
    }
  }

  const handleUpdateAdminPassword = async () => {
    if (!newAdminPassword.trim() || !currentAdmin || !festival || session?.type !== "admin") {
      toast.error("Cannot update password: Admin information not available")
      return
    }
    
    try {
      // Update admin's own password in admins table
      const { error } = await supabase
        .from("admins")
        .update({
          admin_password_hash: newAdminPassword.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("admin_id", currentAdmin.admin_id)

      if (error) throw error

      // Log activity
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session.adminId,
        p_action_type: "update_admin_password",
        p_action_details: {
          admin_code: currentAdmin.admin_code,
          admin_name: currentAdmin.admin_name
        },
      })

      toast.success("Admin password updated successfully")
      setNewAdminPassword("")
      setEditingAdminPassword(false)
      
      // Refresh admin data
      const { data: adminData } = await supabase
        .from("admins")
        .select("*")
        .eq("admin_id", session.adminId)
        .single()
      
      if (adminData) {
        setCurrentAdmin({
          admin_id: adminData.admin_id,
          admin_code: adminData.admin_code,
          admin_name: adminData.admin_name,
          admin_password_hash: adminData.admin_password_hash || ''
        })
      }
    } catch (error: any) {
      console.error("Error updating admin password:", error)
      toast.error(`Failed to update password: ${error?.message || 'Unknown error'}`)
    }
  }

  const bgStyle: React.CSSProperties = festival?.theme_bg_image_url
    ? { backgroundImage: `url(${festival.theme_bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: festival?.theme_bg_color || "#f8fafc" }

  const themeStyles = getThemeStyles(festival)
  const themeClasses = getThemeClasses(festival)

  const normalize = (s: string) => s?.trim().toLowerCase()

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCollections = async () => {
    downloadJSON(collections, `${festival?.code || "fest"}-collections.json`)
    // Log export activity
    try {
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival?.id || "",
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "export_collections",
        p_action_details: { count: collections.length, format: "json" },
        p_target_type: null,
        p_target_id: null,
      })
    } catch (logError) {
      console.error("Error logging export activity:", logError)
    }
  }
  const handleExportCollectionsImportFmt = async () => {
    const data = collections.map((c) => ({
      name: c.name,
      amount: Number(c.amount),
      group_name: c.group_name,
      mode: c.mode,
      note: c.note || "",
      date: c.date,
      time_hour: c.time_hour || 0,
      time_minute: c.time_minute || 0,
      created_by_admin_id: c.created_by_admin_id || null,
    }))
    downloadJSON(data, `${festival?.code || "fest"}-collections-import.json`)
    // Log export activity
    try {
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival?.id || "",
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "export_collections_import_format",
        p_action_details: { count: collections.length, format: "json_import" },
        p_target_type: null,
        p_target_id: null,
      })
    } catch (logError) {
      console.error("Error logging export activity:", logError)
    }
  }
  const handleExportExpenses = async () => {
    downloadJSON(expenses, `${festival?.code || "fest"}-expenses.json`)
    // Log export activity
    try {
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival?.id || "",
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "export_expenses",
        p_action_details: { count: expenses.length, format: "json" },
        p_target_type: null,
        p_target_id: null,
      })
    } catch (logError) {
      console.error("Error logging export activity:", logError)
    }
  }
  const handleExportExpensesImportFmt = async () => {
    const data = expenses.map((e) => ({
      item: e.item,
      pieces: Number(e.pieces),
      price_per_piece: Number(e.price_per_piece),
      total_amount: Number(e.total_amount),
      category: e.category,
      mode: e.mode,
      note: e.note || "",
      date: e.date,
      time_hour: e.time_hour || 0,
      time_minute: e.time_minute || 0,
      created_by_admin_id: e.created_by_admin_id || null,
    }))
    downloadJSON(data, `${festival?.code || "fest"}-expenses-import.json`)
    // Log export activity
    try {
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival?.id || "",
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "export_expenses_import_format",
        p_action_details: { count: expenses.length, format: "json_import" },
        p_target_type: null,
        p_target_id: null,
      })
    } catch (logError) {
      console.error("Error logging export activity:", logError)
    }
  }

  const exampleCollections = [
    {
      name: "John Doe",
      amount: 500,
      group_name: "Group A",
      mode: "Cash",
      note: "Blessings",
      date: "2025-10-21",
      time_hour: 14,
      time_minute: 30,
      created_by_admin_id: null,
    },
    {
      name: "Jane",
      amount: 1000,
      group_name: "Group B",
      mode: "UPI",
      note: "",
      date: "2025-10-22",
      time_hour: 15,
      time_minute: 0,
      created_by_admin_id: null,
    },
  ]
  const exampleExpenses = [
    {
      item: "Flowers",
      pieces: 5,
      price_per_piece: 50,
      total_amount: 250,
      category: "Decoration",
      mode: "Cash",
      note: "",
      date: "2025-10-21",
      time_hour: 10,
      time_minute: 0,
      created_by_admin_id: null,
    },
    {
      item: "Lights",
      pieces: 2,
      price_per_piece: 300,
      total_amount: 600,
      category: "Decoration",
      mode: "UPI",
      note: "extra cable",
      date: "2025-10-22",
      time_hour: 11,
      time_minute: 30,
      created_by_admin_id: null,
    },
  ]

  const handleImportCollections = async () => {
    if (!festival) return

    // Validate CE dates are set
    if (!festival.ce_start_date || !festival.ce_end_date) {
      toast.error("Collection/Expense date range not set. Please set it in festival settings first.")
      return
    }

    try {
      let parsed
      try {
        parsed = JSON.parse(importText)
      } catch (parseError) {
        throw new Error(
          "Invalid JSON format. Please check your JSON syntax. Make sure all brackets, braces, and quotes are properly closed.",
        )
      }

      if (!Array.isArray(parsed)) {
        throw new Error(
          'JSON must be an array. Expected format: [{...}, {...}]. Make sure your JSON starts with "[" and ends with "]".',
        )
      }

      if (parsed.length === 0) {
        throw new Error("JSON array is empty. Please provide at least one collection record.")
      }

      const groupMap = new Map(groups.map((g) => [normalize(g), g]))
      const modeMap = new Map(collectionModes.map((m) => [normalize(m), m]))

      // Get all admins for validation
      const { data: allAdmins } = await supabase
        .from("admins")
        .select("admin_id, admin_code, admin_name")
        .eq("festival_id", festival.id)
        .eq("is_active", true)
      const adminMap = new Map((allAdmins || []).map((a) => [a.admin_id, a]))
      const adminIdList = (allAdmins || []).map((a) => a.admin_id)

      // Determine current admin ID based on session
      let currentAdminIdForImport: string | null = null
      if (session?.type === "admin") {
        currentAdminIdForImport = session.adminId
      } else if (session?.type === "super_admin") {
        // Super admin can leave it null or specify
        currentAdminIdForImport = null
      }

      const rows = parsed.map((c: any, idx: number) => {
        const rowNum = idx + 1

        // Required fields validation
        const name = String(c.name || "").trim()
        if (!name) {
          throw new Error(`Row ${rowNum}: Missing required field "name". Each collection must have a name.`)
        }
        if (name.length > 255) {
          throw new Error(
            `Row ${rowNum}: Field "name" is too long (max 255 characters). Current length: ${name.length}.`,
          )
        }

        const amount = Number(c.amount)
        if (isNaN(amount) || amount <= 0) {
          throw new Error(`Row ${rowNum}: Invalid "amount" value "${c.amount}". Must be a positive number.`)
        }

        const groupKey = normalize(String(c.group_name || ""))
        if (!groupKey) {
          throw new Error(
            `Row ${rowNum}: Missing required field "group_name". Available groups: ${groups.join(", ") || "None (create groups first)"}.`,
          )
        }
        const group_name = groupMap.get(groupKey)
        if (!group_name) {
          throw new Error(
            `Row ${rowNum}: Unknown group "${c.group_name}". Available groups: ${groups.join(", ") || "None"}. Case-insensitive matching is used.`,
          )
        }

        const modeKey = normalize(String(c.mode || ""))
        if (!modeKey) {
          throw new Error(
            `Row ${rowNum}: Missing required field "mode". Available modes: ${collectionModes.join(", ") || "None (create modes first)"}.`,
          )
        }
        const mode = modeMap.get(modeKey)
        if (!mode) {
          throw new Error(
            `Row ${rowNum}: Unknown mode "${c.mode}". Available modes: ${collectionModes.join(", ") || "None"}. Case-insensitive matching is used.`,
          )
        }

        const date = String(c.date || "").trim()
        if (!date) {
          throw new Error(`Row ${rowNum}: Missing required field "date". Format: YYYY-MM-DD (e.g., "2025-10-21").`)
        }
        if (isNaN(Date.parse(date))) {
          throw new Error(
            `Row ${rowNum}: Invalid date format "${date}". Expected format: YYYY-MM-DD (e.g., "2025-10-21").`,
          )
        }

        // Validate date is within CE range
        const dateObj = new Date(date)
        const ceStart = new Date(festival.ce_start_date!)
        const ceEnd = new Date(festival.ce_end_date!)
        if (dateObj < ceStart || dateObj > ceEnd) {
          throw new Error(
            `Row ${rowNum}: Date "${date}" is outside the valid range (${festival.ce_start_date} to ${festival.ce_end_date}). Please adjust the date or update the festival date range.`,
          )
        }

        // Time fields (optional, default to 0)
        let time_hour = 0
        let time_minute = 0
        if (c.time_hour != null) {
          time_hour = Number(c.time_hour)
          if (isNaN(time_hour) || time_hour < 0 || time_hour > 23) {
            throw new Error(`Row ${rowNum}: Invalid "time_hour" value "${c.time_hour}". Must be between 0 and 23.`)
          }
        }
        if (c.time_minute != null) {
          time_minute = Number(c.time_minute)
          if (isNaN(time_minute) || time_minute < 0 || time_minute > 59) {
            throw new Error(`Row ${rowNum}: Invalid "time_minute" value "${c.time_minute}". Must be between 0 and 59.`)
          }
        }

        // Admin ID validation
        let created_by_admin_id: string | null = null
        if (c.created_by_admin_id != null && c.created_by_admin_id !== "") {
          // If provided, validate it exists
          if (adminIdList.includes(c.created_by_admin_id)) {
            created_by_admin_id = c.created_by_admin_id
          } else {
            throw new Error(
              `Row ${rowNum}: Invalid "created_by_admin_id" "${c.created_by_admin_id}". Admin ID not found in this festival. Available admin IDs: ${adminIdList.join(", ") || "None"}. For super admin, you can leave this field as null.`,
            )
          }
        } else {
          // Not provided - use current admin ID for regular admin, null for super admin
          if (session?.type === "admin") {
            created_by_admin_id = session.adminId
          } else {
            // Super admin can leave it null
            created_by_admin_id = null
          }
        }

        const note = c.note != null ? String(c.note).trim() : null
        if (note && note.length > 1000) {
          throw new Error(
            `Row ${rowNum}: Field "note" is too long (max 1000 characters). Current length: ${note.length}.`,
          )
        }

        return {
          festival_id: festival.id,
          name,
          amount,
          group_name,
          mode,
          note: note || null,
          date,
          time_hour,
          time_minute,
          created_by_admin_id,
        }
      })

      const { error } = await supabase.from("collections").insert(rows)
      if (error) {
        // Provide specific database error messages
        if (error.code === "23505") {
          throw new Error(
            `Database error: Duplicate entry detected. This might be due to a unique constraint violation. Check if any collections already exist with the same data.`,
          )
        } else if (error.code === "23503") {
          throw new Error(
            `Database error: Foreign key constraint violation. One or more referenced records (festival, group, mode, or admin) do not exist.`,
          )
        } else if (error.message) {
          throw new Error(`Database error: ${error.message}`)
        } else {
          throw new Error(`Failed to insert collections into database. Error code: ${error.code || "UNKNOWN"}`)
        }
      }

      // Log import activity
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "import_collections",
        p_action_details: {
          count: rows.length,
          imported_by: session?.type === "admin" ? "admin" : "super_admin",
        },
      })

      toast.success(`Successfully imported ${rows.length} collection(s)`)
      setIsImportCollectionsOpen(false)
      setImportText("")
      fetchData()
    } catch (e: any) {
      console.error("Import error:", e)
      toast.error(
        e.message ||
          "Failed to import collections. Please check the error message and fix the issues in your JSON data.",
      )
    }
  }

  const handleImportExpenses = async () => {
    if (!festival) return

    // Validate CE dates are set
    if (!festival.ce_start_date || !festival.ce_end_date) {
      toast.error("Collection/Expense date range not set. Please set it in festival settings first.")
      return
    }

    try {
      let parsed
      try {
        parsed = JSON.parse(importText)
      } catch (parseError) {
        throw new Error(
          "Invalid JSON format. Please check your JSON syntax. Make sure all brackets, braces, and quotes are properly closed.",
        )
      }

      if (!Array.isArray(parsed)) {
        throw new Error(
          'JSON must be an array. Expected format: [{...}, {...}]. Make sure your JSON starts with "[" and ends with "]".',
        )
      }

      if (parsed.length === 0) {
        throw new Error("JSON array is empty. Please provide at least one expense record.")
      }

      const categoryMap = new Map(categories.map((c) => [normalize(c), c]))
      const modeMap = new Map(expenseModes.map((m) => [normalize(m), m]))

      // Get all admins for validation
      const { data: allAdmins } = await supabase
        .from("admins")
        .select("admin_id, admin_code, admin_name")
        .eq("festival_id", festival.id)
        .eq("is_active", true)
      const adminMap = new Map((allAdmins || []).map((a) => [a.admin_id, a]))
      const adminIdList = (allAdmins || []).map((a) => a.admin_id)

      // Determine current admin ID based on session
      let currentAdminIdForImport: string | null = null
      if (session?.type === "admin") {
        currentAdminIdForImport = session.adminId
      } else if (session?.type === "super_admin") {
        // Super admin can leave it null or specify
        currentAdminIdForImport = null
      }

      const rows = parsed.map((x: any, idx: number) => {
        const rowNum = idx + 1

        // Required fields validation
        const item = String(x.item || "").trim()
        if (!item) {
          throw new Error(`Row ${rowNum}: Missing required field "item". Each expense must have an item name.`)
        }
        if (item.length > 255) {
          throw new Error(
            `Row ${rowNum}: Field "item" is too long (max 255 characters). Current length: ${item.length}.`,
          )
        }

        const pieces = Number(x.pieces)
        if (isNaN(pieces) || pieces <= 0 || !Number.isInteger(pieces)) {
          throw new Error(`Row ${rowNum}: Invalid "pieces" value "${x.pieces}". Must be a positive integer.`)
        }

        const price_per_piece = Number(x.price_per_piece)
        if (isNaN(price_per_piece) || price_per_piece < 0) {
          throw new Error(
            `Row ${rowNum}: Invalid "price_per_piece" value "${x.price_per_piece}". Must be a non-negative number.`,
          )
        }

        const total_amount = Number(x.total_amount)
        if (isNaN(total_amount) || total_amount <= 0) {
          throw new Error(`Row ${rowNum}: Invalid "total_amount" value "${x.total_amount}". Must be a positive number.`)
        }

        // Note: total_amount can be manually edited (for discounts, rounding, etc.)
        // So we don't enforce strict validation against pieces * price_per_piece

        const categoryKey = normalize(String(x.category || ""))
        if (!categoryKey) {
          throw new Error(
            `Row ${rowNum}: Missing required field "category". Available categories: ${categories.join(", ") || "None (create categories first)"}.`,
          )
        }
        const category = categoryMap.get(categoryKey)
        if (!category) {
          throw new Error(
            `Row ${rowNum}: Unknown category "${x.category}". Available categories: ${categories.join(", ") || "None"}. Case-insensitive matching is used.`,
          )
        }

        const modeKey = normalize(String(x.mode || ""))
        if (!modeKey) {
          throw new Error(
            `Row ${rowNum}: Missing required field "mode". Available modes: ${expenseModes.join(", ") || "None (create modes first)"}.`,
          )
        }
        const mode = modeMap.get(modeKey)
        if (!mode) {
          throw new Error(
            `Row ${rowNum}: Unknown mode "${x.mode}". Available modes: ${expenseModes.join(", ") || "None"}. Case-insensitive matching is used.`,
          )
        }

        const date = String(x.date || "").trim()
        if (!date) {
          throw new Error(`Row ${rowNum}: Missing required field "date". Format: YYYY-MM-DD (e.g., "2025-10-21").`)
        }
        if (isNaN(Date.parse(date))) {
          throw new Error(
            `Row ${rowNum}: Invalid date format "${date}". Expected format: YYYY-MM-DD (e.g., "2025-10-21").`,
          )
        }

        // Validate date is within CE range
        const dateObj = new Date(date)
        const ceStart = new Date(festival.ce_start_date!)
        const ceEnd = new Date(festival.ce_end_date!)
        if (dateObj < ceStart || dateObj > ceEnd) {
          throw new Error(
            `Row ${rowNum}: Date "${date}" is outside the valid range (${festival.ce_start_date} to ${festival.ce_end_date}). Please adjust the date or update the festival date range.`,
          )
        }

        // Time fields (optional, default to 0)
        let time_hour = 0
        let time_minute = 0
        if (x.time_hour != null) {
          time_hour = Number(x.time_hour)
          if (isNaN(time_hour) || time_hour < 0 || time_hour > 23) {
            throw new Error(`Row ${rowNum}: Invalid "time_hour" value "${x.time_hour}". Must be between 0 and 23.`)
          }
        }
        if (x.time_minute != null) {
          time_minute = Number(x.time_minute)
          if (isNaN(time_minute) || time_minute < 0 || time_minute > 59) {
            throw new Error(`Row ${rowNum}: Invalid "time_minute" value "${x.time_minute}". Must be between 0 and 59.`)
          }
        }

        // Admin ID validation
        let created_by_admin_id: string | null = null
        if (x.created_by_admin_id != null && x.created_by_admin_id !== "") {
          // If provided, validate it exists
          if (adminIdList.includes(x.created_by_admin_id)) {
            created_by_admin_id = x.created_by_admin_id
          } else {
            throw new Error(
              `Row ${rowNum}: Invalid "created_by_admin_id" "${x.created_by_admin_id}". Admin ID not found in this festival. Available admin IDs: ${adminIdList.join(", ") || "None"}. For super admin, you can leave this field as null.`,
            )
          }
        } else {
          // Not provided - use current admin ID for regular admin, null for super admin
          if (session?.type === "admin") {
            created_by_admin_id = session.adminId
          } else {
            // Super admin can leave it null
            created_by_admin_id = null
          }
        }

        const note = x.note != null ? String(x.note).trim() : null
        if (note && note.length > 1000) {
          throw new Error(
            `Row ${rowNum}: Field "note" is too long (max 1000 characters). Current length: ${note.length}.`,
          )
        }

        return {
          festival_id: festival.id,
          item,
          pieces,
          price_per_piece,
          total_amount,
          category,
          mode,
          note: note || null,
          date,
          time_hour,
          time_minute,
          created_by_admin_id,
        }
      })

      const { error } = await supabase.from("expenses").insert(rows)
      if (error) {
        // Provide specific database error messages
        if (error.code === "23505") {
          throw new Error(
            `Database error: Duplicate entry detected. This might be due to a unique constraint violation. Check if any expenses already exist with the same data.`,
          )
        } else if (error.code === "23503") {
          throw new Error(
            `Database error: Foreign key constraint violation. One or more referenced records (festival, category, mode, or admin) do not exist.`,
          )
        } else if (error.message) {
          throw new Error(`Database error: ${error.message}`)
        } else {
          throw new Error(`Failed to insert expenses into database. Error code: ${error.code || "UNKNOWN"}`)
        }
      }

      // Log import activity
      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session?.type === "admin" ? session.adminId : null,
        p_action_type: "import_expenses",
        p_action_details: {
          count: rows.length,
          imported_by: session?.type === "admin" ? "admin" : "super_admin",
        },
      })

      toast.success(`Successfully imported ${rows.length} expense(s)`)
      setIsImportExpensesOpen(false)
      setImportText("")
      fetchData()
    } catch (e: any) {
      console.error("Import error:", e)
      toast.error(
        e.message || "Failed to import expenses. Please check the error message and fix the issues in your JSON data.",
      )
    }
  }

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
            <div className="theme-card bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Festival Code</p>
                  <p className="text-xl font-bold text-gray-900">{festival.code}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAnalyticsConfigOpen(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    Analytics Config
                  </button>
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
              showEditButton
              onEdit={() => setIsFestivalModalOpen(true)}
            />
            <StatsCards stats={stats} />

            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Collections</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCollection(null)
                        setIsCollectionModalOpen(true)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Add Collection
                    </button>
                    <button
                      onClick={handleExportCollections}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={handleExportCollectionsImportFmt}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Export (Import Format)
                    </button>
                    <button
                      onClick={() => {
                        setIsImportCollectionsOpen(true)
                        setImportText("")
                      }}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Import JSON
                    </button>
                  </div>
                </div>
                <CollectionTable
                  collections={collections}
                  groups={groups}
                  modes={collectionModes}
                  onEdit={handleEditCollection}
                  onDelete={handleDeleteCollection}
                  isAdmin
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingExpense(null)
                        setIsExpenseModalOpen(true)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Add Expense
                    </button>
                    <button
                      onClick={handleExportExpenses}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={handleExportExpensesImportFmt}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Export (Import Format)
                    </button>
                    <button
                      onClick={() => {
                        setIsImportExpensesOpen(true)
                        setImportText("")
                      }}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Import JSON
                    </button>
                  </div>
                </div>
                <ExpenseTable
                  expenses={expenses}
                  categories={categories}
                  modes={expenseModes}
                  onEdit={handleEditExpense}
                  onDelete={handleDeleteExpense}
                  isAdmin
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Collection Settings</h3>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">Groups</h4>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newGroup}
                        onChange={(e) => setNewGroup(e.target.value)}
                        placeholder="Add new group"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => e.key === "Enter" && handleAddGroup()}
                      />
                      <button
                        onClick={handleAddGroup}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <div key={group} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm text-gray-700">{group}</span>
                          <button
                            onClick={() => handleDeleteGroup(group)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Collection Modes</h4>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newCollectionMode}
                        onChange={(e) => setNewCollectionMode(e.target.value)}
                        placeholder="Add new mode"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => e.key === "Enter" && handleAddCollectionMode()}
                      />
                      <button
                        onClick={handleAddCollectionMode}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {collectionModes.map((mode) => (
                        <div key={mode} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm text-gray-700">{mode}</span>
                          <button
                            onClick={() => handleDeleteCollectionMode(mode)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Expense Settings</h3>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">Categories</h4>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Add new category"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                      />
                      <button
                        onClick={handleAddCategory}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm text-gray-700">{category}</span>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Expense Modes</h4>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newExpenseMode}
                        onChange={(e) => setNewExpenseMode(e.target.value)}
                        placeholder="Add new mode"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => e.key === "Enter" && handleAddExpenseMode()}
                      />
                      <button
                        onClick={handleAddExpenseMode}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {expenseModes.map((mode) => (
                        <div key={mode} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm text-gray-700">{mode}</span>
                          <button
                            onClick={() => handleDeleteExpenseMode(mode)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Own Login Password Section - Only for regular admins */}
              {session?.type === "admin" && currentAdmin && (
                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Your Admin Account</h3>
                  <div className="space-y-4">
                    {/* Admin Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Code</label>
                        <div className="px-4 py-2 bg-gray-50 rounded-lg font-mono text-gray-800">
                          {currentAdmin.admin_code}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                        <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800">
                          {currentAdmin.admin_name}
                        </div>
                      </div>
                    </div>

                    {/* Admin Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Login Password</label>
                      <p className="text-xs text-gray-600 mb-3">This is your password for logging into the admin dashboard</p>
                      {editingAdminPassword ? (
                        <div className="space-y-3">
                          <input
                            type={showAdminPassword ? "text" : "password"}
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateAdminPassword}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Save Password
                            </button>
                            <button
                              onClick={() => {
                                setEditingAdminPassword(false)
                                setNewAdminPassword("")
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 px-4 py-2 bg-gray-50 rounded-lg font-mono text-gray-800">
                            {showAdminPassword 
                              ? (currentAdmin.admin_password_hash || "Not set") 
                              : "•".repeat(currentAdmin.admin_password_hash?.length || 8)}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title={showAdminPassword ? "Hide password" : "Show password"}
                          >
                            {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAdminPassword(true)
                              setNewAdminPassword("")
                            }}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Change password"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* User Password Management - Only for regular admins */}
              {session?.type === "admin" && adminId && adminId.trim() && (
                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">User Password Management</h3>
                      <p className="text-sm text-gray-600 mt-1">Manage passwords for visitors to access the festival</p>
                    </div>
                    <button
                      onClick={() => setIsManagePasswordsOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Key className="w-5 h-5" />
                      Manage Passwords
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Password Usage:</span>
                      <span className="text-sm text-gray-600">
                        {currentPasswordCount} of {maxUserPasswords} passwords created
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          currentPasswordCount >= maxUserPasswords
                            ? "bg-red-500"
                            : currentPasswordCount >= maxUserPasswords * 0.75
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                        style={{ width: `${(currentPasswordCount / maxUserPasswords) * 100}%` }}
                      />
                    </div>
                    {currentPasswordCount === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        No user passwords created yet. Click "Manage Passwords" to create one.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="theme-card bg-white rounded-lg shadow-md p-6 mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Showcase</h3>
                {allMediaItems.length > 0 &&
                  (() => {
                    const storageStats = calculateStorageStats(allMediaItems, festival?.max_storage_mb)
                    return (
                      <div
                        className="mb-4 cursor-pointer hover:bg-gray-50 p-4 rounded-lg border transition-colors"
                        onClick={() => setIsStorageStatsOpen(true)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium text-gray-800">Storage Usage</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatFileSize(storageStats.totalBytes)} / {formatFileSize(storageStats.maxBytes)}
                            <span className="ml-2 text-xs">({storageStats.percentage.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              storageStats.percentage > 90
                                ? "bg-red-500"
                                : storageStats.percentage > 75
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                            }`}
                            style={{ width: `${storageStats.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Click to view detailed storage breakdown</div>
                      </div>
                    )
                  })()}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600">
                    Create albums and upload photos, videos, audio, and PDFs. Users can view under Showcase.
                  </p>
                  <button
                    onClick={() => {
                      setEditingAlbum(null)
                      setIsAlbumModalOpen(true)
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add Album
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {albums.map((a) => (
                    <div key={a.id} className="border rounded-lg overflow-hidden bg-white">
                      {a.cover_url && (
                        <img
                          src={a.cover_url || "/placeholder.svg"}
                          alt={a.title}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-3">
                        <div className="font-semibold text-gray-800 truncate">{a.title}</div>
                        <div className="text-xs text-gray-500">{a.year || "Year N/A"}</div>
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">{a.description}</div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              setEditingAlbum(a)
                              setIsAlbumModalOpen(true)
                            }}
                            className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              await supabase.from("albums").delete().eq("id", a.id)
                              await supabase.rpc("log_admin_activity", {
                                p_festival_id: festival?.id || "",
                                p_admin_id: session?.type === "admin" ? session.adminId : null,
                                p_action_type: "delete_album",
                                p_action_details: { album_id: a.id, title: a.title },
                              })
                              toast.success("Album deleted")
                              fetchData()
                            }}
                            className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              setActiveAlbumId(a.id)
                              setIsManageMediaOpen(true)
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Manage Media
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {albums.length === 0 && <div className="text-sm text-gray-600">No albums yet.</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav code={code} />
      <GlobalSessionBar festivalCode={code} currentPage="admin" />

      <EditFestivalModal
        isOpen={isFestivalModalOpen}
        onClose={() => setIsFestivalModalOpen(false)}
        onSuccess={fetchData}
        festival={festival}
      />

      <AddEditAlbumModal
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        onSuccess={fetchData}
        festivalId={festival?.id || ""}
        festivalCode={festival?.code || ""}
        initial={editingAlbum}
        festival={festival}
      />

      <ManageAlbumMediaModal
        isOpen={isManageMediaOpen}
        onClose={() => setIsManageMediaOpen(false)}
        albumId={activeAlbumId}
        festivalCode={festival?.code || ""}
      />

      <StorageStatsModal
        isOpen={isStorageStatsOpen}
        onClose={() => setIsStorageStatsOpen(false)}
        allMediaItems={allMediaItems}
        albums={albums}
        maxStorageMB={festival?.max_storage_mb}
      />

      <AddCollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => {
          setIsCollectionModalOpen(false)
          setEditingCollection(null)
        }}
        onSuccess={fetchData}
        groups={groups}
        modes={collectionModes}
        editData={editingCollection}
        festivalId={festival?.id || ""}
        festivalStartDate={festival?.ce_start_date}
        festivalEndDate={festival?.ce_end_date}
      />

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false)
          setEditingExpense(null)
        }}
        onSuccess={fetchData}
        categories={categories}
        modes={expenseModes}
        editData={editingExpense}
        festivalId={festival?.id || ""}
        festivalStartDate={festival?.ce_start_date}
        festivalEndDate={festival?.ce_end_date}
      />

      {/* Import Collections Modal */}
      {isImportCollectionsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 pb-4 z-10">
              <h3 className="text-lg font-bold text-gray-800">Import Collections (JSON)</h3>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-blue-900 mb-2">Required Fields:</p>
                <p className="text-xs text-blue-800 mb-1">• name (string) - Collection name</p>
                <p className="text-xs text-blue-800 mb-1">• amount (number) - Collection amount (positive number)</p>
                <p className="text-xs text-blue-800 mb-1">
                  • group_name (string) - Must match existing group (case-insensitive)
                </p>
                <p className="text-xs text-blue-800 mb-1">
                  • mode (string) - Must match existing mode (case-insensitive)
                </p>
                <p className="text-xs text-blue-800 mb-1">
                  • date (string) - Format: YYYY-MM-DD, must be within festival date range
                </p>
                <p className="text-sm font-semibold text-blue-900 mt-3 mb-2">Optional Fields:</p>
                <p className="text-xs text-blue-800 mb-1">• note (string) - Optional note</p>
                <p className="text-xs text-blue-800 mb-1">• time_hour (number) - 0-23, defaults to 0</p>
                <p className="text-xs text-blue-800 mb-1">• time_minute (number) - 0-59, defaults to 0</p>
                <p className="text-xs text-blue-800 mb-1">
                  • created_by_admin_id (string/null) - Admin ID or null.{" "}
                  {session?.type === "admin"
                    ? "Will default to your admin ID if not provided."
                    : "For super admin, can be null or any valid admin ID."}
                </p>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                💡 Group & Mode are matched case-insensitively. Dates must be within the festival's Collection/Expense
                date range.
              </p>
              <div className="bg-gray-50 p-3 rounded border text-xs mb-3 font-mono overflow-x-auto">
                {`[
  {
    "name": "John Doe",
    "amount": 500,
    "group_name": "Group A",
    "mode": "Cash",
    "note": "Blessings",
    "date": "2025-10-21",
    "time_hour": 14,
    "time_minute": 30,
    "created_by_admin_id": null
  },
  {
    "name": "Jane",
    "amount": 1000,
    "group_name": "Group B",
    "mode": "UPI",
    "note": "",
    "date": "2025-10-22",
    "time_hour": 15,
    "time_minute": 0,
    "created_by_admin_id": null
  }
]`}
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full border rounded p-2 h-40 resize-y"
                placeholder="Paste your JSON array here..."
              />
            </div>
            {/* Sticky Footer with Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 pt-4 flex justify-end gap-2 z-10">
              <button
                onClick={() => setImportText(JSON.stringify(exampleCollections, null, 2))}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Copy Example
              </button>
              <button 
                onClick={() => setIsImportCollectionsOpen(false)} 
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleImportCollections} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Expenses Modal */}
      {isImportExpensesOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 pb-4 z-10">
              <h3 className="text-lg font-bold text-gray-800">Import Expenses (JSON)</h3>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-blue-900 mb-2">Required Fields:</p>
                <p className="text-xs text-blue-800 mb-1">• item (string) - Expense item name</p>
                <p className="text-xs text-blue-800 mb-1">• pieces (number) - Number of pieces (positive integer)</p>
                <p className="text-xs text-blue-800 mb-1">• price_per_piece (number) - Price per piece (non-negative)</p>
                <p className="text-xs text-blue-800 mb-1">
                  • total_amount (number) - Total amount (can be manually adjusted for discounts/rounding)
                </p>
                <p className="text-xs text-blue-800 mb-1">
                  • category (string) - Must match existing category (case-insensitive)
                </p>
                <p className="text-xs text-blue-800 mb-1">
                  • mode (string) - Must match existing mode (case-insensitive)
                </p>
                <p className="text-xs text-blue-800 mb-1">
                  • date (string) - Format: YYYY-MM-DD, must be within festival date range
                </p>
                <p className="text-sm font-semibold text-blue-900 mt-3 mb-2">Optional Fields:</p>
                <p className="text-xs text-blue-800 mb-1">• note (string) - Optional note</p>
                <p className="text-xs text-blue-800 mb-1">• time_hour (number) - 0-23, defaults to 0</p>
                <p className="text-xs text-blue-800 mb-1">• time_minute (number) - 0-59, defaults to 0</p>
                <p className="text-xs text-blue-800 mb-1">
                  • created_by_admin_id (string/null) - Admin ID or null.{" "}
                  {session?.type === "admin"
                    ? "Will default to your admin ID if not provided."
                    : "For super admin, can be null or any valid admin ID."}
                </p>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                💡 Category & Mode are matched case-insensitively. Dates must be within the festival's Collection/Expense
                date range. Total amount can be manually adjusted (e.g., for discounts or rounding).
              </p>
              <div className="bg-gray-50 p-3 rounded border text-xs mb-3 font-mono overflow-x-auto">
                {`[
  {
    "item": "Flowers",
    "pieces": 5,
    "price_per_piece": 50,
    "total_amount": 250,
    "category": "Decoration",
    "mode": "Cash",
    "note": "",
    "date": "2025-10-21",
    "time_hour": 10,
    "time_minute": 0,
    "created_by_admin_id": null
  },
  {
    "item": "Lights",
    "pieces": 2,
    "price_per_piece": 300,
    "total_amount": 600,
    "category": "Decoration",
    "mode": "UPI",
    "note": "extra cable",
    "date": "2025-10-22",
    "time_hour": 11,
    "time_minute": 30,
    "created_by_admin_id": null
  }
]`}
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full border rounded p-2 h-40 resize-y"
                placeholder="Paste your JSON array here..."
              />
            </div>
            {/* Sticky Footer with Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 pt-4 flex justify-end gap-2 z-10">
              <button
                onClick={() => setImportText(JSON.stringify(exampleExpenses, null, 2))}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Copy Example
              </button>
              <button 
                onClick={() => setIsImportExpensesOpen(false)} 
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleImportExpenses} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <ManageUserPasswordsModal
        isOpen={isManagePasswordsOpen}
        onClose={() => setIsManagePasswordsOpen(false)}
        onSuccess={fetchData}
        adminId={adminId}
        festivalId={festival?.id || ""}
        maxUserPasswords={maxUserPasswords}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete this ${deleteTarget?.type}?`}
      />

      <AnalyticsConfigModal
        isOpen={isAnalyticsConfigOpen}
        onClose={() => setIsAnalyticsConfigOpen(false)}
        onSuccess={fetchData}
        festival={festival}
      />
    </div>
  )
}

export default function AdminPage() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""

  return (
    <AdminPasswordGate code={code}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <AdminPageContent />
      </Suspense>
    </AdminPasswordGate>
  )
}

"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Festival, Collection, Expense, Stats, Album, MediaItem, AdminActivityLog, AccessLog, Admin } from "@/types"
import { calculateStats, calculateStorageStats, formatFileSize, formatDate, formatCurrency } from "@/lib/utils"
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
import { Plus, Edit, Trash2, Eye, EyeOff, HardDrive, Key, LogOut, ExternalLink, Search, ChevronLeft, ChevronRight, HelpCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useMemo } from "react"

import { getThemeStyles, getThemeClasses } from "@/lib/theme"
import { useSession } from "@/lib/hooks/useSession"

// Help Structure Components
function HelpAdminStructure({ festivalCode }: { festivalCode: string }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleSection = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const adminStructure = [
    {
      title: "Dashboard",
      icon: "📊",
      subTabs: [
        {
          name: "Info",
          url: `/f/${festivalCode}/admin?tab=dashboard&sub-tab=info`,
          sections: [
            { name: "Festival Information", desc: "View event details like name, organiser, dates, location" },
            { name: "Statistics Cards", desc: "Total collection, expenses, donations, and balance" },
            { name: "Title Style Settings", desc: "Customize title size, weight, alignment, and color" }
          ]
        },
        {
          name: "Analytics",
          url: `/f/${festivalCode}/admin?tab=dashboard&sub-tab=analytics`,
          sections: [
            { name: "Analytics Configuration", desc: "Configure collection targets, donation buckets, and time-of-day analytics" }
          ]
        }
      ]
    },
    {
      title: "Transaction",
      icon: "💰",
      subTabs: [
        {
          name: "Collection",
          url: `/f/${festivalCode}/admin?tab=transaction&sub-tab=collection`,
          sections: [
            { name: "Add Collection", desc: "Record new donations/collections" },
            { name: "Collections Table", desc: "View, edit, and delete collections with filtering" },
            { name: "Export/Import", desc: "Export to JSON or import collections from JSON" }
          ]
        },
        {
          name: "Expenses",
          url: `/f/${festivalCode}/admin?tab=transaction&sub-tab=expenses`,
          sections: [
            { name: "Add Expense", desc: "Record new expenses" },
            { name: "Expenses Table", desc: "View, edit, and delete expenses with filtering" },
            { name: "Export/Import", desc: "Export to JSON or import expenses from JSON" }
          ]
        },
        {
          name: "Configs",
          url: `/f/${festivalCode}/admin?tab=transaction&sub-tab=configs`,
          sections: [
            { name: "Groups Management", desc: "Add/remove collection groups" },
            { name: "Collection Modes", desc: "Manage collection payment modes (Cash, UPI, etc.)" },
            { name: "Categories Management", desc: "Add/remove expense categories" },
            { name: "Expense Modes", desc: "Manage expense payment modes" }
          ]
        }
      ]
    },
    {
      title: "Showcase",
      icon: "🎨",
      url: `/f/${festivalCode}/admin?tab=showcase`,
      sections: [
        { name: "Media Download Control", desc: "Toggle festival-wide media download permission for visitors" },
        { name: "Album Management", desc: "Create, edit, and delete media albums" },
        { name: "Media Upload", desc: "Upload images, videos, audio, and PDFs to albums" },
        { name: "Storage Usage", desc: "Monitor storage consumption and limits" }
      ]
    },
    {
      title: "Settings",
      icon: "⚙️",
      url: `/f/${festivalCode}/admin?tab=settings`,
      sections: [
        { name: "Admin Password", desc: "Change your admin password" },
        { name: "Visitor Passwords", desc: "Manage visitor access passwords (up to your limit)" },
        { name: "Theme Settings", desc: "Customize background color, image, text color, and border color" },
        { name: "Dark Mode", desc: "Toggle dark theme for the festival pages" }
      ]
    },
    {
      title: "Activity",
      icon: "📝",
      url: `/f/${festivalCode}/admin?tab=activity`,
      sections: [
        { name: "My Activity Log", desc: "View your personal admin actions with search and filtering" },
        { name: "Transactions History", desc: "See all collections and expenses with admin attribution" },
        { name: "Visitors Log", desc: "Track visitor access history and authentication methods" }
      ]
    }
  ]

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard Structure</h2>
        <p className="text-sm text-gray-600 mb-4">Navigate the admin dashboard with this visual guide. Click links to open sections in a new tab.</p>
        
        {adminStructure.map((tab, idx) => (
          <div key={idx} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
              onClick={() => toggleSection(`admin-tab-${idx}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tab.icon}</span>
                  <h3 className="text-lg font-bold text-gray-900">{tab.title}</h3>
                </div>
                {collapsed[`admin-tab-${idx}`] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </div>
            </div>
            
            {!collapsed[`admin-tab-${idx}`] && (
              <div className="p-4 bg-white">
                {tab.subTabs ? (
                  tab.subTabs.map((subTab, subIdx) => (
                    <div key={subIdx} className="mb-3 ml-4 border-l-2 border-blue-300 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{subTab.name}</h4>
                        <a 
                          href={subTab.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      {subTab.sections.map((section, secIdx) => (
                        <div key={secIdx} className="ml-4 mb-2 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                          <p className="text-sm font-medium text-gray-700">{section.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{section.desc}</p>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="ml-4">
                    <div className="flex items-center gap-2 mb-3">
                      <a 
                        href={tab.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span className="font-medium">Open {tab.title}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    {tab.sections?.map((section, secIdx) => (
                      <div key={secIdx} className="mb-2 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                        <p className="text-sm font-medium text-gray-700">{section.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{section.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function HelpSuperAdminStructure({ festivalCode }: { festivalCode: string }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleSection = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const superAdminStructure = [
    {
      title: "Home",
      icon: "🏠",
      subTabs: [
        {
          name: "Info",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=home&sub-tab=info`,
          sections: [
            { name: "Festival Information", desc: "View-only festival details (edit via Admin Dashboard)" },
            { name: "Statistics Cards", desc: "Total collection, expenses, donations, and balance" }
          ]
        },
        {
          name: "Banner",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=home&sub-tab=banner`,
          sections: [
            { name: "Banner Visibility Settings", desc: "Toggle visibility of organiser, guide, mentor, location, dates, duration" },
            { name: "Admin Display Preference", desc: "Choose to display admin code or admin name" }
          ]
        },
        {
          name: "Festival Code",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=home&sub-tab=festival-code`,
          sections: [
            { name: "Festival Code Management", desc: "View and update festival code (6-12 characters)" },
            { name: "Automatic Redirect", desc: "Old code links automatically redirect to new code" }
          ]
        }
      ]
    },
    {
      title: "Settings",
      icon: "⚙️",
      subTabs: [
        {
          name: "Personal",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=settings&sub-tab=personal`,
          sections: [
            { name: "Super Admin Password", desc: "Update super admin dashboard access password" }
          ]
        },
        {
          name: "Admin Management",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=settings&sub-tab=admin-management`,
          sections: [
            { name: "Create Admin", desc: "Add new admin accounts with custom codes and passwords" },
            { name: "Admin Search & Filters", desc: "Search by code/name, filter by status, sort by various fields" },
            { name: "Admin Table", desc: "View all admins with type (Default/Super Admin/Regular), status, and actions" },
            { name: "Edit/Delete Admins", desc: "Modify admin details or remove admin accounts" }
          ]
        },
        {
          name: "Media Storage",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=settings&sub-tab=media-storage`,
          sections: [
            { name: "Total Storage Limit", desc: "Set festival-wide storage limit (100-10000 MB)" },
            { name: "Max Video File Size", desc: "Configure maximum video upload size (10-500 MB)" },
            { name: "Max File Size", desc: "Set limit for images, audio, PDFs (1-100 MB)" }
          ]
        },
        {
          name: "Analytics",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=settings&sub-tab=analytics`,
          sections: [
            { name: "Analytics Cards Configuration", desc: "Manage visibility and order of analytics cards for visitors" }
          ]
        },
        {
          name: "Danger",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=settings&sub-tab=danger`,
          sections: [
            { name: "Delete Festival", desc: "Permanently delete festival and all associated data (irreversible)" }
          ]
        }
      ]
    },
    {
      title: "Activity",
      icon: "📝",
      subTabs: [
        {
          name: "My Activity",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=activity&sub-tab=own`,
          sections: [
            { name: "Super Admin Actions", desc: "Track your super admin activities with search and filtering" },
            { name: "System Activities", desc: "View system-level operations and changes" }
          ]
        },
        {
          name: "All Transactions",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=activity&sub-tab=transactions`,
          sections: [
            { name: "Combined View", desc: "See all collections and expenses in one place" },
            { name: "Admin Attribution", desc: "Track which admin created each transaction" },
            { name: "Transaction Management", desc: "Edit or delete any transaction with confirmation" }
          ]
        },
        {
          name: "All Visitors",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=activity&sub-tab=visitors`,
          sections: [
            { name: "Visitor Access Log", desc: "Complete history of visitor logins" },
            { name: "Authentication Details", desc: "See which admin/password was used for access" },
            { name: "Access Method", desc: "Track login page vs direct link access" }
          ]
        },
        {
          name: "Admin Activity",
          url: `/f/${festivalCode}/admin/sup/dashboard?tab=activity&sub-tab=admins`,
          sections: [
            { name: "All Admin Actions", desc: "Monitor actions from all admin accounts" },
            { name: "Multi-level Filtering", desc: "Filter by action type and specific admin" },
            { name: "Accountability Tracking", desc: "Full audit trail of admin operations" }
          ]
        }
      ]
    },

  ]

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Super Admin Dashboard Structure</h2>
        <p className="text-sm text-gray-600 mb-4">Navigate the super admin dashboard with this visual guide. Click links to open sections in a new tab.</p>
        
        {superAdminStructure.map((tab, idx) => (
          <div key={idx} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 cursor-pointer hover:from-purple-100 hover:to-purple-200 transition-colors"
              onClick={() => toggleSection(`super-tab-${idx}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tab.icon}</span>
                  <h3 className="text-lg font-bold text-gray-900">{tab.title}</h3>
                </div>
                {collapsed[`super-tab-${idx}`] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </div>
            </div>
            
            {!collapsed[`super-tab-${idx}`] && (
              <div className="p-4 bg-white">
                {tab.subTabs.map((subTab, subIdx) => (
                  <div key={subIdx} className="mb-3 ml-4 border-l-2 border-purple-300 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800">{subTab.name}</h4>
                      <a 
                        href={subTab.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    {subTab.sections.map((section, secIdx) => (
                      <div key={secIdx} className="ml-4 mb-2 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                        <p className="text-sm font-medium text-gray-700">{section.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{section.desc}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminPageContent() {
  const params = useParams<{ code: string }>()
  const code = (params?.code as string) || ""
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, logout: clearSession } = useSession(code)

  const currentTab = searchParams?.get("tab") || "dashboard"
  const currentSubTab = searchParams?.get("sub-tab") || ""

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

  const [titleStyleSettings, setTitleStyleSettings] = useState({
    title_size: "text-3xl",
    title_weight: "font-bold",
    title_align: "text-center",
    title_color: "#000000",
  })
  const [isSavingTitleStyle, setIsSavingTitleStyle] = useState(false)

  const [themeSettings, setThemeSettings] = useState({
    theme_bg_color: "#f8fafc",
    theme_bg_image_url: "",
    theme_dark: false,
    theme_text_color: "",
    theme_border_color: "",
  })
  const [isSavingTheme, setIsSavingTheme] = useState(false)

  const [allowMediaDownload, setAllowMediaDownload] = useState(true)
  const [isSavingMediaDownload, setIsSavingMediaDownload] = useState(false)

  const [ownActivity, setOwnActivity] = useState<AdminActivityLog[]>([])
  const [ownSearchTerm, setOwnSearchTerm] = useState("")
  const [ownActionFilter, setOwnActionFilter] = useState("all")
  const [ownCurrentPage, setOwnCurrentPage] = useState(1)
  const [ownRecordsPerPage] = useState(10)

  const [transactions, setTransactions] = useState<(Collection & Expense & { type: "collection" | "expense"; admin_code?: string; admin_name?: string })[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [txnSearchTerm, setTxnSearchTerm] = useState("")
  const [txnTypeFilter, setTxnTypeFilter] = useState<"all" | "collection" | "expense">("all")
  const [txnCurrentPage, setTxnCurrentPage] = useState(1)
  const [txnRecordsPerPage] = useState(10)

  const [visitors, setVisitors] = useState<AccessLog[]>([])
  const [visitorSearchTerm, setVisitorSearchTerm] = useState("")
  const [visitorCurrentPage, setVisitorCurrentPage] = useState(1)
  const [visitorRecordsPerPage] = useState(10)

  useEffect(() => {
    if (code) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, session])

  useEffect(() => {
    if (session?.type === "admin" && session.adminId) {
      setAdminId(session.adminId)
      
      const fetchAdminData = async () => {
        try {
          const { data: adminData } = await supabase
            .from("admins")
            .select("*")
            .eq("admin_id", session.adminId)
            .single()

          if (adminData) {
            setMaxUserPasswords(adminData.max_user_passwords || 3)
            setCurrentAdmin({
              admin_id: adminData.admin_id,
              admin_code: adminData.admin_code,
              admin_name: adminData.admin_name,
              admin_password_hash: adminData.admin_password_hash || ''
            })

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
      const fetchDefaultAdmin = async () => {
        try {
          const { data: fest } = await supabase
            .from("festivals")
            .select("id")
            .eq("code", code)
            .single()
          
          if (!fest) return

          const { data: allAdmins } = await supabase
            .from("admins")
            .select("*")
            .eq("festival_id", fest.id)
            .order("created_at", { ascending: true })
          
          if (!allAdmins || allAdmins.length === 0) {
            setAdminId("")
            setCurrentAdmin(null)
            setMaxUserPasswords(3)
            setCurrentPasswordCount(0)
            return
          }

          const nullCreatedByAdmins = allAdmins.filter((a: Admin) => !a.created_by || a.created_by === null || a.created_by === '')
          const defaultAdmin = nullCreatedByAdmins.length > 0 
            ? nullCreatedByAdmins.reduce((oldest: Admin, current: Admin) => 
                new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest
              )
            : allAdmins[0]
          
          setAdminId(defaultAdmin.admin_id)
          setMaxUserPasswords(defaultAdmin.max_user_passwords || 3)
          setCurrentAdmin({
            admin_id: defaultAdmin.admin_id,
            admin_code: defaultAdmin.admin_code,
            admin_name: defaultAdmin.admin_name,
            admin_password_hash: defaultAdmin.admin_password_hash || ''
          })

          const { count } = await supabase
            .from("user_passwords")
            .select("*", { count: "exact", head: true })
            .eq("admin_id", defaultAdmin.admin_id)
          setCurrentPasswordCount(count || 0)
        } catch (error) {
          console.error("Error fetching default admin data:", error)
          setAdminId("")
          setCurrentAdmin(null)
          setMaxUserPasswords(3)
          setCurrentPasswordCount(0)
        }
      }
      
      fetchDefaultAdmin()
    } else if (!session || session.type !== "admin") {
      setAdminId("")
      setCurrentAdmin(null)
    }
  }, [session, code])

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

      const other_data = fest.other_data || {}
      setTitleStyleSettings({
        title_size: other_data.title_size || "text-3xl",
        title_weight: other_data.title_weight || "font-bold",
        title_align: other_data.title_align || "text-center",
        title_color: other_data.title_color || "#000000",
      })

      setThemeSettings({
        theme_bg_color: fest.theme_bg_color || "#f8fafc",
        theme_bg_image_url: fest.theme_bg_image_url || "",
        theme_dark: fest.theme_dark || false,
        theme_text_color: fest.theme_text_color || "",
        theme_border_color: fest.theme_border_color || "",
      })

      setAllowMediaDownload(fest.allow_media_download !== false)

      if (session?.type === "admin" && session.adminId) {
        console.log('[Admin Page] Fetching admin activity:', {
          festival_id: fest.id,
          admin_id: session.adminId,
          session_type: session.type
        })
        
        const { data: activityData, error: activityErr } = await supabase
          .from("admin_activity_log")
          .select("*")
          .eq("festival_id", fest.id)
          .eq("admin_id", session.adminId)
          .order("timestamp", { ascending: false })
        
        console.log('[Admin Page] Activity data fetched:', {
          count: activityData?.length || 0,
          error: activityErr,
          sample: activityData?.slice(0, 2)
        })
        
        if (activityErr) {
          console.error("Error fetching admin activity:", activityErr)
          toast.error("Failed to fetch activity logs")
        }
        setOwnActivity(activityData || [])
      } else {
        console.log('[Admin Page] Skipping activity fetch:', {
          session_type: session?.type,
          has_admin_id: session?.type === 'admin' ? !!session.adminId : false
        })
      }

      const { data: adminsData } = await supabase
        .from("admins")
        .select("*")
        .eq("festival_id", fest.id)
      setAdmins(adminsData || [])

      const adminMap = new Map(adminsData?.map((a: Admin) => [a.admin_id, a]) || [])
      
      const enrichedCollections = fetchedCollections.map((c: Collection) => ({
        ...c,
        type: "collection" as const,
        admin_code: c.created_by_admin_id ? adminMap.get(c.created_by_admin_id)?.admin_code : undefined,
        admin_name: c.created_by_admin_id ? adminMap.get(c.created_by_admin_id)?.admin_name : undefined,
      }))

      const enrichedExpenses = fetchedExpenses.map((e: Expense) => ({
        ...e,
        type: "expense" as const,
        admin_code: e.created_by_admin_id ? adminMap.get(e.created_by_admin_id)?.admin_code : undefined,
        admin_name: e.created_by_admin_id ? adminMap.get(e.created_by_admin_id)?.admin_name : undefined,
      }))

      const combined = [...enrichedCollections, ...enrichedExpenses].sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setTransactions(combined as any)

      const { data: visitorsData } = await supabase
        .from("access_logs")
        .select("*")
        .eq("festival_id", fest.id)
        .order("accessed_at", { ascending: false })
      setVisitors(visitorsData || [])

      const albumIds = (albumsRes.data || []).map((a: Album) => a.id)
      if (albumIds.length > 0) {
        const { data: mediaData } = await supabase.from("media_items").select("*").in("album_id", albumIds)
        setAllMediaItems((mediaData as MediaItem[]) || [])
      } else {
        setAllMediaItems([])
      }

      const calculatedStats = calculateStats(fetchedCollections, fetchedExpenses)
      setStats(calculatedStats)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    router.push(`/f/${code}/admin?tab=${tab}`)
  }

  const handleSubTabChange = (subTab: string) => {
    router.push(`/f/${code}/admin?tab=${currentTab}&sub-tab=${subTab}`)
  }

  const handleLogout = () => {
    clearSession()
    toast.success("Logged out successfully")
    router.push(`/f/${code}`)
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
    if (!newAdminPassword.trim() || !currentAdmin || !festival) {
      toast.error("Cannot update password: Admin information not available")
      return
    }

    if (session?.type !== "admin" && session?.type !== "super_admin") {
      toast.error("Cannot update password: Invalid session")
      return
    }
    
    try {
      const { error } = await supabase
        .from("admins")
        .update({
          admin_password_hash: newAdminPassword.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("admin_id", currentAdmin.admin_id)

      if (error) throw error

      await supabase.rpc("log_admin_activity", {
        p_festival_id: festival.id,
        p_admin_id: session.type === "admin" ? session.adminId : null,
        p_action_type: session.type === "super_admin" ? "update_default_admin_password" : "update_admin_password",
        p_action_details: {
          admin_code: currentAdmin.admin_code,
          admin_name: currentAdmin.admin_name,
          updated_by: session.type === "super_admin" ? "super_admin" : "self"
        },
      })

      toast.success(session.type === "super_admin" ? "Default admin password updated successfully" : "Admin password updated successfully")
      setNewAdminPassword("")
      setEditingAdminPassword(false)
      
      const { data: adminData } = await supabase
        .from("admins")
        .select("*")
        .eq("admin_id", currentAdmin.admin_id)
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

  const handleSaveTitleStyle = async () => {
    if (!festival) return
    
    try {
      setIsSavingTitleStyle(true)
      
      const { error } = await supabase
        .from("festivals")
        .update({
          other_data: {
            ...(festival.other_data || {}),
            title_size: titleStyleSettings.title_size,
            title_weight: titleStyleSettings.title_weight,
            title_align: titleStyleSettings.title_align,
            title_color: titleStyleSettings.title_color,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", festival.id)

      if (error) throw error

      toast.success("Title style settings saved")
      fetchData()
    } catch (error) {
      console.error("Error saving title style:", error)
      toast.error("Failed to save title style settings")
    } finally {
      setIsSavingTitleStyle(false)
    }
  }

  const handleSaveTheme = async () => {
    if (!festival) return
    
    try {
      setIsSavingTheme(true)
      
      const { error } = await supabase
        .from("festivals")
        .update({
          theme_bg_color: themeSettings.theme_bg_color || null,
          theme_bg_image_url: themeSettings.theme_bg_image_url.trim() || null,
          theme_dark: themeSettings.theme_dark,
          theme_text_color: themeSettings.theme_text_color || null,
          theme_border_color: themeSettings.theme_border_color || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", festival.id)

      if (error) throw error

      toast.success("Theme settings saved")
      fetchData()
    } catch (error) {
      console.error("Error saving theme:", error)
      toast.error("Failed to save theme settings")
    } finally {
      setIsSavingTheme(false)
    }
  }

  const handleSaveMediaDownload = async () => {
    if (!festival) return
    
    try {
      setIsSavingMediaDownload(true)
      
      const { error } = await supabase
        .from("festivals")
        .update({
          allow_media_download: allowMediaDownload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", festival.id)

      if (error) throw error

      toast.success("Media download setting saved")
      fetchData()
    } catch (error) {
      console.error("Error saving media download setting:", error)
      toast.error("Failed to save media download setting")
    } finally {
      setIsSavingMediaDownload(false)
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

  const formatTime = (hour?: number, minute?: number) => {
    if (hour === undefined || minute === undefined) return ""
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  }

  const getAdminDisplay = (adminCode?: string, adminName?: string) => {
    if (!adminCode && !adminName) return "N/A"
    const preference = festival?.admin_display_preference || "code"
    return preference === "code" ? adminCode : adminName
  }

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

  const actionTypes = useMemo(() => {
    return Array.from(new Set(ownActivity.map(a => a.action_type)))
  }, [ownActivity])

  const filteredTransactions = useMemo(() => {
    let result = [...transactions]

    if (txnSearchTerm) {
      result = result.filter(txn => 
        (txn.type === "collection" ? txn.name : txn.item)?.toLowerCase().includes(txnSearchTerm.toLowerCase()) ||
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

  const handleExportCollections = async () => {
    downloadJSON(collections, `${festival?.code || "fest"}-collections.json`)
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

      const { data: allAdmins } = await supabase
        .from("admins")
        .select("admin_id, admin_code, admin_name")
        .eq("festival_id", festival.id)
        .eq("is_active", true)
      const adminMap = new Map((allAdmins || []).map((a) => [a.admin_id, a]))
      const adminIdList = (allAdmins || []).map((a) => a.admin_id)

      let currentAdminIdForImport: string | null = null
      if (session?.type === "admin") {
        currentAdminIdForImport = session.adminId
      } else if (session?.type === "super_admin") {
        currentAdminIdForImport = null
      }

      const rows = parsed.map((c: any, idx: number) => {
        const rowNum = idx + 1

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

        const dateObj = new Date(date)
        const ceStart = new Date(festival.ce_start_date!)
        const ceEnd = new Date(festival.ce_end_date!)
        if (dateObj < ceStart || dateObj > ceEnd) {
          throw new Error(
            `Row ${rowNum}: Date "${date}" is outside the valid range (${festival.ce_start_date} to ${festival.ce_end_date}). Please adjust the date or update the festival date range.`,
          )
        }

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

        let created_by_admin_id: string | null = null
        if (c.created_by_admin_id != null && c.created_by_admin_id !== "") {
          if (adminIdList.includes(c.created_by_admin_id)) {
            created_by_admin_id = c.created_by_admin_id
          } else {
            throw new Error(
              `Row ${rowNum}: Invalid "created_by_admin_id" "${c.created_by_admin_id}". Admin ID not found in this festival. Available admin IDs: ${adminIdList.join(", ") || "None"}. For super admin, you can leave this field as null.`,
            )
          }
        } else {
          if (session?.type === "admin") {
            created_by_admin_id = session.adminId
          } else {
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

      const { data: allAdmins } = await supabase
        .from("admins")
        .select("admin_id, admin_code, admin_name")
        .eq("festival_id", festival.id)
        .eq("is_active", true)
      const adminMap = new Map((allAdmins || []).map((a) => [a.admin_id, a]))
      const adminIdList = (allAdmins || []).map((a) => a.admin_id)

      let currentAdminIdForImport: string | null = null
      if (session?.type === "admin") {
        currentAdminIdForImport = session.adminId
      } else if (session?.type === "super_admin") {
        currentAdminIdForImport = null
      }

      const rows = parsed.map((x: any, idx: number) => {
        const rowNum = idx + 1

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

        const dateObj = new Date(date)
        const ceStart = new Date(festival.ce_start_date!)
        const ceEnd = new Date(festival.ce_end_date!)
        if (dateObj < ceStart || dateObj > ceEnd) {
          throw new Error(
            `Row ${rowNum}: Date "${date}" is outside the valid range (${festival.ce_start_date} to ${festival.ce_end_date}). Please adjust the date or update the festival date range.`,
          )
        }

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

        let created_by_admin_id: string | null = null
        if (x.created_by_admin_id != null && x.created_by_admin_id !== "") {
          if (adminIdList.includes(x.created_by_admin_id)) {
            created_by_admin_id = x.created_by_admin_id
          } else {
            throw new Error(
              `Row ${rowNum}: Invalid "created_by_admin_id" "${x.created_by_admin_id}". Admin ID not found in this festival. Available admin IDs: ${adminIdList.join(", ") || "None"}. For super admin, you can leave this field as null.`,
            )
          }
        } else {
          if (session?.type === "admin") {
            created_by_admin_id = session.adminId
          } else {
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
          <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
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
                      Logged in as <span className="font-semibold">{session?.type === "super_admin" ? "Super Admin" : "Admin"}</span>
                    </span>
                    
                    {session?.type === "super_admin" && (
                      <button
                        onClick={() => router.push(`/f/${code}/admin/sup/dashboard`)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs"
                      >
                        Super Admin Dashboard
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    
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
              
              <div className="overflow-x-auto">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => handleTabChange("dashboard")}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      currentTab === "dashboard"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleTabChange("transaction")}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      currentTab === "transaction"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Transaction
                  </button>
                  <button
                    onClick={() => handleTabChange("showcase")}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      currentTab === "showcase"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Showcase
                  </button>
                  <button
                    onClick={() => handleTabChange("settings")}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      currentTab === "settings"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => handleTabChange("activity")}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      currentTab === "activity"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Activity
                  </button>
                  <button
                    onClick={() => handleTabChange("help")}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      currentTab === "help"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 inline mr-1" />
                    Help
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-6">
            {currentTab === "dashboard" && (
              <div className="space-y-6">
                {/* Sub-tabs for Dashboard */}
                <div className="bg-white border-b border-gray-200 rounded-t-lg">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => handleSubTabChange("info")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        (currentSubTab === "info" || !currentSubTab)
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Info
                    </button>
                    <button
                      onClick={() => handleSubTabChange("analytics")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "analytics"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Analytics
                    </button>
                  </div>
                </div>

                {/* Info Sub-tab */}
                {(currentSubTab === "info" || !currentSubTab) && (
                  <div className="space-y-6">
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

                    <div className="theme-card bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Title Style Settings</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Size</label>
                            <select
                              value={titleStyleSettings.title_size}
                              onChange={(e) => setTitleStyleSettings({ ...titleStyleSettings, title_size: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="text-2xl">Small</option>
                              <option value="text-3xl">Medium</option>
                              <option value="text-4xl">Large</option>
                              <option value="text-5xl">Extra Large</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Weight</label>
                            <select
                              value={titleStyleSettings.title_weight}
                              onChange={(e) => setTitleStyleSettings({ ...titleStyleSettings, title_weight: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="font-normal">Normal</option>
                              <option value="font-semibold">Semibold</option>
                              <option value="font-bold">Bold</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Alignment</label>
                            <select
                              value={titleStyleSettings.title_align}
                              onChange={(e) => setTitleStyleSettings({ ...titleStyleSettings, title_align: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="text-left">Left</option>
                              <option value="text-center">Center</option>
                              <option value="text-right">Right</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Color</label>
                            <input
                              type="color"
                              value={titleStyleSettings.title_color}
                              onChange={(e) => setTitleStyleSettings({ ...titleStyleSettings, title_color: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={handleSaveTitleStyle}
                            disabled={isSavingTitleStyle}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isSavingTitleStyle ? "Saving..." : "Save Title Style"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics Sub-tab */}
                {currentSubTab === "analytics" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Analytics Configuration</h3>
                      <button
                        onClick={() => setIsAnalyticsConfigOpen(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        Open Analytics Config
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Configure collection targets, donation buckets, and time-of-day analytics for better insights.
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentTab === "transaction" && (
              <div className="space-y-6">
                <div className="bg-white border-b border-gray-200 rounded-t-lg">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => handleSubTabChange("collection")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        (currentSubTab === "collection" || !currentSubTab)
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Collection
                    </button>
                    <button
                      onClick={() => handleSubTabChange("expenses")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "expenses"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Expenses
                    </button>
                    <button
                      onClick={() => handleSubTabChange("configs")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "configs"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Configs
                    </button>
                  </div>
                </div>

                {(currentSubTab === "collection" || !currentSubTab) && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-800">Collections</h2>
                      <div className="flex flex-wrap items-center gap-2">
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
                )}

                {currentSubTab === "expenses" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
                      <div className="flex flex-wrap items-center gap-2">
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
                )}

                {currentSubTab === "configs" && (
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
                        <div className="space-y-2 max-h-60 overflow-y-auto">
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
                        <div className="space-y-2 max-h-60 overflow-y-auto">
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
                        <div className="space-y-2 max-h-60 overflow-y-auto">
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
                        <div className="space-y-2 max-h-60 overflow-y-auto">
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
                )}
              </div>
            )}

            {currentTab === "showcase" && (
              <div className="space-y-6">
                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Media Download Control</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="allow-media-download"
                          checked={allowMediaDownload}
                          onChange={(e) => setAllowMediaDownload(e.target.checked)}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <label htmlFor="allow-media-download" className="text-sm font-medium text-gray-700 block mb-1 cursor-pointer">
                            Allow visitors to download media (festival-wide)
                          </label>
                          <p className="text-xs text-gray-500">
                            When disabled, visitors cannot download any media from showcase
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2 border-t border-gray-200">
                        <button
                          onClick={handleSaveMediaDownload}
                          disabled={isSavingMediaDownload}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {isSavingMediaDownload ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Showcase Albums</h3>
                  
                  {allMediaItems.length > 0 &&
                    (() => {
                      const storageStats = calculateStorageStats(allMediaItems, festival?.max_storage_mb)
                      return (
                        <div className="mb-4 p-4 rounded-lg border bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <HardDrive className="w-5 h-5 text-gray-600" />
                              <span className="text-sm font-medium text-gray-800">Storage Usage</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                {formatFileSize(storageStats.totalBytes)} / {formatFileSize(storageStats.maxBytes)}
                                <span className="ml-2 text-xs">({storageStats.percentage.toFixed(1)}%)</span>
                              </span>
                              <button
                                onClick={() => setIsStorageStatsOpen(true)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="View detailed storage breakdown"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
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
            )}

            {currentTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-white border-b border-gray-200 rounded-t-lg">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => handleSubTabChange("personal")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        (currentSubTab === "personal" || (!currentSubTab && session?.type === "admin"))
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      onClick={() => handleSubTabChange("user")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "user"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      User
                    </button>
                    <button
                      onClick={() => handleSubTabChange("theme")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "theme" || (session?.type === "super_admin" && !currentSubTab)
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Theme
                    </button>
                  </div>
                </div>

                {(currentSubTab === "personal" || (!currentSubTab && session?.type === "admin")) && currentAdmin && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
                    {session?.type === "super_admin" && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-purple-800 font-medium">Super Admin Mode</p>
                        <p className="text-xs text-purple-600 mt-1">Managing default admin account for password operations</p>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{session?.type === "super_admin" ? "Default Admin Account" : "Your Admin Account"}</h3>
                    <div className="space-y-4">
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{session?.type === "super_admin" ? "Default Admin Login Password" : "Your Login Password"}</label>
                        <p className="text-xs text-gray-600 mb-3">{session?.type === "super_admin" ? "This is the password for the default admin to login to the admin dashboard" : "This is your password for logging into the admin dashboard"}</p>
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

                {currentSubTab === "user" && adminId && adminId.trim() && (
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



                {(currentSubTab === "theme" || (session?.type === "super_admin" && !currentSubTab)) && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Theme Settings</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                          <input
                            type="color"
                            value={themeSettings.theme_bg_color}
                            onChange={(e) => setThemeSettings({ ...themeSettings, theme_bg_color: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                          <input
                            type="text"
                            value={themeSettings.theme_bg_image_url}
                            onChange={(e) => setThemeSettings({ ...themeSettings, theme_bg_image_url: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                          <input
                            type="color"
                            value={themeSettings.theme_text_color}
                            onChange={(e) => setThemeSettings({ ...themeSettings, theme_text_color: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
                          <input
                            type="color"
                            value={themeSettings.theme_border_color}
                            onChange={(e) => setThemeSettings({ ...themeSettings, theme_border_color: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={themeSettings.theme_dark}
                            onChange={(e) => setThemeSettings({ ...themeSettings, theme_dark: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Enable Dark Mode</span>
                        </label>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveTheme}
                          disabled={isSavingTheme}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSavingTheme ? "Saving..." : "Save Theme Settings"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentTab === "activity" && (
              <div className="space-y-6">
                <div className="bg-white border-b border-gray-200 rounded-t-lg">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => handleSubTabChange("my-activity")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        (currentSubTab === "my-activity" || !currentSubTab)
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      My Activity
                    </button>
                    <button
                      onClick={() => handleSubTabChange("transactions")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "transactions"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Transactions
                    </button>
                    <button
                      onClick={() => handleSubTabChange("visitors")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        currentSubTab === "visitors"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Visitors
                    </button>
                  </div>
                </div>

                {(currentSubTab === "my-activity" || !currentSubTab) && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-2">
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <select
                          value={ownActionFilter}
                          onChange={(e) => {
                            setOwnActionFilter(e.target.value)
                            setOwnCurrentPage(1)
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">All Actions</option>
                          {actionTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

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
                  </div>
                )}

                {currentSubTab === "transactions" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-2">
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <select
                          value={txnTypeFilter}
                          onChange={(e) => {
                            setTxnTypeFilter(e.target.value as any)
                            setTxnCurrentPage(1)
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">All Types</option>
                          <option value="collection">Collections Only</option>
                          <option value="expense">Expenses Only</option>
                        </select>
                      </div>

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
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {paginatedTransactions.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
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
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {txn.type === "collection" ? txn.name : txn.item}
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-semibold ${
                                    txn.type === "collection" ? "text-green-600" : "text-red-600"
                                  }`}>
                                    {formatCurrency(txn.type === "collection" ? txn.amount : txn.total_amount)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {txn.type === "collection" ? txn.name : txn.item}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {getAdminDisplay(txn.admin_code, txn.admin_name)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

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
                  </div>
                )}

                {currentSubTab === "visitors" && (
                  <div className="theme-card bg-white rounded-lg shadow-md p-6">
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search visitors..."
                          value={visitorSearchTerm}
                          onChange={(e) => {
                            setVisitorSearchTerm(e.target.value)
                            setVisitorCurrentPage(1)
                          }}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>

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
                                            admins.find(a => a.admin_id === log.admin_id)?.admin_code,
                                            admins.find(a => a.admin_id === log.admin_id)?.admin_name
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
                  </div>
                )}
              </div>
            )}

            {/* HELP TAB */}
            {currentTab === "help" && (
              <div className="space-y-6">
                {/* Sub-tabs for Help */}
                <div className="bg-white border-b border-gray-200 rounded-t-lg">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => handleSubTabChange("admin")}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        (currentSubTab === "admin" || !currentSubTab)
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Admin Dashboard
                    </button>
                    {session?.type === "super_admin" && (
                      <button
                        onClick={() => handleSubTabChange("superadmin")}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                          currentSubTab === "superadmin"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        Super Admin Dashboard
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin Dashboard Help */}
                {(currentSubTab === "admin" || !currentSubTab) && (
                  <HelpAdminStructure festivalCode={code} />
                )}

                {/* Super Admin Dashboard Help */}
                {currentSubTab === "superadmin" && session?.type === "super_admin" && (
                  <HelpSuperAdminStructure festivalCode={code} />
                )}
              </div>
            )}
          </div>
        </>
      )}

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

      {isImportCollectionsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 pb-4 z-10">
              <h3 className="text-lg font-bold text-gray-800">Import Collections (JSON)</h3>
            </div>
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
                {JSON.stringify(exampleCollections, null, 2)}
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full border rounded p-2 h-40 resize-y"
                placeholder="Paste your JSON array here..."
              />
            </div>
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

      {isImportExpensesOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 pb-4 z-10">
              <h3 className="text-lg font-bold text-gray-800">Import Expenses (JSON)</h3>
            </div>
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
                {JSON.stringify(exampleExpenses, null, 2)}
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full border rounded p-2 h-40 resize-y"
                placeholder="Paste your JSON array here..."
              />
            </div>
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

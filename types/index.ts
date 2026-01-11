export interface Festival {
  id: string
  code: string
  event_name: string
  organiser?: string
  mentor?: string
  guide?: string
  location?: string
  event_start_date?: string
  event_end_date?: string
  ce_start_date?: string // Collection/Expense start date (required)
  ce_end_date?: string // Collection/Expense end date (required)
  ce_dates_updated_at?: string
  other_data?: Record<string, any>
  requires_password: boolean // Whether password is required to view
  requires_user_password: boolean // Legacy field
  user_password?: string
  user_password_updated_at?: string
  admin_password?: string
  admin_password_updated_at?: string
  super_admin_password?: string // New super admin password
  super_admin_password_updated_at?: string
  theme_primary_color?: string
  theme_secondary_color?: string
  theme_bg_color?: string
  theme_bg_image_url?: string
  theme_text_color?: string
  theme_border_color?: string
  theme_table_bg?: string
  theme_card_bg?: string
  theme_dark?: boolean
  created_at?: string
  updated_at?: string
  // Multi-admin system fields
  multi_admin_enabled?: boolean
  banner_show_organiser?: boolean
  banner_show_guide?: boolean
  banner_show_mentor?: boolean
  banner_show_location?: boolean
  banner_show_dates?: boolean
  banner_show_duration?: boolean
  admin_display_preference?: "code" | "name"
  // Download control
  allow_media_download?: boolean
}

export interface BasicInfo {
  id: string
  event_name: string
  organiser: string
  mentor: string
  guide: string
  event_date?: string
  event_start_date?: string
  event_end_date?: string
  location?: string
  other_data?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface Collection {
  id: string
  festival_id?: string
  name: string
  amount: number
  group_name: string
  mode: string
  note?: string
  date: string
  time_hour?: number
  time_minute?: number
  image_url?: string
  created_at: string
  // Multi-admin tracking
  created_by_admin_id?: string
  updated_by_admin_id?: string
  updated_at?: string
}

export interface Expense {
  id: string
  festival_id?: string
  item: string
  pieces: number
  price_per_piece: number
  total_amount: number
  category: string
  mode: string
  note?: string
  date: string
  time_hour?: number
  time_minute?: number
  image_url?: string
  created_at: string
  // Multi-admin tracking
  created_by_admin_id?: string
  updated_by_admin_id?: string
  updated_at?: string
}

export interface Transaction {
  id: string
  type: "collection" | "expense"
  name: string
  amount: number
  group_category: string
  mode: string
  note?: string
  date: string
  time_hour?: number
  time_minute?: number
  created_at: string
}

export interface Stats {
  totalCollection: number
  totalExpense: number
  numDonators: number
  balance: number
}

export interface Album {
  id: string
  festival_id: string
  title: string
  description?: string
  year?: number
  cover_url?: string
  created_at?: string
  // Multi-admin tracking
  created_by_admin_id?: string
  updated_by_admin_id?: string
  // Download control
  allow_download?: boolean
}

export type MediaType = "image" | "video" | "audio" | "pdf" | "other"

export interface MediaItem {
  id: string
  album_id: string
  type: MediaType
  title?: string
  description?: string
  url: string
  mime_type?: string
  size_bytes?: number
  duration_sec?: number
  created_at?: string
  thumbnail_url?: string
  // External link support
  is_external_link?: boolean
  external_link?: string
}

export interface Group {
  id: string
  name: string
  created_at?: string
}

export interface Category {
  id: string
  name: string
  created_at?: string
}

export interface Mode {
  id: string
  name: string
  created_at?: string
}

export interface Password {
  id: string
  user_password: string
  admin_password: string
  updated_at?: string
}

// Multi-Admin System Interfaces
export interface Admin {
  admin_id: string
  festival_id: string
  admin_code: string
  admin_name: string
  admin_password_hash: string
  is_active: boolean
  max_user_passwords: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AdminUserPassword {
  password_id: string
  admin_id: string
  festival_id: string
  password: string
  label: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  usage_count?: number  // Add this
}

export interface AdminActivityLog {
  log_id: string
  festival_id: string
  admin_id?: string
  admin_name?: string
  action_type: string
  action_details?: any
  target_type?: string
  target_id?: string
  ip_address?: string
  user_agent?: string
  timestamp: string
}

// Access Logging & Multiple Passwords System
export interface AccessLog {
  id: string
  festival_id: string
  visitor_name: string
  access_method: "password_modal" | "direct_link"
  password_used: string | null
  accessed_at: string
  user_agent?: string | null
  ip_address?: string | null
  session_id?: string | null
  // Multi-admin tracking
  admin_id?: string
  user_password_id?: string
  auth_method?: string
  // Logout tracking
  logout_at?: string | null
  session_duration_seconds?: number | null
  logout_method?: string | null
}

export interface FestivalPassword {
  id: string
  festival_id: string
  password: string
  password_label?: string | null
  is_active: boolean
  created_at: string
  created_by?: string | null
  last_used_at?: string | null
  usage_count: number
}

export interface VisitorStats {
  festival_id: string
  festival_code: string
  event_name: string
  unique_visitors: number
  total_visits: number
  last_visit?: string | null
  total_visitors: number
  last_visitor_name?: string | null
  last_visitor_at?: string | null
}

export interface UserSession {
  authenticated: boolean
  date: string
  token: string
  visitorName: string
  sessionId: string
  accessMethod: "password_modal" | "direct_link"
  passwordUsed: string
  loggedAt: string
}

// Session Types for Multi-Admin System
export interface VisitorSession {
  type: "visitor"
  festivalId: string
  festivalCode: string
  visitorName: string
  adminId: string
  adminCode: string
  adminName: string
  passwordLabel: string
  passwordId: string // Store password ID to check for updates
  loginTime: string
  sessionId: string
  deviceId?: string
}

export interface AdminSession {
  type: "admin"
  festivalId: string
  festivalCode: string
  adminId: string
  adminCode: string
  adminName: string
  loginTime: string
  sessionId: string
}

export interface SuperAdminSession {
  type: "super_admin"
  festivalId: string
  festivalCode: string
  loginTime: string
  sessionId: string
}

export type SessionData = VisitorSession | AdminSession | SuperAdminSession

// Date validation and out-of-range transaction info
export interface OutOfRangeTransactions {
  collections_out_of_range: number
  expenses_out_of_range: number
  earliest_collection_date: string | null
  latest_collection_date: string | null
  earliest_expense_date: string | null
  latest_expense_date: string | null
}

export interface FestivalDateInfo {
  festival_id: string
  festival_code: string
  event_name: string
  ce_start_date: string | null
  ce_end_date: string | null
  event_start_date: string | null
  event_end_date: string | null
  requires_password: boolean
  has_ce_dates: boolean
  dates_valid: boolean
  total_collections: number
  total_expenses: number
  collections_out_of_range: number
  expenses_out_of_range: number
}

export interface AnalyticsConfig {
  id: string
  festival_id: string
  collection_target_amount?: number
  target_visibility: "public" | "admin_only" // 'public' or 'admin_only'
  previous_year_total_collection?: number
  previous_year_total_expense?: number
  previous_year_net_balance?: number
  donation_buckets?: any
  time_of_day_buckets?: any
  created_at?: string
  updated_at?: string
}

export interface DonationBucket {
  id: string
  festival_id: string
  bucket_label: string
  min_amount: number
  max_amount?: number // null for "above" buckets
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface TimeOfDayBucket {
  id: string
  festival_id: string
  bucket_label: string
  start_hour: number
  start_minute: number
  end_hour: number
  end_minute: number
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface FestivalSnapshot {
  total_collection: number
  total_expense: number
  net_balance: number
  unique_donors: number
  total_transactions: number
}

export interface CollectionByBucket {
  bucket_label: string
  total_amount: number
  donation_count: number
}

export interface CollectionByTimeOfDay {
  bucket_label: string
  total_amount: number
  collection_count: number
}

export interface DailyNetBalance {
  date: string
  collection_total: number
  expense_total: number
  net_balance: number
}

export interface TransactionCountByDay {
  date: string
  collection_count: number
  expense_count: number
  total_count: number
}

export interface TopExpenseItem {
  item: string
  amount: number
  percentage: number
}

// Analytics Card Configuration
export type AnalyticsCardType = 
  | 'festival_snapshot'
  | 'collection_target'
  | 'previous_year_summary'
  | 'donation_buckets'
  | 'time_of_day'
  | 'daily_net_balance'
  | 'top_expenses'
  | 'transaction_count_by_day'
  | 'collections_by_group'
  | 'collections_by_mode'
  | 'expenses_by_category'
  | 'expenses_by_mode'
  | 'top_donators'
  | 'average_donation_per_donor'
  | 'collection_vs_expense_comparison'
  | 'daily_collection_expense_bidirectional';

export interface AnalyticsCard {
  id: string
  festival_id: string
  card_type: AnalyticsCardType
  is_visible: boolean
  sort_order: number
  card_config?: Record<string, any>
  created_at?: string
  updated_at?: string
}

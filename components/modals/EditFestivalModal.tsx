"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
import type { Festival } from "@/types"

interface EditFestivalModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  festival: Festival | null
}

interface FestivalFormData {
  event_name: string
  organiser: string
  mentor: string
  guide: string
  location: string
  event_start_date: string
  event_end_date: string
  ce_start_date: string
  ce_end_date: string
  requires_password: boolean
  user_password: string
  admin_password: string
  super_admin_password: string
  style: {
    title_size: string
    title_weight: string
    title_align: string
    title_color: string
  }
  collection_target_amount: string
  target_visibility: boolean
  previous_year_total_collection: string
  previous_year_total_expense: string
  theme_bg_color: string
  theme_bg_image_url: string
  theme_dark: boolean
  theme_text_color: string
  theme_border_color: string
  allow_media_download: boolean
}

export default function EditFestivalModal({ isOpen, onClose, onSuccess, festival }: EditFestivalModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FestivalFormData>({
    event_name: "",
    organiser: "",
    mentor: "",
    guide: "",
    location: "",
    event_start_date: "",
    event_end_date: "",
    ce_start_date: "",
    ce_end_date: "",
    requires_password: false,
    user_password: "",
    admin_password: "",
    super_admin_password: "",
    style: {
      title_size: "text-3xl",
      title_weight: "font-bold",
      title_align: "text-center",
      title_color: "#000000",
    },
    collection_target_amount: "",
    target_visibility: false,
    previous_year_total_collection: "",
    previous_year_total_expense: "",
    theme_bg_color: "#f8fafc",
    theme_bg_image_url: "",
    theme_dark: false,
    theme_text_color: "",
    theme_border_color: "",
    allow_media_download: true,
  })

  // Initialize form data from festival
  useEffect(() => {
    if (festival && isOpen) {
      const other_data = festival.other_data || {}
      setFormData({
        event_name: festival.event_name || "",
        organiser: festival.organiser || "",
        mentor: festival.mentor || "",
        guide: festival.guide || "",
        location: festival.location || "",
        event_start_date: festival.event_start_date || "",
        event_end_date: festival.event_end_date || "",
        ce_start_date: festival.ce_start_date || "",
        ce_end_date: festival.ce_end_date || "",
        requires_password: festival.requires_password || false,
        user_password: festival.user_password || "",
        admin_password: "",
        super_admin_password: "",
        style: {
          title_size: other_data.title_size || "text-3xl",
          title_weight: other_data.title_weight || "font-bold",
          title_align: other_data.title_align || "text-center",
          title_color: other_data.title_color || "#000000",
        },
        collection_target_amount: other_data.collection_target_amount?.toString() || "",
        target_visibility: other_data.target_visibility || false,
        previous_year_total_collection: other_data.previous_year_total_collection?.toString() || "",
        previous_year_total_expense: other_data.previous_year_total_expense?.toString() || "",
        theme_bg_color: festival.theme_bg_color || "#f8fafc",
        theme_bg_image_url: festival.theme_bg_image_url || "",
        theme_dark: festival.theme_dark || false,
        theme_text_color: festival.theme_text_color || "",
        theme_border_color: festival.theme_border_color || "",
        allow_media_download: festival.allow_media_download !== false,
      })
    }
  }, [festival, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else if (name.startsWith("style.")) {
      const styleKey = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        style: { ...prev.style, [styleKey]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!festival) return

    // Validation
    if (!formData.event_name.trim()) {
      toast.error("Event name is required")
      return
    }

    if (formData.ce_start_date && formData.ce_end_date) {
      const ceStart = new Date(formData.ce_start_date)
      const ceEnd = new Date(formData.ce_end_date)
      if (ceStart > ceEnd) {
        toast.error("CE start date must be before CE end date")
        return
      }
    }

    if (formData.event_start_date && formData.event_end_date) {
      const eventStart = new Date(formData.event_start_date)
      const eventEnd = new Date(formData.event_end_date)
      if (eventStart > eventEnd) {
        toast.error("Event start date must be before event end date")
        return
      }
    }

    try {
      setIsLoading(true)

      const { error } = await supabase
        .from("festivals")
        .update({
          event_name: formData.event_name.trim(),
          organiser: formData.organiser.trim() || null,
          mentor: formData.mentor.trim() || null,
          guide: formData.guide.trim() || null,
          location: formData.location.trim() || null,
          event_start_date: formData.event_start_date || null,
          event_end_date: formData.event_end_date || null,
          ce_start_date: formData.ce_start_date || null,
          ce_end_date: formData.ce_end_date || null,
          requires_password: formData.requires_password,
          user_password: formData.requires_password ? formData.user_password.trim() : null,
          theme_bg_color: formData.theme_bg_color || null,
          theme_bg_image_url: formData.theme_bg_image_url.trim() || null,
          theme_dark: formData.theme_dark,
          theme_text_color: formData.theme_text_color || null,
          theme_border_color: formData.theme_border_color || null,
          allow_media_download: formData.allow_media_download,
          other_data: {
            // Preserve existing analytics settings (managed in Analytics Config Modal)
            ...(festival?.other_data || {}),
            // Update style settings only
            title_size: formData.style.title_size,
            title_weight: formData.style.title_weight,
            title_align: formData.style.title_align,
            title_color: formData.style.title_color,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", festival.id)

      if (error) {
        console.error("Error updating festival:", error)
        toast.error("Failed to update festival")
        return
      }

      toast.success("Festival updated successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error:", error)
      toast.error("An error occurred while updating the festival")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Edit Festival</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                <input
                  type="text"
                  name="event_name"
                  value={formData.event_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organiser</label>
                  <input
                    type="text"
                    name="organiser"
                    value={formData.organiser}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mentor</label>
                  <input
                    type="text"
                    name="mentor"
                    value={formData.mentor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guide</label>
                  <input
                    type="text"
                    name="guide"
                    value={formData.guide}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dates</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Start Date</label>
                  <input
                    type="date"
                    name="event_start_date"
                    value={formData.event_start_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event End Date</label>
                  <input
                    type="date"
                    name="event_end_date"
                    value={formData.event_end_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection/Expense Start Date</label>
                  <input
                    type="date"
                    name="ce_start_date"
                    value={formData.ce_start_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection/Expense End Date</label>
                  <input
                    type="date"
                    name="ce_end_date"
                    value={formData.ce_end_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Style Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Title Style Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title Size</label>
                  <select
                    name="style.title_size"
                    value={formData.style.title_size}
                    onChange={handleChange}
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
                    name="style.title_weight"
                    value={formData.style.title_weight}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="font-normal">Normal</option>
                    <option value="font-semibold">Semibold</option>
                    <option value="font-bold">Bold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title Alignment</label>
                  <select
                    name="style.title_align"
                    value={formData.style.title_align}
                    onChange={handleChange}
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
                    name="style.title_color"
                    value={formData.style.title_color}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                  <input
                    type="color"
                    name="theme_bg_color"
                    value={formData.theme_bg_color}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                  <input
                    type="text"
                    name="theme_bg_image_url"
                    value={formData.theme_bg_image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                  <input
                    type="color"
                    name="theme_text_color"
                    value={formData.theme_text_color}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
                  <input
                    type="color"
                    name="theme_border_color"
                    value={formData.theme_border_color}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="theme_dark"
                    checked={formData.theme_dark}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Dark Mode</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allow_media_download"
                    checked={formData.allow_media_download}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow visitors to download media (festival-wide)</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">When disabled, visitors cannot download any media from showcase</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

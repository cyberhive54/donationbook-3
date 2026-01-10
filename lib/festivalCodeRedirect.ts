import { supabase } from "@/lib/supabase"

/**
 * Checks if the provided festival code is an old code and gets the new code
 * If old code exists, returns the new code; otherwise returns the provided code
 */
export async function resolveCurrentFestivalCode(code: string): Promise<string | null> {
  try {
    // First, try to find a festival with this code directly
    const { data: directFestival } = await supabase.from("festivals").select("code").eq("code", code).single()

    if (directFestival) {
      return directFestival.code
    }

    // If not found directly, check if this is an old code
    const { data: oldCodeHistory } = await supabase
      .from("festival_code_history")
      .select("new_code")
      .eq("old_code", code)
      .order("changed_at", { ascending: false })
      .limit(1)
      .single()

    if (oldCodeHistory) {
      return oldCodeHistory.new_code
    }

    // Code not found (neither current nor in history)
    return null
  } catch (error) {
    console.error("Error resolving festival code:", error)
    return null
  }
}

/**
 * Updates festival code and creates a history entry
 * Validates code format: 6-12 chars, alphanumeric + hyphens only
 */
export async function updateFestivalCode(
  festivalId: string,
  newCode: string,
): Promise<{ success: boolean; error?: string }> {
  // Validate code format
  const codeRegex = /^[a-zA-Z0-9-]{6,12}$/
  if (!codeRegex.test(newCode)) {
    return {
      success: false,
      error: "Code must be 6-12 characters long and contain only alphanumeric characters and hyphens",
    }
  }

  try {
    // Check if new code already exists
    const { data: existingCode } = await supabase.from("festivals").select("id").eq("code", newCode).single()

    if (existingCode && existingCode.id !== festivalId) {
      return { success: false, error: "Code already in use by another festival" }
    }

    // Get current code before updating
    const { data: currentFestival } = await supabase.from("festivals").select("code").eq("id", festivalId).single()

    if (!currentFestival) {
      return { success: false, error: "Festival not found" }
    }

    const oldCode = currentFestival.code

    // Update festival code
    const { error: updateError } = await supabase
      .from("festivals")
      .update({
        code: newCode,
        old_code: oldCode,
        code_updated_at: new Date().toISOString(),
      })
      .eq("id", festivalId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Create history entry
    const { error: historyError } = await supabase.from("festival_code_history").insert({
      festival_id: festivalId,
      old_code: oldCode,
      new_code: newCode,
    })

    if (historyError) {
      console.error("Error creating code history entry:", historyError)
      // Not critical - code was updated but history entry failed
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating festival code:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

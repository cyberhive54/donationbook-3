"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { resolveCurrentFestivalCode } from "@/lib/festivalCodeRedirect"
import toast from "react-hot-toast"

export function CodeRedirectHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useParams<{ code: string }>()
  const code = params?.code as string

  useEffect(() => {
    if (!code) return

    const checkAndRedirect = async () => {
      try {
        const resolvedCode = await resolveCurrentFestivalCode(code)

        if (!resolvedCode) {
          // Code not found at all
          toast.error("Festival not found")
          router.push("/")
          return
        }

        if (resolvedCode !== code) {
          const currentPath = window.location.pathname
          const newPath = currentPath.replace(`/f/${code}`, `/f/${resolvedCode}`)

          // Use replace to maintain page context (e.g., /f/OLDCODE/analytics -> /f/NEWCODE/analytics)
          router.replace(newPath)
          toast.success("Festival code was updated. Redirecting to new code...")
        }
      } catch (error) {
        console.error("Error checking festival code:", error)
        // Silently fail - don't block user
      }
    }

    checkAndRedirect()
  }, [code, router])

  return <>{children}</>
}

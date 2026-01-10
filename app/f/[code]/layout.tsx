import type React from "react"
import { CodeRedirectHandler } from "./redirect-handler"

export default function FestivalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { code: string }
}) {
  return (
    <CodeRedirectHandler>
      {/* ... existing layout content ... */}
      {children}
    </CodeRedirectHandler>
  )
}

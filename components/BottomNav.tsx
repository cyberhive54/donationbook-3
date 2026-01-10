"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Wallet, ArrowLeftRight, ShoppingCart, Sparkles, BarChart3 } from "lucide-react"

interface BottomNavProps {
  code?: string
}

export default function BottomNav({ code }: BottomNavProps) {
  const pathname = usePathname()

  if (!code) return null

  const navItems = [
    { href: `/f/${code}`, label: "Home", icon: Home },
    { href: `/f/${code}/collection`, label: "Collection", icon: Wallet },
    { href: `/f/${code}/transaction`, label: "Transaction", icon: ArrowLeftRight },
    { href: `/f/${code}/expense`, label: "Expense", icon: ShoppingCart },
    { href: `/f/${code}/analytics`, label: "Analytics", icon: BarChart3 },
    { href: `/f/${code}/showcase`, label: "Showcase", icon: Sparkles },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-3 px-3 min-h-[60px] flex-1 transition-colors ${
                  isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-500"
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

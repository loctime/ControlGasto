"use client"

import { ThemeToggleCompact } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { History, Home, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", icon: Home, label: "Inicio" },
    { href: "/history", icon: History, label: "Historial" },
    { href: "/profile", icon: User, label: "Perfil" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          )
        })}
        {/* Toggle de tema */}
        <div className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
          <ThemeToggleCompact />
          <span className="text-xs font-medium">Tema</span>
        </div>
      </div>
    </nav>
  )
}

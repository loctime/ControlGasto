"use client"

import { ThemeToggleCompact } from "@/components/theme-toggle"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import { CalendarClock, History, Home, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "./ui/badge"

export function BottomNav() {
  const pathname = usePathname()
  const { getImportantCount, getBadgeVariant } = useNotifications()

  const importantCount = getImportantCount()
  const badgeVariant = getBadgeVariant()

  const links = [
    { href: "/dashboard", icon: Home, label: "Inicio" },
    { href: "/recurring-items", icon: CalendarClock, label: "Items", showBadge: true },
    { href: "/history", icon: History, label: "Historial" },
    { href: "/profile", icon: User, label: "Perfil" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          const showNotificationBadge = link.showBadge && importantCount > 0
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {showNotificationBadge && (
                  <Badge 
                    variant={badgeVariant} 
                    className="absolute -top-2 -right-2 h-5 min-w-[20px] flex items-center justify-center p-1 text-[10px]"
                  >
                    {importantCount}
                  </Badge>
                )}
              </div>
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

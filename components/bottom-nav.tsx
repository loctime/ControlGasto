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
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Efecto de fondo moderno */}
      <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-primary/20"></div>
      <div className="relative flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          const showNotificationBadge = link.showBadge && importantCount > 0
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300 relative rounded-xl",
                isActive 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-foreground hover:scale-105",
              )}
            >
              <div className="relative">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                  isActive 
                    ? "bg-gradient-to-r from-primary to-accent shadow-lg" 
                    : "hover:bg-primary/10"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive ? "text-white" : "text-current"
                  )} />
                </div>
                {showNotificationBadge && (
                  <Badge 
                    variant={badgeVariant} 
                    className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center p-1 text-[9px] rounded-full animate-pulse"
                  >
                    {importantCount}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium transition-all duration-300",
                isActive ? "font-bold" : ""
              )}>
                {link.label}
              </span>
            </Link>
          )
        })}
        {/* Toggle de tema moderno */}
        <div className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/10 transition-all duration-300">
            <ThemeToggleCompact />
          </div>
          <span className="text-xs font-medium">Tema</span>
        </div>
      </div>
    </nav>
  )
}

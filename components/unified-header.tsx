"use client"

import { useAuth } from "@/components/auth-provider"
import { ThemeToggleCompact } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { usePWAInstall } from "@/hooks/use-pwa-install"
import { formatCurrency } from "@/lib/utils"
import { Calendar, CheckCircle, Clock, DollarSign, Download } from "lucide-react"
import { useEffect, useState } from "react"

interface UnifiedHeaderProps {
  title: string
  subtitle?: string
  showSummary?: boolean
  totalPaid?: number
  totalPending?: number
  totalExpenses?: number
}

export function UnifiedHeader({ 
  title, 
  subtitle, 
  showSummary = false, 
  totalPaid = 0, 
  totalPending = 0, 
  totalExpenses = 0 
}: UnifiedHeaderProps) {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall()
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])


  const handleInstall = async () => {
    await installPWA()
  }

  // Formatear fecha y hora
  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    }
  }

  const { date, time } = formatDateTime(currentTime)

  return (
    <div className="space-y-3">
      {/* Header principal mejorado */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-xl p-3 border border-primary/20 shadow-lg backdrop-blur-sm">
        <div className="flex items-start justify-between">
          {/* Lado izquierdo - Título y saludo */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {subtitle || (user ? `Hola, ${user.displayName || user.email?.split('@')[0] || 'Usuario'}` : 'Gestiona tus gastos mensuales')}
            </p>
          </div>

          {/* Lado derecho - Fecha, hora y controles */}
          <div className="flex flex-col items-end gap-4">
            {/* Botón de instalación */}
            {!isInstalled && isInstallable && (
              <Button
                onClick={handleInstall}
                variant="outline"
                size="sm"
                className="bg-secondary hover:bg-accent border-border"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar App
              </Button>
            )}

            
            {/* Fecha y tema */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="capitalize font-medium">{date.split(',')[0]}</span>
              </div>
              <ThemeToggleCompact />
            </div>
            
            {/* Hora */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-medium">{time.split(':')[0]}:{time.split(':')[1]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen integrado y elegante - Solo si showSummary es true */}
      {showSummary && (
        <div className="bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 rounded-xl p-3 border border-primary/20 shadow-lg backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-6">
            {/* Pagado */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-paid/20 to-paid/10 rounded-full mb-3 shadow-md border border-paid/30">
                <CheckCircle className="w-6 h-6 text-paid drop-shadow-sm" />
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Pagado</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalPaid)}</p>
            </div>

            {/* Pendiente */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pending/20 to-pending/10 rounded-full mb-3 shadow-md border border-pending/30">
                <Clock className="w-6 h-6 text-pending drop-shadow-sm" />
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Pendiente</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalPending)}</p>
            </div>

            {/* Total */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-3 shadow-md border border-primary/30">
                <DollarSign className="w-6 h-6 text-primary drop-shadow-sm" />
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Total</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

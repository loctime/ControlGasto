"use client"

import { useAuth } from "@/components/auth-provider"
import { ThemeToggleCompact } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { usePWAInstall } from "@/hooks/use-pwa-install"
import { formatCurrency } from "@/lib/utils"
import { Calendar, CheckCircle, Clock, DollarSign, Download } from "lucide-react"
import { useEffect, useState } from "react"

interface ExpensesHeaderProps {
  totalPaid: number
  totalPending: number
  totalExpenses: number
}

export function ExpensesHeader({ totalPaid, totalPending, totalExpenses }: ExpensesHeaderProps) {
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
    <div className="space-y-1">
      {/* Header principal mejorado */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-xl p-5 border border-primary/20 shadow-lg backdrop-blur-sm">
        <div className="flex items-start justify-between">
          {/* Lado izquierdo - Título y saludo */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground mb-2 tracking-tight">
              Control-Gastos
            </h1>
            <p className="text-sm text-muted-foreground">
              {user ? `Hola, ${user.displayName || user.email?.split('@')[0] || 'Usuario'}` : 'Gestiona tus gastos mensuales'}
            </p>
          </div>

          {/* Lado derecho - Fecha, hora y controles */}
          <div className="flex flex-col items-end gap-3">
            {/* Botón de instalación */}
            {!isInstalled && isInstallable && (
              <Button
                onClick={handleInstall}
                variant="outline"
                size="sm"
                className="bg-secondary hover:bg-accent border-border text-xs px-3 py-1.5 h-8"
              >
                <Download className="w-3 h-3 mr-1" />
                Instalar
              </Button>
            )}
            
            {/* Fecha y tema */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
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

      {/* Resumen compacto */}
      <div className="bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 rounded-lg p-3 border border-primary/20 shadow-md backdrop-blur-sm">
        <div className="grid grid-cols-3 gap-4">
          {/* Pagado */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-paid/20 to-paid/10 rounded-full mb-2 shadow-sm border border-paid/30">
              <CheckCircle className="w-4 h-4 text-paid drop-shadow-sm" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Pagado</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(totalPaid)}</p>
          </div>

          {/* Pendiente */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-pending/20 to-pending/10 rounded-full mb-2 shadow-sm border border-pending/30">
              <Clock className="w-4 h-4 text-pending drop-shadow-sm" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Pendiente</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(totalPending)}</p>
          </div>

          {/* Total */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-2 shadow-sm border border-primary/30">
              <DollarSign className="w-4 h-4 text-primary drop-shadow-sm" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Total</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

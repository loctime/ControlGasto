"use client"

import { CheckCircle, Clock, DollarSign, Download, Calendar, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggleCompact } from "@/components/theme-toggle"
import { usePWAInstall } from "@/hooks/use-pwa-install"
import { useAuth } from "@/components/auth-provider"
import { formatCurrency } from "@/lib/utils"
import { useState, useEffect } from "react"
import { controlFileService } from "@/lib/controlfile"
import { useToast } from "@/hooks/use-toast"

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
  const [isControlFileConnected, setIsControlFileConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Verificar conexión con ControlFile y mantener estado sincronizado
  useEffect(() => {
    const checkControlFileConnection = async () => {
      try {
        const connected = await controlFileService.isConnected()
        setIsControlFileConnected(connected)
      } catch (error) {
        console.error('Error verificando ControlFile:', error)
      }
    }
    
    checkControlFileConnection()

    // Verificar periódicamente el estado de conexión para mantener sincronización
    const interval = setInterval(checkControlFileConnection, 30000) // Cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  const handleInstall = async () => {
    await installPWA()
  }

  const handleControlFileClick = async () => {
    if (isConnecting) return

    if (isControlFileConnected) {
      // Si ya está conectado, abrir ControlFile
      const url = controlFileService.getControlFileUrl()
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    // Si no está conectado, conectar automáticamente
    setIsConnecting(true)
    
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para conectar con ControlFile",
          variant: "destructive"
        })
        return
      }

      const result = await controlFileService.connectWithMainUserCredentials(user)
      
      if (result.success) {
        setIsControlFileConnected(true)
        toast({
          title: "Conectado exitosamente",
          description: "ControlFile se ha conectado con tu cuenta",
        })
      } else {
        // Si falla el popup, intentar con redirect
        if (result.error === 'POPUP_BLOCKED' || result.error === 'POPUP_CANCELLED') {
          toast({
            title: "Popup bloqueado",
            description: "Redirigiendo a ControlFile para conectar...",
          })
          
          const redirectResult = await controlFileService.connectWithRedirect(user)
          if (!redirectResult.success) {
            toast({
              title: "Error de conexión",
              description: "No se pudo conectar con ControlFile",
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Error de conexión",
            description: result.error || "No se pudo conectar con ControlFile",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error conectando con ControlFile:', error)
      toast({
        title: "Error de conexión",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
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
    <div className="space-y-6">
      {/* Título elegante */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-xl p-6 border border-primary/20 shadow-lg backdrop-blur-sm">
        <div className="flex items-start justify-between">
          {/* Lado izquierdo - Título y saludo */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mb-2">
              {subtitle || (user ? `Hola, ${user.displayName || user.email?.split('@')[0] || 'Usuario'}` : 'Gestiona tus gastos mensuales')}
            </p>
            <button 
              onClick={handleControlFileClick}
              disabled={isConnecting}
              className="flex items-center gap-2 hover:bg-muted/50 rounded-lg px-3 py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm border border-transparent hover:border-border/50 active:scale-95"
            >
              <div className={`w-3 h-3 rounded-full ${isControlFileConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnecting ? 'animate-pulse' : ''}`}></div>
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {isConnecting ? 'Conectando...' : isControlFileConnected ? 'Conexión' : 'Conectar'}
              </span>
            </button>
          </div>

          {/* Lado derecho - Fecha y hora */}
          <div className="flex-1 flex justify-end">
            <div className="text-right">
              {!isInstalled && isInstallable && (
                <div className="mb-2">
                  <Button
                    onClick={handleInstall}
                    variant="outline"
                    size="sm"
                    className="bg-secondary hover:bg-accent border-border"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Instalar App
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-end space-x-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="capitalize">{date}</span>
              </div>
              <div className="flex items-center justify-end space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{time}</span>
                <ThemeToggleCompact />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen integrado y elegante - Solo si showSummary es true */}
      {showSummary && (
        <div className="bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 rounded-xl p-6 border border-primary/20 shadow-lg backdrop-blur-sm">
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

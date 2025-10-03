"use client"

import { CheckCircle, Clock, DollarSign, Download, Calendar, Upload, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggleCompact } from "@/components/theme-toggle"
import { usePWAInstall } from "@/hooks/use-pwa-install"
import { useAuth } from "@/components/auth-provider"
import { formatCurrency } from "@/lib/utils"
import { useState, useEffect } from "react"
import { controlFileService } from "@/lib/controlfile"
import { useToast } from "@/hooks/use-toast"

interface ExpensesHeaderProps {
  totalPaid: number
  totalPending: number
  totalExpenses: number
}

export function ExpensesHeader({ totalPaid, totalPending, totalExpenses }: ExpensesHeaderProps) {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall()
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isControlFileConnected, setIsControlFileConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showConnectedMessage, setShowConnectedMessage] = useState(false)
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

  // Cerrar mensaje al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showConnectedMessage) {
        const target = event.target as Element
        if (!target.closest('.controlfile-message-container')) {
          setShowConnectedMessage(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showConnectedMessage])

  const handleInstall = async () => {
    await installPWA()
  }

  const handleControlFileClick = async () => {
    if (isConnecting) return

    if (isControlFileConnected) {
      // Si ya está conectado, mostrar mensaje y opción de ir a ControlFile
      setShowConnectedMessage(true)
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

  const handleGoToControlFile = () => {
    const url = controlFileService.getControlFileUrl()
    window.open(url, '_blank', 'noopener,noreferrer')
    setShowConnectedMessage(false)
  }

  const handleCloseMessage = () => {
    setShowConnectedMessage(false)
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
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {user ? `Hola, ${user.displayName || user.email?.split('@')[0] || 'Usuario'}` : 'Gestiona tus gastos mensuales'}
              </p>
              <div className="relative controlfile-message-container">
                <button 
                  onClick={handleControlFileClick}
                  disabled={isConnecting}
                  className="flex items-center gap-2 hover:bg-muted/50 rounded-lg px-3 py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm border border-transparent hover:border-border/50 active:scale-95"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${isControlFileConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnecting ? 'animate-pulse' : ''}`}></div>
                  <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {isConnecting ? 'Conectando...' : isControlFileConnected ? 'Conexión' : 'Conectar'}
                  </span>
                </button>

                {/* Mensaje de conexión */}
                {showConnectedMessage && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-2">
                          Estás conectado a ControlFile
                        </p>
                        <Button
                          onClick={handleGoToControlFile}
                          size="sm"
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          IR
                        </Button>
                      </div>
                      <button
                        onClick={handleCloseMessage}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

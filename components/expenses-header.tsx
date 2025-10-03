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

interface ExpensesHeaderProps {
  totalPaid: number
  totalPending: number
  totalExpenses: number
}

export function ExpensesHeader({ totalPaid, totalPending, totalExpenses }: ExpensesHeaderProps) {
  const { isInstallable, installPWA } = usePWAInstall()
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isControlFileConnected, setIsControlFileConnected] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Verificar conexión con ControlFile
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
  }, [])

  const handleInstall = async () => {
    await installPWA()
  }

  const handleExportToControlFile = async () => {
    if (!isControlFileConnected) {
      toast({
        title: "No conectado con ControlFile",
        description: "Ve a tu perfil para conectar con ControlFile primero",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    try {
      // Crear un resumen de gastos en formato JSON
      const expensesData = {
        totalPaid,
        totalPending,
        totalExpenses,
        exportDate: new Date().toISOString(),
        user: user?.email
      }

      const jsonString = JSON.stringify(expensesData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const file = new File([blob], `gastos-${new Date().toISOString().split('T')[0]}.json`, { type: 'application/json' })

      const result = await controlFileService.uploadFile(file, 'GastosApp')
      
      if (result.success) {
        toast({
          title: "Exportado exitosamente",
          description: "Los datos se han guardado en ControlFile",
        })
      } else {
        toast({
          title: "Error al exportar",
          description: result.error || "No se pudo exportar a ControlFile",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
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
          {/* Lado izquierdo. - Título y saludo */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
              Control-Gastos
              <div className={`w-2 h-2 rounded-full ${isControlFileConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </h1>
            <p className="text-sm text-muted-foreground">
              {user ? `Hola, ${user.displayName || user.email?.split('@')[0] || 'Usuario'}` : 'Gestiona tus gastos mensuales'}
            </p>
          </div>

          {/* Lado derecho - Fecha y hora */}
          <div className="flex-1 flex justify-end">
            <div className="text-right">
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

      {/* Resumen integrado y elegante */}
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
    </div>
  )
}

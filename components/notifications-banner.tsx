"use client"

import { useAuth } from '@/components/auth-provider'
import { usePWAInstall } from '@/hooks/use-pwa-install'
import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ThemeToggleCompact } from './theme-toggle'
import { Button } from './ui/button'

export function NotificationsBanner() {
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

  const handleInstall = async () => {
    await installPWA()
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-xl p-4 border border-primary/20 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Lado izquierdo - Título y saludo */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground mb-1 tracking-tight">
            Control-Gastos
          </h1>
          <p className="text-xs text-muted-foreground">
            {user ? `Hola, ${user.displayName || user.email?.split('@')[0] || 'Usuario'}` : 'Gestiona tus gastos mensuales'}
          </p>
        </div>

        {/* Lado derecho - Fecha, hora y controles */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Botón de instalación */}
          {!isInstalled && isInstallable && (
            <Button
              onClick={handleInstall}
              variant="outline"
              size="sm"
              className="bg-secondary hover:bg-accent border-border text-xs px-2 py-1 h-7"
            >
              <Download className="w-3 h-3 mr-1" />
              Instalar
            </Button>
          )}
          
          {/* Fecha y tema */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize font-medium">{date.split(',')[0]}</span>
            <ThemeToggleCompact />
          </div>
          
          {/* Hora */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
            {time.split(':')[0]}:{time.split(':')[1]}
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useNotifications } from '@/hooks/use-notifications'
import { AlertCircle, Bell, BellOff, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

export function NotificationsBanner() {
  const { stats, permission, requestPermission, hasImportantNotifications, getNotificationMessage } = useNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(permission === 'default')
  const router = useRouter()

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      setShowPermissionPrompt(false)
    }
  }

  const handleGoToPayments = () => {
    router.push('/dashboard')
  }

  // No mostrar si no hay notificaciones importantes y no hay prompt de permisos
  if (!hasImportantNotifications && !showPermissionPrompt) {
    return null
  }

  // Si el usuario lo cerró, no mostrar
  if (dismissed) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* Banner de permisos de notificación */}
      {showPermissionPrompt && permission === 'default' && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertTitle>Habilita las notificaciones</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              Recibe avisos de pagos pendientes y vencidos directamente en tu navegador.
            </span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleRequestPermission}
              >
                Activar
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setShowPermissionPrompt(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Banner de notificaciones bloqueadas */}
      {permission === 'denied' && hasImportantNotifications && (
        <Alert variant="destructive">
          <BellOff className="h-4 w-4" />
          <AlertTitle>Notificaciones bloqueadas</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              Las notificaciones están bloqueadas. Actívalas en la configuración de tu navegador para recibir avisos.
            </span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Banner de items vencidos */}
      {stats.overdueCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Pagos Vencidos
            <Badge variant="destructive">{stats.overdueCount}</Badge>
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              {stats.overdueCount === 1 
                ? 'Tienes 1 pago vencido que requiere tu atención' 
                : `Tienes ${stats.overdueCount} pagos vencidos que requieren tu atención`}
            </span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleGoToPayments}
              >
                Ver Pagos
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Banner de items para hoy (solo si no hay vencidos) */}
      {stats.overdueCount === 0 && stats.dueTodayCount > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Pagos para Hoy
            <Badge>{stats.dueTodayCount}</Badge>
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              {stats.dueTodayCount === 1 
                ? 'Tienes 1 pago programado para hoy' 
                : `Tienes ${stats.dueTodayCount} pagos programados para hoy`}
            </span>
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={handleGoToPayments}
              >
                Ver Pagos
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}


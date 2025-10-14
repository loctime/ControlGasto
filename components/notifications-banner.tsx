"use client"

import { useNotifications } from '@/hooks/use-notifications'
import { AlertCircle, Bell, BellOff, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert } from './ui/alert'
import { Button } from './ui/button'

export function NotificationsBanner() {
  const { stats, permission, requestPermission, hasImportantNotifications } = useNotifications()
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

  // Determinar el contenido principal y secundario
  const getNotificationContent = () => {
    // Prioridad 1: Items vencidos
    if (stats.overdueCount > 0) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        title: null,
        badge: null,
        description: stats.overdueCount === 1 
          ? '1 pago vencido requiere atención' 
          : `${stats.overdueCount} pagos vencidos requieren atención`,
        variant: 'destructive' as const,
        actionText: 'Ver Pagos',
        onAction: handleGoToPayments
      }
    }

    // Prioridad 2: Items para hoy
    if (stats.dueTodayCount > 0) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        title: null,
        badge: null,
        description: stats.dueTodayCount === 1 
          ? '1 pago programado para hoy' 
          : `${stats.dueTodayCount} pagos programados para hoy`,
        variant: 'default' as const,
        actionText: 'Ver Pagos',
        onAction: handleGoToPayments
      }
    }

    // Prioridad 3: Permisos de notificación
    if (showPermissionPrompt && permission === 'default') {
      return {
        icon: <Bell className="h-4 w-4" />,
        title: "Habilita notificaciones",
        badge: null,
        description: 'Recibe avisos de pagos directamente en tu navegador',
        variant: 'default' as const,
        actionText: 'Activar',
        onAction: handleRequestPermission
      }
    }

    // Prioridad 4: Notificaciones bloqueadas
    if (permission === 'denied' && hasImportantNotifications) {
      return {
        icon: <BellOff className="h-4 w-4" />,
        title: "Notificaciones bloqueadas",
        badge: null,
        description: 'Actívalas en configuración del navegador',
        variant: 'destructive' as const,
        actionText: 'Entendido',
        onAction: () => setDismissed(true)
      }
    }

    return null
  }

  const content = getNotificationContent()
  if (!content) return null

  return (
    <Alert variant={content.variant} className="py-3">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {content.icon}
          {content.title && <span className="font-medium text-sm">{content.title}</span>}
          {content.badge}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {content.description}
          </span>
          <Button 
            size="sm" 
            variant={content.variant === 'destructive' ? 'outline' : 'default'}
            className="h-7 px-3 text-xs"
            onClick={content.onAction}
          >
            {content.actionText}
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {/* Descripción completa en móvil */}
      <div className="sm:hidden mt-2 text-xs text-muted-foreground">
        {content.description}
      </div>
    </Alert>
  )
}


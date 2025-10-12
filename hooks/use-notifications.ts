"use client"

import { useAuth } from '@/components/auth-provider'
import { notificationsService } from '@/lib/notifications-service'
import { RecurringItemsService } from '@/lib/recurring-items-service'
import { NotificationStats, RecurringItemInstance } from '@/lib/types'
import { useCallback, useEffect, useState } from 'react'

export function useNotifications() {
  const { user } = useAuth()
  const [stats, setStats] = useState<NotificationStats>({
    overdueCount: 0,
    dueTodayCount: 0,
    dueSoonCount: 0,
    totalPending: 0
  })
  const [instances, setInstances] = useState<RecurringItemInstance[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(true)

  // Verificar permisos
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Solicitar permisos de notificación
  const requestPermission = useCallback(async () => {
    const granted = await notificationsService.requestNotificationPermission()
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
    return granted
  }, [])

  // Cargar y verificar items
  const checkItems = useCallback(async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      const service = new RecurringItemsService(user.uid)
      
      // Verificar y generar nuevos periodos
      await service.checkAndGenerateNewPeriods()
      
      // Obtener instancias activas
      const activeInstances = await service.getActiveInstances()
      setInstances(activeInstances)

      // Calcular estadísticas
      const notificationStats = notificationsService.checkDueItems(activeInstances)
      setStats(notificationStats)

      // Enviar notificaciones si hay permisos
      if (notificationsService.hasNotificationPermission()) {
        await notificationsService.scheduleNotifications(activeInstances)
      }
    } catch (error) {
      console.error('Error verificando items:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Verificar items al montar y cada 5 minutos
  useEffect(() => {
    checkItems()

    const interval = setInterval(() => {
      checkItems()
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [checkItems])

  // Refrescar manualmente
  const refresh = useCallback(async () => {
    await checkItems()
  }, [checkItems])

  // Obtener color del badge según prioridad
  const getBadgeVariant = useCallback((): "default" | "destructive" | "secondary" => {
    if (stats.overdueCount > 0) return "destructive"
    if (stats.dueTodayCount > 0) return "default"
    return "secondary"
  }, [stats])

  // Obtener conteo total de notificaciones importantes
  const getImportantCount = useCallback((): number => {
    return stats.overdueCount + stats.dueTodayCount
  }, [stats])

  // Obtener mensaje descriptivo
  const getNotificationMessage = useCallback((): string | null => {
    if (stats.overdueCount > 0) {
      return stats.overdueCount === 1 
        ? 'Tienes 1 pago vencido' 
        : `Tienes ${stats.overdueCount} pagos vencidos`
    }
    if (stats.dueTodayCount > 0) {
      return stats.dueTodayCount === 1 
        ? 'Tienes 1 pago para hoy' 
        : `Tienes ${stats.dueTodayCount} pagos para hoy`
    }
    if (stats.dueSoonCount > 0) {
      return stats.dueSoonCount === 1 
        ? 'Tienes 1 pago próximamente' 
        : `Tienes ${stats.dueSoonCount} pagos próximamente`
    }
    return null
  }, [stats])

  return {
    stats,
    instances,
    permission,
    loading,
    requestPermission,
    refresh,
    getBadgeVariant,
    getImportantCount,
    getNotificationMessage,
    hasNotifications: stats.totalPending > 0,
    hasImportantNotifications: stats.overdueCount > 0 || stats.dueTodayCount > 0
  }
}


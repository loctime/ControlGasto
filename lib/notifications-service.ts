import { addDays, endOfDay, format, isBefore, isToday, isWithinInterval, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { NotificationStats, RecurringItemInstance } from './types'

export class NotificationsService {
  private static instance: NotificationsService
  private notificationPermission: NotificationPermission = 'default'

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.notificationPermission = Notification.permission
    }
  }

  static getInstance(): NotificationsService {
    if (!NotificationsService.instance) {
      NotificationsService.instance = new NotificationsService()
    }
    return NotificationsService.instance
  }

  // ========== PERMISOS ==========

  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Las notificaciones no están soportadas en este navegador')
      return false
    }

    if (this.notificationPermission === 'granted') {
      return true
    }

    try {
      const permission = await Notification.requestPermission()
      this.notificationPermission = permission
      
      if (permission === 'granted') {
        console.log('✅ Permisos de notificación concedidos')
        return true
      } else {
        console.log('❌ Permisos de notificación denegados')
        return false
      }
    } catch (error) {
      console.error('Error solicitando permisos de notificación:', error)
      return false
    }
  }

  hasNotificationPermission(): boolean {
    return this.notificationPermission === 'granted'
  }

  getNotificationPermission(): NotificationPermission {
    return this.notificationPermission
  }

  // ========== NOTIFICACIONES PUSH ==========

  async sendPushNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.hasNotificationPermission()) {
      console.warn('No hay permisos para enviar notificaciones')
      return
    }

    try {
      // Si hay service worker registrado, usar showNotification
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(title, {
          icon: '/icon-192.jpg',
          badge: '/icon-192.jpg',
          ...options
        })
      } else {
        // Fallback a notificación simple
        new Notification(title, {
          icon: '/icon-192.jpg',
          badge: '/icon-192.jpg',
          ...options
        })
      }

      console.log('✅ Notificación enviada:', title)
    } catch (error) {
      console.error('Error enviando notificación:', error)
    }
  }

  // ========== VERIFICACIÓN DE ITEMS ==========

  checkDueItems(instances: RecurringItemInstance[]): NotificationStats {
    const now = new Date()
    const today = startOfDay(now)
    const threeDaysLater = endOfDay(addDays(now, 3))

    const stats: NotificationStats = {
      overdueCount: 0,
      dueTodayCount: 0,
      dueSoonCount: 0,
      totalPending: instances.length
    }

    for (const instance of instances) {
      const dueDate = new Date(instance.dueDate)

      if (instance.status === 'overdue' || isBefore(endOfDay(dueDate), today)) {
        stats.overdueCount++
      } else if (isToday(dueDate)) {
        stats.dueTodayCount++
      } else if (isWithinInterval(dueDate, { start: today, end: threeDaysLater })) {
        stats.dueSoonCount++
      }
    }

    return stats
  }

  async notifyOverdueItems(instances: RecurringItemInstance[]): Promise<void> {
    const overdueItems = instances.filter(inst => inst.status === 'overdue')

    if (overdueItems.length === 0) return

    const title = overdueItems.length === 1
      ? 'Tienes 1 pago vencido'
      : `Tienes ${overdueItems.length} pagos vencidos`

    const body = overdueItems.length === 1
      ? `${overdueItems[0].itemName}: $${overdueItems[0].amount.toLocaleString('es-AR')}`
      : `Revisa tus pagos pendientes`

    await this.sendPushNotification(title, {
      body,
      tag: 'overdue-items',
      requireInteraction: true,
      data: { type: 'overdue', count: overdueItems.length }
    })
  }

  async notifyDueToday(instances: RecurringItemInstance[]): Promise<void> {
    const dueTodayItems = instances.filter(inst => isToday(inst.dueDate))

    if (dueTodayItems.length === 0) return

    const title = dueTodayItems.length === 1
      ? 'Tienes 1 pago para hoy'
      : `Tienes ${dueTodayItems.length} pagos para hoy`

    const body = dueTodayItems.length === 1
      ? `${dueTodayItems[0].itemName}: $${dueTodayItems[0].amount.toLocaleString('es-AR')}`
      : `Revisa tus pagos del día`

    await this.sendPushNotification(title, {
      body,
      tag: 'due-today',
      data: { type: 'due-today', count: dueTodayItems.length }
    })
  }

  async notifyDueSoon(instances: RecurringItemInstance[]): Promise<void> {
    const now = new Date()
    const today = startOfDay(now)
    const threeDaysLater = endOfDay(addDays(now, 3))

    const dueSoonItems = instances.filter(inst => {
      const dueDate = new Date(inst.dueDate)
      return !isToday(dueDate) && isWithinInterval(dueDate, { start: today, end: threeDaysLater })
    })

    if (dueSoonItems.length === 0) return

    const nextItem = dueSoonItems[0]
    const daysUntil = Math.ceil((new Date(nextItem.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const title = 'Próximos pagos pendientes'
    const body = `${nextItem.itemName} vence en ${daysUntil} día${daysUntil > 1 ? 's' : ''}`

    await this.sendPushNotification(title, {
      body,
      tag: 'due-soon',
      data: { type: 'due-soon', count: dueSoonItems.length }
    })
  }

  // ========== PROGRAMACIÓN DE NOTIFICACIONES ==========

  async scheduleNotifications(instances: RecurringItemInstance[]): Promise<void> {
    if (!this.hasNotificationPermission()) {
      return
    }

    const stats = this.checkDueItems(instances)

    // Notificar items vencidos (alta prioridad)
    if (stats.overdueCount > 0) {
      await this.notifyOverdueItems(instances)
    }

    // Notificar items de hoy (si no hay vencidos para no saturar)
    if (stats.overdueCount === 0 && stats.dueTodayCount > 0) {
      await this.notifyDueToday(instances)
    }
  }

  // ========== UTILIDADES ==========

  formatItemForNotification(instance: RecurringItemInstance): string {
    const dueDate = new Date(instance.dueDate)
    return `${instance.itemName} - $${instance.amount.toLocaleString('es-AR')} - ${format(dueDate, 'dd/MM/yyyy', { locale: es })}`
  }

  getBadgeColor(status: 'overdue' | 'due-today' | 'due-soon'): string {
    switch (status) {
      case 'overdue':
        return 'destructive' // Rojo
      case 'due-today':
        return 'default' // Amarillo/Naranja
      case 'due-soon':
        return 'secondary' // Azul/Gris
      default:
        return 'default'
    }
  }

  // ========== SERVICE WORKER ==========

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Workers no están soportados en este navegador')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('✅ Service Worker registrado:', registration.scope)
      return registration
    } catch (error) {
      console.error('Error registrando Service Worker:', error)
      return null
    }
  }
}

// Exportar instancia singleton
export const notificationsService = NotificationsService.getInstance()


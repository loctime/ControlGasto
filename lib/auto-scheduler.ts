"use client"

import { useAuth } from '@/components/auth-provider'
import { useCallback, useEffect } from 'react'
import { notificationsService } from './notifications-service'
import { RecurringItemsService } from './recurring-items-service'

// Variable global para controlar ejecuciones simultáneas
let isSchedulerRunning = false
let lastExecutionTime = 0
const MIN_EXECUTION_INTERVAL = 60000 // 60 segundos mínimo entre ejecuciones
let executionCount = 0
const MAX_EXECUTIONS_PER_SESSION = 3 // Máximo 3 ejecuciones por sesión

/**
 * Hook que ejecuta verificaciones automáticas de items recurrentes
 * - Se ejecuta al montar el componente
 * - Se ejecuta cada 5 minutos
 * - Genera instancias faltantes
 * - Actualiza estados de items vencidos
 * - Envía notificaciones si corresponde
 */
export function useAutoScheduler() {
  const { user } = useAuth()

  const runScheduler = useCallback(async () => {
    if (!user?.uid) return

    // Prevenir ejecuciones simultáneas
    if (isSchedulerRunning) {
      console.log('[AutoScheduler] Ya hay una ejecución en curso, saltando...')
      return
    }

    // Prevenir ejecuciones muy frecuentes
    const now = Date.now()
    if (now - lastExecutionTime < MIN_EXECUTION_INTERVAL) {
      console.log('[AutoScheduler] Ejecución muy reciente, saltando...')
      return
    }

    // Prevenir demasiadas ejecuciones por sesión
    if (executionCount >= MAX_EXECUTIONS_PER_SESSION) {
      console.log('[AutoScheduler] Máximo de ejecuciones alcanzado para esta sesión')
      return
    }

    isSchedulerRunning = true
    lastExecutionTime = now
    executionCount++

    try {
      console.log(`[AutoScheduler] Ejecutando verificación (${executionCount}/${MAX_EXECUTIONS_PER_SESSION})...`)
      
      const service = new RecurringItemsService(user.uid)

      // 1. Verificar y generar nuevos periodos
      await service.checkAndGenerateNewPeriods()

      // 2. Obtener instancias activas
      const activeInstances = await service.getActiveInstances()

      // 3. Programar notificaciones si hay permisos
      if (notificationsService.hasNotificationPermission()) {
        await notificationsService.scheduleNotifications(activeInstances)
      }

      console.log('[AutoScheduler] Verificación completada')
      console.log(`[AutoScheduler] ${activeInstances.length} instancias activas`)
    } catch (error) {
      console.error('[AutoScheduler] Error en verificación:', error)
    } finally {
      isSchedulerRunning = false
    }
  }, [user])

  useEffect(() => {
    if (!user?.uid) return

    // Ejecutar inmediatamente al montar
    runScheduler()

    // Ejecutar cada 5 minutos
    const interval = setInterval(() => {
      runScheduler()
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [user?.uid, runScheduler])

  return { runScheduler }
}

/**
 * Función para verificar items manualmente
 * Útil para llamar después de crear/editar items
 */
export async function manualSchedulerCheck(userId: string): Promise<void> {
  try {
    const service = new RecurringItemsService(userId)
    await service.checkAndGenerateNewPeriods()
    
    const activeInstances = await service.getActiveInstances()
    
    if (notificationsService.hasNotificationPermission()) {
      await notificationsService.scheduleNotifications(activeInstances)
    }
    
    console.log('[ManualScheduler] Verificación manual completada')
  } catch (error) {
    console.error('[ManualScheduler] Error en verificación manual:', error)
    throw error
  }
}

/**
 * Función para registrar el Service Worker y configurar notificaciones
 * Se debe llamar una sola vez al iniciar la aplicación
 */
export async function initializeNotificationSystem(): Promise<void> {
  try {
    // Registrar Service Worker
    const registration = await notificationsService.registerServiceWorker()
    
    if (registration) {
      console.log('[NotificationSystem] Service Worker registrado correctamente')
    }

    // Verificar permisos de notificación
    if (notificationsService.hasNotificationPermission()) {
      console.log('[NotificationSystem] Permisos de notificación concedidos')
    } else {
      console.log('[NotificationSystem] Permisos de notificación no concedidos')
    }
  } catch (error) {
    console.error('[NotificationSystem] Error inicializando sistema de notificaciones:', error)
  }
}


"use client"

import { initializeNotificationSystem } from '@/lib/auto-scheduler'
import { useEffect } from 'react'

/**
 * Componente que inicializa el sistema de notificaciones
 * Se ejecuta una sola vez al cargar la aplicación
 */
export function NotificationInitializer() {
  useEffect(() => {
    // Inicializar sistema de notificaciones (Service Worker)
    initializeNotificationSystem().catch(error => {
      console.error('Error inicializando sistema de notificaciones:', error)
    })
  }, [])

  return null // No renderiza nada
}


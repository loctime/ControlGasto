"use client"

import { useEffect, useRef } from "react"
import { useControlFileSync } from "./use-controlfile-sync"

export function useDashboardSync() {
  const { triggerDashboardSync, isControlFileConnected, isSyncing } = useControlFileSync()
  const hasTriggered = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Activar sincronización automática cuando el usuario entra al dashboard
  useEffect(() => {
    // Solo ejecutar una vez por sesión
    if (hasTriggered.current) return
    
    hasTriggered.current = true
    
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Pequeño delay para asegurar que el dashboard esté completamente cargado
    timeoutRef.current = setTimeout(() => {
      triggerDashboardSync()
    }, 2000) // Aumentar delay para evitar conflictos

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, []) // Dependencias vacías para ejecutar solo una vez

  return {
    isControlFileConnected,
    isSyncing
  }
}

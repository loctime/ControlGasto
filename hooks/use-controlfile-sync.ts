"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { controlFileService } from "@/lib/controlfile"
import { useToast } from "@/hooks/use-toast"

export function useControlFileSync() {
  const { user: mainUser } = useAuth()
  const [isControlFileConnected, setIsControlFileConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [controlFileUser, setControlFileUser] = useState<any>(null)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    // Sincronización automática deshabilitada por defecto
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('controlfile-auto-sync-enabled')
      return stored === 'true'
    }
    return false
  })
  const { toast } = useToast()

  // Verificar estado inicial de ControlFile
  useEffect(() => {
    const checkInitialConnection = async () => {
      try {
        // Primero verificar si hay un resultado de redirect pendiente
        const redirectResult = await controlFileService.checkRedirectResult()
        if (redirectResult.success) {
          setIsControlFileConnected(true)
          setControlFileUser(redirectResult.user)
          
          toast({
            title: "ControlFile conectado",
            description: "Tu cuenta se ha conectado con ControlFile",
          })
          return
        }

        // Intentar restaurar sesión guardada
        const restoreResult = await controlFileService.restoreSession()
        if (restoreResult.success) {
          setIsControlFileConnected(true)
          setControlFileUser(restoreResult.user)
          
          toast({
            title: "ControlFile restaurado",
            description: "Tu sesión de ControlFile se ha restaurado automáticamente",
          })
          return
        }

        // Si no hay redirect ni sesión guardada, verificar conexión normal
        const connected = await controlFileService.isConnected()
        setIsControlFileConnected(connected)
        
        if (connected) {
          const user = await controlFileService.getCurrentUser()
          setControlFileUser(user)
        }
      } catch (error) {
        console.error('Error verificando conexión inicial de ControlFile:', error)
      }
    }

    checkInitialConnection()
  }, [])

  // Sincronización automática cuando el usuario principal se autentica
  useEffect(() => {
    if (!mainUser || !autoSyncEnabled) return

    const syncWithControlFile = async () => {
      // Si ya está conectado, no hacer nada
      if (isControlFileConnected) return

      setIsSyncing(true)
      
      try {
        const result = await controlFileService.connectWithMainUserCredentials(mainUser)
        
        if (result.success) {
          setIsControlFileConnected(true)
          setControlFileUser(result.user)
          
          toast({
            title: "ControlFile conectado automáticamente",
            description: "Tu cuenta se ha sincronizado con ControlFile",
          })
        } else {
          console.warn('No se pudo conectar automáticamente con ControlFile:', result.error)
          
          // Manejar diferentes tipos de errores de manera silenciosa
          if (result.error === 'POPUP_BLOCKED') {
            // Popup bloqueado - no mostrar error, solo log
            console.log('Popup bloqueado - sincronización automática no disponible')
          } else if (result.error === 'POPUP_CANCELLED' || result.error === 'auth/cancelled-popup-request') {
            // Popup cancelado por el usuario - no mostrar error
            console.log('Popup cancelado por el usuario - sincronización automática no disponible')
          } else if (result.error && !result.error.includes('POPUP_BLOCKED') && !result.error.includes('POPUP_CANCELLED') && !result.error.includes('cancelled-popup-request')) {
            toast({
              title: "Sincronización automática no disponible",
              description: "Puedes conectar manualmente con ControlFile desde el perfil",
              variant: "destructive"
            })
          }
        }
      } catch (error) {
        console.error('Error en sincronización automática:', error)
        // No mostrar error al usuario para no interrumpir la experiencia
      } finally {
        setIsSyncing(false)
      }
    }

    // Pequeño delay para asegurar que el usuario principal esté completamente autenticado
    const timeoutId = setTimeout(syncWithControlFile, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [mainUser, autoSyncEnabled, isControlFileConnected, toast])

  // Sincronización automática cuando el usuario navega al dashboard
  const triggerDashboardSync = async () => {
    if (!mainUser || !autoSyncEnabled || isControlFileConnected || isSyncing) return

    setIsSyncing(true)
    
    try {
      const result = await controlFileService.connectWithMainUserCredentials(mainUser)
      
      if (result.success) {
        setIsControlFileConnected(true)
        setControlFileUser(result.user)
        
        toast({
          title: "ControlFile conectado automáticamente",
          description: "Tu cuenta se ha sincronizado con ControlFile",
        })
      } else {
        console.warn('No se pudo conectar automáticamente con ControlFile desde dashboard:', result.error)
        
        // Si popup es bloqueado o cancelado desde dashboard, no mostrar toast para evitar spam
        if (result.error === 'POPUP_BLOCKED' || result.error === 'POPUP_CANCELLED' || result.error === 'auth/cancelled-popup-request') {
          console.log('Popup bloqueado/cancelado desde dashboard - sincronización no disponible')
        }
      }
    } catch (error) {
      console.error('Error en sincronización automática desde dashboard:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Desconectar cuando el usuario principal se desconecta
  useEffect(() => {
    if (!mainUser && isControlFileConnected) {
      const disconnectControlFile = async () => {
        try {
          await controlFileService.disconnect()
          setIsControlFileConnected(false)
          setControlFileUser(null)
        } catch (error) {
          console.error('Error desconectando ControlFile:', error)
        }
      }

      disconnectControlFile()
    }
  }, [mainUser, isControlFileConnected])

  // Conectar manualmente (para casos donde la auto-sincronización falla)
  const connectManually = async () => {
    setIsSyncing(true)
    
    try {
      const result = await controlFileService.connect()
      
      if (result.success) {
        setIsControlFileConnected(true)
        setControlFileUser(result.user)
        
        toast({
          title: "Conectado exitosamente",
          description: "Tu cuenta se ha conectado con ControlFile",
        })
      } else {
        toast({
          title: "Error de conexión",
          description: result.error || "No se pudo conectar con ControlFile",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Desconectar manualmente
  const disconnectManually = async () => {
    setIsSyncing(true)
    
    try {
      const result = await controlFileService.disconnect()
      
      if (result.success) {
        setIsControlFileConnected(false)
        setControlFileUser(null)
        
        toast({
          title: "Desconectado",
          description: "Se ha desconectado de ControlFile",
        })
      } else {
        toast({
          title: "Error al desconectar",
          description: result.error || "No se pudo desconectar",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error al desconectar",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Reintentar sincronización automática
  const retryAutoSync = async () => {
    if (!mainUser) return

    setIsSyncing(true)
    
    try {
      const result = await controlFileService.connectWithMainUserCredentials(mainUser)
      
      if (result.success) {
        setIsControlFileConnected(true)
        setControlFileUser(result.user)
        
        toast({
          title: "Sincronización exitosa",
          description: "ControlFile se ha conectado automáticamente",
        })
      } else {
        toast({
          title: "Error de sincronización",
          description: result.error || "No se pudo sincronizar automáticamente",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error de sincronización",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Conectar usando redirect (alternativa cuando popup es bloqueado)
  const connectWithRedirect = async () => {
    if (!mainUser) return

    setIsSyncing(true)
    
    try {
      const result = await controlFileService.connectWithRedirect(mainUser)
      
      if (result.success) {
        // El redirect se completará en la próxima carga de la página
        toast({
          title: "Redirigiendo a ControlFile",
          description: "Serás redirigido para conectar con ControlFile",
        })
      } else {
        toast({
          title: "Error de conexión",
          description: result.error || "No se pudo conectar con redirect",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Función para cambiar el estado de sincronización automática
  const handleAutoSyncToggle = (enabled: boolean) => {
    setAutoSyncEnabled(enabled)
    
    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('controlfile-auto-sync-enabled', enabled.toString())
    }
    
    if (!enabled) {
      toast({
        title: "Sincronización automática desactivada",
        description: "ControlFile no se conectará automáticamente. Puedes activarlo nuevamente desde la configuración.",
      })
    } else {
      toast({
        title: "Sincronización automática activada",
        description: "ControlFile se conectará automáticamente cuando te autentiques.",
      })
    }
  }

  return {
    isControlFileConnected,
    isSyncing,
    controlFileUser,
    autoSyncEnabled,
    setAutoSyncEnabled: handleAutoSyncToggle,
    connectManually,
    disconnectManually,
    retryAutoSync,
    connectWithRedirect,
    triggerDashboardSync
  }
}

"use client"

import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { controlFileService } from "@/lib/controlfile"
import { createContext, ReactNode, useContext, useEffect, useState } from "react"

interface ControlFileContextType {
  isControlFileConnected: boolean
  isConnecting: boolean
  controlFileUser: any
  connectControlFile: () => Promise<void>
  disconnectControlFile: () => Promise<void>
  openControlFile: () => void
}

const ControlFileContext = createContext<ControlFileContextType | undefined>(undefined)

interface ControlFileProviderProps {
  children: ReactNode
}

export function ControlFileProvider({ children }: ControlFileProviderProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [isControlFileConnected, setIsControlFileConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [controlFileUser, setControlFileUser] = useState<any>(null)

  // Verificar conexión inicial y mantener estado sincronizado
  useEffect(() => {
    const checkControlFileConnection = async () => {
      try {
        // Verificar si hay sesión guardada primero
        const savedSession = controlFileService.getSavedSession()
        if (savedSession) {
          console.log('🔄 ControlFile: Esperando restauración automática de Firebase Auth...')
          
          // Esperar a que Firebase Auth se restaure automáticamente
          const restoreResult = await controlFileService.waitForAuthRestore(3000)
          if (restoreResult.success) {
            setIsControlFileConnected(true)
            setControlFileUser(restoreResult.user)
            console.log('✅ ControlFile: Sesión restaurada automáticamente por Firebase Auth')
            return
          } else {
            console.log('⚠️ ControlFile: Firebase Auth no se restauró automáticamente, usando sesión guardada')
            // Si Firebase Auth no se restaura, usar la información de la sesión guardada
            setIsControlFileConnected(true)
            setControlFileUser({
              uid: savedSession.uid,
              email: savedSession.email,
              displayName: savedSession.displayName,
              photoURL: savedSession.photoURL
            })
            return
          }
        }

        // Si no hay sesión guardada, verificar conexión actual
        const connected = await controlFileService.isConnected()
        setIsControlFileConnected(connected)
        
        if (connected) {
          const user = await controlFileService.getCurrentUser()
          setControlFileUser(user)
        }
      } catch (error) {
        console.error('Error verificando ControlFile:', error)
      }
    }
    
    checkControlFileConnection()

    // Verificar periódicamente el estado de conexión para mantener sincronización
    const interval = setInterval(checkControlFileConnection, 30000) // Cada 30 segundos

    // Verificar cuando la página se vuelve visible (cambio de pestaña o navegación)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 ControlFile: Página visible, verificando conexión...')
        checkControlFileConnection()
      }
    }

    // Verificar cuando el usuario vuelve a la página
    const handleFocus = () => {
      console.log('🔄 ControlFile: Página enfocada, verificando conexión...')
      checkControlFileConnection()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Función global para conectar con ControlFile
  const connectControlFile = async () => {
    if (isConnecting) return

    if (isControlFileConnected) {
      // Si ya está conectado, abrir ControlFile
      openControlFile()
      return
    }

    // Si no está conectado, conectar automáticamente
    setIsConnecting(true)
    
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para conectar con ControlFile",
          variant: "destructive"
        })
        return
      }

      const result = await controlFileService.connectWithMainUserCredentials(user)
      
      if (result.success) {
        setIsControlFileConnected(true)
        setControlFileUser(result.user)
        // Toast removido - conexión silenciosa
      } else {
        // Si falla el popup, intentar con redirect
        if (result.error === 'POPUP_BLOCKED' || result.error === 'POPUP_CANCELLED') {
          // Toast removido - manejo silencioso
          const redirectResult = await controlFileService.connectWithRedirect(user)
          if (!redirectResult.success) {
            // Toast removido - error silencioso
          }
        } else {
          // Toast removido - error silencioso
        }
      }
    } catch (error) {
      console.error('Error conectando con ControlFile:', error)
      // Toast removido - error silencioso
    } finally {
      setIsConnecting(false)
    }
  }

  // Función para desconectar de ControlFile
  const disconnectControlFile = async () => {
    setIsConnecting(true)
    
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
      setIsConnecting(false)
    }
  }

  // Función para abrir ControlFile
  const openControlFile = () => {
    const url = controlFileService.getControlFileUrl()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Desconectar cuando el usuario principal se desconecta
  useEffect(() => {
    if (!user && isControlFileConnected) {
      disconnectControlFile()
    }
  }, [user, isControlFileConnected])

  // Escuchar cambios de autenticación de ControlFile en tiempo real
  useEffect(() => {
    const setupControlFileAuthListener = () => {
      // Obtener la instancia de auth de ControlFile
      const controlFileAuth = controlFileService.getAuth?.()
      if (controlFileAuth && typeof controlFileAuth.onAuthStateChanged === 'function') {
        console.log('🔊 ControlFile: Configurando listener de cambios de autenticación...')
        
        const unsubscribe = controlFileAuth.onAuthStateChanged((controlFileUser: any) => {
          console.log('🔄 ControlFile: Cambio de estado de autenticación detectado')
          
          if (controlFileUser) {
            setIsControlFileConnected(true)
            setControlFileUser(controlFileUser)
            console.log('✅ ControlFile: Usuario autenticado en tiempo real')
          } else {
            setIsControlFileConnected(false)
            setControlFileUser(null)
            console.log('❌ ControlFile: Usuario desconectado en tiempo real')
          }
        })

        return unsubscribe
      }
      return () => {}
    }

    const unsubscribe = setupControlFileAuthListener()
    return unsubscribe
  }, [])

  const value: ControlFileContextType = {
    isControlFileConnected,
    isConnecting,
    controlFileUser,
    connectControlFile,
    disconnectControlFile,
    openControlFile
  }

  return (
    <ControlFileContext.Provider value={value}>
      {children}
    </ControlFileContext.Provider>
  )
}

// Hook para usar el contexto de ControlFile
export function useControlFile() {
  const context = useContext(ControlFileContext)
  if (context === undefined) {
    throw new Error('useControlFile debe ser usado dentro de un ControlFileProvider')
  }
  return context
}

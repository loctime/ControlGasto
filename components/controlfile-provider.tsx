"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useAuth } from "@/components/auth-provider"
import { controlFileService } from "@/lib/controlfile"
import { useToast } from "@/hooks/use-toast"

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

    return () => clearInterval(interval)
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
        toast({
          title: "Conectado exitosamente",
          description: "ControlFile se ha conectado con tu cuenta",
        })
      } else {
        // Si falla el popup, intentar con redirect
        if (result.error === 'POPUP_BLOCKED' || result.error === 'POPUP_CANCELLED') {
          toast({
            title: "Popup bloqueado",
            description: "Redirigiendo a ControlFile para conectar...",
          })
          
          const redirectResult = await controlFileService.connectWithRedirect(user)
          if (!redirectResult.success) {
            toast({
              title: "Error de conexión",
              description: "No se pudo conectar con ControlFile",
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Error de conexión",
            description: result.error || "No se pudo conectar con ControlFile",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error conectando con ControlFile:', error)
      toast({
        title: "Error de conexión",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
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

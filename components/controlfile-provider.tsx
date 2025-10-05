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

  // Verificar conexión inicial - ahora es simple porque usa el mismo Firebase
  useEffect(() => {
    const checkControlFileConnection = async () => {
      try {
        // Si hay usuario autenticado en la app principal, ControlFile está conectado
        if (user) {
          setIsControlFileConnected(true)
          setControlFileUser(user)
          console.log('✅ ControlFile: Conectado automáticamente (mismo Firebase Auth)')
        } else {
          setIsControlFileConnected(false)
          setControlFileUser(null)
          console.log('❌ ControlFile: No conectado (no hay usuario autenticado)')
        }
      } catch (error) {
        console.error('Error verificando ControlFile:', error)
      }
    }
    
    checkControlFileConnection()
  }, [user]) // Ejecutar cuando cambie el usuario

  // Ya no necesitamos renovación de tokens - Firebase Auth se encarga

  // Función global para conectar con ControlFile - ahora es simple
  const connectControlFile = async () => {
    if (isConnecting) return

    if (isControlFileConnected) {
      // Si ya está conectado, abrir ControlFile
      openControlFile()
      return
    }

    // Si no está conectado, mostrar mensaje
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para usar ControlFile",
        variant: "destructive"
      })
      return
    }

    // Con ControlFile usando el mismo Firebase, la conexión es automática
    setIsControlFileConnected(true)
    setControlFileUser(user)
    console.log('✅ ControlFile: Conectado automáticamente (mismo Firebase Auth)')
  }

  // Función para desconectar de ControlFile
  const disconnectControlFile = async () => {
    setIsControlFileConnected(false)
    setControlFileUser(null)
    console.log('✅ ControlFile: Desconectado (mismo Firebase Auth)')
  }

  // Función para abrir ControlFile
  const openControlFile = () => {
    const url = controlFileService.getControlFileUrl()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Ya no necesitamos reconexión automática - Firebase Auth se encarga

  // Desconectar cuando el usuario principal se desconecta
  useEffect(() => {
    if (!user && isControlFileConnected) {
      disconnectControlFile()
    }
  }, [user, isControlFileConnected])

  // Ya no necesitamos listener de auth separado - usamos el mismo Firebase

  const value: ControlFileContextType = {
    isControlFileConnected,
    isConnecting, // Ya no necesitamos isAutoReconnecting
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

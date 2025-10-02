"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Upload, LogOut, CheckCircle, AlertCircle } from "lucide-react"
import { controlFileService } from "@/lib/controlfile"
import { useToast } from "@/hooks/use-toast"

interface ControlFileConnectionProps {
  onConnectionChange?: (connected: boolean) => void
}

export function ControlFileConnection({ onConnectionChange }: ControlFileConnectionProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  // Verificar estado de conexión al cargar
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const connected = await controlFileService.isConnected()
      setIsConnected(connected)
      
      if (connected) {
        const currentUser = await controlFileService.getCurrentUser()
        setUser(currentUser)
      }
      
      onConnectionChange?.(connected)
    } catch (error) {
      console.error('Error verificando conexión:', error)
    }
  }

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const result = await controlFileService.connect()
      
      if (result.success) {
        setIsConnected(true)
        setUser(result.user)
        onConnectionChange?.(true)
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
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      const result = await controlFileService.disconnect()
      
      if (result.success) {
        setIsConnected(false)
        setUser(null)
        onConnectionChange?.(false)
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
      setIsLoading(false)
    }
  }

  const handleOpenControlFile = () => {
    const url = controlFileService.getControlFileUrl()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Integración con ControlFile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Conectado
              </Badge>
            </div>
            
            {user && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Conectado como:</p>
                <p className="font-medium">{user.displayName || user.email}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleOpenControlFile}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ir a ControlFile
              </Button>
              
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
                size="sm"
                disabled={isLoading}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <Badge variant="outline" className="text-orange-600">
                No conectado
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Conecta tu cuenta de ControlFile para poder subir y gestionar archivos directamente desde esta aplicación.
            </p>
            
            <Button 
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isLoading ? "Conectando..." : "Conectar con ControlFile"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useControlFile } from "@/components/controlfile-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { controlFileService } from "@/lib/controlfile"
import { AlertCircle, CheckCircle, ExternalLink, LogOut, Settings, Upload } from "lucide-react"
import { useEffect, useState } from "react"

interface ControlFileConnectionProps {
  onConnectionChange?: (connected: boolean) => void
}

export function ControlFileConnection({ onConnectionChange }: ControlFileConnectionProps) {
  const [showSettings, setShowSettings] = useState(false)
  const { toast } = useToast()
  
  // Usar el hook de sincronización automática
  // Ahora usamos el provider simplificado
  const { isControlFileConnected, isConnecting, controlFileUser, connectControlFile, disconnectControlFile } = useControlFile()

  // Notificar cambios de conexión al componente padre
  useEffect(() => {
    onConnectionChange?.(isControlFileConnected)
  }, [isControlFileConnected, onConnectionChange])

  const handleConnect = async () => {
    await connectControlFile()
  }

  const handleDisconnect = async () => {
    await disconnectControlFile()
  }

  const handleOpenControlFile = () => {
    const url = controlFileService.getControlFileUrl()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Integración con ControlFile
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isControlFileConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Conectado automáticamente
              </Badge>
            </div>
            
            {controlFileUser && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Conectado como:</p>
                <p className="font-medium">{controlFileUser.displayName || controlFileUser.email}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleOpenControlFile}
                variant="outline"
                className="flex-1"
                disabled={isConnecting}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ir a ControlFile
              </Button>
              
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
                size="sm"
                disabled={isConnecting}
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
                {isConnecting ? "Conectando..." : "No conectado"}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Conecta tu cuenta de ControlFile para poder subir y gestionar archivos directamente desde esta aplicación.
            </p>
            
            {isConnecting && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  🔄 Conectando con ControlFile...
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isConnecting ? "Conectando..." : "Conectar manualmente"}
                </Button>
                
              </div>
              
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}

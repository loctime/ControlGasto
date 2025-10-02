"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ExternalLink, Upload, LogOut, CheckCircle, AlertCircle, RefreshCw, Settings } from "lucide-react"
import { controlFileService } from "@/lib/controlfile"
import { useControlFileSync } from "@/hooks/use-controlfile-sync"
import { useToast } from "@/hooks/use-toast"

interface ControlFileConnectionProps {
  onConnectionChange?: (connected: boolean) => void
}

export function ControlFileConnection({ onConnectionChange }: ControlFileConnectionProps) {
  const [showSettings, setShowSettings] = useState(false)
  const { toast } = useToast()
  
  // Usar el hook de sincronización automática
  const {
    isControlFileConnected,
    isSyncing,
    controlFileUser,
    autoSyncEnabled,
    setAutoSyncEnabled,
    connectManually,
    disconnectManually,
    retryAutoSync,
    connectWithRedirect
  } = useControlFileSync()

  // Notificar cambios de conexión al componente padre
  useEffect(() => {
    onConnectionChange?.(isControlFileConnected)
  }, [isControlFileConnected, onConnectionChange])

  const handleConnect = async () => {
    await connectManually()
  }

  const handleDisconnect = async () => {
    await disconnectManually()
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
                disabled={isSyncing}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ir a ControlFile
              </Button>
              
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
                size="sm"
                disabled={isSyncing}
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
                {isSyncing ? "Sincronizando..." : "No conectado"}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {autoSyncEnabled 
                ? "La sincronización automática está activada. ControlFile se conectará automáticamente cuando te autentiques."
                : "Conecta tu cuenta de ControlFile para poder subir y gestionar archivos directamente desde esta aplicación."
              }
            </p>
            
            {autoSyncEnabled && isSyncing && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  🔄 Intentando conectar automáticamente con ControlFile...
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={handleConnect}
                  disabled={isSyncing}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isSyncing ? "Conectando..." : "Conectar manualmente"}
                </Button>
                
                {!autoSyncEnabled && (
                  <Button 
                    onClick={retryAutoSync}
                    variant="outline"
                    disabled={isSyncing}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                )}
              </div>
              
              <Button 
                onClick={connectWithRedirect}
                variant="outline"
                disabled={isSyncing}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Conectar con redirect (si popup está bloqueado)
              </Button>
            </div>
          </div>
        )}

        {/* Configuración avanzada */}
        {showSettings && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sincronización automática</p>
                <p className="text-xs text-muted-foreground">
                  Conecta automáticamente con ControlFile al autenticarte
                </p>
              </div>
              <Switch
                checked={autoSyncEnabled}
                onCheckedChange={setAutoSyncEnabled}
              />
            </div>
            
            {!autoSyncEnabled && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  La sincronización automática está desactivada. Deberás conectar manualmente con ControlFile.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

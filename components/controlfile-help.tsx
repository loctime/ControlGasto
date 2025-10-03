"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle, AlertCircle, Info } from "lucide-react"

interface ControlFileHelpProps {
  className?: string
}

export function ControlFileHelp({ className }: ControlFileHelpProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Integración con ControlFile
        </CardTitle>
        <CardDescription>
          Guía para resolver problemas de conexión con ControlFile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de CORS */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>✅ CORS Configurado</AlertTitle>
          <AlertDescription>
            El dominio <Badge variant="outline">https://gastos.controldoc.app</Badge> ya está 
            configurado en los allowed origins de ControlFile.
          </AlertDescription>
        </Alert>

        {/* Pasos de solución */}
        <div className="space-y-3">
          <h4 className="font-medium">Si sigues teniendo problemas:</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <span>
                <strong>Verifica tu conexión:</strong> Asegúrate de tener una conexión estable a internet.
              </span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <span>
                <strong>Reinicia la aplicación:</strong> Cierra y abre nuevamente el navegador.
              </span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <span>
                <strong>Limpia la caché:</strong> Presiona <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+F5</kbd> para recargar sin caché.
              </span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <span>
                <strong>Verifica la autenticación:</strong> Asegúrate de estar conectado a ControlFile en la sección de perfil.
              </span>
            </div>
          </div>
        </div>

        {/* Enlaces útiles */}
        <div className="space-y-2">
          <h4 className="font-medium">Enlaces útiles:</h4>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
              onClick={() => window.open('https://files.controldoc.app/', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ir a ControlFile
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
              onClick={() => window.open('/profile', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Configurar integración
            </Button>
          </div>
        </div>

        {/* Información técnica */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información técnica</AlertTitle>
          <AlertDescription className="text-xs">
            <strong>Servidor:</strong> https://controlfile.onrender.com<br/>
            <strong>Dominio permitido:</strong> https://gastos.controldoc.app<br/>
            <strong>Estado CORS:</strong> Configurado correctamente<br/>
            <strong>API Endpoints:</strong><br/>
            • Crear carpeta: /api/folders/root<br/>
            • Subir archivo: /api/uploads/presign → /api/uploads/proxy-upload → /api/uploads/confirm
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

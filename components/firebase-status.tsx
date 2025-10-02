"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface FirebaseStatusProps {
  showDetails?: boolean
}

export function FirebaseStatus({ showDetails = false }: FirebaseStatusProps) {
  const [status, setStatus] = useState({
    config: false,
    auth: false,
    firestore: false,
    errors: [] as string[]
  })

  useEffect(() => {
    const checkFirebaseConfig = () => {
      const requiredEnvVars = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'NEXT_PUBLIC_FIREBASE_APP_ID'
      ]

      const missingVars = requiredEnvVars.filter(key => !process.env[key])
      
      if (missingVars.length === 0) {
        setStatus(prev => ({ ...prev, config: true }))
      } else {
        setStatus(prev => ({ 
          ...prev, 
          config: false,
          errors: [...prev.errors, `Variables faltantes: ${missingVars.join(', ')}`]
        }))
      }
    }

    checkFirebaseConfig()
  }, [])

  if (!showDetails && status.config) {
    return null
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-5 h-5" />
          Estado de Firebase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {status.config ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="text-sm">Configuración</span>
          <Badge variant={status.config ? "default" : "destructive"}>
            {status.config ? "OK" : "Error"}
          </Badge>
        </div>

        {status.errors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-600">Errores encontrados:</p>
            <ul className="text-xs text-red-600 space-y-1">
              {status.errors.map((error, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-amber-700">
          <p>Para configurar Firebase:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Crea un proyecto en Firebase Console</li>
            <li>Habilita Authentication y Firestore</li>
            <li>Copia las credenciales a .env.local</li>
            <li>Reinicia el servidor</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useControlFile } from "@/components/controlfile-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { controlFileService } from "@/lib/controlfile"
import { taskbarStructureService } from "@/lib/taskbar-structure"
import { Bug, FolderTree, RefreshCw } from "lucide-react"
import { useState } from "react"

export function ControlFileDebug() {
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugResults, setDebugResults] = useState<string[]>([])
  const { isControlFileConnected } = useControlFile()

  const runDebug = async () => {
    setIsDebugging(true)
    setDebugResults([])
    
    const results: string[] = []
    
    try {
      results.push('🔍 Iniciando debug de ControlFile...')
      
      // 1. Health Check
      results.push('📡 Verificando conexión...')
      const health = await controlFileService.healthCheck()
      if (health.success) {
        results.push(`✅ Conexión OK: ${health.status}`)
      } else {
        results.push(`❌ Error de conexión: ${health.error}`)
        return
      }
      
      // 2. Forzar recreación de estructura Gastos > Año > Mes
      results.push('🏗️ Forzando recreación de estructura Gastos > Año > Mes...')
      const structure = await taskbarStructureService.forceCreateStructure()
      if (structure.success) {
        results.push(`✅ Estructura recreada exitosamente: ${structure.folderId}`)
        
        // 3. Verificar que la estructura se creó correctamente
        results.push('📁 Verificando estructura creada...')
        const monthFolder = await taskbarStructureService.getCurrentMonthFolder()
        if (monthFolder.success) {
          results.push(`✅ Carpeta del mes actual: ${monthFolder.folderId}`)
        } else {
          results.push(`❌ Error obteniendo carpeta del mes: ${monthFolder.error}`)
        }
      } else {
        results.push(`❌ Error recreando estructura: ${structure.error}`)
      }
      
      results.push('✅ Debug completado - revisa la consola para más detalles')
      
    } catch (error: any) {
      results.push(`❌ Error en debug: ${error.message}`)
    } finally {
      setIsDebugging(false)
      setDebugResults(results)
    }
  }

  if (!isControlFileConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-orange-500" />
            ControlFile Debug
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Conecta a ControlFile primero para poder ejecutar el debug.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          ControlFile Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={runDebug} 
            disabled={isDebugging}
            className="w-full"
          >
            {isDebugging ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FolderTree className="w-4 h-4 mr-2" />
            )}
            {isDebugging ? "Ejecutando debug..." : "Forzar Recreación"}
          </Button>
          
          <Button 
            onClick={async () => {
              setIsDebugging(true)
              setDebugResults([])
              try {
                const monthFolder = await taskbarStructureService.getCurrentMonthFolder()
                if (monthFolder.success) {
                  setDebugResults([`✅ Carpeta del mes actual: ${monthFolder.folderId}`])
                } else {
                  setDebugResults([`❌ Error: ${monthFolder.error}`])
                }
              } catch (error: any) {
                setDebugResults([`❌ Error: ${error.message}`])
              } finally {
                setIsDebugging(false)
              }
            }}
            disabled={isDebugging}
            variant="outline"
            className="w-full"
          >
            <FolderTree className="w-4 h-4 mr-2" />
            Verificar Estructura
          </Button>
        </div>

        {debugResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Resultados del debug:</h4>
            <div className="bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
              {debugResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Nota:</strong> Este debug verifica:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Conexión con ControlFile</li>
            <li>Estructura de carpetas (Gastos → Año → Mes)</li>
            <li>Metadata de carpetas</li>
            <li>Logs detallados en consola</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

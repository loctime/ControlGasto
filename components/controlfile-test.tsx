"use client"

import { useControlFile } from "@/components/controlfile-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { controlFileService } from "@/lib/controlfile"
import {
    AlertCircle,
    CheckCircle,
    FileText,
    FolderTree,
    Loader2,
    Tag,
    Upload
} from "lucide-react"
import { useState } from "react"

export function ControlFileTest() {
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedType, setSelectedType] = useState<'Comprobantes' | 'Facturas' | 'Recibos' | 'Otros'>('Comprobantes')
  const [isUploading, setIsUploading] = useState(false)
  
  const { isControlFileConnected } = useControlFile()
  const { toast } = useToast()

  const runTests = async () => {
    setIsTesting(true)
    setTestResults(null)
    
    const results: any = {
      healthCheck: null,
      createStructure: null,
      listFiles: null,
      errors: []
    }

    try {
      // 1. Health Check
      console.log('🧪 Test 1: Health Check')
      results.healthCheck = await controlFileService.healthCheck()
      
      if (!results.healthCheck.success) {
        results.errors.push('Health check failed')
      }

       // 2. Crear carpeta específica de prueba
       console.log('🧪 Test 2: Crear carpeta específica')
       results.createStructure = await controlFileService.ensureFolderExists(['2025', 'Comprobantes'])
       
       if (!results.createStructure.success) {
         results.errors.push('Failed to create specific folder')
       }

       // 3. Listar archivos en carpeta principal
       if (results.createStructure?.success && results.createStructure?.folderId) {
         console.log('🧪 Test 3: Listar archivos')
         results.listFiles = await controlFileService.listFiles(results.createStructure.folderId)
         
         if (!results.listFiles.success) {
           results.errors.push('Failed to list files')
         }
       }

      setTestResults(results)
      
      if (results.errors.length === 0) {
        toast({
          title: "Tests completados exitosamente",
          description: "Todos los tests de ControlFile pasaron correctamente",
        })
      } else {
        toast({
          title: "Tests completados con errores",
          description: `${results.errors.length} errores encontrados`,
          variant: "destructive"
        })
      }

    } catch (error: any) {
      console.error('❌ Error en tests:', error)
      results.errors.push(error.message)
      setTestResults(results)
      
      toast({
        title: "Error en tests",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Selecciona un archivo primero",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    try {
      const result = await controlFileService.uploadFile(selectedFile, selectedType)
      
      if (result.success) {
        toast({
          title: "Archivo subido exitosamente",
          description: `Archivo "${result.fileName}" guardado en carpeta "${selectedType}"`,
        })
      } else {
        toast({
          title: "Error al subir archivo",
          description: result.error || "No se pudo subir el archivo",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error inesperado",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  if (!isControlFileConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            ControlFile Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Conecta a ControlFile primero para poder ejecutar los tests.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Panel de Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5" />
            Tests de ControlFile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTests} 
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {isTesting ? "Ejecutando tests..." : "Ejecutar Tests"}
          </Button>

          {testResults && (
            <div className="space-y-3">
              <h4 className="font-medium">Resultados:</h4>
              
              {/* Health Check */}
              <div className="flex items-center gap-2">
                {testResults.healthCheck?.success ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span>Health Check: {testResults.healthCheck?.status || 'Error'}</span>
              </div>

               {/* Carpeta Específica */}
               <div className="flex items-center gap-2">
                 {testResults.createStructure?.success ? (
                   <CheckCircle className="w-4 h-4 text-green-500" />
                 ) : (
                   <AlertCircle className="w-4 h-4 text-red-500" />
                 )}
                 <span>Carpeta Específica: {testResults.createStructure?.success ? 'Creada' : 'Error'}</span>
               </div>

              {/* Lista de Archivos */}
              {testResults.listFiles && (
                <div className="flex items-center gap-2">
                  {testResults.listFiles?.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>Lista de Archivos: {testResults.listFiles?.files?.length || 0} archivos</span>
                </div>
              )}

              {/* Errores */}
              {testResults.errors?.length > 0 && (
                <div className="space-y-1">
                  <h5 className="font-medium text-red-600">Errores:</h5>
                  {testResults.errors.map((error: string, index: number) => (
                    <Badge key={index} variant="destructive" className="mr-1">
                      {error}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de Upload de Prueba */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload de Prueba
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Seleccionar Archivo</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Documento</Label>
            <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Comprobantes">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Comprobantes
                  </div>
                </SelectItem>
                <SelectItem value="Facturas">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Facturas
                  </div>
                </SelectItem>
                <SelectItem value="Recibos">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Recibos
                  </div>
                </SelectItem>
                <SelectItem value="Otros">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Otros
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleFileUpload} 
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? "Subiendo..." : "Subir Archivo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

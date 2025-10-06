"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { controlFileService } from "@/lib/controlfile"
import { Loader2, Upload } from "lucide-react"
import { useState } from "react"

interface ControlFileUploadProps {
  file?: File
  fileName?: string
  type?: 'Comprobantes' | 'Facturas' | 'Recibos' | 'Otros'
  onUploaded?: (result: { success: boolean; fileId?: string; fileUrl?: string; shareUrl?: string; shareToken?: string; fileName?: string; fileSize?: number; error?: string }) => void
  disabled?: boolean
  size?: "default" | "sm" | "lg"
  variant?: "default" | "outline" | "secondary"
  className?: string
}

export function ControlFileUpload({
  file,
  fileName,
  type,
  onUploaded,
  disabled = false,
  size = "default",
  variant = "default",
  className
}: ControlFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "No hay archivo seleccionado",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    try {
      const result = await controlFileService.uploadFile(file, type)
      
      if (result.success) {
        const folderInfo = type ? ` en carpeta "${type}"` : " en carpeta del mes actual"
        toast({
          title: "Archivo subido exitosamente",
          description: result.shareUrl 
            ? `Archivo "${result.fileName || 'archivo'}" guardado${folderInfo}${result.fileSize ? ` (${Math.round(result.fileSize / 1024)}KB)` : ''}. Enlace permanente creado.`
            : result.fileUrl 
            ? `Archivo "${result.fileName || 'archivo'}" guardado${folderInfo}${result.fileSize ? ` (${Math.round(result.fileSize / 1024)}KB)` : ''}. URL temporal disponible por 5 minutos.`
            : `El archivo se ha guardado${folderInfo}`,
        })
        onUploaded?.(result)
      } else {
        toast({
          title: "Error al subir archivo",
          description: result.error || "No se pudo subir el archivo",
          variant: "destructive"
        })
        onUploaded?.(result)
      }
    } catch (error) {
      const errorResult = {
        success: false,
        error: "Error inesperado al subir archivo"
      }
      toast({
        title: "Error al subir archivo",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
      onUploaded?.(errorResult)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Button
      onClick={handleUpload}
      disabled={disabled || isUploading || !file}
      size={size}
      variant={variant}
      className={className}
    >
      {isUploading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Upload className="w-4 h-4 mr-2" />
      )}
      {isUploading ? "Subiendo..." : "Guardar en ControlFile"}
    </Button>
  )
}

// Componente para subir archivo desde URL
interface ControlFileUploadFromUrlProps {
  fileUrl: string
  fileName: string
  type?: 'Comprobantes' | 'Facturas' | 'Recibos' | 'Otros'
  onUploaded?: (result: { success: boolean; fileId?: string; fileUrl?: string; shareUrl?: string; shareToken?: string; fileName?: string; fileSize?: number; error?: string }) => void
  disabled?: boolean
  size?: "default" | "sm" | "lg"
  variant?: "default" | "outline" | "secondary"
  className?: string
}

export function ControlFileUploadFromUrl({
  fileUrl,
  fileName,
  type,
  onUploaded,
  disabled = false,
  size = "default",
  variant = "default",
  className
}: ControlFileUploadFromUrlProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleUpload = async () => {
    if (!fileUrl) {
      toast({
        title: "Error",
        description: "No hay URL de archivo disponible",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    try {
      // Descargar archivo desde URL
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('No se pudo descargar el archivo')
      }
      
      const blob = await response.blob()
      const file = new File([blob], fileName, { type: blob.type })
      
      const result = await controlFileService.uploadFile(file, type)
      
      if (result.success) {
        const folderInfo = type ? ` en carpeta "${type}"` : " en carpeta del mes actual"
        toast({
          title: "Archivo subido exitosamente",
          description: result.shareUrl 
            ? `Archivo "${result.fileName || fileName}" guardado${folderInfo}${result.fileSize ? ` (${Math.round(result.fileSize / 1024)}KB)` : ''}. Enlace permanente creado.`
            : result.fileUrl 
            ? `Archivo "${result.fileName || fileName}" guardado${folderInfo}${result.fileSize ? ` (${Math.round(result.fileSize / 1024)}KB)` : ''}. URL temporal disponible por 5 minutos.`
            : `El archivo "${fileName}" se ha guardado${folderInfo}`,
        })
        onUploaded?.(result)
      } else {
        toast({
          title: "Error al subir archivo",
          description: result.error || "No se pudo subir el archivo",
          variant: "destructive"
        })
        onUploaded?.(result)
      }
    } catch (error) {
      const errorResult = {
        success: false,
        error: "Error inesperado al subir archivo"
      }
      toast({
        title: "Error al subir archivo",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
      onUploaded?.(errorResult)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Button
      onClick={handleUpload}
      disabled={disabled || isUploading || !fileUrl}
      size={size}
      variant={variant}
      className={className}
    >
      {isUploading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Upload className="w-4 h-4 mr-2" />
      )}
      {isUploading ? "Subiendo..." : "Guardar en ControlFile"}
    </Button>
  )
}

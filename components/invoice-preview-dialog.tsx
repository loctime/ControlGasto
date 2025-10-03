"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { InvoiceService } from "@/lib/invoice-service"
import { Invoice } from "@/lib/types"
import { 
  Eye, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle,
  Maximize2,
  ExternalLink
} from "lucide-react"

interface InvoicePreviewDialogProps {
  invoice: Invoice
  isOpen: boolean
  onClose: () => void
}

export function InvoicePreviewDialog({ invoice, isOpen, onClose }: InvoicePreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewError, setPreviewError] = useState<string>("")
  const { toast } = useToast()

  const invoiceService = new InvoiceService(invoice.userId)

  useEffect(() => {
    if (isOpen && invoice) {
      loadPreview()
    }
  }, [isOpen, invoice])

  const loadPreview = async () => {
    if (!invoice) return

    setIsLoadingPreview(true)
    setPreviewError("")
    
    try {
      let url: string

      if (invoiceService.isImageFile(invoice.mimeType)) {
        url = await invoiceService.getImagePreviewUrl(invoice.fileId)
      } else if (invoiceService.isPdfFile(invoice.mimeType)) {
        url = await invoiceService.getPdfPreviewUrl(invoice.fileId)
      } else {
        throw new Error('Tipo de archivo no soportado para vista previa')
      }

      setPreviewUrl(url)
    } catch (error: any) {
      console.error('Error cargando vista previa:', error)
      setPreviewError(error.message || 'No se pudo cargar la vista previa')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await invoiceService.downloadFileDirectly(invoice.fileId, invoice.fileName)
      
      toast({
        title: "Descarga iniciada",
        description: `El archivo "${invoice.fileName}" se está descargando.`,
      })
    } catch (error: any) {
      toast({
        title: "Error al descargar",
        description: error.message || "No se pudo descargar el archivo",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = () => {
    if (invoiceService.isImageFile(invoice.mimeType)) return <ImageIcon className="w-5 h-5" />
    if (invoiceService.isPdfFile(invoice.mimeType)) return <FileText className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon()}
              {invoice.fileName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={invoice.verified ? "default" : "secondary"}>
                {invoice.verified ? "Verificada" : "Pendiente"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                disabled={!previewUrl}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del archivo */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Tamaño: {formatFileSize(invoice.fileSize)}</span>
              <span>Tipo: {invoice.mimeType}</span>
              <span>Subido: {invoice.uploadedAt.toLocaleDateString('es-AR')}</span>
            </div>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              size="sm"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isDownloading ? "Descargando..." : "Descargar"}
            </Button>
          </div>

          {/* Vista previa */}
          <div className="border rounded-lg overflow-hidden bg-gray-50 min-h-[400px] flex items-center justify-center">
            {isLoadingPreview ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Cargando vista previa...</p>
              </div>
            ) : previewError ? (
              <div className="flex flex-col items-center gap-2 p-8">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <p className="text-sm text-red-600">{previewError}</p>
                <Button variant="outline" size="sm" onClick={loadPreview}>
                  Reintentar
                </Button>
              </div>
            ) : previewUrl ? (
              <div className="w-full h-full">
                {invoiceService.isImageFile(invoice.mimeType) ? (
                  <img
                    src={previewUrl}
                    alt={invoice.fileName}
                    className="max-w-full max-h-full object-contain"
                    style={{ maxHeight: '500px' }}
                  />
                ) : invoiceService.isPdfFile(invoice.mimeType) ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    style={{ minHeight: '500px' }}
                    title={invoice.fileName}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 p-8">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Vista previa no disponible para este tipo de archivo
                    </p>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar para ver
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Tags */}
          {invoice.tags && invoice.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Tags:</h4>
              <div className="flex flex-wrap gap-1">
                {invoice.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleDownload} disabled={isDownloading} className="flex-1">
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Archivo
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

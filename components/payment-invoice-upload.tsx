"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Eye, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { InvoiceService } from "@/lib/invoice-service"
import { PaymentType } from "@/lib/types"

interface PaymentInvoiceUploadProps {
  paymentId: string
  paymentType: PaymentType
  onInvoiceUploaded?: (invoice: any) => void
  className?: string
}

export function PaymentInvoiceUpload({
  paymentId,
  paymentType,
  onInvoiceUploaded,
  className
}: PaymentInvoiceUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedInvoices, setUploadedInvoices] = useState<any[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const { toast } = useToast()

  // Obtener servicio de facturas (necesitarías el userId del contexto)
  const invoiceService = new InvoiceService("temp-user-id") // TODO: Obtener del contexto de auth

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const invoice = await invoiceService.uploadInvoice(paymentId, file)
      
      setUploadedInvoices(prev => [invoice, ...prev])
      
      toast({
        title: "Factura subida exitosamente",
        description: `La factura "${file.name}" se ha guardado correctamente.`,
      })
      
      onInvoiceUploaded?.(invoice)
    } catch (error: any) {
      toast({
        title: "Error al subir factura",
        description: error.message || "No se pudo subir la factura",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const loadExistingInvoices = async () => {
    setIsLoadingInvoices(true)
    try {
      const invoices = await invoiceService.getInvoicesByPayment(paymentId)
      setUploadedInvoices(invoices)
    } catch (error: any) {
      toast({
        title: "Error cargando facturas",
        description: error.message || "No se pudieron cargar las facturas",
        variant: "destructive"
      })
    } finally {
      setIsLoadingInvoices(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType.includes('document')) return '📝'
    return '📎'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Subir Factura
        </CardTitle>
        <CardDescription>
          Adjunta la factura correspondiente al pago de {paymentType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botón de subida */}
        <div className="space-y-2">
          <input
            type="file"
            id={`invoice-upload-${paymentId}`}
            onChange={handleFileUpload}
            disabled={isUploading}
            accept="image/*,application/pdf,.doc,.docx"
            className="hidden"
          />
          <label htmlFor={`invoice-upload-${paymentId}`}>
            <Button
              asChild
              disabled={isUploading}
              className="w-full"
            >
              <span>
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploading ? "Subiendo..." : "Seleccionar Factura"}
              </span>
            </Button>
          </label>
        </div>

        {/* Botón para cargar facturas existentes */}
        <Button
          variant="outline"
          onClick={loadExistingInvoices}
          disabled={isLoadingInvoices}
          className="w-full"
        >
          {isLoadingInvoices ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {isLoadingInvoices ? "Cargando..." : "Ver Facturas Existentes"}
        </Button>

        {/* Lista de facturas subidas */}
        {uploadedInvoices.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Facturas subidas:</h4>
            {uploadedInvoices.map((invoice) => (
              <Card key={invoice.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getFileIcon(invoice.mimeType)}</span>
                    <div>
                      <p className="font-medium text-sm">{invoice.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(invoice.fileSize)}</span>
                        <Badge variant={invoice.verified ? "default" : "secondary"}>
                          {invoice.verified ? "Verificada" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(invoice.shareUrl, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = invoice.shareUrl
                        link.download = invoice.fileName
                        link.click()
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Información sobre tipos de archivo */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Tipos de archivo soportados:</strong> Imágenes (JPG, PNG, GIF), PDF, Documentos (DOC, DOCX)
            <br />
            <strong>Tamaño máximo:</strong> 10MB por archivo
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

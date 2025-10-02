"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Receipt, Eye, Download, ExternalLink, Loader2 } from "lucide-react"
import { controlFileService } from "@/lib/controlfile"
import { useToast } from "@/hooks/use-toast"

interface ReceiptViewerProps {
  receiptImageId: string
  expenseName: string
  expenseAmount: number
}

export function ReceiptViewer({ 
  receiptImageId, 
  expenseName, 
  expenseAmount 
}: ReceiptViewerProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const { toast } = useToast()

  const handleViewReceipt = () => {
    setIsViewerOpen(true)
  }

  const handleDownloadReceipt = async () => {
    try {
      // Abrir ControlFile en una nueva pestaña para descargar
      const controlFileUrl = controlFileService.getControlFileUrl()
      window.open(controlFileUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Error abriendo ControlFile:', error)
    }
  }

  const handleViewInControlFile = async () => {
    setIsLoadingUrl(true)
    try {
      console.log(`🔍 Obteniendo URL directa de BlackBlaze para archivo: ${receiptImageId}`)
      
      // Intentar obtener URL directa de BlackBlaze B2
      const result = await controlFileService.getFileUrl(receiptImageId)
      
      if (result.success && result.url) {
        console.log(`✅ URL directa obtenida: ${result.url}`)
        
        // Verificar si es una URL de BlackBlaze
        const isBlackBlaze = result.url.includes('backblazeb2.com') || result.url.includes('b2.')
        
        if (isBlackBlaze) {
          console.log(`🚀 Abriendo URL directa de BlackBlaze B2`)
          toast({
            title: "Abriendo comprobante",
            description: "Cargando imagen directamente desde BlackBlaze B2...",
          })
        } else {
          console.log(`📁 Abriendo URL de ControlFile`)
          toast({
            title: "Abriendo comprobante",
            description: "Redirigiendo a ControlFile...",
          })
        }
        
        window.open(result.url, '_blank', 'noopener,noreferrer')
      } else {
        console.log(`❌ No se pudo obtener URL directa: ${result.error}`)
        
        // Si no se puede obtener la URL directa, abrir ControlFile general
        toast({
          title: "Abriendo ControlFile",
          description: "No se pudo obtener URL directa, abriendo ControlFile...",
          variant: "default"
        })
        handleDownloadReceipt()
      }
    } catch (error) {
      console.error('Error obteniendo URL del archivo:', error)
      toast({
        title: "Error al abrir comprobante",
        description: "No se pudo acceder al archivo. Intentando abrir ControlFile...",
        variant: "destructive"
      })
      handleDownloadReceipt()
    } finally {
      setIsLoadingUrl(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleViewReceipt}
        className="h-8 px-3 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
      >
        <Receipt className="w-4 h-4 mr-1" />
        Ver Comprobante
      </Button>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-500" />
              Comprobante de Pago
            </DialogTitle>
            <DialogDescription>
              Comprobante para "{expenseName}" - ${expenseAmount.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información del gasto */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">{expenseName}</p>
                    <p className="text-2xl font-bold text-green-900">
                      ${expenseAmount.toLocaleString()}
                    </p>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    <Receipt className="w-3 h-3 mr-1" />
                    Comprobante Guardado
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Mensaje informativo mejorado */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">
                      Comprobante guardado en ControlFile + BlackBlaze B2
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Tu comprobante se ha guardado de forma segura en BlackBlaze B2 a través de ControlFile. 
                      Puedes acceder directamente al archivo o a través de tu panel de ControlFile.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleViewInControlFile}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isLoadingUrl}
                      >
                        {isLoadingUrl ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Obteniendo URL...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Comprobante Directo
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleDownloadReceipt}
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ir a ControlFile
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información técnica (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="text-xs text-gray-600">
                    <p><strong>File ID:</strong> {receiptImageId}</p>
                    <p><strong>Almacenamiento:</strong> BlackBlaze B2 via ControlFile</p>
                    <p><strong>Acceso:</strong> URL directa o interfaz ControlFile</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
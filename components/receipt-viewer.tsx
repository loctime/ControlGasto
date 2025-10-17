"use client"

import { useControlFile } from "@/components/controlfile-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { controlFileService } from "@/lib/controlfile"
import { Download, ExternalLink, Eye, Loader2, Receipt, Upload } from "lucide-react"
import { useState } from "react"

interface ReceiptViewerProps {
  receiptImageId: string
  expenseName: string
  expenseAmount: number
  paidAt?: Date | null
}

export function ReceiptViewer({ 
  receiptImageId, 
  expenseName, 
  expenseAmount,
  paidAt
}: ReceiptViewerProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const { toast } = useToast()
  const { isControlFileConnected, isConnecting, connectControlFile } = useControlFile()

  const handleViewReceipt = async () => {
    setIsViewerOpen(true)
    
    // Cargar automáticamente la imagen al abrir el modal
    if (!imageUrl) {
      setIsLoadingUrl(true)
      try {
        console.log(`🔍 Obteniendo URL directa de BlackBlaze para archivo: ${receiptImageId}`)
        
        const result = await controlFileService.getFileUrl(receiptImageId)
        
        if (result.success && result.fileUrl) {
          const isBlackBlaze = result.fileUrl.includes('backblazeb2.com') || result.fileUrl.includes('b2.')
          
          if (isBlackBlaze) {
            console.log(`🚀 Cargando imagen automáticamente desde BlackBlaze B2`)
            setImageUrl(result.fileUrl)
          }
        }
      } catch (error) {
        console.error('Error cargando imagen automáticamente:', error)
      } finally {
        setIsLoadingUrl(false)
      }
    }
  }

  // Handler de conexión con ControlFile usando el contexto global
  const handleControlFileClick = async () => {
    await connectControlFile()
  }

  const handleDownloadImage = async () => {
    if (!imageUrl) return
    
    try {
      setIsLoadingUrl(true)
      
      // Usar un proxy interno para descargar la imagen
      const response = await fetch(`/api/download-image?url=${encodeURIComponent(imageUrl)}`)
      
      if (!response.ok) {
        throw new Error('Error en la descarga')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `comprobante-${expenseName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Limpiar la URL temporal
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Descarga completada",
        description: "El comprobante se ha descargado exitosamente.",
      })
    } catch (error) {
      console.error('Error descargando imagen:', error)
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar el comprobante. Intenta abrir ControlFile.",
        variant: "destructive"
      })
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
        Ver Comp.
      </Button>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-500" />
              Comprobante de Pago
            </DialogTitle>
            <DialogDescription>
              Comprobante para "{expenseName}" - ${expenseAmount.toLocaleString()} {paidAt && `pagado el ${paidAt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
            </DialogDescription>
          </DialogHeader>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Estado de carga */}
            {isLoadingUrl && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <p className="text-blue-700">Cargando comprobante...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mensaje cuando no hay imagen */}
            {!imageUrl && !isLoadingUrl && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-3">
                        Tu comprobante se ha guardado de forma segura en ControlFile.
                      </p>
                      {isControlFileConnected ? (
                        <Button
                          onClick={handleControlFileClick}
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ir a ControlFile
                        </Button>
                      ) : (
                        <Button
                          onClick={handleControlFileClick}
                          size="sm"
                          variant="outline"
                          className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Conectando...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Conectar con ControlFile
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mostrar imagen del comprobante si está disponible */}
            {imageUrl && (
              <Card className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">
                        Comprobante de Pago
                      </h4>
                      <Button
                        onClick={handleDownloadImage}
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                        disabled={isLoadingUrl}
                      >
                        {isLoadingUrl ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-1" />
                            Descargar
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={`Comprobante de ${expenseName}`}
                        className="w-full h-auto max-h-96 object-contain"
                        onError={() => {
                          toast({
                            title: "Error al cargar imagen",
                            description: "No se pudo cargar el comprobante. Intenta abrir ControlFile.",
                            variant: "destructive"
                          })
                          setImageUrl(null)
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Imagen cargada desde tu cuenta de ControlFile 
                    </p>
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
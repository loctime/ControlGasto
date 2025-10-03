"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  Camera, 
  Image, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  ExternalLink 
} from "lucide-react"
import { controlFileService } from "@/lib/controlfile"
import { useControlFile } from "@/components/controlfile-provider"
import { useToast } from "@/hooks/use-toast"

interface PaymentReceiptDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (receiptImageId?: string) => void
  expenseName: string
  expenseAmount: number
  isConnectedToControlFile: boolean
  onConnectionChange?: (connected: boolean) => void
}

export function PaymentReceiptDialog({
  isOpen,
  onClose,
  onConfirm,
  expenseName,
  expenseAmount,
  isConnectedToControlFile: propIsConnected, // Renombrar para evitar conflicto
  onConnectionChange
}: PaymentReceiptDialogProps) {
  // Usar el contexto global de ControlFile
  const { isControlFileConnected, connectControlFile } = useControlFile()
  
  // Usar el estado global si está disponible, sino usar el prop
  const isConnectedToControlFile = isControlFileConnected || propIsConnected
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null)
  const [isMarkAsPaidSelected, setIsMarkAsPaidSelected] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadImage = async () => {
    if (!selectedImage || !isConnectedToControlFile) return

    setIsUploading(true)
    try {
      const result = await controlFileService.uploadFile(
        selectedImage, 
        "ControlGastos"
      )

      if (result.success && result.fileId) {
        setUploadedImageId(result.fileId)
        toast({
          title: "Comprobante subido exitosamente",
          description: "La imagen se ha guardado en tu cuenta de ControlFile",
        })
      } else {
        toast({
          title: "Error al subir comprobante",
          description: result.error || "No se pudo subir la imagen",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error al subir comprobante",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfirm = () => {
    onConfirm(uploadedImageId || undefined)
    handleClose()
  }

  const handleClose = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setUploadedImageId(null)
    setIsUploading(false)
    setIsMarkAsPaidSelected(false)
    onClose()
  }

  const handleConnectControlFile = async () => {
    // Usar el método del contexto global
    await connectControlFile()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Marcar como Pagado
          </DialogTitle>
          <DialogDescription>
            Ya pagaste "{expenseName}"? Tienes el comprobante?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del gasto */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800 text-sm">{expenseName}</p>
                  <p className="text-2xl font-bold text-green-900 leading-tight">
                    ${expenseAmount.toLocaleString()}
                  </p>
                </div>
                <Badge className="bg-green-500 text-white">
                  Pagado
                </Badge>
              </div>
            </CardContent>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Secciones lado a lado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sección de subir comprobante */}
                  <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <p className="font-medium text-orange-800">Subir comprobante</p>
                    </div>
                    <p className="text-sm text-orange-700">
                      Conectate con ControlFile!
                    </p>
                  </div>

                  {/* Sección de marcar como pagado */}
                  <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                      <p className="font-medium text-blue-800">Sin comprobante</p>
                    </div>
                    <p className="text-sm text-blue-700">
                      Puedes subirlo luego
                    </p>
                  </div>
                </div>

                {/* Botones */}
                <div className="space-y-3">
                  {isConnectedToControlFile ? (
                    <>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 bg-orange-500 hover:bg-orange-600"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Subir
                        </Button>
                        <div 
                          className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-200 rounded-lg p-3 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => setIsMarkAsPaidSelected(!isMarkAsPaidSelected)}
                        >
                          <Checkbox 
                            id="mark-paid"
                            checked={isMarkAsPaidSelected}
                            onCheckedChange={setIsMarkAsPaidSelected}
                          />
                          <label htmlFor="mark-paid" className="text-sm font-medium text-blue-800 cursor-pointer">
                            Marcar Pagado
                          </label>
                        </div>
                      </div>
                      <Button 
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full bg-orange-400 hover:bg-orange-500"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Tomar Foto
                      </Button>
                    </>
                  ) : (
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleConnectControlFile}
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Conectar ControlFile
                      </Button>
                      <div 
                        className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-200 rounded-lg p-3 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => setIsMarkAsPaidSelected(!isMarkAsPaidSelected)}
                      >
                        <Checkbox 
                          id="mark-paid"
                          checked={isMarkAsPaidSelected}
                          onCheckedChange={setIsMarkAsPaidSelected}
                        />
                        <label htmlFor="mark-paid" className="text-sm font-medium text-blue-800 cursor-pointer">
                          Marcar Pagado
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
              
          </Card>


          {/* Inputs ocultos */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Vista previa de imagen */}
          {imagePreview && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {!uploadedImageId && (
                    <Button
                      onClick={handleUploadImage}
                      disabled={isUploading}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? "Subiendo..." : "Subir a ControlFile"}
                    </Button>
                  )}
                  {uploadedImageId && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Comprobante guardado</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          {(uploadedImageId || isMarkAsPaidSelected) && (
            <Button
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700"
              disabled={isUploading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {uploadedImageId ? "Confirmar Pago con Comprobante" : "Confirmar Pago"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

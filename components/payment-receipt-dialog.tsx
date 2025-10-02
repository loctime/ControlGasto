"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  isConnectedToControlFile,
  onConnectionChange
}: PaymentReceiptDialogProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null)
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
        `Comprobantes de Pago - ${new Date().getFullYear()}`
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
    onClose()
  }

  const handleConnectControlFile = async () => {
    try {
      const result = await controlFileService.connect()
      if (result.success) {
        onConnectionChange?.(true)
        toast({
          title: "Conectado exitosamente",
          description: "Tu cuenta se ha conectado con ControlFile",
        })
      } else {
        toast({
          title: "Error de conexión",
          description: result.error || "No se pudo conectar con ControlFile",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
    }
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
            ¿Deseas subir un comprobante de pago para "{expenseName}"?
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
                  Pagado
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Estado de conexión con ControlFile */}
          {!isConnectedToControlFile && (
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <p className="font-medium text-orange-800">Conexión requerida</p>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  Para subir comprobantes necesitas conectar tu cuenta de ControlFile
                </p>
                <Button 
                  onClick={handleConnectControlFile}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Conectar con ControlFile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Opciones de imagen */}
          {isConnectedToControlFile && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                  disabled={isUploading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Tomar Foto
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                  disabled={isUploading}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Galería
                </Button>
              </div>

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
          <Button
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700"
            disabled={isUploading}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

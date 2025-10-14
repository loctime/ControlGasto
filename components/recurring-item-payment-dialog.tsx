"use client"

import { useControlFile } from "@/components/controlfile-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { controlFileService } from "@/lib/controlfile"
import {
    AlertCircle,
    Camera,
    CheckCircle,
    DollarSign,
    ExternalLink,
    Upload,
    X
} from "lucide-react"
import React, { useRef, useState } from "react"

interface RecurringItemPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: number, receiptImageId?: string, notes?: string) => void
  itemName: string
  suggestedAmount?: number
  isConnectedToControlFile: boolean
  onConnectionChange?: (connected: boolean) => void
}

export function RecurringItemPaymentDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  suggestedAmount = 0,
  isConnectedToControlFile: propIsConnected,
  onConnectionChange
}: RecurringItemPaymentDialogProps) {
  // Usar el contexto global de ControlFile
  const { isControlFileConnected, connectControlFile } = useControlFile()
  
  // Usar el estado global si está disponible, sino usar el prop
  const isConnectedToControlFile = isControlFileConnected || propIsConnected
  const [amount, setAmount] = useState(suggestedAmount.toString())
  const [notes, setNotes] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null)
  const [isMarkAsPaidSelected, setIsMarkAsPaidSelected] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Focus en el campo de monto cuando se abre el diálogo
  React.useEffect(() => {
    if (isOpen && amountInputRef.current) {
      setTimeout(() => amountInputRef.current?.focus(), 100)
    }
  }, [isOpen])

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
        "Comprobantes"
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
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Monto inválido",
        description: "Por favor ingresa un monto válido mayor a 0",
        variant: "destructive"
      })
      return
    }

    onConfirm(numericAmount, uploadedImageId || undefined, notes || undefined)
    handleClose()
  }

  const handleClose = () => {
    setAmount(suggestedAmount.toString())
    setNotes('')
    setSelectedImage(null)
    setImagePreview(null)
    setUploadedImageId(null)
    setIsUploading(false)
    setIsMarkAsPaidSelected(false)
    setShowImageModal(false)
    onClose()
  }

  const handleConnectControlFile = async () => {
    // Usar el método del contexto global
    await connectControlFile()
  }

  const isValidAmount = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Pagar Item Recurrente
          </DialogTitle>
          <DialogDescription>
            Ingresa el monto que pagaste por "{itemName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de monto */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto pagado *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                ref={amountInputRef}
                id="amount"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10 text-lg font-semibold"
              />
            </div>
            {suggestedAmount > 0 && (
              <p className="text-sm text-muted-foreground">
                💡 Monto sugerido: ${suggestedAmount.toLocaleString('es-AR')} - Puedes editarlo si pagaste diferente
              </p>
            )}
            {suggestedAmount === 0 && (
              <p className="text-sm text-muted-foreground">
                💡 Ingresa el monto que realmente pagaste
              </p>
            )}
          </div>

          {/* Campo de notas opcional */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Pagado en efectivo, descuento aplicado..."
            />
          </div>

          {/* Información del gasto */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800 text-sm">{itemName}</p>
                  <p className="text-2xl font-bold text-green-900 leading-tight">
                    {isValidAmount ? `$${parseFloat(amount).toLocaleString('es-AR')}` : 'Ingresa monto'}
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
                    {imagePreview ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={imagePreview}
                          alt="Vista previa"
                          className="w-12 h-12 object-cover rounded-lg border border-orange-200 cursor-pointer"
                          onClick={() => setShowImageModal(true)}
                        />
                        {!uploadedImageId && (
                          <div className="flex-1">
                            <Button
                              onClick={handleUploadImage}
                              disabled={isUploading}
                              size="sm"
                              className="w-full"
                            >
                              <Upload className="w-3 h-3 mr-2" />
                              {isUploading ? "Subiendo..." : "Subir"}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-orange-700">
                        Conectate con ControlFile!
                      </p>
                    )}
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
                          {imagePreview ? "Cambiar" : "Subir"}
                        </Button>
                        <div 
                          className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-200 rounded-lg p-3 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => setIsMarkAsPaidSelected(!isMarkAsPaidSelected)}
                        >
                          <Checkbox 
                            id="mark-paid"
                            checked={isMarkAsPaidSelected}
                            onCheckedChange={(checked) => setIsMarkAsPaidSelected(checked === true)}
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
                          onCheckedChange={(checked) => setIsMarkAsPaidSelected(checked === true)}
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
          {isValidAmount && (uploadedImageId || isMarkAsPaidSelected) && (
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

      {/* Modal para ver imagen en grande */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista previa del comprobante</DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <div className="flex justify-center">
              <img
                src={imagePreview}
                alt="Comprobante"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

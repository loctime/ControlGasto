"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PaymentService } from "@/lib/payment-service"
import { PaymentType } from "@/lib/types"
import { CreditCard, Receipt, Home, Wrench, Shield, FileText, DollarSign } from "lucide-react"

interface PaymentDialogProps {
  expenseId: string
  expenseAmount: number
  expenseDescription: string
  onPaymentCreated?: (paymentId: string) => void
  children?: React.ReactNode
}

const paymentTypeOptions = [
  { value: 'rent', label: 'Alquiler', icon: Home, color: 'bg-blue-100 text-blue-800' },
  { value: 'utilities', label: 'Servicios', icon: Wrench, color: 'bg-green-100 text-green-800' },
  { value: 'maintenance', label: 'Mantenimiento', icon: Wrench, color: 'bg-orange-100 text-orange-800' },
  { value: 'insurance', label: 'Seguros', icon: Shield, color: 'bg-purple-100 text-purple-800' },
  { value: 'taxes', label: 'Impuestos', icon: FileText, color: 'bg-red-100 text-red-800' },
  { value: 'other', label: 'Otros', icon: DollarSign, color: 'bg-gray-100 text-gray-800' }
]

export function PaymentDialog({
  expenseId,
  expenseAmount,
  expenseDescription,
  onPaymentCreated,
  children
}: PaymentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [paymentType, setPaymentType] = useState<PaymentType>('rent')
  const [amount, setAmount] = useState(expenseAmount.toString())
  const [description, setDescription] = useState(expenseDescription)
  const [notes, setNotes] = useState('')
  const { toast } = useToast()

  // TODO: Obtener userId del contexto de autenticación
  const paymentService = new PaymentService("temp-user-id")

  const handleCreatePayment = async () => {
    if (!paymentType || !amount || !description) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      const paymentData = {
        type: paymentType,
        amount: parseFloat(amount),
        currency: 'ARS',
        date: new Date().toISOString().split('T')[0],
        description: description,
        status: 'paid' as const,
        category: paymentType,
        month: getCurrentMonth(),
        year: new Date().getFullYear()
      }

      const paymentId = await paymentService.createPayment(paymentData)
      
      toast({
        title: "Pago registrado exitosamente",
        description: `El pago de ${paymentData.amount} ARS ha sido registrado.`,
      })

      onPaymentCreated?.(paymentId)
      setIsOpen(false)
      
      // Reset form
      setAmount(expenseAmount.toString())
      setDescription(expenseDescription)
      setNotes('')
    } catch (error: any) {
      toast({
        title: "Error al registrar pago",
        description: error.message || "No se pudo registrar el pago",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getCurrentMonth = (): string => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const selectedOption = paymentTypeOptions.find(option => option.value === paymentType)
  const IconComponent = selectedOption?.icon || DollarSign

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <CreditCard className="w-4 h-4 mr-2" />
            Marcar como Pagado
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Registrar Pago
          </DialogTitle>
          <DialogDescription>
            Registra el pago y adjunta la factura correspondiente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de pago */}
          <div className="space-y-2">
            <Label htmlFor="payment-type">Tipo de Pago</Label>
            <Select value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de pago" />
              </SelectTrigger>
              <SelectContent>
                {paymentTypeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {selectedOption && (
              <Badge className={selectedOption.color}>
                <IconComponent className="w-3 h-3 mr-1" />
                {selectedOption.label}
              </Badge>
            )}
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto (ARS)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del pago"
            />
          </div>

          {/* Notas adicionales */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales sobre el pago..."
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCreatePayment}
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Registrar Pago
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

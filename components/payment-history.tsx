"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { PaymentService } from "@/lib/payment-service"
import { InvoiceService } from "@/lib/invoice-service"
import { PaymentWithInvoices, PaymentType } from "@/lib/types"
import { 
  CreditCard, 
  FileText, 
  Calendar, 
  DollarSign, 
  Eye, 
  Download, 
  Upload,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { PaymentInvoiceUpload } from "./payment-invoice-upload"

export function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentWithInvoices[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithInvoices | null>(null)
  const { toast } = useToast()

  // TODO: Obtener userId del contexto de autenticación
  const paymentService = new PaymentService("temp-user-id")
  const invoiceService = new InvoiceService("temp-user-id")

  useEffect(() => {
    loadPayments()
    loadAvailableMonths()
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      loadPaymentsByMonth(selectedMonth)
    } else {
      loadPayments()
    }
  }, [selectedMonth])

  const loadPayments = async () => {
    setIsLoading(true)
    try {
      const paymentsData = await paymentService.getPaymentsWithInvoices()
      setPayments(paymentsData)
    } catch (error: any) {
      toast({
        title: "Error cargando pagos",
        description: error.message || "No se pudieron cargar los pagos",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadPaymentsByMonth = async (month: string) => {
    setIsLoading(true)
    try {
      const paymentsData = await paymentService.getPaymentsWithInvoices(month)
      setPayments(paymentsData)
    } catch (error: any) {
      toast({
        title: "Error cargando pagos del mes",
        description: error.message || "No se pudieron cargar los pagos del mes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableMonths = async () => {
    try {
      const months = await paymentService.getAvailableMonths()
      setAvailableMonths(months)
    } catch (error: any) {
      console.error('Error cargando meses disponibles:', error)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPaymentTypeLabel = (type: PaymentType): string => {
    const labels: Record<PaymentType, string> = {
      rent: 'Alquiler',
      utilities: 'Servicios',
      maintenance: 'Mantenimiento',
      insurance: 'Seguros',
      taxes: 'Impuestos',
      other: 'Otros'
    }
    return labels[type] || type
  }

  const getPaymentTypeColor = (type: PaymentType): string => {
    const colors: Record<PaymentType, string> = {
      rent: 'bg-blue-100 text-blue-800',
      utilities: 'bg-green-100 text-green-800',
      maintenance: 'bg-orange-100 text-orange-800',
      insurance: 'bg-purple-100 text-purple-800',
      taxes: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTotalAmount = (): number => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  const getPaymentsByType = (): Record<PaymentType, number> => {
    const totals: Record<PaymentType, number> = {
      rent: 0,
      utilities: 0,
      maintenance: 0,
      insurance: 0,
      taxes: 0,
      other: 0
    }

    payments.forEach(payment => {
      totals[payment.type] += payment.amount
    })

    return totals
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historial de Pagos</h2>
          <p className="text-muted-foreground">
            {selectedMonth ? `Pagos de ${selectedMonth}` : 'Todos los pagos'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los meses</SelectItem>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('es-AR', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalAmount())}</div>
            <p className="text-xs text-muted-foreground">
              {payments.length} pago{payments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.reduce((sum, payment) => sum + payment.invoices.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              documentos adjuntos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                payments
                  .filter(p => p.month === new Date().toISOString().slice(0, 7))
                  .reduce((sum, payment) => sum + payment.amount, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('es-AR', { month: 'long' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pagos */}
      <div className="space-y-4">
        {payments.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay pagos registrados{selectedMonth ? ` para ${selectedMonth}` : ''}.
            </AlertDescription>
          </Alert>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{payment.description}</CardTitle>
                      <CardDescription>
                        {formatDate(payment.date)} • {formatCurrency(payment.amount)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPaymentTypeColor(payment.type)}>
                      {getPaymentTypeLabel(payment.type)}
                    </Badge>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Detalles</TabsTrigger>
                    <TabsTrigger value="invoices">
                      Facturas ({payment.invoices.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Tipo:</span> {getPaymentTypeLabel(payment.type)}
                      </div>
                      <div>
                        <span className="font-medium">Estado:</span> {payment.status}
                      </div>
                      <div>
                        <span className="font-medium">Mes:</span> {payment.month}
                      </div>
                      <div>
                        <span className="font-medium">Categoría:</span> {payment.category}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="invoices" className="space-y-4">
                    {payment.invoices.length === 0 ? (
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                          No hay facturas adjuntas a este pago.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        {payment.invoices.map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{invoice.fileName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(invoice.fileSize / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={invoice.verified ? "default" : "secondary"}>
                                {invoice.verified ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verificada
                                  </>
                                ) : (
                                  "Pendiente"
                                )}
                              </Badge>
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
                        ))}
                      </div>
                    )}
                    
                    {/* Componente para subir facturas */}
                    <PaymentInvoiceUpload
                      paymentId={payment.id}
                      paymentType={payment.type}
                      onInvoiceUploaded={() => {
                        // Recargar pagos para mostrar la nueva factura
                        loadPayments()
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

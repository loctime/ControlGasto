"use client"

import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { HistoryHeader } from "@/components/history-header"
import { HistoryResetModal } from "@/components/history-reset-modal"
import { HistoryStats } from "@/components/history-stats"
import { ReceiptViewer } from "@/components/receipt-viewer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HistorySkeleton } from "@/components/ui/skeleton-loaders"
import { PaymentService } from "@/lib/payment-service"
import { Payment } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import {
    Calendar as CalendarIcon,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Plus,
    Search
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

type SortField = 'date' | 'amount' | 'name'
type SortOrder = 'asc' | 'desc'

export function HistoryContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [view, setView] = useState<"week" | "month">("month")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  
  // Control de meses
  const [monthsToShow, setMonthsToShow] = useState(1) // Empezar con 1 mes
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  
  // Rango de fechas
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  })
  const [useDateRange, setUseDateRange] = useState(false)

  useEffect(() => {
    if (!user && !loading) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const fetchPayments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log("🔍 Historial - Cargando pagos para usuario:", user.uid)
        const paymentService = new PaymentService(user.uid)
        const paymentsData = await paymentService.getAllPayments()
        console.log("🔍 Historial - Pagos encontrados:", paymentsData.length)
        console.log("🔍 Historial - Pagos procesados:", paymentsData)
        setPayments(paymentsData)
      } catch (error) {
        console.error("❌ Historial - Error fetching payments:", error)
        setError("Error al cargar historial de pagos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [user])

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    console.log("🔍 Historial - Aplicando filtros. Pagos originales:", payments.length)
    let filtered = [...payments]

    // Filtrar por término de búsqueda (buscar en el nombre del gasto)
    if (searchTerm.trim()) {
      filtered = filtered.filter(payment =>
        payment.expenseName.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
      console.log("🔍 Historial - Después de filtro de búsqueda:", filtered.length)
    }

    // Filtrar por período
    if (useDateRange && dateRange.from && dateRange.to) {
      // Usar rango de fechas personalizado
      filtered = filtered.filter(payment => {
        const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
        return paymentDate >= dateRange.from! && paymentDate <= dateRange.to!
      })
    } else {
      // Usar lógica de meses/semana
      const now = new Date()
      let startDate: Date

      if (view === "week") {
        // Últimos 7 días
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else {
        // Últimos X meses (empezando desde el mes actual hacia atrás)
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const targetMonth = currentMonth - (monthsToShow - 1)
        
        if (targetMonth < 0) {
          // Si necesitamos ir al año anterior
          const targetYear = currentYear - Math.floor(Math.abs(targetMonth) / 12) - 1
          const adjustedMonth = 12 + (targetMonth % 12)
          startDate = new Date(targetYear, adjustedMonth, 1)
        } else {
          startDate = new Date(currentYear, targetMonth, 1)
        }
      }

      filtered = filtered.filter(payment => {
        const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
        return paymentDate >= startDate
      })
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'date':
          aValue = (a.paidAt instanceof Date ? a.paidAt : new Date(a.paidAt)).getTime()
          bValue = (b.paidAt instanceof Date ? b.paidAt : new Date(b.paidAt)).getTime()
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'name':
          aValue = a.expenseName.toLowerCase()
          bValue = b.expenseName.toLowerCase()
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    console.log("🔍 Historial - Pagos filtrados finales:", filtered.length)
    setFilteredPayments(filtered)
  }, [payments, searchTerm, sortField, sortOrder, view, monthsToShow, useDateRange, dateRange])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // ✅ OPTIMIZACIÓN: Memoizar cálculos pesados
  const totals = useMemo(() => {
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalPayments = filteredPayments.length

    return { 
      totalExpenses: totalAmount, 
      totalPaid: totalAmount, 
      totalPending: 0
    }
  }, [filteredPayments])

  // Verificar si hay más meses disponibles
  const isNewMonthWithPreviousPayments = useMemo(() => {
    if (payments.length === 0) return false
    
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const hasPreviousMonthPayments = payments.some(payment => {
      const paidDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
      return paidDate.getMonth() < currentMonth || paidDate.getFullYear() < currentYear
    })
    
    return hasPreviousMonthPayments
  }, [payments])

  const loadMoreMonths = () => {
    setIsLoadingMore(true)
    // Simular carga (en realidad no necesitamos cargar más datos, solo mostrar más)
    setTimeout(() => {
      setMonthsToShow(prev => prev + 1)
      setIsLoadingMore(false)
    }, 500)
  }

  // Verificar si hay más datos disponibles
  const hasMoreData = useMemo(() => {
    if (payments.length === 0) return false
    
    const now = new Date()
    const oldestPayment = payments.reduce((oldest, payment) => {
      const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
      const oldestDate = oldest.paidAt instanceof Date ? oldest.paidAt : new Date(oldest.paidAt)
      return paymentDate < oldestDate ? payment : oldest
    })
    
    const oldestDate = oldestPayment.paidAt instanceof Date ? oldestPayment.paidAt : new Date(oldestPayment.paidAt)
    const monthsDifference = (now.getFullYear() - oldestDate.getFullYear()) * 12 + 
                           (now.getMonth() - oldestDate.getMonth())
    
    return monthsToShow < monthsDifference + 1
  }, [payments, monthsToShow])

  const resetAllPayments = async () => {
    setIsResetting(true)
    try {
      await PaymentService.resetAllPayments(user!.uid)
      toast.success("Todos los pagos han sido reiniciados")
      setShowResetModal(false)
      // Recargar datos
      window.location.reload()
    } catch (error) {
      console.error("Error resetting payments:", error)
      toast.error("Error al reiniciar pagos")
    } finally {
      setIsResetting(false)
    }
  }

  if (loading || isLoading) {
    return <HistorySkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-red-800 font-medium mb-2">Error al cargar historial</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Reintentar
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <HistoryHeader 
          totals={totals}
          isNewMonth={isNewMonthWithPreviousPayments}
          onShowResetModal={() => setShowResetModal(true)}
        />

        <HistoryStats payments={filteredPayments} />

        {/* Filtros compactos */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre del gasto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* Ordenar */}
          <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Fecha</SelectItem>
              <SelectItem value="amount">Monto</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
            </SelectContent>
          </Select>

          {/* Dirección orden */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-9 px-3"
          >
            {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          {/* Rango de fechas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 px-3 text-sm"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {useDateRange && dateRange.from && dateRange.to 
                  ? `${dateRange.from.toLocaleDateString('es-ES')} - ${dateRange.to.toLocaleDateString('es-ES')}`
                  : "Rango de fechas"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Seleccionar rango:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateRange({ from: undefined, to: undefined })
                        setUseDateRange(false)
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      Limpiar
                    </Button>
                  </div>
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange(range)
                        setUseDateRange(true)
                      }
                    }}
                    className="rounded-md border"
                    numberOfMonths={1}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Vista */}
          <div className="flex items-center gap-1 bg-background rounded-md p-1">
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setView("week")
                setUseDateRange(false)
              }}
              className="h-7 px-3 text-xs"
            >
              Semana
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setView("month")
                setUseDateRange(false)
              }}
              className="h-7 px-3 text-xs"
            >
              Mes
            </Button>
          </div>
        </div>

        {/* Lista de pagos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Historial de Pagos ({filteredPayments.length} de {payments.length})
            </h2>
            <div className="text-sm text-muted-foreground">
              Mostrando últimos {monthsToShow} {monthsToShow === 1 ? 'mes' : 'meses'}
            </div>
          </div>
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No se encontraron pagos
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Intenta ajustar los filtros de búsqueda" 
                    : "No hay pagos registrados aún"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPayments.map((payment) => {
              const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
              const { date, time } = formatDateTime(paymentDate)
              
              return (
                 <Card 
                   key={payment.id}
                   className="transition-all duration-200 hover:shadow-md border-green-200 bg-green-50/50 dark:bg-green-950/20"
                 >
                   <CardContent className="p-4">
                     {/* Primera línea: Nombre y Estado */}
                     <div className="flex items-center justify-between mb-3">
                       <h3 className="text-lg font-semibold text-foreground truncate flex-1">{payment.expenseName}</h3>
                       
                       <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1 text-green-600">
                           <CheckCircle className="w-4 h-4" />
                           <span className="text-sm font-medium">Pagado</span>
                         </div>
                       </div>
                     </div>

                     {/* Segunda línea: Monto */}
                     <div className="flex items-center justify-between mb-3">
                       <div className="text-3xl font-bold text-foreground">
                         {formatCurrency(payment.amount)}
                       </div>
                       
                       <Badge variant="outline" className="text-sm px-3 py-1.5">
                         {payment.currency || 'ARS'}
                       </Badge>
                     </div>

                     {/* Tercera línea: Fecha y Comprobante */}
                     <div className="flex items-center justify-between">
                       <div className="text-sm text-muted-foreground">
                         <span className="block text-green-600 font-medium">
                           Pagado: {date} a las {time}
                         </span>
                         {payment.notes && (
                           <span className="block text-xs mt-1 italic">
                             Nota: {payment.notes}
                           </span>
                         )}
                       </div>
                       
                       {payment.receiptImageId && (
                         <ReceiptViewer
                           receiptImageId={payment.receiptImageId}
                           expenseName={payment.expenseName}
                           expenseAmount={payment.amount}
                           paidAt={paymentDate}
                         />
                       )}
                     </div>
                   </CardContent>
                 </Card>
              )
            })
          )}

          {/* Botón Ver más */}
          {filteredPayments.length > 0 && hasMoreData && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={loadMoreMonths}
                disabled={isLoadingMore}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Ver más meses
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Resumen compacto */}
        {filteredPayments.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{filteredPayments.length}</p>
                    <p className="text-xs text-muted-foreground">Pagos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Pagado</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Promedio</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0) / filteredPayments.length)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <HistoryResetModal 
          open={showResetModal}
          onOpenChange={setShowResetModal}
          onReset={resetAllPayments}
          isResetting={isResetting}
        />
      </div>
      <BottomNav />
    </div>
  )
}
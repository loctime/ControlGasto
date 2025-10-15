"use client"

import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { HistoryHeader } from "@/components/history-header"
import { HistoryResetModal } from "@/components/history-reset-modal"
import { HistoryStats } from "@/components/history-stats"
import { ReceiptViewer } from "@/components/receipt-viewer"
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
        
        // Cargar pagos tradicionales
        const paymentsData = await paymentService.getAllPayments()
        console.log("🔍 Historial - Pagos tradicionales encontrados:", paymentsData.length)
        
        // Cargar gastos pagados (incluyendo items recurrentes pagados)
        const expensesData = await paymentService.getAllPaidExpenses()
        console.log("🔍 Historial - Gastos pagados encontrados:", expensesData.length)
        
        // Combinar ambos tipos de pagos
        const allPayments = [...paymentsData, ...expensesData]
        console.log("🔍 Historial - Total de pagos:", allPayments.length)
        console.log("🔍 Historial - Pagos procesados:", allPayments)
        setPayments(allPayments)
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
      totalAmount: totalAmount, 
      paymentsCount: totalPayments
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
    <div className="min-h-screen gradient-bg pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <HistoryHeader 
          totals={totals}
          isNewMonth={isNewMonthWithPreviousPayments}
          onShowResetModal={() => setShowResetModal(true)}
        />

        <HistoryStats payments={filteredPayments} />

        {/* Filtros modernos y compactos */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-success/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
            <div className="flex flex-wrap items-center gap-3">
              {/* Búsqueda */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <Input
                  placeholder="Buscar por nombre del gasto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-2 border-primary/20 focus:border-primary focus:ring-primary rounded-xl transition-all duration-300"
                />
              </div>

              {/* Ordenar */}
              <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                <SelectTrigger className="w-[120px] h-10 border-2 border-primary/20 focus:border-primary focus:ring-primary rounded-xl transition-all duration-300">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="date" className="rounded-lg">📅 Fecha</SelectItem>
                  <SelectItem value="amount" className="rounded-lg">💰 Monto</SelectItem>
                  <SelectItem value="name" className="rounded-lg">📝 Nombre</SelectItem>
                </SelectContent>
              </Select>

              {/* Dirección orden */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-10 px-4 border-2 border-primary/20 text-primary hover:bg-primary/10 rounded-xl transition-all duration-300"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {/* Rango de fechas */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 px-4 text-sm border-2 border-primary/20 text-primary hover:bg-primary/10 rounded-xl transition-all duration-300"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {useDateRange && dateRange.from && dateRange.to 
                      ? `${dateRange.from.toLocaleDateString('es-ES')} - ${dateRange.to.toLocaleDateString('es-ES')}`
                      : "📅 Rango"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
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
                          className="h-6 px-2 text-xs rounded-lg"
                        >
                          Limpiar
                        </Button>
                      </div>
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          if (range?.from && range?.to) {
                            setDateRange({ from: range.from, to: range.to })
                            setUseDateRange(true)
                          }
                        }}
                        className="rounded-xl border"
                        numberOfMonths={1}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Vista */}
              <div className="flex items-center gap-1 bg-primary/10 rounded-xl p-1">
                <Button
                  variant={view === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setView("week")
                    setUseDateRange(false)
                  }}
                  className="h-8 px-3 text-xs rounded-lg"
                >
                  📅 Semana
                </Button>
                <Button
                  variant={view === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setView("month")
                    setUseDateRange(false)
                  }}
                  className="h-8 px-3 text-xs rounded-lg"
                >
                  📊 Mes
                </Button>
              </div>
            </div>
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
                 <div
                   key={payment.id}
                   className="card-float bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-green-900/20 dark:via-emerald-900/20 dark:to-gray-900/50 border-2 border-green-400 dark:border-green-500 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02]"
                 >
                   {/* Efectos de fondo animados */}
                   <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-400/10 to-emerald-500/10 rounded-full blur-lg animate-pulse"></div>
                   
                   <div className="relative">
                     {/* Header del card */}
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-lg font-bold animate-bounce-gentle">
                           ✅
                         </div>
                         <div>
                           <h3 className="text-lg font-bold text-foreground">{payment.expenseName}</h3>
                           <div className="flex items-center gap-2">
                             <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-semibold">
                               💳 Pagado
                             </span>
                           </div>
                         </div>
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

                     {/* Footer del card */}
                     <div className="flex items-center justify-between">
                       {/* Monto */}
                       <div className="text-2xl font-bold text-foreground">
                         {formatCurrency(payment.amount)}
                       </div>
                       
                       <div className="text-right">
                         <div className="text-sm text-green-600 font-medium">
                           📅 {date} a las {time}
                         </div>
                         {payment.notes && (
                           <div className="text-xs text-muted-foreground italic">
                             📝 {payment.notes}
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
              )
            })
          )}

          {/* Botón Ver más moderno */}
          {filteredPayments.length > 0 && hasMoreData && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={loadMoreMonths}
                disabled={isLoadingMore}
                className="btn-modern px-6 py-3 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    📅 Ver más meses
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Resumen moderno */}
        {filteredPayments.length > 0 && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg animate-pulse-glow mx-auto mb-2">
                      📊
                    </div>
                    <p className="text-lg font-bold text-foreground">{filteredPayments.length}</p>
                    <p className="text-xs text-muted-foreground">Pagos</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg animate-bounce-gentle mx-auto mb-2">
                      💰
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Pagado</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-lg animate-wiggle mx-auto mb-2">
                    📈
                  </div>
                  <p className="text-sm text-muted-foreground">Promedio</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0) / filteredPayments.length)}
                  </p>
                </div>
              </div>
            </div>
          </div>
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
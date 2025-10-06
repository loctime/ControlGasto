"use client"

import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { HistoryHeader } from "@/components/history-header"
import { HistoryResetModal } from "@/components/history-reset-modal"
import { HistoryStats } from "@/components/history-stats"
import { ReceiptViewer } from "@/components/receipt-viewer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HistorySkeleton } from "@/components/ui/skeleton-loaders"
import { db } from "@/lib/firebase"
import { useMemoizedCalculations, useRetry } from "@/lib/optimization"
import { PaymentService } from "@/lib/payment-service"
import { formatCurrency } from "@/lib/utils"
import { collection, FieldValue, getDocs, query, Timestamp } from "firebase/firestore"
import {
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    Plus,
    Search
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// Helper function to safely convert Firebase timestamp to Date
const getDateFromTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  return new Date()
}

interface Expense {
  id: string
  name: string
  amount: number
  category: 'hogar' | 'transporte' | 'alimentacion' | 'servicios' | 'entretenimiento' | 'salud' | 'otros'
  status: 'pending' | 'paid'
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
  paidAt?: Timestamp | FieldValue | null
  unpaidAt?: Timestamp | FieldValue | null
  receiptImageId?: string | null
}

type SortField = 'date' | 'amount' | 'name' | 'category'
type SortOrder = 'asc' | 'desc'
type FilterCategory = 'all' | 'hogar' | 'transporte' | 'alimentacion' | 'servicios' | 'entretenimiento' | 'salud' | 'otros'

export function HistoryContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [view, setView] = useState<"week" | "month">("month")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [hasPreviousMonthPayments, setHasPreviousMonthPayments] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  
  // Control de meses
  const [monthsToShow, setMonthsToShow] = useState(1) // Empezar con 1 mes
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  
  const { retryWithBackoff } = useRetry()

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

    const fetchExpenses = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log("🔍 Historial - Cargando gastos para usuario:", user.uid)
        const q = query(
          collection(db, `apps/controlgastos/users/${user.uid}/expenses`)
        )
        const snapshot = await getDocs(q)
        console.log("🔍 Historial - Documentos encontrados:", snapshot.docs.length)
        const expensesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Expense[]
        console.log("🔍 Historial - Gastos procesados:", expensesData)
        setExpenses(expensesData)
      } catch (error) {
        console.error("❌ Historial - Error fetching expenses:", error)
        setError("Error al cargar historial")
      } finally {
        setIsLoading(false)
      }
    }

    fetchExpenses()
  }, [user])

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    console.log("🔍 Historial - Aplicando filtros. Gastos originales:", expenses.length)
    let filtered = [...expenses]

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(expense =>
        expense.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
      console.log("🔍 Historial - Después de filtro de búsqueda:", filtered.length)
    }

    // Filtrar por categoría
    if (categoryFilter !== "all") {
      filtered = filtered.filter(expense => expense.category === categoryFilter)
      console.log("🔍 Historial - Después de filtro de categoría:", filtered.length)
    }

    // Filtrar por período
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

    filtered = filtered.filter(expense => {
      const expenseDate = getDateFromTimestamp(expense.createdAt)
      return expenseDate >= startDate
    })

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'date':
          aValue = getDateFromTimestamp(a.createdAt).getTime()
          bValue = getDateFromTimestamp(b.createdAt).getTime()
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'category':
          aValue = a.category
          bValue = b.category
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

    console.log("🔍 Historial - Gastos filtrados finales:", filtered.length)
    setFilteredExpenses(filtered)
  }, [expenses, searchTerm, categoryFilter, sortField, sortOrder, view, monthsToShow])

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

  const getCategoryLabel = (category: string) => {
    const labels = {
      'hogar': '🏠 Hogar',
      'transporte': '🚗 Transporte',
      'alimentacion': '🍽️ Alimentación',
      'servicios': '⚡ Servicios',
      'entretenimiento': '🎬 Entretenimiento',
      'salud': '🏥 Salud',
      'otros': '📦 Otros'
    }
    return labels[category as keyof typeof labels] || category
  }

  const formatDateTime = (timestamp: Timestamp | FieldValue) => {
    const date = getDateFromTimestamp(timestamp)
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
  const totals = useMemoizedCalculations(
    filteredExpenses,
    (expenses) => {
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
      const totalPaid = expenses.filter((exp) => exp.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0)
      const totalPending = expenses.filter((exp) => exp.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0)

      return { totalExpenses, totalPaid, totalPending }
    }
  )

  // Verificar si es nuevo mes con pagos del mes anterior
  const isNewMonthWithPreviousPayments = useMemo(() => {
    if (expenses.length === 0) return false
    
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const hasPreviousMonthPayments = expenses.some(expense => {
      if (expense.status !== 'paid') return false
      const paidDate = getDateFromTimestamp(expense.paidAt)
      return paidDate.getMonth() < currentMonth || paidDate.getFullYear() < currentYear
    })
    
    return hasPreviousMonthPayments
  }, [expenses])

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
    if (expenses.length === 0) return false
    
    const now = new Date()
    const oldestExpense = expenses.reduce((oldest, expense) => {
      const expenseDate = getDateFromTimestamp(expense.createdAt)
      const oldestDate = getDateFromTimestamp(oldest.createdAt)
      return expenseDate < oldestDate ? expense : oldest
    })
    
    const oldestDate = getDateFromTimestamp(oldestExpense.createdAt)
    const monthsDifference = (now.getFullYear() - oldestDate.getFullYear()) * 12 + 
                           (now.getMonth() - oldestDate.getMonth())
    
    return monthsToShow < monthsDifference + 1
  }, [expenses, monthsToShow])

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

        <HistoryStats payments={filteredExpenses} />

        {/* Filtros compactos */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          
          {/* Categoría */}
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as FilterCategory)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="hogar">🏠 Hogar</SelectItem>
              <SelectItem value="transporte">🚗 Transporte</SelectItem>
              <SelectItem value="alimentacion">🍽️ Alimentación</SelectItem>
              <SelectItem value="servicios">⚡ Servicios</SelectItem>
              <SelectItem value="entretenimiento">🎬 Entretenimiento</SelectItem>
              <SelectItem value="salud">🏥 Salud</SelectItem>
              <SelectItem value="otros">📦 Otros</SelectItem>
            </SelectContent>
          </Select>

          {/* Ordenar */}
          <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Fecha</SelectItem>
              <SelectItem value="amount">Monto</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="category">Categoría</SelectItem>
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

          {/* Vista */}
          <div className="flex items-center gap-1 bg-background rounded-md p-1">
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className="h-7 px-3 text-xs"
            >
              Semana
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className="h-7 px-3 text-xs"
            >
              Mes
            </Button>
          </div>
        </div>

        {/* Lista de gastos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Historial de Gastos ({filteredExpenses.length} de {expenses.length})
            </h2>
            <div className="text-sm text-muted-foreground">
              Mostrando últimos {monthsToShow} {monthsToShow === 1 ? 'mes' : 'meses'}
            </div>
          </div>
          {filteredExpenses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No se encontraron gastos
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || categoryFilter !== "all" 
                    ? "Intenta ajustar los filtros de búsqueda" 
                    : "No hay gastos registrados aún"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredExpenses.map((expense) => {
              const { date, time } = formatDateTime(expense.createdAt)
              const paidDate = expense.status === 'paid' && expense.paidAt ? formatDateTime(expense.paidAt) : null
              
              return (
                 <Card 
                   key={expense.id}
                   className={`transition-all duration-200 hover:shadow-md ${
                     expense.status === 'paid' 
                       ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" 
                       : "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"
                   }`}
                 >
                   <CardContent className="p-4">
                     {/* Primera línea: Nombre y Estado */}
                     <div className="flex items-center justify-between mb-3">
                       <h3 className="text-lg font-semibold text-foreground truncate flex-1">{expense.name}</h3>
                       
                       <div className="flex items-center gap-2">
                         {expense.status === 'paid' ? (
                           <div className="flex items-center gap-1 text-green-600">
                             <CheckCircle className="w-4 h-4" />
                             <span className="text-sm font-medium">Pagado</span>
                           </div>
                         ) : (
                           <div className="flex items-center gap-1 text-amber-600">
                             <Clock className="w-4 h-4" />
                             <span className="text-sm font-medium">Pendiente</span>
                           </div>
                         )}
                       </div>
                     </div>

                     {/* Segunda línea: Monto y Categoría */}
                     <div className="flex items-center justify-between mb-3">
                       <div className="text-3xl font-bold text-foreground">
                         {formatCurrency(expense.amount)}
                       </div>
                       
                       <Badge variant="outline" className="text-sm px-3 py-1.5">
                         {getCategoryLabel(expense.category)}
                       </Badge>
                     </div>

                     {/* Tercera línea: Fechas y Comprobante */}
                     <div className="flex items-center justify-between">
                       <div className="text-sm text-muted-foreground">
                         Creado: {date} a las {time}
                         {paidDate && (
                           <span className="block text-green-600">
                             Pagado: {paidDate.date} a las {paidDate.time}
                           </span>
                         )}
                       </div>
                       
                       {expense.status === 'paid' && expense.receiptImageId && (
                         <ReceiptViewer
                           receiptImageId={expense.receiptImageId}
                           expenseName={expense.name}
                           expenseAmount={expense.amount}
                           paidAt={expense.paidAt && 'toDate' in expense.paidAt ? expense.paidAt.toDate() : null}
                         />
                       )}
                     </div>
                   </CardContent>
                 </Card>
              )
            })
          )}

          {/* Botón Ver más */}
          {filteredExpenses.length > 0 && hasMoreData && (
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
        {filteredExpenses.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{filteredExpenses.length}</p>
                    <p className="text-xs text-muted-foreground">Gastos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(filteredExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Pagado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-600">
                      {formatCurrency(filteredExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Pendiente</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}
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
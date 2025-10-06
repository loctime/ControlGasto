"use client"

import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { HistoryHeader } from "@/components/history-header"
import { HistoryResetModal } from "@/components/history-reset-modal"
import { HistoryStats } from "@/components/history-stats"
import { ReceiptViewer } from "@/components/receipt-viewer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    Filter,
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
      // Mes actual
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
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
  }, [expenses, searchTerm, categoryFilter, sortField, sortOrder, view])

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

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros y Ordenamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros en grid 2x2 */}
            <div className="grid grid-cols-2 gap-4">
              {/* Primera fila */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as FilterCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="hogar">🏠 Hogar</SelectItem>
                  <SelectItem value="transporte">🚗 Transporte</SelectItem>
                  <SelectItem value="alimentacion">🍽️ Alimentación</SelectItem>
                  <SelectItem value="servicios">⚡ Servicios</SelectItem>
                  <SelectItem value="entretenimiento">🎬 Entretenimiento</SelectItem>
                  <SelectItem value="salud">🏥 Salud</SelectItem>
                  <SelectItem value="otros">📦 Otros</SelectItem>
                </SelectContent>
              </Select>

              {/* Segunda fila */}
              <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Fecha</SelectItem>
                  <SelectItem value="amount">Monto</SelectItem>
                  <SelectItem value="name">Descripción</SelectItem>
                  <SelectItem value="category">Categoría</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              </Button>
            </div>

            {/* Toggle de vista */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Vista:</span>
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
              >
                Semana
              </Button>
              <Button
                variant={view === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("month")}
              >
                Mes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de gastos */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Historial de Gastos ({filteredExpenses.length} de {expenses.length})</h2>
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
        </div>

        {/* Resumen */}
        {filteredExpenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Resumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{filteredExpenses.length}</p>
                  <p className="text-sm text-muted-foreground">Total Gastos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(filteredExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Pagado</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(filteredExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Pendiente</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total General</p>
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
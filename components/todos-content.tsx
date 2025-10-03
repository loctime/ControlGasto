"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Receipt, 
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Timestamp, FieldValue } from "firebase/firestore"
import { ReceiptViewer } from "@/components/receipt-viewer"

interface Expense {
  id: string
  name: string
  amount: number
  category: 'hogar' | 'transporte' | 'alimentacion' | 'servicios' | 'entretenimiento' | 'salud' | 'otros'
  paid: boolean
  userId: string
  createdAt: Timestamp | FieldValue
  paidAt?: Timestamp | FieldValue | null
  unpaidAt?: Timestamp | FieldValue | null
  receiptImageId?: string | null
}

type SortField = 'date' | 'amount' | 'name' | 'category'
type SortOrder = 'asc' | 'desc'
type FilterCategory = 'all' | 'hogar' | 'transporte' | 'alimentacion' | 'servicios' | 'entretenimiento' | 'salud' | 'otros'

// Helper function to safely convert Firebase timestamp to Date
const getDateFromTimestamp = (timestamp: Timestamp | FieldValue | null | undefined): Date => {
  if (!timestamp) return new Date()
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  return new Date()
}

export function TodosContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

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
        const q = query(
          collection(db, "expenses"), 
          where("userId", "==", user.uid), 
          orderBy("createdAt", "desc")
        )
        const snapshot = await getDocs(q)
        const expensesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Expense[]
        setExpenses(expensesData)
      } catch (error) {
        console.error("Error fetching expenses:", error)
        setError("Error al cargar gastos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchExpenses()
  }, [user])

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let filtered = [...expenses]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por categoría
    if (categoryFilter !== "all") {
      filtered = filtered.filter(expense => expense.category === categoryFilter)
    }

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

    setFilteredExpenses(filtered)
  }, [expenses, searchTerm, categoryFilter, sortField, sortOrder])

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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-red-800 font-medium mb-2">Error al cargar gastos</h3>
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
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Todos los Gastos</h1>
          <p className="text-muted-foreground">
            Lista completa de todos los pagos realizados ({filteredExpenses.length} de {expenses.length})
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros y Ordenamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros en grid responsive */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por categoría */}
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

              {/* Ordenar por */}
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

              {/* Orden */}
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de gastos */}
        <div className="space-y-3">
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
              const paidDate = expense.paid && expense.paidAt ? formatDateTime(expense.paidAt) : null
              
              return (
                <Card 
                  key={expense.id}
                  className={`transition-all duration-200 hover:shadow-md ${
                    expense.paid 
                      ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" 
                      : "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Información principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{expense.name}</h3>
                          <Badge 
                            variant={expense.paid ? "default" : "secondary"}
                            className={`text-xs ${
                              expense.paid 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                          >
                            {expense.paid ? (
                              <><CheckCircle className="w-3 h-3 mr-1" />Pagado</>
                            ) : (
                              <><Clock className="w-3 h-3 mr-1" />Pendiente</>
                            )}
                          </Badge>
                          {expense.receiptImageId && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <Receipt className="w-3 h-3 mr-1" />
                              Comprobante
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(expense.category)}
                          </Badge>
                        </div>

                        <div className="text-2xl font-bold text-foreground mb-2">
                          {formatCurrency(expense.amount)}
                        </div>

                        {/* Fechas */}
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Creado: {date} a las {time}</span>
                          </div>
                          {paidDate && (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>Pagado: {paidDate.date} a las {paidDate.time}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {/* Ver comprobante si existe */}
                        {expense.paid && expense.receiptImageId && (
                          <ReceiptViewer
                            receiptImageId={expense.receiptImageId}
                            expenseName={expense.name}
                            expenseAmount={expense.amount}
                          />
                        )}
                      </div>
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
                <DollarSign className="w-5 h-5" />
                Resumen
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
                    {formatCurrency(filteredExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Pagado</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(filteredExpenses.filter(e => !e.paid).reduce((sum, e) => sum + e.amount, 0))}
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
      </div>
      <BottomNav />
    </div>
  )
}

"use client"

import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { HistoryHeader } from "@/components/history-header"
import { HierarchicalHistory } from "@/components/history-hierarchical"
import { HistoryResetModal } from "@/components/history-reset-modal"
import { HistoryStats } from "@/components/history-stats"
import { SearchHelp } from "@/components/search-help"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HistorySkeleton } from "@/components/ui/skeleton-loaders"
import { PaymentService } from "@/lib/payment-service"
import { Payment } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import {
    ChevronDown,
    ChevronUp,
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  
  // Filtros simplificados
  const [searchTerm, setSearchTerm] = useState("")
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

  // Aplicar ordenamiento a los pagos
  const sortedPayments = useMemo(() => {
    const sorted = [...payments]
    
    sorted.sort((a, b) => {
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

    return sorted
  }, [payments, sortField, sortOrder])

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
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalPayments = payments.length

    return { 
      totalAmount: totalAmount, 
      paymentsCount: totalPayments
    }
  }, [payments])

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

        <HistoryStats payments={payments} />

        {/* Filtros simplificados */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-success/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
            <div className="flex flex-wrap items-center gap-3">
              {/* Búsqueda */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <Input
                  placeholder="Buscar: 'supermercado', 'octubre', '2025', 'supermercado octubre'..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 h-10 border-2 border-primary/20 focus:border-primary focus:ring-primary rounded-xl transition-all duration-300"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <SearchHelp />
                </div>
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
            </div>
          </div>
        </div>

        {/* Navegación jerárquica */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Historial de Pagos ({payments.length} pagos)
            </h2>
            <div className="text-sm text-muted-foreground">
              Navega por años, meses, semanas y días
            </div>
          </div>
          
          <HierarchicalHistory 
            payments={sortedPayments} 
            searchTerm={searchTerm} 
          />
        </div>

        {/* Resumen moderno */}
        {payments.length > 0 && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg animate-pulse-glow mx-auto mb-2">
                      📊
                    </div>
                    <p className="text-lg font-bold text-foreground">{payments.length}</p>
                    <p className="text-xs text-muted-foreground">Pagos</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg animate-bounce-gentle mx-auto mb-2">
                      💰
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
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
                    {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0) / payments.length)}
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
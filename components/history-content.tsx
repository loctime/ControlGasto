"use client"

import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { DateSearch } from "@/components/date-search"
import { HistoryHeader } from "@/components/history-header"
import { HierarchicalHistory } from "@/components/history-hierarchical"
import { HistoryResetModal } from "@/components/history-reset-modal"
import { HistoryStats } from "@/components/history-stats"
import { SearchHelp } from "@/components/search-help"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HistorySkeleton } from "@/components/ui/skeleton-loaders"
import { PaymentService } from "@/lib/payment-service"
import { Payment } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"


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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  // Aplicar filtros
  const filteredPayments = useMemo(() => {
    let filtered = [...payments]

    // Filtrar por fecha específica si está seleccionada
    if (selectedDate) {
      filtered = filtered.filter(payment => {
        const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
        return paymentDate.toDateString() === selectedDate.toDateString()
      })
    }

    // Aplicar búsqueda inteligente solo si hay término de búsqueda
    if (searchTerm.trim()) {
      const { smartSearch } = require('@/lib/smart-search')
      const searchResult = smartSearch(filtered, searchTerm)
      filtered = searchResult.payments
    }

    return filtered
  }, [payments, searchTerm, selectedDate])


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

        {/* Filtros divididos */}
        <div className="space-y-4">
          {/* Búsqueda de texto */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-success/5 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
              <div className="flex items-center gap-2">
                {/* Búsqueda de texto */}
                <div className="relative flex-1 min-w-[120px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 h-10 border-2 border-primary/20 focus:border-primary focus:ring-primary rounded-xl transition-all duration-300"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <SearchHelp />
                  </div>
                </div>

                {/* Búsqueda de fecha */}
                <div className="relative w-[140px]">
                  <DateSearch 
                    onDateChange={setSelectedDate}
                    placeholder="DD/MM/YYYY"
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Indicadores de filtros activos */}
          {(searchTerm || selectedDate) && (
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                  🔍 "{searchTerm}"
                </div>
              )}
              {selectedDate && (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                  📅 {selectedDate.toLocaleDateString('es-ES')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navegación jerárquica */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Historial de Pagos ({payments.length} pagos)
            </h2>
            
          </div>
          
          <HierarchicalHistory 
            payments={filteredPayments} 
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
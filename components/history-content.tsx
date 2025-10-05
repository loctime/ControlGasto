"use client"

import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { HistoryHeader } from "@/components/history-header"
import { HistoryResetModal } from "@/components/history-reset-modal"
import { HistoryStats } from "@/components/history-stats"
import { HistorySkeleton } from "@/components/ui/skeleton-loaders"
import { db } from "@/lib/firebase"
import { useMemoizedCalculations, useRetry } from "@/lib/optimization"
import { PaymentService } from "@/lib/payment-service"
import { collection, FieldValue, getDocs, orderBy, query, Timestamp, where } from "firebase/firestore"
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

interface Payment {
  id: string
  expenseId: string
  expenseName: string
  amount: number
  currency: string
  paidAt: Timestamp | FieldValue
  receiptImageId?: string | null
  notes?: string | null
  createdAt: Timestamp | FieldValue
}

export function HistoryContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [view, setView] = useState<"week" | "month">("month")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [hasPreviousMonthPayments, setHasPreviousMonthPayments] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  
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

    const fetchPayments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        await retryWithBackoff(async () => {
          const q = query(collection(db, "payments"), where("userId", "==", user.uid), orderBy("paidAt", "desc"))
          const snapshot = await getDocs(q)
          const paymentsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Payment[]
          setPayments(paymentsData)
        })
      } catch (error) {
        console.error("Error fetching payments:", error)
        setError("Error al cargar historial de pagos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [user, retryWithBackoff])

  // Filtrar pagos por período
  useEffect(() => {
    if (payments.length === 0) {
      setFilteredPayments([])
      return
    }

    const now = new Date()
    let startDate: Date

    if (view === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const filtered = payments.filter(payment => {
      const paymentDate = getDateFromTimestamp(payment.paidAt)
      return paymentDate >= startDate
    })

    setFilteredPayments(filtered)
  }, [payments, view])

  // Memoizar cálculos pesados
  const currentPayments = useMemo(() => 
    filteredPayments.length > 0 ? filteredPayments : payments, 
    [filteredPayments, payments]
  )

  const totals = useMemoizedCalculations(
    currentPayments,
    (payments) => {
      const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
      const paymentsCount = payments.length
      return { totalAmount, paymentsCount }
    }
  )

  // Detectar si es un nuevo mes Y si hay pagos del mes anterior
  const isNewMonthWithPreviousPayments = useMemo(() => {
    const now = new Date()
    const isFirstDaysOfMonth = now.getDate() <= 3 // Primeros 3 días del mes
    
    return isFirstDaysOfMonth && hasPreviousMonthPayments
  }, [hasPreviousMonthPayments])

  // Verificar si hay pagos del mes anterior
  useEffect(() => {
    if (!user) return

    const checkPreviousMonthPayments = async () => {
      try {
        const paymentService = new PaymentService(user.uid)
        const hasPayments = await paymentService.hasPaymentsFromPreviousMonth()
        setHasPreviousMonthPayments(hasPayments)
      } catch (error) {
        console.error("Error verificando pagos del mes anterior:", error)
        setHasPreviousMonthPayments(false)
      }
    }

    checkPreviousMonthPayments()
  }, [user])

  const resetAllPayments = async () => {
    if (!user) return

    setIsResetting(true)
    try {
      const paymentService = new PaymentService(user.uid)
      await paymentService.resetAllExpensesToPending()
      
      toast.success("✅ Todos los gastos han sido reiniciados a estado pendiente")
      setShowResetModal(false)
      setHasPreviousMonthPayments(false)
      
      // Recargar la página para actualizar los datos
      window.location.reload()
    } catch (error) {
      console.error("Error reiniciando pagos:", error)
      toast.error("❌ Error al reiniciar los gastos. Intenta nuevamente.")
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return <HistorySkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-1">
        <HistoryHeader 
          totals={totals}
          isNewMonth={isNewMonthWithPreviousPayments}
          onShowResetModal={() => setShowResetModal(true)}
        />

        <HistoryStats payments={currentPayments} />

        {/* Lista de pagos */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Historial de Pagos</h2>
          {currentPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentPayments.map((payment) => (
                <div key={payment.id} className="bg-card border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{payment.expenseName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getDateFromTimestamp(payment.paidAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${payment.amount.toLocaleString()}</p>
                      {payment.receiptImageId && (
                        <p className="text-xs text-green-600">✓ Con comprobante</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { HistoryHeader } from "@/components/history-header"
import { HistoryCharts } from "@/components/history-charts"
import { HistoryStats } from "@/components/history-stats"
import { HistoryResetModal } from "@/components/history-reset-modal"
import { HistorySkeleton } from "@/components/ui/skeleton-loaders"
import { useRetry, useMemoizedCalculations } from "@/lib/optimization"
import { collection, query, where, getDocs, orderBy, writeBatch, doc, Timestamp, FieldValue } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Helper function to safely convert Firebase timestamp to Date
const getDateFromTimestamp = (timestamp: Timestamp | FieldValue | null | undefined): Date => {
  if (!timestamp) return new Date()
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
  paid: boolean
  createdAt: Timestamp | FieldValue
  paidAt?: Timestamp | FieldValue | null
  unpaidAt?: Timestamp | FieldValue | null
}

export function HistoryContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [view, setView] = useState<"week" | "month">("month")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  
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
        await retryWithBackoff(async () => {
          const q = query(collection(db, "expenses"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
          const snapshot = await getDocs(q)
          const expensesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Expense[]
          setExpenses(expensesData)
        })
      } catch (error) {
        console.error("Error fetching expenses:", error)
        setError("Error al cargar historial")
      } finally {
        setIsLoading(false)
      }
    }

    fetchExpenses()
  }, [user, retryWithBackoff])

  // Filtrar gastos por período
  useEffect(() => {
    if (expenses.length === 0) {
      setFilteredExpenses([])
      return
    }

    const now = new Date()
    let startDate: Date

    if (view === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const filtered = expenses.filter(expense => {
      const expenseDate = getDateFromTimestamp(expense.createdAt)
      return expenseDate >= startDate
    })

    setFilteredExpenses(filtered)
  }, [expenses, view])

  // Memoizar cálculos pesados
  const currentExpenses = useMemo(() => 
    filteredExpenses.length > 0 ? filteredExpenses : expenses, 
    [filteredExpenses, expenses]
  )

  const totals = useMemoizedCalculations(
    currentExpenses,
    (expenses) => {
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
      const totalPaid = expenses.filter((exp) => exp.paid).reduce((sum, exp) => sum + exp.amount, 0)
      const totalPending = totalExpenses - totalPaid
      return { totalExpenses, totalPaid, totalPending }
    }
  )

  // Detectar si es un nuevo mes y hay gastos pagados del mes anterior
  const isNewMonth = () => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const lastMonthExpenses = expenses.filter(expense => {
      const expenseDate = getDateFromTimestamp(expense.createdAt)
      return expenseDate >= lastMonth && expenseDate < currentMonth && expense.paid
    })
    
    return lastMonthExpenses.length > 0
  }

  // Función para reiniciar todos los pagos
  const resetAllPayments = async () => {
    if (!user) return

    try {
      const batch = writeBatch(db)
      const paidExpenses = expenses.filter(exp => exp.paid)
      
      paidExpenses.forEach(expense => {
        const expenseRef = doc(db, "expenses", expense.id)
        batch.update(expenseRef, {
          paid: false,
          unpaidAt: new Date(),
          paidAt: null
        })
      })

      await batch.commit()
      setShowResetModal(false)
      
      // Recargar la página para actualizar los datos
      window.location.reload()
    } catch (error) {
      console.error("Error resetting payments:", error)
    }
  }

  // Mostrar modal de reinicio si es nuevo mes
  useEffect(() => {
    if (isNewMonth() && expenses.length > 0) {
      setShowResetModal(true)
    }
  }, [expenses])

  // Datos para gráficos
  const pieData = useMemo(() => [
    { name: "Pagado", value: totals.totalPaid, color: "#10b981" },
    { name: "Pendiente", value: totals.totalPending, color: "#f59e0b" },
  ], [totals])

  const categoryChartData = useMemo(() => {
    const categoryData = currentExpenses.reduce((acc, expense) => {
      const category = expense.category
      if (!acc[category]) {
        acc[category] = { category, total: 0, paid: 0, pending: 0 }
      }
      acc[category].total += expense.amount
      if (expense.paid) {
        acc[category].paid += expense.amount
      } else {
        acc[category].pending += expense.amount
      }
      return acc
    }, {} as Record<string, { category: string; total: number; paid: number; pending: number }>)

    return Object.values(categoryData).map(item => ({
      name: item.category === 'hogar' ? 'Hogar' :
            item.category === 'transporte' ? 'Transporte' :
            item.category === 'alimentacion' ? 'Alimentacion' :
            item.category === 'servicios' ? 'Servicios' :
            item.category === 'entretenimiento' ? 'Entretenimiento' :
            item.category === 'salud' ? 'Salud' : 'Otros',
      total: item.total,
      paid: item.paid,
      pending: item.pending
    }))
  }, [currentExpenses])

  const itemsChartData = useMemo(() => {
    const itemsData = currentExpenses.reduce((acc, expense) => {
      const itemName = expense.name
      if (!acc[itemName]) {
        acc[itemName] = { 
          name: itemName, 
          total: 0, 
          paid: 0, 
          pending: 0, 
          count: 0,
          category: expense.category
        }
      }
      acc[itemName].total += expense.amount
      acc[itemName].count += 1
      if (expense.paid) {
        acc[itemName].paid += expense.amount
      } else {
        acc[itemName].pending += expense.amount
      }
      return acc
    }, {} as Record<string, { 
      name: string; 
      total: number; 
      paid: number; 
      pending: number; 
      count: number;
      category: string;
    }>)

    return Object.values(itemsData)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(item => ({
        name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
        fullName: item.name,
        total: item.total,
        paid: item.paid,
        pending: item.pending,
        count: item.count,
        category: item.category
      }))
  }, [currentExpenses])

  // Estados de carga optimizados
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
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
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
          isNewMonth={isNewMonth()}
          onShowResetModal={() => setShowResetModal(true)}
        />

        <HistoryStats expenses={currentExpenses} />

        <HistoryCharts 
          pieData={pieData}
          categoryChartData={categoryChartData}
          itemsChartData={itemsChartData}
        />

        <HistoryResetModal 
          open={showResetModal}
          onOpenChange={setShowResetModal}
          onReset={resetAllPayments}
        />
      </div>
      <BottomNav />
    </div>
  )
}
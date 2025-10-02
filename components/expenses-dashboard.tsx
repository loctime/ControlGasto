"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/components/auth-provider"
import { ExpensesHeader } from "@/components/expenses-header"
import { ExpensesTable } from "@/components/expenses-table"
import { ErrorBoundary, ChartErrorFallback } from "@/components/ui/error-boundary"
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders"
import { useRetry, useRateLimit, useMemoizedCalculations } from "@/lib/optimization"
import { toast } from "sonner"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Expense {
  id: string
  name: string
  amount: number
  category: 'hogar' | 'transporte' | 'alimentacion' | 'servicios' | 'entretenimiento' | 'salud' | 'otros'
  paid: boolean
  userId: string
  createdAt: any
  paidAt?: any
  unpaidAt?: any
}

export function ExpensesDashboard() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // ✅ OPTIMIZACIÓN: Hooks de optimización
  const { retryWithBackoff } = useRetry()
  const { canMakeRequest, makeRequest } = useRateLimit(20, 60000) // 20 requests por minuto

  // ✅ OPTIMIZACIÓN: Memoizar cálculos pesados
  const totals = useMemoizedCalculations(
    expenses,
    (expenses) => {
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
      const totalPaid = expenses.filter((exp) => exp.paid).reduce((sum, exp) => sum + exp.amount, 0)
      const totalPending = totalExpenses - totalPaid
      return { totalExpenses, totalPaid, totalPending }
    }
  )

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const q = query(collection(db, "expenses"), where("userId", "==", user.uid))
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const expensesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Expense[]
          console.log("🔍 DEBUG - Gastos cargados desde Firestore:", expensesData.map(exp => ({ 
            name: exp.name, 
            category: exp.category, 
            amount: exp.amount 
          })))
          setExpenses(expensesData)
          setError(null)
        } catch (err) {
          console.error("Error loading expenses:", err)
          setError("Error al cargar gastos")
        } finally {
          setIsLoading(false)
        }
      },
      (error) => {
        console.error("Firestore error:", error)
        setError("Error de conexión")
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  // ✅ OPTIMIZACIÓN: Funciones memoizadas con retry logic
  const addExpense = useCallback(async (name: string, amount: number, category: string) => {
    if (!user || !canMakeRequest) {
      toast.error("Demasiadas solicitudes. Espera un momento.")
      return
    }

    try {
      makeRequest()
      await retryWithBackoff(async () => {
        const expenseData = {
          name,
          amount,
          category,
          paid: false,
          userId: user.uid,
          createdAt: serverTimestamp(),
        }
        console.log("🔍 DEBUG - Guardando gasto:", expenseData)
        await addDoc(collection(db, "expenses"), expenseData)
      })
      toast.success("Gasto agregado correctamente")
    } catch (error) {
      console.error("Error adding expense:", error)
      toast.error("Error al agregar gasto")
      throw error
    }
  }, [user, canMakeRequest, makeRequest, retryWithBackoff])

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    if (!canMakeRequest) {
      toast.error("Demasiadas solicitudes. Espera un momento.")
      return
    }

    try {
      makeRequest()
      await retryWithBackoff(async () => {
        await updateDoc(doc(db, "expenses", id), updates)
      })
      toast.success("Gasto actualizado correctamente")
    } catch (error) {
      console.error("Error updating expense:", error)
      toast.error("Error al actualizar gasto")
      throw error
    }
  }, [canMakeRequest, makeRequest, retryWithBackoff])

  const deleteExpense = useCallback(async (id: string) => {
    if (!canMakeRequest) {
      toast.error("Demasiadas solicitudes. Espera un momento.")
      return
    }

    try {
      makeRequest()
      await retryWithBackoff(async () => {
        await deleteDoc(doc(db, "expenses", id))
      })
      toast.success("Gasto eliminado correctamente")
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast.error("Error al eliminar gasto")
      throw error
    }
  }, [canMakeRequest, makeRequest, retryWithBackoff])

  const togglePaid = useCallback(async (id: string, currentPaid: boolean) => {
    const newPaidStatus = !currentPaid
    const updates: Partial<Expense> = { paid: newPaidStatus }
    
    if (newPaidStatus) {
      updates.paidAt = serverTimestamp()
      updates.unpaidAt = null
    } else {
      updates.unpaidAt = serverTimestamp()
      updates.paidAt = null
    }
    
    await updateExpense(id, updates)
  }, [updateExpense])

  // ✅ OPTIMIZACIÓN: Estados de carga y error
  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-red-800 font-medium mb-2">Error al cargar gastos</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header con totales */}
        <ExpensesHeader 
          totalPaid={totals.totalPaid}
          totalPending={totals.totalPending}
          totalExpenses={totals.totalExpenses}
        />

        {/* Tabla de gastos */}
        <ErrorBoundary fallback={ChartErrorFallback}>
          <ExpensesTable
            expenses={expenses}
            onAddExpense={addExpense}
            onUpdateExpense={updateExpense}
            onDeleteExpense={deleteExpense}
            onTogglePaid={togglePaid}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  )
}

"use client"

import { useAuth } from "@/components/auth-provider"
import { ExpensesHeader } from "@/components/expenses-header"
import { ExpensesTable } from "@/components/expenses-table"
import { NotificationsBanner } from "@/components/notifications-banner"
import { PendingItemsCard } from "@/components/pending-items-card"
import { ChartErrorFallback, ErrorBoundary } from "@/components/ui/error-boundary"
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAutoScheduler } from "@/lib/auto-scheduler"
import { db } from "@/lib/firebase"
import { useMemoizedCalculations, useRateLimit, useRetry } from "@/lib/optimization"
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    FieldValue,
    onSnapshot,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc
} from "firebase/firestore"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

interface Expense {
  id: string
  name: string
  amount: number
  category: 'hogar' | 'transporte' | 'alimentacion' | 'servicios' | 'entretenimiento' | 'salud' | 'otros'
  status: 'pending' | 'paid'
  userId: string
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}

// Función helper para filtrar gastos por período
const filterExpensesByPeriod = (expenses: Expense[], period: 'daily' | 'weekly' | 'monthly') => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  return expenses.filter(expense => {
    const expenseDate = expense.createdAt instanceof Timestamp 
      ? expense.createdAt.toDate() 
      : new Date()
    
    switch (period) {
      case 'daily':
        // Gastos de hoy
        const expenseDay = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate())
        return expenseDay.getTime() === today.getTime()
      
      case 'weekly':
        // Gastos de esta semana (últimos 7 días)
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return expenseDate >= weekAgo
      
      case 'monthly':
        // Gastos de este mes
        return expenseDate.getMonth() === now.getMonth() && 
               expenseDate.getFullYear() === now.getFullYear()
      
      default:
        return true
    }
  })
}

export function ExpensesDashboard() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  
  // ✅ OPTIMIZACIÓN: Hooks de optimización
  const { retryWithBackoff } = useRetry()
  const { canMakeRequest, makeRequest } = useRateLimit(20, 60000) // 20 requests por minuto
  
  // ✅ AUTO-SCHEDULER: Verificar items recurrentes automáticamente
  useAutoScheduler()
  
  // ✅ Filtrar gastos según el período activo
  const filteredExpenses = useMemo(() => {
    return filterExpensesByPeriod(expenses, activePeriod)
  }, [expenses, activePeriod])

  // ✅ OPTIMIZACIÓN: Memoizar cálculos pesados para el período seleccionado
  const totals = useMemoizedCalculations(
    filteredExpenses,
    (expenses) => {
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
      const totalPaid = expenses.filter((exp) => exp.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0)
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

    const q = query(collection(db, `apps/controlgastos/users/${user?.uid}/expenses`))
    
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
          status: 'pending',
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
        console.log("🔍 DEBUG - Guardando gasto:", expenseData)
        await addDoc(collection(db, `apps/controlgastos/users/${user?.uid}/expenses`), expenseData)
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
      // Filtrar campos undefined antes de enviar a Firebase
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      )
      
      await retryWithBackoff(async () => {
        await updateDoc(doc(db, `apps/controlgastos/users/${user?.uid}/expenses`, id), {
          ...cleanUpdates,
          updatedAt: serverTimestamp()
        })
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
        await deleteDoc(doc(db, `apps/controlgastos/users/${user?.uid}/expenses`, id))
      })
      toast.success("Gasto eliminado correctamente")
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast.error("Error al eliminar gasto")
      throw error
    }
  }, [canMakeRequest, makeRequest, retryWithBackoff])

  const togglePaid = useCallback(async (id: string, currentStatus: 'pending' | 'paid', receiptImageId?: string) => {
    const newStatus = currentStatus === 'pending' ? 'paid' : 'pending'
    
    if (newStatus === 'paid') {
      // Crear registro de pago en el historial
      const paymentService = new (await import('@/lib/payment-service')).PaymentService(user!.uid)
      const expense = expenses.find(exp => exp.id === id)
      
      if (expense) {
        await paymentService.recordPayment(
          id,
          expense.name,
          expense.amount,
          receiptImageId
        )
      }
    }
    
    // Actualizar estado del gasto
    await updateExpense(id, { status: newStatus })
  }, [updateExpense, user, expenses])

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

        {/* Banner de notificaciones */}
        <NotificationsBanner />

        {/* Pestañas de períodos */}
        <Tabs defaultValue="daily" className="w-full" onValueChange={(value) => setActivePeriod(value as 'daily' | 'weekly' | 'monthly')}>
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="daily" className="text-sm font-medium">
                📅 Diario
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-sm font-medium">
                📊 Semanal
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-sm font-medium">
                📈 Mensual
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Contenido para cada período */}
          <TabsContent value="daily" className="space-y-6">
            {/* Items recurrentes diarios pendientes */}
            <ErrorBoundary fallback={ChartErrorFallback}>
              <PendingItemsCard filterByRecurrence="daily" />
            </ErrorBoundary>

            {/* Header con totales del día */}
            <ExpensesHeader 
              totalPaid={totals.totalPaid}
              totalPending={totals.totalPending}
              totalExpenses={totals.totalExpenses}
            />

            {/* Tabla de gastos del día */}
            <ErrorBoundary fallback={ChartErrorFallback}>
              <ExpensesTable
                expenses={filteredExpenses}
                onAddExpense={addExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
                onTogglePaid={togglePaid}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6">
            {/* Items recurrentes semanales pendientes */}
            <ErrorBoundary fallback={ChartErrorFallback}>
              <PendingItemsCard filterByRecurrence="weekly" />
            </ErrorBoundary>

            {/* Header con totales de la semana */}
            <ExpensesHeader 
              totalPaid={totals.totalPaid}
              totalPending={totals.totalPending}
              totalExpenses={totals.totalExpenses}
            />

            {/* Tabla de gastos de la semana */}
            <ErrorBoundary fallback={ChartErrorFallback}>
              <ExpensesTable
                expenses={filteredExpenses}
                onAddExpense={addExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
                onTogglePaid={togglePaid}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            {/* Items recurrentes mensuales pendientes */}
            <ErrorBoundary fallback={ChartErrorFallback}>
              <PendingItemsCard filterByRecurrence="monthly" />
            </ErrorBoundary>

            {/* Header con totales del mes */}
            <ExpensesHeader 
              totalPaid={totals.totalPaid}
              totalPending={totals.totalPending}
              totalExpenses={totals.totalExpenses}
            />

            {/* Tabla de gastos del mes */}
            <ErrorBoundary fallback={ChartErrorFallback}>
              <ExpensesTable
                expenses={filteredExpenses}
                onAddExpense={addExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
                onTogglePaid={togglePaid}
              />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}

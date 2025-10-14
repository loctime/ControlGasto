"use client"

import { useAuth } from "@/components/auth-provider"
import { ExpensesTable } from "@/components/expenses-table"
import { NotificationsBanner } from "@/components/notifications-banner"
import { ChartErrorFallback, ErrorBoundary } from "@/components/ui/error-boundary"
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { useAutoScheduler } from "@/lib/auto-scheduler" // ❌ ELIMINADO - Sistema simplificado
import { db } from "@/lib/firebase"
import { useMemoizedCalculations, useRateLimit, useRetry } from "@/lib/optimization"
import { RecurringItemsService } from "@/lib/recurring-items-service"
import { RecurringItem } from "@/lib/types"
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

// ✅ NUEVA FUNCIÓN: Filtrar items recurrentes por período (SISTEMA SIMPLIFICADO)
const filterRecurringItemsByPeriod = (items: RecurringItem[], period: 'daily' | 'weekly' | 'monthly') => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  return items.filter(item => {
    if (!item.isActive) return false
    
    switch (period) {
      case 'daily':
        // Items diarios activos
        return item.recurrenceType === 'daily'
      
      case 'weekly':
        // Items semanales que corresponden a hoy
        if (item.recurrenceType === 'weekly') {
          return item.weekDay === now.getDay()
        }
        // También incluir items diarios
        return item.recurrenceType === 'daily'
      
      case 'monthly':
        // Items mensuales que corresponden a hoy
        if (item.recurrenceType === 'monthly') {
          return item.customDays?.includes(now.getDate()) || false
        }
        // También incluir items diarios y semanales
        return item.recurrenceType === 'daily' || 
               (item.recurrenceType === 'weekly' && item.weekDay === now.getDay())
      
      default:
        return false
    }
  })
}

export function ExpensesDashboard() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  
  // ✅ OPTIMIZACIÓN: Hooks de optimización
  const { retryWithBackoff } = useRetry()
  const { canMakeRequest, makeRequest } = useRateLimit(20, 60000) // 20 requests por minuto
  
  // ❌ AUTO-SCHEDULER ELIMINADO - Sistema simplificado
  
  // ✅ Filtrar gastos según el período activo
  const filteredExpenses = useMemo(() => {
    return filterExpensesByPeriod(expenses, activePeriod)
  }, [expenses, activePeriod])

  // ✅ NUEVO: Filtrar items recurrentes según el período activo
  const filteredRecurringItems = useMemo(() => {
    return filterRecurringItemsByPeriod(recurringItems, activePeriod)
  }, [recurringItems, activePeriod])

  // ✅ Estado de items pendientes por período
  const [pendingItemsStatus, setPendingItemsStatus] = useState<{
    daily: { hasPending: boolean; hasOverdue: boolean }
    weekly: { hasPending: boolean; hasOverdue: boolean }
    monthly: { hasPending: boolean; hasOverdue: boolean }
  }>({
    daily: { hasPending: false, hasOverdue: false },
    weekly: { hasPending: false, hasOverdue: false },
    monthly: { hasPending: false, hasOverdue: false }
  })

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

  // ✅ SIMPLIFICADO: Cargar items recurrentes (sin instancias)
  const loadRecurringItems = async () => {
    if (!user?.uid) return

    try {
      const service = new RecurringItemsService(user.uid)
      
      // Cargar todos los items recurrentes activos
      const allItems = await service.getAllRecurringItems()
      setRecurringItems(allItems)
      
      console.log(`✅ Items recurrentes cargados: ${allItems.length}`)
    } catch (error) {
      console.error('Error cargando items recurrentes:', error)
    }
  }

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

  // ✅ SIMPLIFICADO: Cargar items recurrentes solo cuando cambie el usuario
  useEffect(() => {
    loadRecurringItems()
  }, [user])

  // ✅ SIMPLIFICADO: Calcular estado de items pendientes basado en items filtrados
  useEffect(() => {
    if (!user?.uid) return

    const calculatePendingStatus = () => {
      const now = new Date()
      
      // Verificar items para cada período
      const dailyItems = filterRecurringItemsByPeriod(recurringItems, 'daily')
      const weeklyItems = filterRecurringItemsByPeriod(recurringItems, 'weekly')
      const monthlyItems = filterRecurringItemsByPeriod(recurringItems, 'monthly')
      
      setPendingItemsStatus({
        daily: { 
          hasPending: dailyItems.length > 0, 
          hasOverdue: false // No hay concepto de vencido en el sistema simplificado
        },
        weekly: { 
          hasPending: weeklyItems.length > 0, 
          hasOverdue: false 
        },
        monthly: { 
          hasPending: monthlyItems.length > 0, 
          hasOverdue: false 
        }
      })
    }
    
    calculatePendingStatus()
  }, [recurringItems])

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

  // ✅ SIMPLIFICADO: Función para manejar pagos de items recurrentes (crea gasto normal)
  const handlePayRecurringItem = useCallback(async (itemId: string, amount: number, notes?: string) => {
    if (!user?.uid) return

    try {
      const item = recurringItems.find(item => item.id === itemId)
      if (!item) return

      // Crear gasto normal directamente
      const expenseData = {
        name: item.name,
        amount,
        category: item.category,
        status: 'paid' as const,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        type: 'recurring' as const,
        recurringItemId: itemId,
        notes: notes || undefined
      }

      await addDoc(collection(db, `apps/controlgastos/users/${user.uid}/expenses`), expenseData)
      
      toast.success(`${item.name} pagado correctamente`)
    } catch (error) {
      console.error('Error procesando pago:', error)
      toast.error('Error al procesar el pago')
    }
  }, [user, recurringItems])

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
      <div className="max-w-6xl mx-auto p-4 space-y-3">

        {/* Banner de notificaciones */}
        <NotificationsBanner />

        {/* Pestañas de períodos */}
        <Tabs value={activePeriod} className="w-full" onValueChange={(value) => {
          console.log("🔄 Cambiando período:", value)
          setActivePeriod(value as 'daily' | 'weekly' | 'monthly')
        }}>
          <div className="flex justify-center mb-1">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger 
                value="daily" 
                className={`text-sm font-medium relative ${
                  pendingItemsStatus.daily.hasOverdue 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : pendingItemsStatus.daily.hasPending 
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : ''
                }`}
              >
                📅 Diario
                {(pendingItemsStatus.daily.hasPending || pendingItemsStatus.daily.hasOverdue) && (
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                    pendingItemsStatus.daily.hasOverdue ? 'bg-red-500' : 'bg-orange-500'
                  }`} />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="weekly" 
                className={`text-sm font-medium relative ${
                  pendingItemsStatus.weekly.hasOverdue 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : pendingItemsStatus.weekly.hasPending 
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : ''
                }`}
              >
                📊 Semanal
                {(pendingItemsStatus.weekly.hasPending || pendingItemsStatus.weekly.hasOverdue) && (
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                    pendingItemsStatus.weekly.hasOverdue ? 'bg-red-500' : 'bg-orange-500'
                  }`} />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="monthly" 
                className={`text-sm font-medium relative ${
                  pendingItemsStatus.monthly.hasOverdue 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : pendingItemsStatus.monthly.hasPending 
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : ''
                }`}
              >
                📈 Mensual
                {(pendingItemsStatus.monthly.hasPending || pendingItemsStatus.monthly.hasOverdue) && (
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                    pendingItemsStatus.monthly.hasOverdue ? 'bg-red-500' : 'bg-orange-500'
                  }`} />
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Contenido para cada período */}
          <TabsContent value="daily" className="space-y-6">
            {/* Tabla unificada de gastos e items recurrentes */}
            <ErrorBoundary fallback={ChartErrorFallback}>
              <ExpensesTable
                expenses={filteredExpenses}
                recurringItems={filteredRecurringItems}
                onAddExpense={addExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
                onTogglePaid={togglePaid}
                onPayRecurringItem={handlePayRecurringItem}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6">
            {/* Tabla unificada de gastos e items recurrentes */}
            <ErrorBoundary fallback={ChartErrorFallback}>
              <ExpensesTable
                expenses={filteredExpenses}
                recurringItems={filteredRecurringItems}
                onAddExpense={addExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
                onTogglePaid={togglePaid}
                onPayRecurringItem={handlePayRecurringItem}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            {/* Tabla unificada de gastos e items recurrentes */}
            <ErrorBoundary fallback={ChartErrorFallback}>
              <ExpensesTable
                expenses={filteredExpenses}
                recurringItems={filteredRecurringItems}
                onAddExpense={addExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
                onTogglePaid={togglePaid}
                onPayRecurringItem={handlePayRecurringItem}
              />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}

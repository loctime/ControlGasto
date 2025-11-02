"use client"

import { useAuth } from "@/components/auth-provider"
import { ExpensesTable } from "@/components/expenses-table"
import { NotificationsBanner } from "@/components/notifications-banner"
import { Button } from "@/components/ui/button"
import { ChartErrorFallback, ErrorBoundary } from "@/components/ui/error-boundary"
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders"
import { db } from "@/lib/firebase"
import { useRateLimit, useRetry } from "@/lib/optimization"
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
import { Plus } from "lucide-react"
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
  type?: 'manual' | 'recurring'
  recurringItemId?: string
  notes?: string
  receiptImageId?: string
}

// ✅ Función para filtrar gastos de hoy
const filterExpensesForToday = (expenses: Expense[]) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  return expenses.filter(expense => {
    const expenseDate = expense.createdAt instanceof Timestamp 
      ? expense.createdAt.toDate() 
      : new Date()
    
    const expenseDay = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate())
    return expenseDay.getTime() === today.getTime()
  })
}

// ✅ Función para filtrar items recurrentes que corresponden a HOY
const filterItemsForToday = (items: RecurringItem[], paidExpensesToday: Expense[] = []) => {
  const now = new Date()
  const today = now.getDay() // 0 = Domingo, 1 = Lunes, etc.
  const dayOfMonth = now.getDate()
  
  console.log(`🔍 Filtrando items para HOY - Día de semana: ${today}, Día del mes: ${dayOfMonth}`)
  console.log(`🔍 Gastos pagados hoy: ${paidExpensesToday.length}`)
  
  const filtered = items.filter(item => {
    if (!item.isActive) {
      console.log(`❌ ${item.name} no está activo`)
      return false
    }
    
    // Verificar si este item ya fue pagado hoy
    const alreadyPaidToday = paidExpensesToday.some(expense => 
      expense.recurringItemId === item.id && expense.status === 'paid'
    )
    
    if (alreadyPaidToday) {
      console.log(`❌ ${item.name} ya fue pagado hoy - EXCLUIDO`)
      return false
    }
    
    // Items diarios: siempre se muestran (a menos que ya estén pagados)
    if (item.recurrenceType === 'daily') {
      console.log(`  ✅ ${item.name} es diario - INCLUIDO`)
      return true
    }
    
    // Items semanales: si coincide el día de la semana
    if (item.recurrenceType === 'weekly') {
      const matches = item.weekDay === today
      console.log(`  ${matches ? '✅' : '❌'} ${item.name} es semanal - weekDay: ${item.weekDay}, hoy: ${today} - ${matches ? 'INCLUIDO' : 'EXCLUIDO'}`)
      return matches
    }
    
    // Items mensuales: si coincide el día del mes
    if (item.recurrenceType === 'monthly') {
      const matches = item.monthDay === dayOfMonth
      console.log(`  ${matches ? '✅' : '❌'} ${item.name} es mensual - día configurado: ${item.monthDay}, hoy: ${dayOfMonth} - ${matches ? 'INCLUIDO' : 'EXCLUIDO'}`)
      return matches
    }
    
    // Items con calendario personalizado
    if (item.recurrenceType === 'custom_calendar') {
      const matches = item.customDays?.includes(dayOfMonth) || false
      console.log(`  ${matches ? '✅' : '❌'} ${item.name} tiene calendario personalizado - días: ${item.customDays}, hoy: ${dayOfMonth} - ${matches ? 'INCLUIDO' : 'EXCLUIDO'}`)
      return matches
    }
    
    return false
  })
  
  console.log(`✅ Total items para hoy: ${filtered.length}`)
  return filtered
}

export function ExpensesDashboard() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  
  // ✅ OPTIMIZACIÓN: Hooks de optimización
  const { retryWithBackoff } = useRetry()
  const { canMakeRequest, makeRequest } = useRateLimit(20, 60000) // 20 requests por minuto
  
  // ✅ Filtrar gastos de hoy
  const todayExpenses = useMemo(() => {
    return filterExpensesForToday(expenses)
  }, [expenses])

  // ✅ Filtrar gastos pagados de hoy (para excluir items recurrentes ya pagados)
  const todayPaidExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const expenseDate = expense.createdAt instanceof Timestamp 
        ? expense.createdAt.toDate() 
        : new Date()
      const expenseDay = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate())
      return expenseDay.getTime() === today.getTime() && expense.status === 'paid' && expense.type === 'recurring'
    })
  }, [expenses])

  // ✅ Filtrar items recurrentes que corresponden a hoy (excluyendo los ya pagados)
  const todayRecurringItems = useMemo(() => {
    return filterItemsForToday(recurringItems, todayPaidExpenses)
  }, [recurringItems, todayPaidExpenses])


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

  // ✅ Cargar items recurrentes cuando cambie el usuario
  useEffect(() => {
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

    loadRecurringItems()
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
    if (!user?.uid) {
      toast.error("Usuario no autenticado")
      return
    }

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
        const docRef = doc(db, `apps/controlgastos/users/${user.uid}/expenses`, id)
        
        // Verificar que el documento existe antes de actualizar
        const { getDoc } = await import('firebase/firestore')
        const docSnap = await getDoc(docRef)
        
        if (!docSnap.exists()) {
          throw new Error('El gasto no existe o ya fue eliminado')
        }
        
        await updateDoc(docRef, {
          ...cleanUpdates,
          updatedAt: serverTimestamp()
        })
      })
      toast.success("Gasto actualizado correctamente")
    } catch (error: any) {
      console.error("Error updating expense:", error)
      if (error.message?.includes('no existe')) {
        toast.error("El gasto no existe. Por favor actualiza la página.")
      } else if (error.code === 'permission-denied') {
        toast.error("No tienes permisos para actualizar este gasto")
      } else {
        toast.error("Error al actualizar gasto")
      }
      throw error
    }
  }, [user, canMakeRequest, makeRequest, retryWithBackoff])

  const deleteExpense = useCallback(async (id: string) => {
    if (!user?.uid) {
      toast.error("Usuario no autenticado")
      return
    }

    if (!canMakeRequest) {
      toast.error("Demasiadas solicitudes. Espera un momento.")
      return
    }

    try {
      makeRequest()
      await retryWithBackoff(async () => {
        await deleteDoc(doc(db, `apps/controlgastos/users/${user.uid}/expenses`, id))
      })
      toast.success("Gasto eliminado correctamente")
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast.error("Error al eliminar gasto")
      throw error
    }
  }, [user, canMakeRequest, makeRequest, retryWithBackoff])

  const togglePaid = useCallback(async (id: string, currentStatus: 'pending' | 'paid', receiptImageId?: string) => {
    console.log('🔄 togglePaid llamado:', { id, currentStatus, receiptImageId })
    
    const newStatus = currentStatus === 'pending' ? 'paid' : 'pending'
    
    try {
      if (newStatus === 'paid') {
        // Crear registro de pago en el historial
        const paymentService = new (await import('@/lib/payment-service')).PaymentService(user!.uid)
        const expense = expenses.find(exp => exp.id === id)
        
        if (!expense) {
          console.error('❌ Gasto no encontrado en la lista local:', id)
          toast.error('Gasto no encontrado. Por favor actualiza la página.')
          return
        }
        
        console.log('💰 Registrando pago:', { expense })
        await paymentService.recordPayment(
          id,
          expense.name,
          expense.amount,
          receiptImageId
        )
      }
      
      // Actualizar estado del gasto
      console.log('📝 Actualizando estado del gasto a:', newStatus)
      await updateExpense(id, { status: newStatus })
      console.log('✅ Estado actualizado correctamente')
    } catch (error) {
      console.error('❌ Error en togglePaid:', error)
      throw error
    }
  }, [updateExpense, user, expenses])

  // ✅ SIMPLIFICADO: Función para manejar pagos de items recurrentes (crea gasto normal)
  const handlePayRecurringItem = useCallback(async (itemId: string, amount: number, receiptImageId?: string, notes?: string) => {
    if (!user?.uid) return

    try {
      const item = recurringItems.find(item => item.id === itemId)
      if (!item) return

      // Crear gasto normal directamente
      const expenseData: any = {
        name: item.name,
        amount,
        category: item.category,
        status: 'paid' as const,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        type: 'recurring' as const,
        recurringItemId: itemId
      }

      // Solo agregar notes si tiene valor
      if (notes && notes.trim()) {
        expenseData.notes = notes
      }

      // Solo agregar receiptImageId si tiene valor
      if (receiptImageId && receiptImageId.trim()) {
        expenseData.receiptImageId = receiptImageId
      }

      await addDoc(collection(db, `apps/controlgastos/users/${user.uid}/expenses`), expenseData)
      
      toast.success(`${item.name} pagado correctamente`)
    } catch (error) {
      console.error('Error procesando pago:', error)
      toast.error('Error al procesar el pago')
    }
  }, [user, recurringItems])

  const handleToggleAdding = () => {
    setIsAdding(!isAdding)
  }

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
      <div className="min-h-screen gradient-bg">
        <div className="max-w-6xl mx-auto p-4 space-y-4">
          {/* Banner de notificaciones */}
          <div className="animate-slide-in">
            <NotificationsBanner />
          </div>

          {/* Header principal compacto */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-xs animate-pulse">
                      ✨
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Gastos de Hoy
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleToggleAdding}
                  className="btn-modern px-4 py-2 text-sm font-semibold rounded-xl shadow-lg transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isAdding ? "Cancelar" : "Agregar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Tabla unificada de gastos e items recurrentes de hoy */}
          <ErrorBoundary fallback={ChartErrorFallback}>
            <ExpensesTable
              expenses={todayExpenses}
              recurringItems={todayRecurringItems}
              onAddExpense={addExpense}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
              onTogglePaid={togglePaid}
              onPayRecurringItem={handlePayRecurringItem}
              isAdding={isAdding}
              onToggleAdding={handleToggleAdding}
            />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  )
}

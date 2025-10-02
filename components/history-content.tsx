"use client"

import { useEffect, useState, useCallback, useMemo, Suspense, lazy } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ErrorBoundary, ChartErrorFallback } from "@/components/ui/error-boundary"
import { HistorySkeleton, ChartSkeleton, PieChartSkeleton } from "@/components/ui/skeleton-loaders"
import { useDebouncedCallback, useRetry, useMemoizedCalculations } from "@/lib/optimization"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { collection, query, where, getDocs, orderBy, limit, updateDoc, doc, writeBatch, Timestamp, FieldValue } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Helper function to safely convert Firebase timestamp to Date
const getDateFromTimestamp = (timestamp: Timestamp | FieldValue | null | undefined): Date => {
  if (!timestamp) return new Date()
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  // If it's a FieldValue (like serverTimestamp), return current date
  return new Date()
}

// ✅ LAZY LOADING: Cargar gráficos solo cuando se necesiten
const BarChart = lazy(() => import("recharts").then(module => ({ default: module.BarChart })))
const Bar = lazy(() => import("recharts").then(module => ({ default: module.Bar })))
const XAxis = lazy(() => import("recharts").then(module => ({ default: module.XAxis })))
const YAxis = lazy(() => import("recharts").then(module => ({ default: module.YAxis })))
const CartesianGrid = lazy(() => import("recharts").then(module => ({ default: module.CartesianGrid })))
const Tooltip = lazy(() => import("recharts").then(module => ({ default: module.Tooltip })))
const ResponsiveContainer = lazy(() => import("recharts").then(module => ({ default: module.ResponsiveContainer })))
const PieChart = lazy(() => import("recharts").then(module => ({ default: module.PieChart })))
const Pie = lazy(() => import("recharts").then(module => ({ default: module.Pie })))
const Cell = lazy(() => import("recharts").then(module => ({ default: module.Cell })))

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
  
  // ✅ OPTIMIZACIÓN: Hooks de optimización
  const { retryWithBackoff } = useRetry()
  const debouncedSetView = useDebouncedCallback(setView, 300)

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
        toast.error("Error al cargar historial")
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
      // Últimos 7 días
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      // Mes actual
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const filtered = expenses.filter(expense => {
      const expenseDate = getDateFromTimestamp(expense.createdAt)
      return expenseDate >= startDate
    })

    setFilteredExpenses(filtered)
  }, [expenses, view])

  // ✅ OPTIMIZACIÓN: Memoizar cálculos pesados (SIEMPRE antes de returns condicionales)
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
      
      // Recargar datos
      const q = query(collection(db, "expenses"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[]
      setExpenses(expensesData)
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

  // ✅ OPTIMIZACIÓN: Memoizar datos de gráficos
  const barData = useMemo(() => [
    { name: "Total", amount: totals.totalExpenses },
    { name: "Pagado", amount: totals.totalPaid },
    { name: "Pendiente", amount: totals.totalPending },
  ], [totals])

  const pieData = useMemo(() => [
    { name: "Pagado", value: totals.totalPaid, color: "#10b981" },
    { name: "Pendiente", value: totals.totalPending, color: "#f59e0b" },
  ], [totals])

  // ✅ OPTIMIZACIÓN: Memoizar datos por categoría
  const categoryChartData = useMemo(() => {
    // 🔍 DEBUG: Log para ver qué categorías tenemos
    console.log("🔍 DEBUG - Gastos actuales:", currentExpenses.map(exp => ({ 
      name: exp.name, 
      category: exp.category, 
      amount: exp.amount 
    })))
    
    const categoryData = currentExpenses.reduce((acc, expense) => {
      const category = expense.category
      console.log("🔍 DEBUG - Procesando categoría:", category)
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

    console.log("🔍 DEBUG - Datos de categorías:", categoryData)

    return Object.values(categoryData).map(item => ({
      name: item.category === 'hogar' ? '🏠 Hogar' :
            item.category === 'transporte' ? '🚗 Transporte' :
            item.category === 'alimentacion' ? '🍽️ Alimentación' :
            item.category === 'servicios' ? '⚡ Servicios' :
            item.category === 'entretenimiento' ? '🎬 Entretenimiento' :
            item.category === 'salud' ? '🏥 Salud' : '📦 Otros',
      total: item.total,
      paid: item.paid,
      pending: item.pending
    }))
  }, [currentExpenses])

  // ✅ NUEVO: Memoizar datos por items individuales
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

    // Ordenar por total descendente y tomar los top 10
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

  // ✅ OPTIMIZACIÓN: Estados de carga optimizados
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
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Historial</h1>
          <p className="text-muted-foreground">Visualiza tus análisis de gastos</p>
          
          {/* Alerta de nuevo mes */}
          {isNewMonth() && (
            <Alert className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <AlertDescription>
                🗓️ <strong>Nuevo mes detectado!</strong> Tienes gastos pagados del mes anterior. 
                ¿Quieres reiniciar todos los pagos para este mes?
                <Button 
                  size="sm" 
                  className="ml-2 bg-amber-600 hover:bg-amber-700"
                  onClick={() => setShowResetModal(true)}
                >
                  Reiniciar Pagos
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={view === "week" ? "default" : "outline"}
            onClick={() => setView("week")}
            className={view === "week" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            Semanal
          </Button>
          <Button
            variant={view === "month" ? "default" : "outline"}
            onClick={() => setView("month")}
            className={view === "month" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            Mensual
          </Button>
        </div>

        {/* Bar Chart */}
        <ErrorBoundary fallback={ChartErrorFallback}>
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ChartSkeleton />}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Pie Chart */}
        <ErrorBoundary fallback={ChartErrorFallback}>
          <Card>
            <CardHeader>
              <CardTitle>Estado de Pagos</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Suspense fallback={<PieChartSkeleton />}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Suspense>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Gráfico por Categorías */}
        {categoryChartData.length > 0 && (
          <ErrorBoundary fallback={ChartErrorFallback}>
            <Card>
              <CardHeader>
                <CardTitle>Gastos por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<ChartSkeleton />}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="paid" stackId="a" fill="#10b981" name="Pagado" />
                      <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pendiente" />
                    </BarChart>
                  </ResponsiveContainer>
                </Suspense>
              </CardContent>
            </Card>
          </ErrorBoundary>
        )}

        {/* Gráfico por Items Individuales */}
        {itemsChartData.length > 0 && (
          <ErrorBoundary fallback={ChartErrorFallback}>
            <Card>
              <CardHeader>
                <CardTitle>Gastos por Items (Top 10)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Los gastos individuales más costosos
                </p>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<ChartSkeleton />}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={itemsChartData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value, name, props) => {
                          const data = props.payload
                          return [
                            `$${value.toLocaleString()}`,
                            name === 'paid' ? 'Pagado' : 'Pendiente'
                          ]
                        }}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload
                            return `${data.fullName} (${data.count} veces)`
                          }
                          return label
                        }}
                      />
                      <Bar dataKey="paid" stackId="a" fill="#10b981" name="Pagado" />
                      <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pendiente" />
                    </BarChart>
                  </ResponsiveContainer>
                </Suspense>
              </CardContent>
            </Card>
          </ErrorBoundary>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total de Gastos</p>
              <p className="text-3xl font-bold text-foreground">{expenses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Tasa de Pago</p>
              <p className="text-3xl font-bold text-emerald-600">
                {expenses.length > 0 ? Math.round((expenses.filter((e) => e.paid).length / expenses.length) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
      <BottomNav />

      {/* Modal de Reinicio de Pagos */}
      <AlertDialog open={showResetModal} onOpenChange={setShowResetModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🔄 Reiniciar Pagos del Mes</AlertDialogTitle>
            <AlertDialogDescription>
              Has detectado que es un nuevo mes y tienes gastos pagados del mes anterior. 
              ¿Quieres reiniciar todos los pagos para comenzar el nuevo mes con todos los gastos como pendientes?
              <br /><br />
              <strong>Esta acción marcará todos los gastos como "Pendiente"</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={resetAllPayments}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Reiniciar Todos los Pagos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

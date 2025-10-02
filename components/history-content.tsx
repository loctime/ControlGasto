"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { collection, query, where, getDocs, orderBy, limit, updateDoc, doc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"

interface Expense {
  id: string
  name: string
  amount: number
  category: 'hogar' | 'transporte' | 'alimentacion' | 'servicios' | 'entretenimiento' | 'salud' | 'otros'
  paid: boolean
  createdAt: any
  paidAt?: any
  unpaidAt?: any
}

export function HistoryContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [view, setView] = useState<"week" | "month">("month")

  useEffect(() => {
    if (!user && !loading) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    const fetchExpenses = async () => {
      const q = query(collection(db, "expenses"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[]
      setExpenses(expensesData)
    }

    fetchExpenses()
  }, [user])

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
      const expenseDate = expense.createdAt?.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt)
      return expenseDate >= startDate
    })

    setFilteredExpenses(filtered)
  }, [expenses, view])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Usar gastos filtrados para los cálculos
  const currentExpenses = filteredExpenses.length > 0 ? filteredExpenses : expenses
  const totalExpenses = currentExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalPaid = currentExpenses.filter((exp) => exp.paid).reduce((sum, exp) => sum + exp.amount, 0)
  const totalPending = totalExpenses - totalPaid

  // Detectar si es un nuevo mes y hay gastos pagados del mes anterior
  const isNewMonth = () => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const lastMonthExpenses = expenses.filter(expense => {
      const expenseDate = expense.createdAt?.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt)
      return expenseDate >= lastMonth && expenseDate < currentMonth && expense.paid
    })
    
    return lastMonthExpenses.length > 0
  }

  const [showResetModal, setShowResetModal] = useState(false)

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

  const barData = [
    { name: "Total", amount: totalExpenses },
    { name: "Pagado", amount: totalPaid },
    { name: "Pendiente", amount: totalPending },
  ]

  const pieData = [
    { name: "Pagado", value: totalPaid, color: "#10b981" },
    { name: "Pendiente", value: totalPending, color: "#f59e0b" },
  ]

  // Datos por categoría
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

  const categoryChartData = Object.values(categoryData).map(item => ({
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
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Pagos</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
          </CardContent>
        </Card>

        {/* Gráfico por Categorías */}
        {categoryChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
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

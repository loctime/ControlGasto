"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface Expense {
  id: string
  name: string
  amount: number
  paid: boolean
  createdAt: any
}

export function HistoryContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [view, setView] = useState<"week" | "month">("month")

  useEffect(() => {
    if (!user && !loading) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    const fetchExpenses = async () => {
      const q = query(collection(db, "expenses"), where("userId", "==", user.uid))
      const snapshot = await getDocs(q)
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[]
      setExpenses(expensesData)
    }

    fetchExpenses()
  }, [user])

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

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalPaid = expenses.filter((exp) => exp.paid).reduce((sum, exp) => sum + exp.amount, 0)
  const totalPending = totalExpenses - totalPaid

  const barData = [
    { name: "Total", amount: totalExpenses },
    { name: "Pagado", amount: totalPaid },
    { name: "Pendiente", amount: totalPending },
  ]

  const pieData = [
    { name: "Pagado", value: totalPaid, color: "#10b981" },
    { name: "Pendiente", value: totalPending, color: "#f59e0b" },
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Historial</h1>
          <p className="text-muted-foreground">Visualiza tus análisis de gastos</p>
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
    </div>
  )
}

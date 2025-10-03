"use client"

import { Card, CardContent } from "@/components/ui/card"

interface HistoryStatsProps {
  expenses: Array<{ paid: boolean; amount: number }>
}

export function HistoryStats({ expenses }: HistoryStatsProps) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const paidCount = expenses.filter(exp => exp.paid).length
  const pendingCount = expenses.length - paidCount
  const paymentRate = expenses.length > 0 ? Math.round((paidCount / expenses.length) * 100) : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Gastos */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Gastos</p>
          <p className="text-2xl font-bold text-foreground">
            ${totalExpenses.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Gastos Pagados */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Pagados</p>
          <p className="text-2xl font-bold text-emerald-600">{paidCount}</p>
        </CardContent>
      </Card>

      {/* Gastos Pendientes */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </CardContent>
      </Card>

      {/* Tasa de Pago */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Tasa de Pago</p>
          <p className="text-3xl font-bold text-emerald-600">{paymentRate}%</p>
        </CardContent>
      </Card>
    </div>
  )
}

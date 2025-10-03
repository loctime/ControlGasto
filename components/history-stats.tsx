"use client"

import { Card, CardContent } from "@/components/ui/card"

interface Payment {
  amount: number
  paidAt: any
}

interface HistoryStatsProps {
  payments: Payment[]
}

export function HistoryStats({ payments }: HistoryStatsProps) {
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const paymentsCount = payments.length
  
  // Calcular pagos de este mes
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  
  const thisMonthPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.paidAt)
    return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear
  })
  
  const thisMonthAmount = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Pagado */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Pagado</p>
          <p className="text-2xl font-bold text-foreground">
            ${totalAmount.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Total Pagos */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Pagos</p>
          <p className="text-2xl font-bold text-emerald-600">{paymentsCount}</p>
        </CardContent>
      </Card>

      {/* Este Mes */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Este Mes</p>
          <p className="text-2xl font-bold text-blue-600">
            ${thisMonthAmount.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Pagos Este Mes */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Pagos Este Mes</p>
          <p className="text-2xl font-bold text-blue-600">{thisMonthPayments.length}</p>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Timestamp, FieldValue } from "firebase/firestore"

interface Payment {
  amount: number
  paidAt: Timestamp | FieldValue | Date
}

interface HistoryStatsProps {
  payments: Payment[]
}

// Helper function to safely convert Firebase timestamp to Date
const getDateFromTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  if (timestamp instanceof Date) {
    return timestamp
  }
  return new Date()
}

export function HistoryStats({ payments }: HistoryStatsProps) {
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const paymentsCount = payments.length
  
  // Calcular pagos de este mes
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  
  const thisMonthPayments = payments.filter(payment => {
    const paymentDate = getDateFromTimestamp(payment.paidAt)
    const isThisMonth = paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear
    
    // Debug log para verificar fechas
    console.log(`🔍 Payment date: ${paymentDate.toLocaleDateString()}, Amount: $${payment.amount}, Is this month: ${isThisMonth}`)
    
    return isThisMonth
  })
  
  const thisMonthAmount = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0)
  
  // Debug log para verificar resultados
  console.log(`📊 Stats - Total payments: ${paymentsCount}, This month payments: ${thisMonthPayments.length}, This month amount: $${thisMonthAmount}`)

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

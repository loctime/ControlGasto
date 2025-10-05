"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { FieldValue, Timestamp } from "firebase/firestore"

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
    return isThisMonth
  })
  
  const thisMonthAmount = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0)
  
  // Calcular pagos de esta semana
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Domingo
  startOfWeek.setHours(0, 0, 0, 0)
  
  const thisWeekPayments = payments.filter(payment => {
    const paymentDate = getDateFromTimestamp(payment.paidAt)
    return paymentDate >= startOfWeek
  })
  
  const thisWeekAmount = thisWeekPayments.reduce((sum, payment) => sum + payment.amount, 0)
  
  // Debug log para verificar resultados
  console.log(`📊 Stats - Total: ${paymentsCount} pagos ($${totalAmount}), Este mes: ${thisMonthPayments.length} pagos ($${thisMonthAmount}), Esta semana: ${thisWeekPayments.length} pagos ($${thisWeekAmount})`)

  return (
    <div className="w-full bg-card text-card-foreground rounded-xl border shadow-sm">
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableBody>
            {/* Total Pagado */}
            <TableRow className="border-b">
              <TableCell className="font-medium py-1 px-4">
                Total Pagado
              </TableCell>
              <TableCell className="text-right py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-lg font-bold text-foreground">
                    ${totalAmount.toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {paymentsCount} pagos
                  </Badge>
                </div>
              </TableCell>
            </TableRow>

            {/* Este Mes */}
            <TableRow className="border-b">
              <TableCell className="font-medium py-1 px-4">
                Este Mes
              </TableCell>
              <TableCell className="text-right py-1 px-4">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-lg font-bold text-blue-600">
                    ${thisMonthAmount.toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {thisMonthPayments.length} pagos
                  </Badge>
                </div>
              </TableCell>
            </TableRow>

            {/* Esta Semana */}
            <TableRow>
              <TableCell className="font-medium py-1 px-4">
                Esta Semana
              </TableCell>
              <TableCell className="text-right py-1 px-4">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-lg font-bold text-green-600">
                    ${thisWeekAmount.toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {thisWeekPayments.length} pagos
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
          </Table>
        </div>
    </div>
  )
}

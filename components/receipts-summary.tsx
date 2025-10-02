"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receipt, FileText, CheckCircle } from "lucide-react"

interface Expense {
  id: string
  name: string
  amount: number
  category: string
  paid: boolean
  receiptImageId?: string
}

interface ReceiptsSummaryProps {
  expenses: Expense[]
}

export function ReceiptsSummary({ expenses }: ReceiptsSummaryProps) {
  const paidExpenses = expenses.filter(exp => exp.paid)
  const expensesWithReceipts = paidExpenses.filter(exp => exp.receiptImageId)
  const totalWithReceipts = expensesWithReceipts.reduce((sum, exp) => sum + exp.amount, 0)
  const totalPaid = paidExpenses.reduce((sum, exp) => sum + exp.amount, 0)

  if (paidExpenses.length === 0) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Receipt className="w-5 h-5" />
          Resumen de Comprobantes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">
              {expensesWithReceipts.length}
            </div>
            <div className="text-sm text-green-600">
              Comprobantes guardados
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">
              {paidExpenses.length - expensesWithReceipts.length}
            </div>
            <div className="text-sm text-green-600">
              Sin comprobante
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">
              {Math.round((expensesWithReceipts.length / paidExpenses.length) * 100)}%
            </div>
            <div className="text-sm text-green-600">
              Cobertura
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">Total con comprobantes:</span>
            <span className="font-semibold text-green-800">
              ${totalWithReceipts.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">Total pagado:</span>
            <span className="font-semibold text-green-800">
              ${totalPaid.toLocaleString()}
            </span>
          </div>
        </div>

        {expensesWithReceipts.length > 0 && (
          <div className="pt-2 border-t border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>
                {expensesWithReceipts.length} de {paidExpenses.length} pagos tienen comprobante guardado
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

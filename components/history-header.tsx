"use client"

import { UnifiedHeader } from "@/components/unified-header"

interface HistoryHeaderProps {
  totals: {
    totalAmount: number
    paymentsCount: number
  }
}

export function HistoryHeader({ totals }: HistoryHeaderProps) {
  return (
    <UnifiedHeader 
      title="Historial"
      subtitle="Visualiza tus pagos realizados"
      showSummary={false}
      totalPaid={totals.totalAmount}
      totalPending={0}
      totalExpenses={totals.totalAmount}
    />
  )
}

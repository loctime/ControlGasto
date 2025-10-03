"use client"

import { UnifiedHeader } from "@/components/unified-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface HistoryHeaderProps {
  totals: {
    totalPaid: number
    totalPending: number
    totalExpenses: number
  }
  isNewMonth: boolean
  onShowResetModal: () => void
}

export function HistoryHeader({ totals, isNewMonth, onShowResetModal }: HistoryHeaderProps) {
  return (
    <>
      <UnifiedHeader 
        title="Historial"
        subtitle="Visualiza tus analisis de gastos"
        showSummary={true}
        totalPaid={totals.totalPaid}
        totalPending={totals.totalPending}
        totalExpenses={totals.totalExpenses}
      />
          
      {/* Alerta de nuevo mes */}
      {isNewMonth && (
        <Alert className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <AlertDescription>
            <strong>Nuevo mes detectado!</strong> Tienes gastos pagados del mes anterior. 
            Quieres reiniciar todos los pagos para este mes?
            <Button 
              size="sm" 
              className="ml-2 bg-amber-600 hover:bg-amber-700"
              onClick={onShowResetModal}
            >
              Reiniciar Pagos
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}

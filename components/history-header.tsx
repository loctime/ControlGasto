"use client"

import { UnifiedHeader } from "@/components/unified-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface HistoryHeaderProps {
  totals: {
    totalAmount: number
    paymentsCount: number
  }
  isNewMonth: boolean
  onShowResetModal: () => void
}

export function HistoryHeader({ totals, isNewMonth, onShowResetModal }: HistoryHeaderProps) {
  return (
    <>
      <UnifiedHeader 
        title="Historial"
        subtitle="Visualiza tus pagos realizados"
        showSummary={false}
        totalPaid={totals.totalAmount}
        totalPending={0}
        totalExpenses={totals.totalAmount}
      />
          
      {/* Alerta de nuevo mes */}
      {isNewMonth && (
        <Alert className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <AlertDescription>
            <strong>🔄 Nuevo mes detectado!</strong> Tienes gastos pagados del mes anterior. 
            ¿Quieres reiniciar todos los gastos a estado "Pendiente" para comenzar el nuevo mes?
            <Button 
              size="sm" 
              className="ml-2 bg-amber-600 hover:bg-amber-700"
              onClick={onShowResetModal}
            >
              Reiniciar Gastos
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}

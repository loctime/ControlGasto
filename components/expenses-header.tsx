"use client"

import { CheckCircle, Clock, DollarSign, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePWAInstall } from "@/hooks/use-pwa-install"
import { formatCurrency } from "@/lib/utils"

interface ExpensesHeaderProps {
  totalPaid: number
  totalPending: number
  totalExpenses: number
}

export function ExpensesHeader({ totalPaid, totalPending, totalExpenses }: ExpensesHeaderProps) {
  const { isInstallable, installPWA } = usePWAInstall()

  const handleInstall = async () => {
    await installPWA()
  }

  return (
    <div className="space-y-6">
      {/* Título elegante */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-1">Gastos Fijos</h1>
        <p className="text-sm text-muted-foreground">Gestiona tus gastos mensuales</p>
        
        {/* Botón de instalación PWA */}
        {isInstallable && (
          <div className="mt-4">
            <Button
              onClick={handleInstall}
              variant="outline"
              size="sm"
              className="bg-secondary hover:bg-accent border-border"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar App
            </Button>
          </div>
        )}
      </div>

      {/* Resumen integrado y elegante */}
      <div className="bg-gradient-to-r from-secondary to-accent rounded-xl p-6 border border-border">
        <div className="grid grid-cols-3 gap-6">
          {/* Pagado */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-paid/10 rounded-full mb-3">
              <CheckCircle className="w-6 h-6 text-paid" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Pagado</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalPaid)}</p>
          </div>

          {/* Pendiente */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pending/10 rounded-full mb-3">
              <Clock className="w-6 h-6 text-pending" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Pendiente</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalPending)}</p>
          </div>

          {/* Total */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-full mb-3">
              <DollarSign className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Total</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

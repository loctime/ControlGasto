"use client"

import { CheckCircle, Clock, DollarSign, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggleCompact } from "@/components/theme-toggle"
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1" />
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-1">Control-Gastos</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus gastos mensuales</p>
          </div>
          <div className="flex-1 flex justify-end">
            <ThemeToggleCompact />
          </div>
        </div>
        
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
      <div className="bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 rounded-xl p-6 border border-primary/20 shadow-lg backdrop-blur-sm">
        <div className="grid grid-cols-3 gap-6">
          {/* Pagado */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-paid/20 to-paid/10 rounded-full mb-3 shadow-md border border-paid/30">
              <CheckCircle className="w-6 h-6 text-paid drop-shadow-sm" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Pagado</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalPaid)}</p>
          </div>

          {/* Pendiente */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pending/20 to-pending/10 rounded-full mb-3 shadow-md border border-pending/30">
              <Clock className="w-6 h-6 text-pending drop-shadow-sm" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Pendiente</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalPending)}</p>
          </div>

          {/* Total */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-3 shadow-md border border-primary/30">
              <DollarSign className="w-6 h-6 text-primary drop-shadow-sm" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Total</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

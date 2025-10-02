"use client"

import { CheckCircle, Clock, DollarSign, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePWAInstall } from "@/hooks/use-pwa-install"

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
              className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar App
            </Button>
          </div>
        )}
      </div>

      {/* Resumen integrado y elegante */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-6">
          {/* Pagado */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Pagado</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">${totalPaid.toFixed(2)}</p>
          </div>

          {/* Pendiente */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-3">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Pendiente</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">${totalPending.toFixed(2)}</p>
          </div>

          {/* Total */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full mb-3">
              <DollarSign className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Total</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">${totalExpenses.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

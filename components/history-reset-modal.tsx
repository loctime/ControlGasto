"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface HistoryResetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReset: () => Promise<void>
}

export function HistoryResetModal({ open, onOpenChange, onReset }: HistoryResetModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reiniciar Pagos del Mes</AlertDialogTitle>
          <AlertDialogDescription>
            Has detectado que es un nuevo mes y tienes gastos pagados del mes anterior. 
            Quieres reiniciar todos los pagos para comenzar el nuevo mes con todos los gastos como pendientes?
            <br /><br />
            <strong>Esta accion marcara todos los gastos como "Pendiente"</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onReset}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Reiniciar Todos los Pagos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

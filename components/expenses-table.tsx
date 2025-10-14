"use client"

import { useControlFile } from "@/components/controlfile-provider"
import { PaymentReceiptDialog } from "@/components/payment-receipt-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { FieldValue, Timestamp } from "firebase/firestore"
import { Check, DollarSign, MoreVertical, Pencil, Plus, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface Expense {
  id: string
  name: string
  amount: number
  category: 'hogar' | 'transporte' | 'alimentacion' | 'servicios' | 'entretenimiento' | 'salud' | 'otros'
  status: 'pending' | 'paid'
  userId: string
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}

interface ExpensesTableProps {
  expenses: Expense[]
  onAddExpense: (name: string, amount: number, category: string) => void
  onUpdateExpense: (id: string, updates: Partial<Expense>) => void
  onDeleteExpense: (id: string) => void
  onTogglePaid: (id: string, currentStatus: 'pending' | 'paid', receiptImageId?: string) => void
}

export function ExpensesTable({ 
  expenses, 
  onAddExpense, 
  onUpdateExpense, 
  onDeleteExpense, 
  onTogglePaid 
}: ExpensesTableProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newExpense, setNewExpense] = useState({ name: "", amount: "", category: "hogar" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState({ name: "", amount: "", category: "hogar" })
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Usar el contexto global de ControlFile
  const { isControlFileConnected } = useControlFile()

  // Auto-focus en el input cuando se abre el formulario
  useEffect(() => {
    if (isAdding && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [isAdding])

  const handleToggleAdding = () => {
    setIsAdding(!isAdding)
  }

  const handleAddExpense = () => {
    if (newExpense.name && newExpense.amount) {
      onAddExpense(newExpense.name, Number.parseFloat(newExpense.amount), newExpense.category)
      setNewExpense({ name: "", amount: "", category: "hogar" })
      setIsAdding(false)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingId(expense.id)
    setEditingExpense({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
    })
  }

  const handleSaveEdit = () => {
    if (editingExpense.name && editingExpense.amount) {
      onUpdateExpense(editingId!, {
        name: editingExpense.name,
        amount: Number.parseFloat(editingExpense.amount),
        category: editingExpense.category as any,
      })
      setEditingId(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingExpense({ name: "", amount: "", category: "hogar" })
  }

  const handleTogglePaidClick = (expense: Expense) => {
    if (expense.status === 'pending') {
      // Si va a marcar como pagado, mostrar diálogo de comprobante
      setSelectedExpense(expense)
      setShowReceiptDialog(true)
    } else {
      // Si va a marcar como pendiente, hacerlo directamente
      onTogglePaid(expense.id, expense.status)
    }
  }

  const handleReceiptConfirm = (receiptImageId?: string) => {
    if (selectedExpense) {
      onTogglePaid(selectedExpense.id, selectedExpense.status, receiptImageId)
    }
    setShowReceiptDialog(false)
    setSelectedExpense(null)
  }

  const handleReceiptClose = () => {
    setShowReceiptDialog(false)
    setSelectedExpense(null)
  }

  return (
    <div className="space-y-3">
      {/* Header elegante */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Gastos</h2>
        </div>
        <Button
          onClick={handleToggleAdding}
          className="bg-primary hover:bg-primary/90 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isAdding ? "Cancelar" : "Agregar"}
        </Button>
      </div>

      {/* Formulario de agregar - Estilo moderno */}
      {isAdding && (
        <div className="bg-gradient-to-br from-primary/8 via-primary/5 to-primary/3 rounded-xl p-4 border border-primary/30 shadow-lg backdrop-blur-sm">
          <h3 className="font-medium text-primary mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            Nuevo Gasto
          </h3>
            <div className="space-y-3">
              <Input
                ref={nameInputRef}
                placeholder="Descripción del gasto"
                value={newExpense.name}
                onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                className="h-12 text-lg border-primary/30 focus:border-primary focus:ring-primary"
              />
              <Select
                value={newExpense.category}
                onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
              >
                <SelectTrigger className="h-12 text-lg border-primary/30 focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hogar">🏠 Hogar</SelectItem>
                  <SelectItem value="transporte">🚗 Transporte</SelectItem>
                  <SelectItem value="alimentacion">🍽️ Alimentación</SelectItem>
                  <SelectItem value="servicios">⚡ Servicios</SelectItem>
                  <SelectItem value="entretenimiento">🎬 Entretenimiento</SelectItem>
                  <SelectItem value="salud">🏥 Salud</SelectItem>
                  <SelectItem value="otros">📦 Otros</SelectItem>
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="pl-9 h-12 text-lg border-primary/30 focus:border-primary focus:ring-primary"
                  />
                </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleAddExpense}
                  className="flex-1 bg-primary hover:bg-primary/90 h-12"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 border-primary/30 text-primary hover:bg-primary/10 h-12"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de gastos - Estilo moderno */}
      <div className="space-y-2">
        {expenses
          .sort((a, b) => {
            // Primero los pendientes (status: 'pending'), luego los pagados (status: 'paid')
            if (a.status !== b.status) {
              return a.status === 'paid' ? 1 : -1
            }
            // Si tienen el mismo estado de pago, ordenar por nombre alfabéticamente
            return a.name.localeCompare(b.name)
          })
          .map((expense) => (
          <div
            key={expense.id}
            className={`group rounded-lg border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
              expense.status === 'paid' 
                ? "bg-gradient-to-br from-paid/10 via-paid/5 to-paid/3 border-paid/30 hover:border-paid/40 shadow-md" 
                : "bg-gradient-to-br from-pending/10 via-pending/5 to-pending/3 border-pending/30 hover:border-pending/40 shadow-md"
            }`}
          >
            {editingId === expense.id ? (
              // Modo edición
              <div className="p-4 bg-gradient-to-br from-warning/15 via-warning/8 to-warning/5 rounded-lg border border-warning/30 shadow-md">
                <h3 className="font-medium text-warning mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning rounded-full animate-pulse"></span>
                  Editando Gasto
                </h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Descripción del gasto"
                    value={editingExpense.name}
                    onChange={(e) => setEditingExpense({ ...editingExpense, name: e.target.value })}
                    className="h-12 text-lg border-warning/30 focus:border-warning focus:ring-warning"
                  />
                  <Select
                    value={editingExpense.category}
                    onValueChange={(value) => setEditingExpense({ ...editingExpense, category: value })}
                  >
                    <SelectTrigger className="h-12 text-lg border-warning/30 focus:border-warning focus:ring-warning">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hogar">🏠 Hogar</SelectItem>
                      <SelectItem value="transporte">🚗 Transporte</SelectItem>
                      <SelectItem value="alimentacion">🍽️ Alimentación</SelectItem>
                      <SelectItem value="servicios">⚡ Servicios</SelectItem>
                      <SelectItem value="entretenimiento">🎬 Entretenimiento</SelectItem>
                      <SelectItem value="salud">🏥 Salud</SelectItem>
                      <SelectItem value="otros">📦 Otros</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="space-y-2">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={editingExpense.amount}
                        onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                        className="pl-9 h-12 text-lg border-warning/30 focus:border-warning focus:ring-warning"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveEdit}
                        className="flex-1 bg-warning hover:bg-warning/90 h-12"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="flex-1 border-warning/30 text-warning hover:bg-warning/10 h-12"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Vista normal reorganizada
              <div className="p-4">
                {/* Primera fila: Menú - Descripción - Categoría */}
                <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
                  {/* Dropdown de editar (incluye eliminar) - Pegado al borde */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0 -ml-4"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Descripción */}
                  <h3 className="text-lg font-semibold text-foreground truncate flex-1 min-w-0 mx-2">{expense.name}</h3>
                  
                  {/* Categoría */}
                  <Badge variant="outline" className="text-sm px-2 py-1 whitespace-nowrap flex-shrink-0">
                    {expense.category === 'hogar' && '🏠 Hogar'}
                    {expense.category === 'transporte' && '🚗 Transporte'}
                    {expense.category === 'alimentacion' && '🍽️ Alimentación'}
                    {expense.category === 'servicios' && '⚡ Servicios'}
                    {expense.category === 'entretenimiento' && '🎬 Entretenimiento'}
                    {expense.category === 'salud' && '🏥 Salud'}
                    {expense.category === 'otros' && '📦 Otros'}
                  </Badge>
                </div>

                {/* Segunda fila: Monto - Botón de estado - Indicador de pago */}
                <div className="flex items-center justify-between gap-3 min-w-0">
                  {/* Monto */}
                  <div className={`font-bold text-foreground truncate min-w-0 flex-shrink-0 ${
                    expense.amount.toString().length <= 6 
                      ? 'text-3xl' 
                      : expense.amount.toString().length <= 8 
                        ? 'text-2xl' 
                        : expense.amount.toString().length <= 10
                          ? 'text-xl'
                          : 'text-lg'
                  }`}>
                    {formatCurrency(expense.amount)}
                  </div>
                  
                  {/* Botón de estado de pago y indicador */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Botón de estado de pago */}
                    {expense.status === 'paid' ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs border-pending/40 text-pending hover:bg-pending/10 whitespace-nowrap"
                          >
                            Pendiente
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Marcar como pendiente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que quieres marcar "{expense.name}" como pendiente?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onTogglePaid(expense.id, expense.status)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Marcar como Pendiente
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleTogglePaidClick(expense)}
                        className="h-8 px-4 text-xs bg-paid hover:bg-paid/90 text-paid-foreground whitespace-nowrap shadow-md border-2 border-paid/30 hover:border-paid/50 font-semibold"
                      >
                        Pagar
                      </Button>
                    )}
                    
                    {/* Indicador de estado de pago */}
                    {expense.status === 'paid' && (
                      <div className="w-4 h-4 bg-paid rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-paid-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Estado vacío elegante */}
        {expenses.length === 0 && !isAdding && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No hay gastos registrados
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Comienza agregando tu primer gasto fijo
            </p>
            <Button
              onClick={handleToggleAdding}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Gasto
            </Button>
          </div>
        )}
      </div>

      {/* Diálogo de comprobante de pago */}
      {selectedExpense && (
        <PaymentReceiptDialog
          isOpen={showReceiptDialog}
          onClose={handleReceiptClose}
          onConfirm={handleReceiptConfirm}
          expenseName={selectedExpense.name}
          expenseAmount={selectedExpense.amount}
          isConnectedToControlFile={isControlFileConnected}
          onConnectionChange={() => {}} // No necesario ya que se maneja globalmente
        />
      )}
    </div>
  )
}

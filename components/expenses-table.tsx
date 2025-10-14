"use client"

import { useControlFile } from "@/components/controlfile-provider"
import { PaymentReceiptDialog } from "@/components/payment-receipt-dialog"
import { RecurringPaymentDialog } from "@/components/recurring-payment-dialog"
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
import { RecurringItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { FieldValue, Timestamp } from "firebase/firestore"
import { Check, DollarSign, MoreVertical, Pencil, Plus, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface Expense {
  id: string
  name: string
  amount: number
  category: 'hogar' | 'transporte' | 'alimentacion' | 'servicios' | 'entretenimiento' | 'salud' | 'otros'
  status: 'pending' | 'paid'
  userId: string
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
  type?: 'manual' | 'recurring' // Tipo de gasto
  recurringItemId?: string // ID del item recurrente si aplica
  receiptImageId?: string // ID del comprobante
}

interface ExpensesTableProps {
  expenses: Expense[]
  recurringItems?: RecurringItem[] // Items recurrentes filtrados por período
  onAddExpense: (name: string, amount: number, category: string) => void
  onUpdateExpense: (id: string, updates: Partial<Expense>) => void
  onDeleteExpense: (id: string) => void
  onTogglePaid: (id: string, currentStatus: 'pending' | 'paid', receiptImageId?: string) => void
  onPayRecurringItem?: (itemId: string, amount: number, notes?: string) => void
  isAdding: boolean
  onToggleAdding: () => void
}

export function ExpensesTable({ 
  expenses, 
  recurringItems = [],
  onAddExpense, 
  onUpdateExpense, 
  onDeleteExpense, 
  onTogglePaid,
  onPayRecurringItem,
  isAdding,
  onToggleAdding
}: ExpensesTableProps) {
  const [newExpense, setNewExpense] = useState({ name: "", amount: "", category: "hogar" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState({ name: "", amount: "", category: "hogar" })
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showRecurringPaymentDialog, setShowRecurringPaymentDialog] = useState(false)
  const [selectedRecurringItem, setSelectedRecurringItem] = useState<RecurringItem | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Usar el contexto global de ControlFile
  const { isControlFileConnected } = useControlFile()

  // ✅ SIMPLIFICADO: Combinar gastos normales con items recurrentes filtrados
  const getAllExpenses = () => {
    const allItems: Array<Expense | RecurringItem> = []
    
    // Agregar gastos normales
    allItems.push(...expenses)
    
    // Agregar items recurrentes filtrados por período
    allItems.push(...recurringItems)
    
    return allItems
  }

  // Auto-focus en el input cuando se abre el formulario
  useEffect(() => {
    if (isAdding && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [isAdding])

  const handleAddExpense = () => {
    if (newExpense.name && newExpense.amount) {
      onAddExpense(newExpense.name, Number.parseFloat(newExpense.amount), newExpense.category)
      setNewExpense({ name: "", amount: "", category: "hogar" })
      onToggleAdding()
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

  // ✅ UNIFICADO: Función para manejar pagos de TODOS los items recurrentes
  const handlePayRecurringItem = (item: RecurringItem) => {
    setSelectedRecurringItem(item)
    // Para items con monto predefinido, mostrarlo como valor inicial
    // Para items diarios sin monto, empezar con campo vacío
    setPaymentAmount(item.amount ? item.amount.toString() : '')
    setPaymentNotes('')
    setShowRecurringPaymentDialog(true)
  }

  const handleConfirmRecurringPayment = async (amount: number, receiptImageId?: string, notes?: string) => {
    if (!selectedRecurringItem) return

    try {
      onPayRecurringItem?.(selectedRecurringItem.id, amount, notes)
      setShowRecurringPaymentDialog(false)
      setSelectedRecurringItem(null)
      setPaymentAmount('')
      setPaymentNotes('')
    } catch (error) {
      console.error('Error procesando pago:', error)
      toast.error('Error al procesar el pago')
    }
  }

  const handleRecurringPaymentClose = () => {
    setShowRecurringPaymentDialog(false)
    setSelectedRecurringItem(null)
    setPaymentAmount('')
    setPaymentNotes('')
  }

  return (
    <div className="space-y-3">
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
                  onClick={onToggleAdding}
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
        {getAllExpenses()
          .filter(item => item && item.id) // Filtrar items inválidos
          .sort((a, b) => {
            // Validar que ambos items existan
            if (!a || !b) return 0
            
            // Primero determinar si son gastos normales o recurrentes
            const aIsExpense = 'userId' in a
            const bIsExpense = 'userId' in b
            
            // Los gastos normales primero, luego los recurrentes
            if (aIsExpense !== bIsExpense) {
              return aIsExpense ? -1 : 1
            }
            
            // Si ambos son gastos normales, ordenar por status
            if (aIsExpense && bIsExpense) {
              const aExpense = a as Expense
              const bExpense = b as Expense
              if (aExpense.status !== bExpense.status) {
                return aExpense.status === 'paid' ? 1 : -1
              }
              const aName = (aExpense.name || '').toString()
              const bName = (bExpense.name || '').toString()
              return aName.localeCompare(bName)
            }
            
            // Si ambos son recurrentes, ordenar por nombre
            const aName = (a.name || '').toString()
            const bName = (b.name || '').toString()
            return aName.localeCompare(bName)
          })
          .map((item) => {
            // Determinar si es un gasto normal o un item recurrente
            // Los items recurrentes tienen 'recurrenceType', los gastos tienen 'status'
            const isExpense = 'status' in item
            const expense = isExpense ? item as Expense : null
            const recurringItem = !isExpense ? item as RecurringItem : null
            
            return (
              <div
                key={item.id}
                className={`group rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                  isExpense && expense?.status === 'paid' 
                    ? "bg-gradient-to-br from-green-50 via-green-25 to-white border-2 border-green-500 hover:border-green-600 shadow-md"
                    : isExpense && expense?.status === 'pending'
                    ? "bg-gradient-to-br from-pending/10 via-pending/5 to-pending/3 border border-pending/30 hover:border-pending/40 shadow-md"
                    : recurringItem
                    ? "bg-gradient-to-br from-blue-50 via-blue-25 to-blue-10 border border-blue-200 hover:border-blue-300 shadow-md"
                    : "bg-gradient-to-br from-pending/10 via-pending/5 to-pending/3 border border-pending/30 hover:border-pending/40 shadow-md"
                }`}
              >
                {isExpense && editingId === expense?.id ? (
                  // Modo edición para gastos normales
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
            ) : isExpense ? (
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
                      <DropdownMenuItem onClick={() => expense && handleEditExpense(expense)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => expense && onDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Descripción */}
                  <h3 className="text-lg font-semibold text-foreground truncate flex-1 min-w-0 mx-2">{expense?.name}</h3>
                  
                  {/* Categoría */}
                  <Badge variant="outline" className="text-sm px-2 py-1 whitespace-nowrap flex-shrink-0">
                    {expense?.category === 'hogar' && '🏠 Hogar'}
                    {expense?.category === 'transporte' && '🚗 Transporte'}
                    {expense?.category === 'alimentacion' && '🍽️ Alimentación'}
                    {expense?.category === 'servicios' && '⚡ Servicios'}
                    {expense?.category === 'entretenimiento' && '🎬 Entretenimiento'}
                    {expense?.category === 'salud' && '🏥 Salud'}
                    {expense?.category === 'otros' && '📦 Otros'}
                  </Badge>
                </div>

                {/* Segunda fila: Monto - Botón de estado - Indicador de pago */}
                <div className="flex items-center justify-between gap-3 min-w-0">
                  {/* Monto */}
                  <div className={`font-bold text-foreground truncate min-w-0 flex-shrink-0 ${
                    (expense?.amount?.toString().length || 0) <= 6 
                      ? 'text-3xl' 
                      : (expense?.amount?.toString().length || 0) <= 8 
                        ? 'text-2xl' 
                        : (expense?.amount?.toString().length || 0) <= 10
                          ? 'text-xl'
                          : 'text-lg'
                  }`}>
                    {expense && formatCurrency(expense.amount)}
                  </div>
                  
                  {/* Botón de estado de pago y indicador */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Botón de estado de pago */}
                    {expense?.status === 'paid' ? (
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
                              ¿Estás seguro de que quieres marcar "{expense?.name}" como pendiente?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => expense && onTogglePaid(expense.id, expense.status)}
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
                        onClick={() => expense && handleTogglePaidClick(expense)}
                        className="h-8 px-4 text-xs bg-paid hover:bg-paid/90 text-paid-foreground whitespace-nowrap shadow-md border-2 border-paid/30 hover:border-paid/50 font-semibold"
                      >
                        Pagar
                      </Button>
                    )}
                    
                    {/* Indicador de estado de pago */}
                    {expense?.status === 'paid' && (
                      <div className="w-4 h-4 bg-paid rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-paid-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
            {!isExpense && (
              // Vista para items recurrentes
              <div className="p-4">
                <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
                  {/* Indicador de item recurrente */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                      Recurrente
                    </Badge>
                  </div>
                  
                  {/* Descripción */}
                  <h3 className="text-lg font-semibold text-foreground truncate flex-1 min-w-0 mx-2">
                    {recurringItem?.name}
                  </h3>
                  
                  {/* Categoría */}
                  <Badge variant="outline" className="text-sm px-2 py-1 whitespace-nowrap flex-shrink-0">
                    {recurringItem?.category === 'hogar' && '🏠 Hogar'}
                    {recurringItem?.category === 'transporte' && '🚗 Transporte'}
                    {recurringItem?.category === 'alimentacion' && '🍽️ Alimentación'}
                    {recurringItem?.category === 'servicios' && '⚡ Servicios'}
                    {recurringItem?.category === 'entretenimiento' && '🎬 Entretenimiento'}
                    {recurringItem?.category === 'salud' && '🏥 Salud'}
                    {recurringItem?.category === 'otros' && '📦 Otros'}
                  </Badge>
                </div>

                {/* Segunda fila: Monto y botón de pago */}
                <div className="flex items-center justify-between gap-3 min-w-0">
                  {/* Monto */}
                  <div className="font-bold text-foreground truncate min-w-0 flex-shrink-0 text-2xl">
                    {recurringItem && recurringItem.amount
                      ? formatCurrency(recurringItem.amount)
                      : 'Ingresar monto'}
                  </div>
                  
                  {/* Botón de pago */}
                  <Button
                    size="sm"
                    onClick={() => handlePayRecurringItem(recurringItem!)}
                    className="h-8 px-4 text-xs bg-paid hover:bg-paid/90 text-paid-foreground whitespace-nowrap shadow-md border-2 border-paid/30 hover:border-paid/50 font-semibold"
                  >
                    Pagar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}

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
              onClick={onToggleAdding}
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

      {/* Diálogo de pago para items recurrentes */}
      {selectedRecurringItem && (
        <RecurringPaymentDialog
          isOpen={showRecurringPaymentDialog}
          onClose={handleRecurringPaymentClose}
          onConfirm={handleConfirmRecurringPayment}
          itemName={selectedRecurringItem.name}
          suggestedAmount={selectedRecurringItem.amount || 0}
          isConnectedToControlFile={isControlFileConnected}
          onConnectionChange={() => {}}
        />
      )}
    </div>
  )
}

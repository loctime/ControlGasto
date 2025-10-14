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
    <div className="space-y-4">
      {/* Formulario de agregar compacto */}
      {isAdding && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-success/20 rounded-2xl blur-lg animate-pulse"></div>
          <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-xl">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-sm animate-bounce-gentle">
                ✨
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Nuevo Gasto
                </h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                    <span className="text-primary">📝</span>
                    Descripción
                  </label>
                  <Input
                    ref={nameInputRef}
                    placeholder="Ej: Almuerzo con amigos"
                    value={newExpense.name}
                    onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                    className="h-10 text-sm border-2 border-primary/20 focus:border-primary focus:ring-primary rounded-xl transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                    <span className="text-primary">🏷️</span>
                    Categoría
                  </label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                  >
                    <SelectTrigger className="h-10 text-sm border-2 border-primary/20 focus:border-primary focus:ring-primary rounded-xl transition-all duration-300">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="hogar" className="rounded-lg">🏠 Hogar</SelectItem>
                      <SelectItem value="transporte" className="rounded-lg">🚗 Transporte</SelectItem>
                      <SelectItem value="alimentacion" className="rounded-lg">🍽️ Alimentación</SelectItem>
                      <SelectItem value="servicios" className="rounded-lg">⚡ Servicios</SelectItem>
                      <SelectItem value="entretenimiento" className="rounded-lg">🎬 Entretenimiento</SelectItem>
                      <SelectItem value="salud" className="rounded-lg">🏥 Salud</SelectItem>
                      <SelectItem value="otros" className="rounded-lg">📦 Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                  <span className="text-primary">💰</span>
                  Monto
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="pl-9 h-10 text-lg font-bold border-2 border-primary/20 focus:border-primary focus:ring-primary rounded-xl transition-all duration-300"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleAddExpense}
                  className="flex-1 btn-modern h-10 text-sm font-semibold rounded-xl"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={onToggleAdding}
                  className="flex-1 h-10 text-sm font-semibold rounded-xl border-2 border-primary/30 text-primary hover:bg-primary/10 transition-all duration-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de gastos - Estilo compacto */}
      <div className="space-y-3">
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
                className={`group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] animate-scale-in ${
                  isExpense && expense?.status === 'paid' 
                    ? "card-float bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-green-900/20 dark:via-emerald-900/20 dark:to-gray-900/50 border-2 border-green-400 dark:border-green-500"
                    : isExpense && expense?.status === 'pending'
                    ? "card-float bg-gradient-to-br from-orange-50 via-amber-50 to-white dark:from-orange-900/20 dark:via-amber-900/20 dark:to-gray-900/50 border-2 border-orange-400 dark:border-orange-500"
                    : recurringItem
                    ? "card-float bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-gray-900/50 border-2 border-blue-400 dark:border-blue-500"
                    : "card-float bg-gradient-to-br from-orange-50 via-amber-50 to-white dark:from-orange-900/20 dark:via-amber-900/20 dark:to-gray-900/50 border-2 border-orange-400 dark:border-orange-500"
                }`}
                style={{
                  animationDelay: `${Math.random() * 0.5}s`
                }}
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
              // Vista compacta para gastos
              <div className="p-4">
                {/* Efectos de fondo animados */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-lg animate-pulse"></div>
                
                {/* Header del card */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                      expense?.status === 'paid' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 animate-bounce-gentle' 
                        : 'bg-gradient-to-r from-orange-500 to-amber-600 animate-wiggle'
                    }`}>
                      {expense?.category === 'hogar' && '🏠'}
                      {expense?.category === 'transporte' && '🚗'}
                      {expense?.category === 'alimentacion' && '🍽️'}
                      {expense?.category === 'servicios' && '⚡'}
                      {expense?.category === 'entretenimiento' && '🎬'}
                      {expense?.category === 'salud' && '🏥'}
                      {expense?.category === 'otros' && '📦'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{expense?.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          expense?.status === 'paid' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {expense?.category === 'hogar' && '🏠 Hogar'}
                          {expense?.category === 'transporte' && '🚗 Transporte'}
                          {expense?.category === 'alimentacion' && '🍽️ Alimentación'}
                          {expense?.category === 'servicios' && '⚡ Servicios'}
                          {expense?.category === 'entretenimiento' && '🎬 Entretenimiento'}
                          {expense?.category === 'salud' && '🏥 Salud'}
                          {expense?.category === 'otros' && '📦 Otros'}
                        </span>
                        {expense?.status === 'paid' && (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-semibold animate-pulse">
                            ✅
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Menú de acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-primary/10 rounded-lg transition-all duration-300"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => expense && handleEditExpense(expense)} className="rounded-lg">
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => expense && onDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Footer del card */}
                <div className="flex items-center justify-between">
                  {/* Monto */}
                  <div className={`font-bold text-foreground ${
                    (expense?.amount?.toString().length || 0) <= 6 
                      ? 'text-2xl' 
                      : (expense?.amount?.toString().length || 0) <= 8 
                        ? 'text-xl' 
                        : (expense?.amount?.toString().length || 0) <= 10
                          ? 'text-lg'
                          : 'text-base'
                  }`}>
                    {expense && formatCurrency(expense.amount)}
                  </div>
                  
                  {/* Botón de estado */}
                  <div className="flex items-center gap-2">
                    {expense?.status === 'paid' ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            className="h-8 px-4 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                          >
                            ⏳ Pendiente
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Marcar como pendiente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que quieres marcar "{expense?.name}" como pendiente?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => expense && onTogglePaid(expense.id, expense.status)}
                              className="rounded-lg"
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
                        className="h-8 px-4 text-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        💳 Pagar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
            {!isExpense && (
              // Vista compacta para items recurrentes
              <div className="p-4">
                {/* Efectos de fondo animados */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-lg animate-pulse"></div>
                
                {/* Header del card */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-lg font-bold animate-float">
                      🔄
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{recurringItem?.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full font-semibold">
                          🔄 RECURRENTE
                        </span>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {recurringItem?.category === 'hogar' && '🏠 Hogar'}
                          {recurringItem?.category === 'transporte' && '🚗 Transporte'}
                          {recurringItem?.category === 'alimentacion' && '🍽️ Alimentación'}
                          {recurringItem?.category === 'servicios' && '⚡ Servicios'}
                          {recurringItem?.category === 'entretenimiento' && '🎬 Entretenimiento'}
                          {recurringItem?.category === 'salud' && '🏥 Salud'}
                          {recurringItem?.category === 'otros' && '📦 Otros'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer del card */}
                <div className="flex items-center justify-between">
                  {/* Monto */}
                  <div className="text-xl font-bold text-foreground">
                    {recurringItem && recurringItem.amount
                      ? formatCurrency(recurringItem.amount)
                      : '💰 Ingresar monto'}
                  </div>
                  
                  {/* Botón de pago */}
                  <Button
                    size="sm"
                    onClick={() => handlePayRecurringItem(recurringItem!)}
                    className="h-8 px-4 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    💳 Pagar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Estado vacío compacto */}
        {expenses.length === 0 && !isAdding && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-success/5 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-3 animate-bounce-gentle">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-xs animate-pulse">
                  ✨
                </div>
              </div>
              
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                ¡Tu lista está vacía! 🎉
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Comienza agregando tu primer gasto
              </p>
              
              <Button
                onClick={onToggleAdding}
                className="btn-modern px-6 py-3 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Gasto
              </Button>
            </div>
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

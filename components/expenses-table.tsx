"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Check, X, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Expense {
  id: string
  name: string
  amount: number
  paid: boolean
  userId: string
  createdAt: any
}

interface ExpensesTableProps {
  expenses: Expense[]
  onAddExpense: (name: string, amount: number) => void
  onUpdateExpense: (id: string, updates: Partial<Expense>) => void
  onDeleteExpense: (id: string) => void
  onTogglePaid: (id: string, currentPaid: boolean) => void
}

export function ExpensesTable({ 
  expenses, 
  onAddExpense, 
  onUpdateExpense, 
  onDeleteExpense, 
  onTogglePaid 
}: ExpensesTableProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newExpense, setNewExpense] = useState({ name: "", amount: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState({ name: "", amount: "" })

  const handleAddExpense = () => {
    if (newExpense.name && newExpense.amount) {
      onAddExpense(newExpense.name, Number.parseFloat(newExpense.amount))
      setNewExpense({ name: "", amount: "" })
      setIsAdding(false)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingId(expense.id)
    setEditingExpense({
      name: expense.name,
      amount: expense.amount.toString(),
    })
  }

  const handleSaveEdit = () => {
    if (editingExpense.name && editingExpense.amount) {
      onUpdateExpense(editingId!, {
        name: editingExpense.name,
        amount: Number.parseFloat(editingExpense.amount),
      })
      setEditingId(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingExpense({ name: "", amount: "" })
  }

  return (
    <div className="space-y-6">
      {/* Header elegante */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Gastos</h2>
          <p className="text-sm text-muted-foreground">{expenses.length} gastos registrados</p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Formulario de agregar - Estilo moderno */}
      {isAdding && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
          <h3 className="font-medium text-emerald-900 dark:text-emerald-100 mb-4">Nuevo Gasto</h3>
          <div className="space-y-4">
            <Input
              placeholder="Descripción del gasto"
              value={newExpense.name}
              onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
              className="border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
            />
            <div className="flex gap-3">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="pl-9 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <Button
                onClick={handleAddExpense}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAdding(false)}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de gastos - Estilo moderno */}
      <div className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="group bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 hover:shadow-sm"
          >
            {editingId === expense.id ? (
              // Modo edición
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-4">Editando Gasto</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Descripción del gasto"
                    value={editingExpense.name}
                    onChange={(e) => setEditingExpense({ ...editingExpense, name: e.target.value })}
                    className="border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={editingExpense.amount}
                        onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                        className="pl-9 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                      />
                    </div>
                    <Button
                      onClick={handleSaveEdit}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Vista normal.
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{expense.name}</h3>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      ${expense.amount.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={expense.paid ? "default" : "secondary"}
                      className={`${
                        expense.paid 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {expense.paid ? "Pagado" : "Pendiente"}
                    </Badge>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        onClick={() => onTogglePaid(expense.id, expense.paid)}
                        variant={expense.paid ? "outline" : "default"}
                        className={`${
                          expense.paid 
                            ? "border-slate-300 text-slate-700 hover:bg-slate-50" 
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {expense.paid ? "Pagar" : "Pagado"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditExpense(expense)}
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteExpense(expense.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
              onClick={() => setIsAdding(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Gasto
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

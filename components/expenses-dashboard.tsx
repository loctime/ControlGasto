"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { ExpensesHeader } from "@/components/expenses-header"
import { ExpensesTable } from "@/components/expenses-table"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Expense {
  id: string
  name: string
  amount: number
  category: 'hogar' | 'transporte' | 'alimentacion' | 'servicios' | 'entretenimiento' | 'salud' | 'otros'
  paid: boolean
  userId: string
  createdAt: any
  paidAt?: any
  unpaidAt?: any
}

export function ExpensesDashboard() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    if (!user) return

    const q = query(collection(db, "expenses"), where("userId", "==", user.uid))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[]
      setExpenses(expensesData)
    })

    return () => unsubscribe()
  }, [user])

  const addExpense = async (name: string, amount: number, category: string) => {
    if (!user) return

    try {
      await addDoc(collection(db, "expenses"), {
        name,
        amount,
        category,
        paid: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("[v0] Error adding expense:", error)
    }
  }

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      await updateDoc(doc(db, "expenses", id), updates)
    } catch (error) {
      console.error("[v0] Error updating expense:", error)
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, "expenses", id))
    } catch (error) {
      console.error("[v0] Error deleting expense:", error)
    }
  }

  const togglePaid = async (id: string, currentPaid: boolean) => {
    const newPaidStatus = !currentPaid
    const updates: Partial<Expense> = { paid: newPaidStatus }
    
    if (newPaidStatus) {
      // Si se marca como pagado, guardar fecha de pago
      updates.paidAt = serverTimestamp()
      updates.unpaidAt = null
    } else {
      // Si se desmarca como pagado, guardar fecha de desmarcado
      updates.unpaidAt = serverTimestamp()
      updates.paidAt = null
    }
    
    await updateExpense(id, updates)
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalPaid = expenses.filter((exp) => exp.paid).reduce((sum, exp) => sum + exp.amount, 0)
  const totalPending = totalExpenses - totalPaid

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header con totales */}
      <ExpensesHeader 
        totalPaid={totalPaid}
        totalPending={totalPending}
        totalExpenses={totalExpenses}
      />

      {/* Tabla de gastos */}
      <ExpensesTable
        expenses={expenses}
        onAddExpense={addExpense}
        onUpdateExpense={updateExpense}
        onDeleteExpense={deleteExpense}
        onTogglePaid={togglePaid}
      />
    </div>
  )
}

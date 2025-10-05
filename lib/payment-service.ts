import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore'
import { db } from './firebase'
import { Invoice, Payment, PaymentWithInvoices } from './types'

export class PaymentService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Crear un nuevo pago (registro en el historial)
  async createPayment(paymentData: any): Promise<string> {
    try {
      const paymentRef = await addDoc(collection(db, `apps/controlgastos/users/${this.userId}/expenses`), {
        ...paymentData,
        userId: this.userId,
        createdAt: serverTimestamp()
      })
      
      console.log('✅ Pago registrado en historial:', paymentRef.id)
      return paymentRef.id
    } catch (error) {
      console.error('Error creando pago:', error)
      throw error
    }
  }

  // Registrar pago de un gasto específico
  async recordPayment(
    expenseId: string, 
    expenseName: string, 
    amount: number, 
    receiptImageId?: string,
    notes?: string
  ): Promise<string> {
    try {
      const paymentData = {
        expenseId,
        expenseName,
        amount,
        currency: 'ARS',
        paidAt: serverTimestamp(),
        ...(receiptImageId && { receiptImageId }),
        ...(notes && { notes })
      }

      return await this.createPayment(paymentData)
    } catch (error) {
      console.error('Error registrando pago:', error)
      throw error
    }
  }

  // Obtener pagos por gasto específico
  async getPaymentsByExpense(expenseId: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, `apps/controlgastos/users/${this.userId}/expenses`),
        where('expenseId', '==', expenseId),
        orderBy('paidAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        paidAt: doc.data().paidAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Payment[]
    } catch (error) {
      console.error('Error obteniendo pagos del gasto:', error)
      throw error
    }
  }

  // Obtener todos los pagos del usuario
  async getAllPayments(): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, `apps/controlgastos/users/${this.userId}/expenses`),
        orderBy('paidAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        paidAt: doc.data().paidAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Payment[]
    } catch (error) {
      console.error('Error obteniendo pagos:', error)
      throw error
    }
  }

  // Obtener pagos por rango de fechas
  async getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, `apps/controlgastos/users/${this.userId}/expenses`),
        where('paidAt', '>=', startDate),
        where('paidAt', '<=', endDate),
        orderBy('paidAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        paidAt: doc.data().paidAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Payment[]
    } catch (error) {
      console.error('Error obteniendo pagos por rango:', error)
      throw error
    }
  }

  // Obtener pagos con sus facturas
  async getPaymentsWithInvoices(): Promise<PaymentWithInvoices[]> {
    try {
      const payments = await this.getAllPayments()
      const paymentsWithInvoices: PaymentWithInvoices[] = []
      
      for (const payment of payments) {
        const invoicesQuery = query(
          collection(db, `apps/controlgastos/users/${this.userId}/receipts`),
          where('paymentId', '==', payment.id)
        )
        
        const invoicesSnapshot = await getDocs(invoicesQuery)
        const invoices = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate() || new Date()
        })) as Invoice[]

        paymentsWithInvoices.push({
          ...payment,
          invoices
        })
      }

      return paymentsWithInvoices
    } catch (error) {
      console.error('Error obteniendo pagos con facturas:', error)
      throw error
    }
  }

  // Eliminar pago del historial
  async deletePayment(paymentId: string): Promise<void> {
    try {
      // Primero eliminar facturas asociadas
      const invoicesQuery = query(
        collection(db, `apps/controlgastos/users/${this.userId}/receipts`),
        where('paymentId', '==', paymentId)
      )
      
      const invoicesSnapshot = await getDocs(invoicesQuery)
      for (const invoiceDoc of invoicesSnapshot.docs) {
        await deleteDoc(invoiceDoc.ref)
      }

      // Luego eliminar el pago
      const paymentRef = doc(db, 'payments', paymentId)
      await deleteDoc(paymentRef)
      
      console.log('✅ Pago eliminado del historial:', paymentId)
    } catch (error) {
      console.error('Error eliminando pago:', error)
      throw error
    }
  }

  // Obtener estadísticas del dashboard
  async getDashboardStats(): Promise<{ totalPayments: number; totalAmount: number; paymentsThisMonth: number }> {
    try {
      const payments = await this.getAllPayments()
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      
      const paymentsThisMonth = payments.filter(payment => {
        const paymentDate = new Date(payment.paidAt)
        return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear
      })
      
      return {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
        paymentsThisMonth: paymentsThisMonth.length
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      throw error
    }
  }

  // Verificar si hay pagos del mes anterior
  async hasPaymentsFromPreviousMonth(): Promise<boolean> {
    try {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      // Calcular el mes anterior
      let previousMonth = currentMonth - 1
      let previousYear = currentYear
      
      if (previousMonth < 0) {
        previousMonth = 11 // Diciembre
        previousYear = currentYear - 1
      }
      
      // Crear fechas de inicio y fin del mes anterior
      const startDate = new Date(previousYear, previousMonth, 1)
      const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999) // Último día del mes anterior
      
      const payments = await this.getPaymentsByDateRange(startDate, endDate)
      
      return payments.length > 0
    } catch (error) {
      console.error('Error verificando pagos del mes anterior:', error)
      return false
    }
  }

  // Reiniciar todos los gastos a estado pendiente (para nuevo mes)
  async resetAllExpensesToPending(): Promise<void> {
    try {
      // Obtener todos los gastos del usuario
      const expensesQuery = query(
        collection(db, `apps/controlgastos/users/${this.userId}/expenses`)
      )
      
      const expensesSnapshot = await getDocs(expensesQuery)
      
      // Actualizar todos los gastos a estado pendiente
      const updatePromises = expensesSnapshot.docs.map(doc => {
        return updateDoc(doc.ref, {
          status: 'pending',
          updatedAt: serverTimestamp()
        })
      })
      
      await Promise.all(updatePromises)
      
      console.log(`✅ ${updatePromises.length} gastos reiniciados a estado pendiente`)
    } catch (error) {
      console.error('Error reiniciando gastos:', error)
      throw error
    }
  }

  // Obtener meses disponibles con pagos
  async getAvailableMonths(): Promise<string[]> {
    try {
      const payments = await this.getAllPayments()
      const monthsSet = new Set<string>()
      
      payments.forEach(payment => {
        const paymentDate = new Date(payment.paidAt)
        const monthYear = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
        monthsSet.add(monthYear)
      })
      
      // Convertir a array y ordenar de más reciente a más antiguo
      return Array.from(monthsSet).sort().reverse()
    } catch (error) {
      console.error('Error obteniendo meses disponibles:', error)
      return []
    }
  }
}

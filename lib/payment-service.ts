import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { Payment, Invoice, ExpenseCategory, ExpenseStatus, PaymentWithInvoices, Expense } from './types'

export class PaymentService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Crear un nuevo pago (registro en el historial)
  async createPayment(paymentData: any): Promise<string> {
    try {
      const paymentRef = await addDoc(collection(db, 'payments'), {
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
        collection(db, 'payments'),
        where('userId', '==', this.userId),
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
        collection(db, 'payments'),
        where('userId', '==', this.userId),
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
        collection(db, 'payments'),
        where('userId', '==', this.userId),
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
          collection(db, 'invoices'),
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
        collection(db, 'invoices'),
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
}

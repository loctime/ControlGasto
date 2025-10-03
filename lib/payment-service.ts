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
import { Payment, Invoice, PaymentType, PaymentStatus, PaymentWithInvoices } from './types'

export class PaymentService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Crear un nuevo pago
  async createPayment(paymentData: Omit<Payment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const paymentRef = await addDoc(collection(db, 'users', this.userId, 'payments'), {
        ...paymentData,
        userId: this.userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      console.log('✅ Pago creado:', paymentRef.id)
      return paymentRef.id
    } catch (error) {
      console.error('Error creando pago:', error)
      throw error
    }
  }

  // Marcar un gasto como pagado
  async markExpenseAsPaid(expenseId: string, paymentType: PaymentType): Promise<string> {
    try {
      // Obtener datos del gasto (esto debería venir del contexto)
      // Por ahora, creamos el pago con datos básicos
      const paymentData = {
        type: paymentType,
        amount: 0, // Se debería obtener del gasto original
        currency: 'ARS',
        date: new Date().toISOString().split('T')[0],
        description: `Pago de ${paymentType}`,
        status: 'paid' as PaymentStatus,
        category: paymentType,
        month: this.getCurrentMonth(),
        year: new Date().getFullYear()
      }

      return await this.createPayment(paymentData)
    } catch (error) {
      console.error('Error marcando gasto como pagado:', error)
      throw error
    }
  }

  // Obtener pagos por tipo y mes
  async getPaymentsByTypeAndMonth(type: PaymentType, month: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, 'users', this.userId, 'payments'),
        where('type', '==', type),
        where('month', '==', month),
        orderBy('date', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Payment[]
    } catch (error) {
      console.error('Error obteniendo pagos:', error)
      throw error
    }
  }

  // Obtener todos los pagos de un mes
  async getPaymentsByMonth(month: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, 'users', this.userId, 'payments'),
        where('month', '==', month),
        orderBy('date', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Payment[]
    } catch (error) {
      console.error('Error obteniendo pagos del mes:', error)
      throw error
    }
  }

  // Obtener pagos con sus facturas
  async getPaymentsWithInvoices(month?: string): Promise<PaymentWithInvoices[]> {
    try {
      let q = query(
        collection(db, 'users', this.userId, 'payments'),
        orderBy('date', 'desc')
      )

      if (month) {
        q = query(
          collection(db, 'users', this.userId, 'payments'),
          where('month', '==', month),
          orderBy('date', 'desc')
        )
      }

      const paymentsSnapshot = await getDocs(q)
      const payments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Payment[]

      // Obtener facturas para cada pago
      const paymentsWithInvoices: PaymentWithInvoices[] = []
      
      for (const payment of payments) {
        const invoicesQuery = query(
          collection(db, 'users', this.userId, 'invoices'),
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

  // Actualizar estado de pago
  async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
    try {
      const paymentRef = doc(db, 'users', this.userId, 'payments', paymentId)
      await updateDoc(paymentRef, {
        status,
        updatedAt: serverTimestamp()
      })
      
      console.log('✅ Estado de pago actualizado:', paymentId)
    } catch (error) {
      console.error('Error actualizando estado de pago:', error)
      throw error
    }
  }

  // Eliminar pago
  async deletePayment(paymentId: string): Promise<void> {
    try {
      // Primero eliminar facturas asociadas
      const invoicesQuery = query(
        collection(db, 'users', this.userId, 'invoices'),
        where('paymentId', '==', paymentId)
      )
      
      const invoicesSnapshot = await getDocs(invoicesQuery)
      for (const invoiceDoc of invoicesSnapshot.docs) {
        await deleteDoc(invoiceDoc.ref)
      }

      // Luego eliminar el pago
      const paymentRef = doc(db, 'users', this.userId, 'payments', paymentId)
      await deleteDoc(paymentRef)
      
      console.log('✅ Pago eliminado:', paymentId)
    } catch (error) {
      console.error('Error eliminando pago:', error)
      throw error
    }
  }

  // Obtener resumen de pagos por mes
  async getMonthlySummary(month: string): Promise<{ totalAmount: number; paymentCount: number; byType: Record<PaymentType, number> }> {
    try {
      const payments = await this.getPaymentsByMonth(month)
      
      const summary = {
        totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
        paymentCount: payments.length,
        byType: {} as Record<PaymentType, number>
      }

      // Agrupar por tipo
      payments.forEach(payment => {
        if (!summary.byType[payment.type]) {
          summary.byType[payment.type] = 0
        }
        summary.byType[payment.type] += payment.amount
      })

      return summary
    } catch (error) {
      console.error('Error obteniendo resumen mensual:', error)
      throw error
    }
  }

  // Utilidades
  private getCurrentMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  // Obtener meses disponibles
  async getAvailableMonths(): Promise<string[]> {
    try {
      const q = query(
        collection(db, 'users', this.userId, 'payments'),
        orderBy('month', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const months = new Set<string>()
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.month) {
          months.add(data.month)
        }
      })

      return Array.from(months).sort().reverse()
    } catch (error) {
      console.error('Error obteniendo meses disponibles:', error)
      throw error
    }
  }
}

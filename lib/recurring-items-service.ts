import {
    addWeeks,
    endOfDay,
    endOfMonth,
    endOfWeek,
    isBefore,
    startOfDay,
    startOfMonth,
    startOfWeek
} from 'date-fns'
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore'
import { db } from './firebase'
import { ExpenseCategory, RecurringItem, RecurringItemInstance } from './types'

export class RecurringItemsService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // ========== GESTIÓN DE PLANTILLAS ==========

  async createRecurringItem(itemData: Omit<RecurringItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validar que los items no-diarios tengan monto
      if (itemData.recurrenceType !== 'daily' && !itemData.amount) {
        throw new Error('Los items semanales, mensuales y de calendario deben tener un monto definido')
      }

      // Validar que los items mensuales tengan día del mes configurado
      if (itemData.recurrenceType === 'monthly' && !itemData.monthDay) {
        throw new Error('Los items mensuales deben tener un día del mes configurado')
      }

      // Filtrar campos undefined (Firestore no los permite)
      const cleanData = Object.fromEntries(
        Object.entries(itemData).filter(([_, value]) => value !== undefined)
      )

      const itemRef = await addDoc(
        collection(db, `apps/controlgastos/users/${this.userId}/recurring_items`),
        {
          ...cleanData,
          userId: this.userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      )

      console.log('✅ Item recurrente creado:', itemRef.id)

      // Generar instancias si no es diario
      if (itemData.recurrenceType !== 'daily') {
        await this.generateInstancesForItem(itemRef.id, itemData)
      }

      return itemRef.id
    } catch (error) {
      console.error('Error creando item recurrente:', error)
      throw error
    }
  }

  async updateRecurringItem(itemId: string, updates: Partial<RecurringItem>): Promise<void> {
    try {
      // Filtrar campos undefined (Firestore no los permite)
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      )

      const itemRef = doc(db, `apps/controlgastos/users/${this.userId}/recurring_items`, itemId)
      await updateDoc(itemRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      })

      console.log('✅ Item recurrente actualizado:', itemId)
    } catch (error) {
      console.error('Error actualizando item recurrente:', error)
      throw error
    }
  }

  async deleteRecurringItem(itemId: string): Promise<void> {
    try {
      // Eliminar instancias pendientes del item
      const instancesQuery = query(
        collection(db, `apps/controlgastos/users/${this.userId}/recurring_items_instances`),
        where('recurringItemId', '==', itemId),
        where('status', '==', 'pending')
      )

      const instancesSnapshot = await getDocs(instancesQuery)
      for (const instanceDoc of instancesSnapshot.docs) {
        await deleteDoc(instanceDoc.ref)
      }

      // Eliminar el item
      const itemRef = doc(db, `apps/controlgastos/users/${this.userId}/recurring_items`, itemId)
      await deleteDoc(itemRef)

      console.log('✅ Item recurrente eliminado:', itemId)
    } catch (error) {
      console.error('Error eliminando item recurrente:', error)
      throw error
    }
  }

  async getAllRecurringItems(): Promise<RecurringItem[]> {
    try {
      const q = query(
        collection(db, `apps/controlgastos/users/${this.userId}/recurring_items`),
        orderBy('createdAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as RecurringItem[]
    } catch (error) {
      console.error('Error obteniendo items recurrentes:', error)
      return []
    }
  }

  async getDailyItems(): Promise<RecurringItem[]> {
    try {
      const q = query(
        collection(db, `apps/controlgastos/users/${this.userId}/recurring_items`),
        where('recurrenceType', '==', 'daily'),
        where('isActive', '==', true)
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as RecurringItem[]
    } catch (error) {
      console.error('Error obteniendo items diarios:', error)
      return []
    }
  }

  // ========== GESTIÓN DE INSTANCIAS ==========

  async generateInstancesForItem(
    itemId: string,
    itemData: Omit<RecurringItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | RecurringItem
  ): Promise<void> {
    try {
      const now = new Date()
      const instances: Omit<RecurringItemInstance, 'id'>[] = []

      if (itemData.recurrenceType === 'weekly') {
        // Generar instancias para las próximas 4 semanas
        for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
          const weekStart = addWeeks(startOfWeek(now, { weekStartsOn: 1 }), weekOffset)
          const weekEnd = addWeeks(endOfWeek(now, { weekStartsOn: 1 }), weekOffset)
          
          // Calcular el día de la semana específico
          const dayOfWeek = itemData.weekDay || 1 // 1 = Lunes por defecto
          const dueDate = new Date(weekStart)
          dueDate.setDate(weekStart.getDate() + (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

          // Solo crear si la fecha no ha pasado o es hoy
          if (!isBefore(dueDate, startOfDay(now))) {
            instances.push({
              userId: this.userId,
              recurringItemId: itemId,
              itemName: itemData.name,
              amount: itemData.amount || 0,
              category: itemData.category,
              recurrenceType: 'weekly',
              dueDate: dueDate,
              status: 'pending',
              periodStart: weekStart,
              periodEnd: weekEnd,
              createdAt: now
            })
          }
        }
      } else if (itemData.recurrenceType === 'monthly') {
        // Generar instancias para los próximos 3 meses
        for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0)
          
          // Usar el día configurado por el usuario, o el día 1 por defecto
          const dayOfMonth = itemData.monthDay || 1
          const dueDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, dayOfMonth)

          // Solo crear si la fecha no ha pasado o es hoy
          if (!isBefore(dueDate, startOfDay(now))) {
            instances.push({
              userId: this.userId,
              recurringItemId: itemId,
              itemName: itemData.name,
              amount: itemData.amount || 0,
              category: itemData.category,
              recurrenceType: 'monthly',
              dueDate: dueDate,
              status: 'pending',
              periodStart: monthStart,
              periodEnd: monthEnd,
              createdAt: now
            })
          }
        }
      } else if (itemData.recurrenceType === 'custom_calendar' && itemData.customDays) {
        // Generar instancias para cada día configurado en este mes
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        const daysInMonth = monthEnd.getDate()

        for (const day of itemData.customDays) {
          if (day <= daysInMonth) {
            const dueDate = new Date(now.getFullYear(), now.getMonth(), day)
            
            // Solo crear si la fecha no ha pasado o es hoy
            if (!isBefore(dueDate, startOfDay(now))) {
              instances.push({
                userId: this.userId,
                recurringItemId: itemId,
                itemName: itemData.name,
                amount: itemData.amount || 0,
                category: itemData.category,
                recurrenceType: 'custom_calendar',
                dueDate: dueDate,
                status: 'pending',
                periodStart: monthStart,
                periodEnd: monthEnd,
                createdAt: now
              })
            }
          }
        }
      }

      // Guardar instancias en Firestore
      for (const instance of instances) {
        // Verificar que no exista ya una instancia para este periodo
        const existingQuery = query(
          collection(db, `apps/controlgastos/users/${this.userId}/recurring_items_instances`),
          where('recurringItemId', '==', itemId),
          where('periodStart', '==', Timestamp.fromDate(instance.periodStart))
        )

        const existingSnapshot = await getDocs(existingQuery)
        
        if (existingSnapshot.empty) {
          await addDoc(
            collection(db, `apps/controlgastos/users/${this.userId}/recurring_items_instances`),
            {
              ...instance,
              dueDate: Timestamp.fromDate(instance.dueDate),
              periodStart: Timestamp.fromDate(instance.periodStart),
              periodEnd: Timestamp.fromDate(instance.periodEnd),
              createdAt: serverTimestamp()
            }
          )
        }
      }

      console.log(`✅ ${instances.length} instancia(s) generada(s) para item ${itemId}`)
    } catch (error) {
      console.error('Error generando instancias:', error)
      throw error
    }
  }

  async checkAndGenerateNewPeriods(): Promise<void> {
    try {
      const items = await this.getAllRecurringItems()
      const activeItems = items.filter(item => item.isActive && item.recurrenceType !== 'daily')

      for (const item of activeItems) {
        await this.generateInstancesForItem(item.id, item)
      }

      // Actualizar estado de instancias vencidas
      await this.updateOverdueInstances()

      console.log('✅ Verificación de nuevos periodos completada')
    } catch (error) {
      console.error('Error verificando nuevos periodos:', error)
    }
  }

  async updateOverdueInstances(): Promise<void> {
    try {
      const now = new Date()
      const q = query(
        collection(db, `apps/controlgastos/users/${this.userId}/recurring_items_instances`),
        where('status', '==', 'pending')
      )

      const querySnapshot = await getDocs(q)
      
      for (const docSnap of querySnapshot.docs) {
        const instance = docSnap.data()
        const dueDate = instance.dueDate?.toDate()
        
        if (dueDate && isBefore(endOfDay(dueDate), now)) {
          await updateDoc(docSnap.ref, {
            status: 'overdue'
          })
        }
      }
    } catch (error) {
      console.error('Error actualizando instancias vencidas:', error)
    }
  }

  async getActiveInstances(): Promise<RecurringItemInstance[]> {
    try {
      const q = query(
        collection(db, `apps/controlgastos/users/${this.userId}/recurring_items_instances`),
        where('status', 'in', ['pending', 'overdue']),
        orderBy('dueDate', 'asc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date(),
        periodStart: doc.data().periodStart?.toDate() || new Date(),
        periodEnd: doc.data().periodEnd?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        paidAt: doc.data().paidAt?.toDate()
      })) as RecurringItemInstance[]
    } catch (error) {
      console.error('Error obteniendo instancias activas:', error)
      return []
    }
  }

  async markInstanceAsPaid(instanceId: string, receiptImageId?: string, notes?: string): Promise<string> {
    try {
      // Obtener la instancia
      const instanceRef = doc(db, `apps/controlgastos/users/${this.userId}/recurring_items_instances`, instanceId)
      const instanceDoc = await getDocs(
        query(
          collection(db, `apps/controlgastos/users/${this.userId}/recurring_items_instances`),
          where('__name__', '==', instanceId)
        )
      )

      if (instanceDoc.empty) {
        throw new Error('Instancia no encontrada')
      }

      const instanceData = instanceDoc.docs[0].data() as RecurringItemInstance

      // Crear registro de pago
      const paymentData = {
        userId: this.userId,
        expenseId: instanceData.recurringItemId,
        expenseName: instanceData.itemName,
        amount: instanceData.amount,
        currency: 'ARS',
        paidAt: serverTimestamp(),
        ...(receiptImageId && { receiptImageId }),
        ...(notes && { notes })
      }

      const paymentRef = await addDoc(
        collection(db, `apps/controlgastos/users/${this.userId}/payments`),
        {
          ...paymentData,
          createdAt: serverTimestamp()
        }
      )

      // Actualizar instancia
      await updateDoc(instanceRef, {
        status: 'paid',
        paidAt: serverTimestamp(),
        paymentId: paymentRef.id
      })

      console.log('✅ Instancia marcada como pagada:', instanceId)
      return paymentRef.id
    } catch (error) {
      console.error('Error marcando instancia como pagada:', error)
      throw error
    }
  }

  async payDailyItem(
    itemId: string,
    itemName: string,
    amount: number,
    category: ExpenseCategory,
    receiptImageId?: string,
    notes?: string
  ): Promise<string> {
    try {
      // Crear registro de pago directo
      const paymentData = {
        userId: this.userId,
        expenseId: itemId,
        expenseName: itemName,
        amount: amount,
        currency: 'ARS',
        paidAt: serverTimestamp(),
        ...(receiptImageId && { receiptImageId }),
        ...(notes && { notes })
      }

      const paymentRef = await addDoc(
        collection(db, `apps/controlgastos/users/${this.userId}/payments`),
        {
          ...paymentData,
          createdAt: serverTimestamp()
        }
      )

      console.log('✅ Item diario pagado:', itemId)
      return paymentRef.id
    } catch (error) {
      console.error('Error pagando item diario:', error)
      throw error
    }
  }

  // ========== ESTADÍSTICAS ==========

  async getRecurringItemsStats(): Promise<{
    totalActive: number
    dailyCount: number
    weeklyCount: number
    monthlyCount: number
    calendarCount: number
    pendingInstances: number
    overdueInstances: number
  }> {
    try {
      const items = await this.getAllRecurringItems()
      const activeItems = items.filter(item => item.isActive)
      const instances = await this.getActiveInstances()

      return {
        totalActive: activeItems.length,
        dailyCount: activeItems.filter(item => item.recurrenceType === 'daily').length,
        weeklyCount: activeItems.filter(item => item.recurrenceType === 'weekly').length,
        monthlyCount: activeItems.filter(item => item.recurrenceType === 'monthly').length,
        calendarCount: activeItems.filter(item => item.recurrenceType === 'custom_calendar').length,
        pendingInstances: instances.filter(inst => inst.status === 'pending').length,
        overdueInstances: instances.filter(inst => inst.status === 'overdue').length
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return {
        totalActive: 0,
        dailyCount: 0,
        weeklyCount: 0,
        monthlyCount: 0,
        calendarCount: 0,
        pendingInstances: 0,
        overdueInstances: 0
      }
    }
  }
}


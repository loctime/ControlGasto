// Tipos para el sistema de gastos y pagos

// Gasto fijo (alquiler, servicios, etc.)
export interface Expense {
  id: string
  userId: string
  name: string
  amount: number
  category: ExpenseCategory
  status: ExpenseStatus
  createdAt: Date
  updatedAt: Date
}

// Pago individual (historial de todos los pagos realizados)
export interface Payment {
  id: string
  userId: string
  expenseId: string // Referencia al gasto original
  expenseName: string // Nombre del gasto (para facilitar consultas)
  amount: number
  currency: string
  paidAt: Date // Fecha del pago
  receiptImageId?: string // ID del comprobante en ControlFile
  notes?: string // Notas adicionales
  createdAt: Date
  type?: PaymentType // Tipo de pago (opcional para compatibilidad)
}

export interface Invoice {
  id: string
  paymentId: string // Referencia al pago
  userId: string
  fileName: string
  fileSize: number
  mimeType: string
  // ControlFile
  fileId: string
  shareUrl: string
  shareToken: string
  // Metadatos
  uploadedAt: Date
  verified: boolean
  tags: string[]
}

export type ExpenseCategory = 
  | 'hogar'          // Hogar
  | 'transporte'     // Transporte
  | 'alimentacion'   // Alimentación
  | 'servicios'      // Servicios
  | 'entretenimiento' // Entretenimiento
  | 'salud'          // Salud
  | 'otros'          // Otros

export type ExpenseStatus = 
  | 'pending'        // Pendiente
  | 'paid'           // Pagado (último pago completado)

export type PaymentType = 
  | 'rent'           // Alquiler
  | 'utilities'      // Servicios
  | 'maintenance'    // Mantenimiento
  | 'insurance'      // Seguros
  | 'taxes'          // Impuestos
  | 'credit_card'    // Tarjeta de crédito
  | 'cash'           // Efectivo
  | 'transfer'       // Transferencia
  | 'other'          // Otros

// Pago con sus facturas asociadas
export interface PaymentWithInvoices extends Payment {
  invoices: Invoice[]
}

// Resumen de pagos por categoría
export interface PaymentSummary {
  category: ExpenseCategory
  totalAmount: number
  count: number
  month: string
  year: number
}

// Resumen mensual de pagos
export interface MonthlyPaymentSummary {
  month: string
  year: number
  totalAmount: number
  payments: PaymentSummary[]
}

// Estadísticas del dashboard
export interface DashboardStats {
  totalExpenses: number
  totalPaid: number
  totalPending: number
  paymentsThisMonth: number
  totalAmountThisMonth: number
}

// ========== SISTEMA DE ITEMS RECURRENTES ==========

// Tipos de recurrencia
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom_calendar'

// Item recurrente (plantilla)
export interface RecurringItem {
  id: string
  userId: string
  name: string
  amount?: number // Opcional para diarios, obligatorio para otros
  category: ExpenseCategory
  recurrenceType: RecurrenceType
  // Para calendario personalizado
  customDays?: number[] // Días del mes [1-31]
  // Configuración de semana
  weekDay?: number // 0=domingo, 1=lunes, etc.
  // Configuración de mes
  monthDay?: number // 1-31, día del mes para items mensuales
  // Estado
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Instancia de item recurrente (cada periodo)
export interface RecurringItemInstance {
  id: string
  userId: string
  recurringItemId: string // Referencia a la plantilla
  itemName: string
  amount: number
  category: ExpenseCategory
  recurrenceType: RecurrenceType
  dueDate: Date // Fecha de vencimiento
  status: 'pending' | 'paid' | 'overdue'
  paidAt?: Date
  paymentId?: string // Si fue pagado, referencia al Payment
  periodStart: Date // Inicio del periodo
  periodEnd: Date // Fin del periodo
  createdAt: Date
}

// Estadísticas de notificaciones
export interface NotificationStats {
  overdueCount: number
  dueTodayCount: number
  dueSoonCount: number // Próximos 3 días
  totalPending: number
}
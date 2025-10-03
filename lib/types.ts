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

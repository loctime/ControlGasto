// Tipos para el sistema de pagos y facturas

export interface Payment {
  id: string
  userId: string
  type: PaymentType
  amount: number
  currency: string
  date: string // ISO date string
  description: string
  status: PaymentStatus
  category: string
  month: string // YYYY-MM format
  year: number
  createdAt: Date
  updatedAt: Date
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

export type PaymentType = 
  | 'rent'           // Alquiler
  | 'utilities'      // Servicios
  | 'maintenance'    // Mantenimiento
  | 'insurance'      // Seguros
  | 'taxes'          // Impuestos
  | 'other'          // Otros

export type PaymentStatus = 
  | 'pending'        // Pendiente
  | 'paid'           // Pagado
  | 'overdue'        // Vencido
  | 'cancelled'      // Cancelado

export interface PaymentWithInvoices extends Payment {
  invoices: Invoice[]
}

export interface PaymentSummary {
  type: PaymentType
  totalAmount: number
  count: number
  month: string
  year: number
}

export interface MonthlyPaymentSummary {
  month: string
  year: number
  totalAmount: number
  payments: PaymentSummary[]
}

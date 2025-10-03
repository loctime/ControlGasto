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
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { Invoice } from './types'
import { controlFileService } from './controlfile'

export class InvoiceService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Subir factura para un pago
  async uploadInvoice(
    paymentId: string, 
    file: File, 
    folderName: string = "ControlGastos"
  ): Promise<Invoice> {
    try {
      console.log('📄 Subiendo factura para pago:', paymentId)

      // Subir archivo a ControlFile
      const uploadResult = await controlFileService.uploadFile(file, folderName)
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Error subiendo archivo')
      }

      // Crear documento de factura en Firestore
      const invoiceData = {
        paymentId,
        userId: this.userId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileId: uploadResult.fileId!,
        shareUrl: uploadResult.shareUrl || uploadResult.fileUrl!,
        shareToken: uploadResult.shareToken || '',
        uploadedAt: serverTimestamp(),
        verified: false,
        tags: this.generateTags(file.name, file.type)
      }

      const invoiceRef = await addDoc(collection(db, 'users', this.userId, 'invoices'), invoiceData)
      
      const invoice: Invoice = {
        id: invoiceRef.id,
        paymentId,
        userId: this.userId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileId: uploadResult.fileId!,
        shareUrl: uploadResult.shareUrl || uploadResult.fileUrl!,
        shareToken: uploadResult.shareToken || '',
        uploadedAt: new Date(),
        verified: false,
        tags: this.generateTags(file.name, file.type)
      }

      console.log('✅ Factura subida:', invoice.id)
      return invoice
    } catch (error) {
      console.error('Error subiendo factura:', error)
      throw error
    }
  }

  // Obtener facturas de un pago
  async getInvoicesByPayment(paymentId: string): Promise<Invoice[]> {
    try {
      const q = query(
        collection(db, 'users', this.userId, 'invoices'),
        where('paymentId', '==', paymentId),
        orderBy('uploadedAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date()
      })) as Invoice[]
    } catch (error) {
      console.error('Error obteniendo facturas del pago:', error)
      throw error
    }
  }

  // Obtener todas las facturas del usuario
  async getAllInvoices(): Promise<Invoice[]> {
    try {
      const q = query(
        collection(db, 'users', this.userId, 'invoices'),
        orderBy('uploadedAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date()
      })) as Invoice[]
    } catch (error) {
      console.error('Error obteniendo todas las facturas:', error)
      throw error
    }
  }

  // Obtener facturas por tipo de archivo
  async getInvoicesByType(mimeType: string): Promise<Invoice[]> {
    try {
      const q = query(
        collection(db, 'users', this.userId, 'invoices'),
        where('mimeType', '==', mimeType),
        orderBy('uploadedAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date()
      })) as Invoice[]
    } catch (error) {
      console.error('Error obteniendo facturas por tipo:', error)
      throw error
    }
  }

  // Obtener facturas por tags
  async getInvoicesByTag(tag: string): Promise<Invoice[]> {
    try {
      const q = query(
        collection(db, 'users', this.userId, 'invoices'),
        where('tags', 'array-contains', tag),
        orderBy('uploadedAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date()
      })) as Invoice[]
    } catch (error) {
      console.error('Error obteniendo facturas por tag:', error)
      throw error
    }
  }

  // Marcar factura como verificada
  async verifyInvoice(invoiceId: string): Promise<void> {
    try {
      const invoiceRef = doc(db, 'users', this.userId, 'invoices', invoiceId)
      await updateDoc(invoiceRef, {
        verified: true
      })
      
      console.log('✅ Factura verificada:', invoiceId)
    } catch (error) {
      console.error('Error verificando factura:', error)
      throw error
    }
  }

  // Eliminar factura
  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      const invoiceRef = doc(db, 'users', this.userId, 'invoices', invoiceId)
      await deleteDoc(invoiceRef)
      
      console.log('✅ Factura eliminada:', invoiceId)
    } catch (error) {
      console.error('Error eliminando factura:', error)
      throw error
    }
  }

  // Regenerar enlace de compartir
  async regenerateShareLink(invoiceId: string): Promise<string> {
    try {
      // Obtener factura
      const invoice = await this.getInvoiceById(invoiceId)
      if (!invoice) {
        throw new Error('Factura no encontrada')
      }

      // Crear nuevo enlace de compartir
      const shareResult = await controlFileService.createPermanentShare(invoice.fileId)
      
      if (!shareResult.success) {
        throw new Error(shareResult.error || 'Error creando enlace de compartir')
      }

      // Actualizar factura con nuevo enlace
      const invoiceRef = doc(db, 'users', this.userId, 'invoices', invoiceId)
      await updateDoc(invoiceRef, {
        shareUrl: shareResult.shareUrl,
        shareToken: shareResult.shareToken
      })

      console.log('✅ Enlace de compartir regenerado:', invoiceId)
      return shareResult.shareUrl!
    } catch (error) {
      console.error('Error regenerando enlace de compartir:', error)
      throw error
    }
  }

  // Obtener factura por ID
  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      const invoiceRef = doc(db, 'users', this.userId, 'invoices', invoiceId)
      const invoiceDoc = await getDocs(query(collection(db, 'users', this.userId, 'invoices'), where('__name__', '==', invoiceId)))
      
      if (invoiceDoc.empty) {
        return null
      }

      const docData = invoiceDoc.docs[0].data()
      return {
        id: invoiceDoc.docs[0].id,
        ...docData,
        uploadedAt: docData.uploadedAt?.toDate() || new Date()
      } as Invoice
    } catch (error) {
      console.error('Error obteniendo factura por ID:', error)
      throw error
    }
  }

  // Generar tags automáticamente
  private generateTags(fileName: string, mimeType: string): string[] {
    const tags: string[] = []
    
    // Tags por tipo de archivo
    if (mimeType.startsWith('image/')) {
      tags.push('image')
    } else if (mimeType === 'application/pdf') {
      tags.push('pdf')
    } else if (mimeType.includes('document')) {
      tags.push('document')
    }

    // Tags por nombre de archivo
    const name = fileName.toLowerCase()
    if (name.includes('alquiler') || name.includes('rent')) {
      tags.push('rent')
    }
    if (name.includes('servicio') || name.includes('utility')) {
      tags.push('utilities')
    }
    if (name.includes('mantenimiento') || name.includes('maintenance')) {
      tags.push('maintenance')
    }

    // Tags por fecha
    const currentDate = new Date()
    tags.push(`year-${currentDate.getFullYear()}`)
    tags.push(`month-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)

    return tags
  }

  // Obtener estadísticas de facturas
  async getInvoiceStats(): Promise<{
    totalInvoices: number
    totalSize: number
    byType: Record<string, number>
    verifiedCount: number
  }> {
    try {
      const invoices = await this.getAllInvoices()
      
      const stats = {
        totalInvoices: invoices.length,
        totalSize: invoices.reduce((sum, invoice) => sum + invoice.fileSize, 0),
        byType: {} as Record<string, number>,
        verifiedCount: invoices.filter(invoice => invoice.verified).length
      }

      // Agrupar por tipo MIME
      invoices.forEach(invoice => {
        const type = invoice.mimeType.split('/')[0]
        if (!stats.byType[type]) {
          stats.byType[type] = 0
        }
        stats.byType[type]++
      })

      return stats
    } catch (error) {
      console.error('Error obteniendo estadísticas de facturas:', error)
      throw error
    }
  }
}

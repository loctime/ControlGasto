import { controlFileService } from './controlfile'

export interface InvoiceRecord {
  id: string
  fileId: string
  shareUrl?: string
  shareToken?: string
  fileName?: string
  fileSize?: number
  createdAt?: Date
  updatedAt?: Date
}

export class InvoiceManager {
  constructor() {}

  // Crear/regenerar enlace de compartir
  async ensureValidShareUrl(fileId: string, expiresInHours: number = 87600): Promise<{ shareUrl: string; shareToken: string }> {
    try {
      console.log(`🔄 Creando/regenerando enlace de compartir para archivo: ${fileId}`)
      
      const result = await controlFileService.createPermanentShare(fileId, expiresInHours)
      
      if (!result.success || !result.shareUrl || !result.shareToken) {
        throw new Error(result.error || 'Error creando enlace de compartir')
      }
      
      return {
        shareUrl: result.shareUrl,
        shareToken: result.shareToken
      }
    } catch (error) {
      console.error('Error creando enlace de compartir:', error)
      throw error
    }
  }

  // Obtener URL válida (crear si no existe)
  async getInvoiceUrl(invoiceRecord: InvoiceRecord): Promise<string> {
    try {
      // Si ya tiene un enlace, intentar usarlo primero
      if (invoiceRecord.shareUrl) {
        try {
          const testResponse = await fetch(invoiceRecord.shareUrl, { 
            method: 'HEAD',
            // No incluir credenciales para enlaces públicos
            credentials: 'omit'
          })
          
          if (testResponse.ok) {
            console.log('✅ URL de compartir sigue válida:', invoiceRecord.shareUrl)
            return invoiceRecord.shareUrl // URL sigue válida
          }
        } catch (error) {
          console.log('⚠️ URL expiró o no es válida, regenerando...', error)
        }
      }

      // Crear nuevo enlace
      console.log('🔗 Creando nuevo enlace de compartir para archivo:', invoiceRecord.fileId)
      const { shareUrl, shareToken } = await this.ensureValidShareUrl(invoiceRecord.fileId)

      // Actualizar en base de datos (esto debería hacerse en el componente que llama)
      console.log('✅ Nuevo enlace creado:', shareUrl)
      
      return shareUrl
    } catch (error) {
      console.error('Error obteniendo URL de la factura:', error)
      throw error
    }
  }

  // Verificar si una URL de compartir es válida
  async isShareUrlValid(shareUrl: string): Promise<boolean> {
    try {
      const response = await fetch(shareUrl, { 
        method: 'HEAD',
        credentials: 'omit'
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  // Regenerar enlace para un registro específico
  async regenerateShareUrl(invoiceRecord: InvoiceRecord): Promise<{ shareUrl: string; shareToken: string }> {
    console.log(`🔄 Regenerando enlace para factura: ${invoiceRecord.id}`)
    return await this.ensureValidShareUrl(invoiceRecord.fileId)
  }

  // Regenerar enlaces para múltiples facturas
  async regenerateMultipleShareUrls(invoices: InvoiceRecord[]): Promise<Array<{ invoice: InvoiceRecord; shareUrl: string; shareToken: string; success: boolean; error?: string }>> {
    const results = []
    
    for (const invoice of invoices) {
      try {
        const { shareUrl, shareToken } = await this.ensureValidShareUrl(invoice.fileId)
        results.push({
          invoice,
          shareUrl,
          shareToken,
          success: true
        })
        console.log(`✅ Regenerado enlace para factura ${invoice.id}`)
      } catch (error: any) {
        results.push({
          invoice,
          shareUrl: '',
          shareToken: '',
          success: false,
          error: error.message
        })
        console.error(`❌ Error regenerando factura ${invoice.id}:`, error)
      }
    }
    
    return results
  }

  // Función de utilidad para formatear tamaño de archivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Función de utilidad para obtener información del archivo desde la URL
  getFileInfoFromUrl(shareUrl: string): { fileName?: string; fileSize?: string } {
    try {
      // Extraer información del nombre del archivo de la URL si es posible
      const url = new URL(shareUrl)
      const pathParts = url.pathname.split('/')
      const fileName = pathParts[pathParts.length - 1]
      
      return {
        fileName: fileName || undefined,
        fileSize: undefined // El tamaño no está en la URL
      }
    } catch (error) {
      return {}
    }
  }
}

// Instancia singleton
export const invoiceManager = new InvoiceManager()

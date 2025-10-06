import { auth } from './firebase'; // Usar el mismo auth que la app principal

// Configuración de ControlFile
const CONTROLFILE_CONFIG = {
  backendUrl: process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL || "https://controlfile.onrender.com",
  appDisplayName: process.env.NEXT_PUBLIC_CONTROLFILE_APP_DISPLAY_NAME || "ControlFile",
  appCode: process.env.NEXT_PUBLIC_CONTROLFILE_APP_CODE || "controlfile"
}

export class ControlFileService {
  private auth: any
  private backendUrl: string

  constructor() {
    // Usar el mismo auth que la app principal
    this.auth = auth
    this.backendUrl = CONTROLFILE_CONFIG.backendUrl
    
    console.log('✅ ControlFile: Usando Firebase Auth compartido con la app principal')
  }

  // Obtener instancia de auth para listeners externos
  public getAuth() {
    return this.auth
  }

  // Obtener URL de ControlFile
  getControlFileUrl(): string {
    return `https://files.controldoc.app/`
  }

  // Crear carpeta principal "Gastos" en el taskbar
  async createMainFolder(): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
      }

      const token = await user.getIdToken()

      // Usar /api/folders/root para crear/obtener carpeta principal "Gastos"
      const response = await fetch(`${this.backendUrl}/api/folders/root?name=${encodeURIComponent('Gastos')}&pin=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ ControlFile: Carpeta principal "Gastos" creada/obtenida:', result.folderId)
      return { success: true, folderId: result.folderId }
    } catch (error: any) {
      console.error('❌ ControlFile: Error creando carpeta principal:', error)
      return { 
        success: false, 
        error: error.message || 'Error creando carpeta principal' 
      }
    }
  }

  // Crear carpeta específica solo cuando sea necesaria
  async ensureFolderExists(folderPath: string[]): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
      }

      console.log('📁 ControlFile: Asegurando que existe la carpeta:', folderPath.join(' > '))

      // 1. Crear/obtener carpeta principal "Gastos"
      const mainFolder = await this.createMainFolder()
      if (!mainFolder.success || !mainFolder.folderId) {
        return { success: false, error: mainFolder.error }
      }

      let currentFolderId = mainFolder.folderId

      // 2. Navegar/crear cada nivel de la ruta
      for (const folderName of folderPath) {
        // Verificar si la carpeta ya existe
        const existingFiles = await this.listFiles(currentFolderId)
        if (existingFiles.success && existingFiles.files) {
          const existingFolder = existingFiles.files.find(file => 
            file.type === 'folder' && file.name === folderName
          )
          
          if (existingFolder) {
            currentFolderId = existingFolder.id
            console.log(`📁 ControlFile: Carpeta "${folderName}" ya existe`)
            continue
          }
        }

        // Crear la carpeta si no existe
        const newFolder = await this.createSubFolder(folderName, currentFolderId)
        if (!newFolder.success || !newFolder.folderId) {
          return { success: false, error: `Error creando carpeta "${folderName}": ${newFolder.error}` }
        }
        
        currentFolderId = newFolder.folderId
        console.log(`📁 ControlFile: Carpeta "${folderName}" creada`)
      }

      return { success: true, folderId: currentFolderId }
    } catch (error: any) {
      console.error('❌ ControlFile: Error asegurando carpeta:', error)
      return { 
        success: false, 
        error: error.message || 'Error asegurando carpeta' 
      }
    }
  }

  // Obtener carpeta del mes actual (crear si no existe)
  async getCurrentMonthFolder(): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() // 0-11
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]

      const monthName = monthNames[month]
      const folderPath = [`${year}`, monthName]
      
      return await this.ensureFolderExists(folderPath)
    } catch (error: any) {
      console.error('❌ ControlFile: Error obteniendo carpeta del mes actual:', error)
      return { 
        success: false, 
        error: error.message || 'Error obteniendo carpeta del mes actual' 
      }
    }
  }

  // Obtener carpeta por tipo en el año actual (crear si no existe)
  async getTypeFolder(type: 'Comprobantes' | 'Facturas' | 'Recibos' | 'Otros'): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const year = new Date().getFullYear()
      const folderPath = [`${year}`, type]
      
      return await this.ensureFolderExists(folderPath)
    } catch (error: any) {
      console.error('❌ ControlFile: Error obteniendo carpeta por tipo:', error)
      return { 
        success: false, 
        error: error.message || 'Error obteniendo carpeta por tipo' 
      }
    }
  }

  // Crear subcarpeta dentro de la carpeta principal
  async createSubFolder(folderName: string, parentId: string): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
      }

      const token = await user.getIdToken()

      const response = await fetch(`${this.backendUrl}/api/folders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: folderName,
          parentId: parentId,
          icon: "Folder",
          color: "text-purple-600",
          source: "controlgastos"
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      return { success: true, folderId: result.folderId }
    } catch (error: any) {
      console.error('❌ ControlFile: Error creando subcarpeta:', error)
      return { 
        success: false, 
        error: error.message || 'Error creando subcarpeta' 
      }
    }
  }

  // Subir archivo usando el nuevo flujo de uploads (automáticamente al mes actual)
  async uploadFile(file: File, type?: 'Comprobantes' | 'Facturas' | 'Recibos' | 'Otros'): Promise<{ success: boolean; fileId?: string; fileUrl?: string; shareUrl?: string; shareToken?: string; fileName?: string; fileSize?: number; error?: string }> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
      }

      console.log(`📤 ControlFile: Subiendo archivo ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

      // Determinar carpeta de destino
      let targetFolderId: string | null = null

      if (type) {
        // Subir a carpeta por tipo en el año actual
        const typeFolder = await this.getTypeFolder(type)
        if (typeFolder.success && typeFolder.folderId) {
          targetFolderId = typeFolder.folderId
          console.log(`📁 ControlFile: Subiendo a carpeta por tipo: ${type}`)
        }
      } else {
        // Subir a carpeta del mes actual
        const monthFolder = await this.getCurrentMonthFolder()
        if (monthFolder.success && monthFolder.folderId) {
          targetFolderId = monthFolder.folderId
          console.log('📁 ControlFile: Subiendo a carpeta del mes actual')
        }
      }

      // Si no se pudo obtener carpeta específica, usar carpeta principal
      if (!targetFolderId) {
        const mainFolder = await this.createMainFolder()
        if (mainFolder.success && mainFolder.folderId) {
          targetFolderId = mainFolder.folderId
          console.log('📁 ControlFile: Subiendo a carpeta principal "Gastos"')
        }
      }

      const token = await user.getIdToken()

      // Paso 1: Obtener URL de presign
      const presignResponse = await fetch(`${this.backendUrl}/api/uploads/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          mime: file.type,
          parentId: targetFolderId
        })
      })

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Error presign HTTP: ${presignResponse.status}`)
      }

      const presignData = await presignResponse.json()

      // Paso 2: Subir archivo al URL presignado
      const uploadResponse = await fetch(presignData.url, {
        method: 'PUT',
        body: file
      })

      if (!uploadResponse.ok) {
        throw new Error(`Error subiendo archivo: ${uploadResponse.status}`)
      }

      const etag = uploadResponse.headers.get('etag')

      // Paso 3: Confirmar upload
      const confirmResponse = await fetch(`${this.backendUrl}/api/uploads/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          uploadSessionId: presignData.uploadSessionId,
          etag: etag
        })
      })

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Error confirmando upload: ${confirmResponse.status}`)
      }

      const confirmData = await confirmResponse.json()

      // Paso 4: Obtener URL del archivo
      const fileUrlResponse = await fetch(`${this.backendUrl}/api/files/presign-get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileId: confirmData.fileId
        })
      })

      let fileUrl = ''
      if (fileUrlResponse.ok) {
        const fileUrlData = await fileUrlResponse.json()
        fileUrl = fileUrlData.downloadUrl
      }

      console.log(`✅ ControlFile: Archivo subido exitosamente - ID: ${confirmData.fileId}`)
      
      return {
        success: true,
        fileId: confirmData.fileId,
        fileUrl: fileUrl,
        fileName: file.name,
        fileSize: file.size
      }
    } catch (error: any) {
      console.error('❌ ControlFile: Error subiendo archivo:', error)
      return { 
        success: false, 
        error: error.message || 'Error subiendo archivo' 
      }
    }
  }

  // Obtener URL de un archivo
  async getFileUrl(fileId: string): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
      }

      const token = await user.getIdToken()

      const response = await fetch(`${this.backendUrl}/api/files/presign-get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileId: fileId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      return { success: true, fileUrl: result.downloadUrl }
    } catch (error: any) {
      console.error('❌ ControlFile: Error obteniendo URL del archivo:', error)
      return { 
        success: false, 
        error: error.message || 'Error obteniendo URL del archivo' 
      }
    }
  }

  // Crear enlace permanente para compartir
  async createPermanentShare(fileId: string, expiresInHours?: number): Promise<{ success: boolean; shareUrl?: string; shareToken?: string; error?: string }> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
      }

      const token = await user.getIdToken()

      const response = await fetch(`${this.backendUrl}/api/shares/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileId: fileId,
          expiresIn: expiresInHours || 8760 // 1 año por defecto
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      return { 
        success: true, 
        shareUrl: result.shareUrl,
        shareToken: result.shareToken
      }
    } catch (error: any) {
      console.error('❌ ControlFile: Error creando enlace permanente:', error)
      return { 
        success: false, 
        error: error.message || 'Error creando enlace permanente' 
      }
    }
  }

  // Listar archivos en una carpeta
  async listFiles(parentId?: string, pageSize: number = 20): Promise<{ success: boolean; files?: any[]; nextPage?: string; error?: string }> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
      }

      const token = await user.getIdToken()
      const params = new URLSearchParams({
        parentId: parentId || 'null',
        pageSize: pageSize.toString()
      })

      const response = await fetch(`${this.backendUrl}/api/files/list?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      return { 
        success: true, 
        files: result.items,
        nextPage: result.nextPage
      }
    } catch (error: any) {
      console.error('❌ ControlFile: Error listando archivos:', error)
      return { 
        success: false, 
        error: error.message || 'Error listando archivos' 
      }
    }
  }

  // Health check
  async healthCheck(): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const response = await fetch(`${this.backendUrl}/api/health`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }

      const result = await response.json()
      return { 
        success: true, 
        status: result.status
      }
    } catch (error: any) {
      console.error('❌ ControlFile: Error en health check:', error)
      return { 
        success: false, 
        error: error.message || 'Error en health check' 
      }
    }
  }
}

// Instancia singleton
export const controlFileService = new ControlFileService()

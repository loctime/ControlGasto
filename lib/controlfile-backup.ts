import { auth } from './firebase' // Usar el mismo auth que la app principal

// Configuración de ControlFile
const CONTROLFILE_CONFIG = {
  backendUrl: process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL || "https://controlfile.onrender.com",
  appDisplayName: process.env.NEXT_PUBLIC_CONTROLFILE_APP_DISPLAY_NAME || "ControlFile",
  appCode: process.env.NEXT_PUBLIC_CONTROLFILE_APP_CODE || "controlgastos"
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

  // Subir archivo a ControlFile
  async uploadFile(file: File, folderName?: string): Promise<{ success: boolean; fileId?: string; fileUrl?: string; shareUrl?: string; shareToken?: string; fileName?: string; fileSize?: number; error?: string }> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
      }

      const token = await user.getIdToken()
      const folderToUse = folderName || 'ControlGastos'

      // Crear carpeta si no existe
      const folderResult = await this.createFolder(folderToUse)
      if (folderResult.success) {
        console.log('✅ ControlFile: Carpeta creada/verificada:', folderToUse)
      }

      // Preparar datos del archivo
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folderName', folderToUse)
      formData.append('userId', user.uid)
      formData.append('userEmail', user.email || '')

      // Subir archivo
      const response = await fetch(`${this.backendUrl}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        fileId: result.fileId,
        fileUrl: result.fileUrl,
        shareUrl: result.shareUrl,
        shareToken: result.shareToken,
        fileName: result.fileName,
        fileSize: result.fileSize
      }
    } catch (error: any) {
      console.error('❌ ControlFile: Error subiendo archivo:', error)
      return { 
        success: false, 
        error: error.message || 'Error subiendo archivo' 
      }
    }
  }

  // Crear carpeta en ControlFile
  async createFolder(folderName?: string): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
      }

      const token = await user.getIdToken()
      const folderToUse = folderName || 'ControlGastos'

      const response = await fetch(`${this.backendUrl}/api/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: folderToUse,
          userId: user.uid,
          userEmail: user.email || ''
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Si la carpeta ya existe, no es un error
        if (response.status === 409) {
          return { success: true, folderId: 'existing' }
        }
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      return { success: true, folderId: result.folderId }
    } catch (error: any) {
      console.error('❌ ControlFile: Error creando carpeta:', error)
      return { 
        success: false, 
        error: error.message || 'Error creando carpeta' 
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

      const response = await fetch(`${this.backendUrl}/api/files/${fileId}/url`, {
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
      return { success: true, fileUrl: result.fileUrl }
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

      const response = await fetch(`${this.backendUrl}/api/shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileId,
          userId: user.uid,
          expiresInHours: expiresInHours || 8760, // 1 año por defecto
          isPublic: false
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
}

// Instancia singleton
export const controlFileService = new ControlFileService()
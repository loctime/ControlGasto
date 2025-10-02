import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, setPersistence, browserLocalPersistence } from 'firebase/auth'

// Configuración de ControlFile
const CONTROLFILE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_CONTROLFILE_API_KEY || "A",
  authDomain: process.env.NEXT_PUBLIC_CONTROLFILE_AUTH_DOMAIN || "c",
  projectId: process.env.NEXT_PUBLIC_CONTROLFILE_PROJECT_ID || "con",
  appId: process.env.NEXT_PUBLIC_CONTROLFILE_APP_ID || "",
  backendUrl: process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL || "https://controlfile.onrender.com",
  appDisplayName: process.env.NEXT_PUBLIC_CONTROLFILE_APP_DISPLAY_NAME || "ControlFile"
}

// Inicializar Firebase para ControlFile
let controlFileApp: any = null
let controlFileAuth: any = null

const initializeControlFile = () => {
  if (!controlFileApp) {
    controlFileApp = initializeApp(CONTROLFILE_CONFIG, 'controlfile')
    controlFileAuth = getAuth(controlFileApp)
    
    // Configurar persistencia local
    setPersistence(controlFileAuth, browserLocalPersistence)
  }
  return { controlFileApp, controlFileAuth }
}

export class ControlFileService {
  private auth: any
  private backendUrl: string

  constructor() {
    const { controlFileAuth } = initializeControlFile()
    this.auth = controlFileAuth
    this.backendUrl = CONTROLFILE_CONFIG.backendUrl
  }

  // Verificar si hay una sesión activa
  async isConnected(): Promise<boolean> {
    try {
      const user = this.auth.currentUser
      return !!user
    } catch (error) {
      console.error('Error verificando conexión:', error)
      return false
    }
  }

  // Obtener usuario actual
  async getCurrentUser() {
    return this.auth.currentUser
  }

  // Conectar con ControlFile usando Google Auth
  async connect(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const provider = new GoogleAuthProvider()
      
      // Configurar parámetros adicionales
      provider.addScope('email')
      provider.addScope('profile')
      
      const result = await signInWithPopup(this.auth, provider)
      const user = result.user
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }
      }
    } catch (error: any) {
      console.error('Error conectando con ControlFile:', error)
      
      // Si el popup es bloqueado, intentar con redirect
      if (error.code === 'auth/popup-blocked') {
        return {
          success: false,
          error: 'Popup bloqueado. Por favor, permite popups para este sitio e intenta de nuevo.'
        }
      }
      
      return {
        success: false,
        error: error.message || 'Error desconocido al conectar'
      }
    }
  }

  // Desconectar de ControlFile
  async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      await firebaseSignOut(this.auth)
      return { success: true }
    } catch (error: any) {
      console.error('Error desconectando de ControlFile:', error)
      return {
        success: false,
        error: error.message || 'Error al desconectar'
      }
    }
  }

  // Obtener token de autenticación
  async getAuthToken(): Promise<string | null> {
    try {
      const user = this.auth.currentUser
      if (!user) return null
      
      const token = await user.getIdToken()
      return token
    } catch (error) {
      console.error('Error obteniendo token:', error)
      return null
    }
  }

  // Subir archivo a ControlFile
  async uploadFile(file: File, folderName?: string): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      const token = await this.getAuthToken()
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa con ControlFile'
        }
      }

      // Crear carpeta si no existe
      let folderId = null
      if (folderName) {
        const folderResult = await this.createFolder(folderName)
        if (folderResult.success) {
          folderId = folderResult.folderId
        }
      }

      // Preparar FormData
      const formData = new FormData()
      formData.append('file', file)
      if (folderId) {
        formData.append('folderId', folderId)
      }

      // Subir archivo
      const response = await fetch(`${this.backendUrl}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.message || 'Error subiendo archivo'
        }
      }

      const result = await response.json()
      return {
        success: true,
        fileId: result.fileId
      }
    } catch (error: any) {
      console.error('Error subiendo archivo:', error)
      return {
        success: false,
        error: error.message || 'Error desconocido al subir archivo'
      }
    }
  }

  // Crear carpeta en ControlFile
  async createFolder(folderName: string): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const token = await this.getAuthToken()
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa con ControlFile'
        }
      }

      const response = await fetch(`${this.backendUrl}/api/folders/root?name=${encodeURIComponent(folderName)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.message || 'Error creando carpeta'
        }
      }

      const result = await response.json()
      return {
        success: true,
        folderId: result.folderId
      }
    } catch (error: any) {
      console.error('Error creando carpeta:', error)
      return {
        success: false,
        error: error.message || 'Error desconocido al crear carpeta'
      }
    }
  }

  // Obtener URL de ControlFile con autenticación automática
  getControlFileUrl(): string {
    return `https://files.controldoc.app/`
  }

  // Obtener URL directa de un archivo
  async getFileUrl(fileId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const token = await this.getAuthToken()
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa con ControlFile'
        }
      }

      const response = await fetch(`${this.backendUrl}/api/files/${fileId}/url`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.message || 'Error obteniendo URL del archivo'
        }
      }

      const result = await response.json()
      return {
        success: true,
        url: result.url
      }
    } catch (error: any) {
      console.error('Error obteniendo URL del archivo:', error)
      return {
        success: false,
        error: error.message || 'Error desconocido al obtener URL del archivo'
      }
    }
  }
}

// Instancia singleton
export const controlFileService = new ControlFileService()

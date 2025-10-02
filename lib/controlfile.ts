import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, setPersistence, browserLocalPersistence, signInWithCredential, signInWithRedirect, getRedirectResult } from 'firebase/auth'

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

  // Verificar si hay un resultado de redirect pendiente
  async checkRedirectResult(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const result = await getRedirectResult(this.auth)
      if (result) {
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
      }
      return { success: false }
    } catch (error: any) {
      console.error('Error verificando redirect result:', error)
      return {
        success: false,
        error: error.message || 'Error verificando redirect'
      }
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

  // Conectar automáticamente usando las credenciales del usuario principal
  async connectWithMainUserCredentials(mainUser: any): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Verificar si ya hay una sesión activa en ControlFile
      const currentUser = this.auth.currentUser
      if (currentUser && currentUser.email === mainUser.email) {
        return {
          success: true,
          user: {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL
          }
        }
      }

      // Si no hay sesión activa, intentar conectar usando popup
      // pero de manera más silenciosa
      const provider = new GoogleAuthProvider()
      
      // Configurar parámetros adicionales
      provider.addScope('email')
      provider.addScope('profile')
      
      // Configurar para que use la misma cuenta si es posible
      provider.setCustomParameters({
        'login_hint': mainUser.email
      })
      
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
      console.error('Error conectando automáticamente con ControlFile:', error)
      
      // Si el popup es bloqueado, no mostrar error al usuario
      if (error.code === 'auth/popup-blocked') {
        return {
          success: false,
          error: 'POPUP_BLOCKED' // Código especial para manejar en el hook
        }
      }
      
      return {
        success: false,
        error: error.message || 'Error desconocido al conectar automáticamente'
      }
    }
  }

  // Conectar usando redirect (alternativa cuando popup es bloqueado)
  async connectWithRedirect(mainUser: any): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = new GoogleAuthProvider()
      
      // Configurar parámetros adicionales
      provider.addScope('email')
      provider.addScope('profile')
      
      // Configurar para que use la misma cuenta si es posible
      provider.setCustomParameters({
        'login_hint': mainUser.email
      })
      
      await signInWithRedirect(this.auth, provider)
      
      return { success: true }
    } catch (error: any) {
      console.error('Error conectando con redirect:', error)
      return {
        success: false,
        error: error.message || 'Error desconocido al conectar con redirect'
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
      
      // Manejar diferentes tipos de errores
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.'
        }
      }
      
      if (error.message?.includes('CORS') || error.message?.includes('Access-Control-Allow-Origin')) {
        return {
          success: false,
          error: 'Error de configuración del servidor. Contacta al administrador.'
        }
      }
      
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
      
      // Manejar diferentes tipos de errores
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.'
        }
      }
      
      if (error.message?.includes('CORS') || error.message?.includes('Access-Control-Allow-Origin')) {
        return {
          success: false,
          error: 'Error de configuración del servidor. Contacta al administrador.'
        }
      }
      
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

  // Verificar si la URL es de BlackBlaze B2
  private isBlackBlazeUrl(url: string): boolean {
    const blackBlazePatterns = [
      'backblazeb2.com',
      'b2.',
      'f000.backblazeb2.com',
      's3.us-west-004.backblazeb2.com',
      's3.eu-central-003.backblazeb2.com',
      's3.ap-southeast-002.backblazeb2.com',
      's3.us-west-000.backblazeb2.com'
    ]
    
    return blackBlazePatterns.some(pattern => url.includes(pattern))
  }

  // Obtener URL directa de un archivo desde BlackBlaze B2
  async getFileUrl(fileId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const token = await this.getAuthToken()
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa con ControlFile'
        }
      }

      // Lista de endpoints a probar para obtener URL directa de BlackBlaze
      const endpoints = [
        {
          url: `${this.backendUrl}/api/files/${fileId}/download-url`,
          description: 'download-url endpoint'
        },
        {
          url: `${this.backendUrl}/api/files/${fileId}/direct-url`,
          description: 'direct-url endpoint'
        },
        {
          url: `${this.backendUrl}/api/files/${fileId}/b2-url`,
          description: 'b2-url endpoint'
        },
        {
          url: `${this.backendUrl}/api/files/${fileId}/url`,
          description: 'url endpoint (fallback)'
        }
      ]

      console.log(`🔍 Intentando obtener URL directa de BlackBlaze para archivo: ${fileId}`)

      // Probar cada endpoint hasta encontrar una URL válida de BlackBlaze
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Probando endpoint: ${endpoint.description}`)
          
          const response = await fetch(endpoint.url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const result = await response.json()
            
            // Buscar URL en diferentes campos de respuesta
            const possibleUrls = [
              result.url,
              result.directUrl,
              result.downloadUrl,
              result.b2Url,
              result.blackBlazeUrl,
              result.fileUrl
            ].filter(Boolean)

            for (const url of possibleUrls) {
              if (this.isBlackBlazeUrl(url)) {
                console.log(`✅ URL directa de BlackBlaze encontrada: ${url}`)
                return {
                  success: true,
                  url: url
                }
              }
            }

            // Si encontramos una URL pero no es de BlackBlaze, la guardamos como fallback
            if (possibleUrls.length > 0) {
              console.log(`⚠️ URL encontrada pero no es de BlackBlaze: ${possibleUrls[0]}`)
            }
          } else {
            console.log(`❌ Endpoint ${endpoint.description} falló: ${response.status}`)
          }
        } catch (endpointError) {
          console.log(`❌ Error en endpoint ${endpoint.description}:`, endpointError)
          continue
        }
      }

      // Si ningún endpoint devolvió URL de BlackBlaze, devolver error
      console.log(`❌ No se pudo obtener URL directa de BlackBlaze B2 para archivo: ${fileId}`)
      return {
        success: false,
        error: 'No se pudo obtener URL directa de BlackBlaze B2. El archivo puede no estar disponible o el servicio no soporta URLs directas.'
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
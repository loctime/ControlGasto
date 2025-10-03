import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, setPersistence, browserLocalPersistence, signInWithCredential, signInWithRedirect, getRedirectResult } from 'firebase/auth'

// Configuración de ControlFile
const CONTROLFILE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_CONTROLFILE_API_KEY || "A",
  authDomain: process.env.NEXT_PUBLIC_CONTROLFILE_AUTH_DOMAIN || "c",
  projectId: process.env.NEXT_PUBLIC_CONTROLFILE_PROJECT_ID || "con",
  appId: process.env.NEXT_PUBLIC_CONTROLFILE_APP_ID || "",
  backendUrl: process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL || "https://controlfile.onrender.com",
  appDisplayName: process.env.NEXT_PUBLIC_CONTROLFILE_APP_DISPLAY_NAME || "ControlFile",
  appCode: process.env.NEXT_PUBLIC_CONTROLFILE_APP_CODE || "controlgastos"
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
  private readonly SESSION_KEY = 'controlfile-session'

  constructor() {
    const { controlFileAuth } = initializeControlFile()
    this.auth = controlFileAuth
    this.backendUrl = CONTROLFILE_CONFIG.backendUrl
    
    // Configurar listener para cambios de autenticación
    if (this.auth) {
      this.setupAuthStateListener()
    }
  }

  // Configurar listener para cambios de estado de autenticación
  private setupAuthStateListener() {
    this.auth.onAuthStateChanged((user: any) => {
      if (user) {
        // Guardar sesión cuando el usuario se autentica
        this.saveSession(user)
      } else {
        // Limpiar sesión cuando el usuario se desconecta
        this.clearSession()
      }
    })
  }

  // Guardar sesión en localStorage
  private saveSession(user: any) {
    if (typeof window !== 'undefined') {
      const sessionData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        timestamp: Date.now()
      }
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData))
    }
  }

  // Limpiar sesión de localStorage
  private clearSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSION_KEY)
    }
  }

  // Obtener sesión guardada
  private getSavedSession(): any {
    if (typeof window === 'undefined') return null
    
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY)
      if (!sessionData) return null
      
      const parsed = JSON.parse(sessionData)
      // Verificar que la sesión no sea muy antigua (30 días)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      if (parsed.timestamp < thirtyDaysAgo) {
        this.clearSession()
        return null
      }
      
      return parsed
    } catch (error) {
      console.error('Error leyendo sesión guardada:', error)
      this.clearSession()
      return null
    }
  }

  // Restaurar sesión desde localStorage
  async restoreSession(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const savedSession = this.getSavedSession()
      if (!savedSession) {
        return { success: false, error: 'No hay sesión guardada' }
      }

      // Verificar si ya hay un usuario autenticado
      const currentUser = this.auth.currentUser
      if (currentUser && currentUser.uid === savedSession.uid) {
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

      // Si no hay usuario autenticado pero hay sesión guardada, 
      // devolver la información de la sesión guardada para mostrar estado
      return { 
        success: true, 
        user: {
          uid: savedSession.uid,
          email: savedSession.email,
          displayName: savedSession.displayName,
          photoURL: savedSession.photoURL
        }
      }
    } catch (error: any) {
      console.error('Error restaurando sesión:', error)
      return {
        success: false,
        error: error.message || 'Error restaurando sesión'
      }
    }
  }

  // Verificar si hay una sesión activa
  async isConnected(): Promise<boolean> {
    try {
      // Primero verificar si hay un usuario autenticado en Firebase
      const user = this.auth.currentUser
      if (user) {
        return true
      }

      // Si no hay usuario autenticado, verificar si hay sesión guardada
      const savedSession = this.getSavedSession()
      return !!savedSession
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
    // Primero intentar obtener el usuario autenticado en Firebase
    const currentUser = this.auth.currentUser
    if (currentUser) {
      return currentUser
    }

    // Si no hay usuario autenticado, intentar restaurar desde sesión guardada
    const savedSession = this.getSavedSession()
    if (savedSession) {
      return {
        uid: savedSession.uid,
        email: savedSession.email,
        displayName: savedSession.displayName,
        photoURL: savedSession.photoURL
      }
    }

    return null
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
      
      // Manejar diferentes tipos de errores de manera silenciosa
      if (error.code === 'auth/popup-blocked') {
        return {
          success: false,
          error: 'POPUP_BLOCKED' // Código especial para manejar en el hook
        }
      }
      
      if (error.code === 'auth/cancelled-popup-request') {
        return {
          success: false,
          error: 'POPUP_CANCELLED' // Código especial para popup cancelado
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

  // Subir archivo a ControlFile usando el flujo correcto
  async uploadFile(file: File, folderName?: string): Promise<{ success: boolean; fileId?: string; fileUrl?: string; shareUrl?: string; shareToken?: string; fileName?: string; fileSize?: number; error?: string }> {
    try {
      const token = await this.getAuthToken()
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa con ControlFile'
        }
      }

      // Crear carpeta si no existe (usar appCode por defecto)
      let parentId = null
      const folderToUse = folderName || CONTROLFILE_CONFIG.appCode
      const folderResult = await this.createFolder(folderToUse)
      if (folderResult.success) {
        parentId = folderResult.folderId
      }

      console.log('🚀 Iniciando subida de archivo:', file.name)

      // Paso 1: Obtener URL presignada
      const presignResponse = await fetch(`${this.backendUrl}/api/uploads/presign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          mime: file.type,
          parentId: parentId
        })
      })

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json()
        console.error('Error obteniendo URL presignada:', errorData)
        return {
          success: false,
          error: errorData.message || 'Error obteniendo URL de subida'
        }
      }

      const { uploadSessionId, url } = await presignResponse.json()
      console.log('✅ URL presignada obtenida:', uploadSessionId)

      // Paso 2: Subir archivo usando proxy para evitar CORS con B2
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sessionId', uploadSessionId)

      const uploadResponse = await fetch(`${this.backendUrl}/api/uploads/proxy-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        console.error('Error subiendo archivo via proxy:', errorData)
        return {
          success: false,
          error: errorData.message || `Error subiendo archivo: ${uploadResponse.status} ${uploadResponse.statusText}`
        }
      }

      const uploadResult = await uploadResponse.json()
      console.log('✅ Archivo subido via proxy:', uploadResult)

      // Paso 3: Confirmar subida
      const etag = uploadResult.etag || uploadResponse.headers.get('etag')
      
      const confirmResponse = await fetch(`${this.backendUrl}/api/uploads/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uploadSessionId,
          etag: etag
        })
      })

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json()
        console.error('Error confirmando subida:', errorData)
        return {
          success: false,
          error: errorData.message || 'Error confirmando subida del archivo'
        }
      }

      const result = await confirmResponse.json()
      console.log('✅ Subida confirmada:', result)

      const fileId = result.fileId || result.id || uploadSessionId
      
      // Crear enlace de compartir permanente (recomendado)
      console.log('🔗 Creando enlace de compartir permanente para archivo:', fileId)
      const shareResult = await this.createPermanentShare(fileId, 87600) // 10 años
      
      if (shareResult.success) {
        console.log('✅ Enlace de compartir creado:', shareResult.shareUrl)
        return {
          success: true,
          fileId: fileId,
          shareUrl: shareResult.shareUrl,
          shareToken: shareResult.shareToken,
          // Mantener compatibilidad con código existente
          fileUrl: shareResult.shareUrl,
          fileName: file.name,
          fileSize: file.size
        }
      } else {
        console.warn('⚠️ No se pudo crear enlace de compartir, usando URL temporal:', shareResult.error)
        
        // Fallback a URL temporal si falla el enlace de compartir
        const urlResult = await this.getFileUrl(fileId)
        if (urlResult.success) {
          return {
            success: true,
            fileId: fileId,
            fileUrl: urlResult.url,
            fileName: urlResult.fileName,
            fileSize: urlResult.fileSize,
            shareUrl: undefined,
            shareToken: undefined
          }
        } else {
          return {
            success: true,
            fileId: fileId,
            fileUrl: undefined,
            fileName: file.name,
            fileSize: file.size,
            shareUrl: undefined,
            shareToken: undefined
          }
        }
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
  async createFolder(folderName?: string): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const token = await this.getAuthToken()
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa con ControlFile'
        }
      }

      // Usar appCode por defecto si no se especifica folderName
      const folderToCreate = folderName || CONTROLFILE_CONFIG.appCode

      const response = await fetch(`${this.backendUrl}/api/folders/root?name=${encodeURIComponent(folderToCreate)}`, {
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

  // Crear enlace de compartir permanente (recomendado)
  async createPermanentShare(fileId: string, expiresInHours: number = 87600): Promise<{ success: boolean; shareUrl?: string; shareToken?: string; error?: string }> {
    try {
      const token = await this.getAuthToken()
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa con ControlFile'
        }
      }

      console.log(`🔗 Creando enlace de compartir permanente para archivo: ${fileId}`)

      const response = await fetch(`${this.backendUrl}/api/shares/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId: fileId,
          expiresIn: expiresInHours // Por defecto 10 años
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error creando enlace de compartir:', errorData)
        return {
          success: false,
          error: errorData.message || `Error creando enlace de compartir: ${response.status}`
        }
      }

      const result = await response.json()
      console.log('✅ Enlace de compartir creado:', result.shareUrl)
      console.log('🔑 Share Token:', result.shareToken)

      return {
        success: true,
        shareUrl: result.shareUrl,
        shareToken: result.shareToken
      }
    } catch (error: any) {
      console.error('Error creando enlace de compartir:', error)
      return {
        success: false,
        error: error.message || 'Error desconocido al crear enlace de compartir'
      }
    }
  }

  // Obtener URL de descarga de un archivo usando el endpoint correcto (método legacy)
  async getFileUrl(fileId: string): Promise<{ success: boolean; url?: string; fileName?: string; fileSize?: number; error?: string }> {
    try {
      const token = await this.getAuthToken()
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa con ControlFile'
        }
      }

      console.log(`🔍 Obteniendo URL de descarga para archivo: ${fileId}`)

      // Usar el endpoint correcto /api/files/presign-get
      const response = await fetch(`${this.backendUrl}/api/files/presign-get`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId: fileId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error obteniendo URL de descarga:', errorData)
        return {
          success: false,
          error: errorData.message || `Error obteniendo URL de descarga: ${response.status}`
        }
      }

      const result = await response.json()
      console.log('✅ URL de descarga obtenida:', result.downloadUrl)
      console.log('📁 Archivo:', result.fileName)
      console.log('📏 Tamaño:', result.fileSize)

      return {
        success: true,
        url: result.downloadUrl,
        fileName: result.fileName,
        fileSize: result.fileSize
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
import { auth } from './firebase'; // Usar el mismo auth que la app principal

// Configuración de ControlFile
const CONTROLFILE_CONFIG = {
  backendUrl: process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL || "https://controlfile.onrender.com",
  appDisplayName: process.env.NEXT_PUBLIC_CONTROLFILE_APP_DISPLAY_NAME || "ControlFile",
  appCode: process.env.NEXT_PUBLIC_CONTROLFILE_APP_CODE || "controlfile"
}

/**
 * 🎯 ENDPOINTS DE CONTROLFILE:
 * 
 * /api/folders/root?name=X&pin=1 (GET)
 * - Para carpetas principales del taskbar
 * - Se pueden "fijar" en el taskbar
 * - source: "taskbar"
 * 
 * /api/folders/create (POST)
 * - Para carpetas normales dentro de otras carpetas
 * - No aparecen en el taskbar
 * - source: "controlgastos"
 */

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

      console.log('🔄 ControlFile: Creando carpeta "Gastos" para taskbar...')

      // Primero intentar obtener la carpeta existente
      let response = await fetch(`${this.backendUrl}/api/folders/root?name=${encodeURIComponent('Gastos')}&pin=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      let result: any = null
      let isNewFolder = false

      if (response.ok) {
        result = await response.json()
        console.log('📁 ControlFile: Carpeta "Gastos" ya existe:', result.folderId)
      } else {
        // Si no existe, crear con metadata de taskbar desde el inicio
        console.log('📁 ControlFile: Carpeta "Gastos" no existe, creando con metadata de taskbar...')
        
        response = await fetch(`${this.backendUrl}/api/folders/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: 'Gastos',
            parentId: null, // Carpeta raíz
            icon: 'Taskbar',
            color: 'text-blue-600',
            source: 'taskbar',
            isMainFolder: true,
            isDefault: false,
            isPublic: false,
            pin: 1 // Fijar en taskbar
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Error HTTP: ${response.status}`)
        }

        result = await response.json()
        isNewFolder = true
        console.log('✅ ControlFile: Carpeta "Gastos" creada con metadata de taskbar:', result.folderId)
      }

      // Si la carpeta ya existía, forzar actualización de metadata
      if (!isNewFolder && result.folderId) {
        console.log('🔄 ControlFile: Actualizando metadata de carpeta existente "Gastos" con source: taskbar')
        const updateResult = await this.updateFolderMetadata(result.folderId, {
          metadata: {
            source: "taskbar",
            icon: "Taskbar",
            color: "text-blue-600",
            isMainFolder: true,
            isDefault: false,
            isPublic: false,
            pin: 1
          }
        })
        
        if (updateResult.success) {
          console.log('✅ ControlFile: Metadata de carpeta "Gastos" actualizada correctamente')
        } else {
          console.warn('⚠️ ControlFile: No se pudo actualizar metadata:', updateResult.error)
        }
      }
      
      console.log('✅ ControlFile: Carpeta principal "Gastos" lista:', result.folderId)
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
      for (let i = 0; i < folderPath.length; i++) {
        const folderName = folderPath[i]
        console.log(`🔍 ControlFile: Verificando si existe carpeta "${folderName}" en carpeta padre ${currentFolderId} (nivel ${i + 1}/${folderPath.length})`)
        
        // Verificar si la carpeta ya existe
        const existingFiles = await this.listFiles(currentFolderId)
        if (existingFiles.success && existingFiles.files) {
          const existingFolder = existingFiles.files.find(file => 
            file.type === 'folder' && file.name === folderName
          )
          
          if (existingFolder) {
            currentFolderId = existingFolder.id
            console.log(`✅ ControlFile: Carpeta "${folderName}" ya existe (ID: ${existingFolder.id}) - navegando a ella`)
            continue
          } else {
            console.log(`❌ ControlFile: Carpeta "${folderName}" NO existe - procediendo a crear`)
          }
        } else {
          console.log(`⚠️ ControlFile: No se pudieron listar archivos en carpeta padre ${currentFolderId} - procediendo a crear "${folderName}"`)
        }

        // Crear la carpeta si no existe
        console.log(`📁 ControlFile: Creando carpeta "${folderName}" en carpeta padre ${currentFolderId}`)
        const newFolder = await this.createSubFolder(folderName, currentFolderId)
        if (!newFolder.success || !newFolder.folderId) {
          return { success: false, error: `Error creando carpeta "${folderName}": ${newFolder.error}` }
        }
        
        currentFolderId = newFolder.folderId
        console.log(`✅ ControlFile: Carpeta "${folderName}" creada exitosamente (ID: ${newFolder.folderId})`)
        
        // Verificar que la carpeta se creó correctamente
        console.log(`🔍 ControlFile: Verificando que la carpeta "${folderName}" se creó correctamente...`)
        const verifyFiles = await this.listFiles(currentFolderId)
        if (verifyFiles.success) {
          console.log(`✅ ControlFile: Carpeta "${folderName}" verificada - lista para siguiente nivel`)
        } else {
          console.warn(`⚠️ ControlFile: No se pudo verificar carpeta "${folderName}" - continuando...`)
        }
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


  // Obtener carpeta del mes actual (sin tipo de documento)
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
      
      console.log(`📁 ControlFile: Carpeta del mes actual: ${folderPath.join(' → ')}`)
      return await this.ensureFolderExists(folderPath)
    } catch (error: any) {
      console.error('❌ ControlFile: Error obteniendo carpeta del mes actual:', error)
      return { 
        success: false, 
        error: error.message || 'Error obteniendo carpeta del mes actual' 
      }
    }
  }

  // Actualizar metadata de una carpeta
  async updateFolderMetadata(folderId: string, metadata: any): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
      }

      const token = await user.getIdToken()

      console.log(`🔄 ControlFile: Actualizando metadata de carpeta ${folderId}:`, metadata)

      const response = await fetch(`${this.backendUrl}/api/folders/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          folderId: folderId,
          ...metadata
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ ControlFile: Error actualizando metadata:', {
          status: response.status,
          error: errorData.error || `HTTP: ${response.status}`,
          response: errorData
        })
        return { success: false, error: errorData.error || `Error HTTP: ${response.status}` }
      }

      const result = await response.json()
      console.log('✅ ControlFile: Metadata de carpeta actualizada exitosamente:', result)
      return { success: true }
    } catch (error: any) {
      console.error('❌ ControlFile: Error actualizando metadata de carpeta:', error)
      return { 
        success: false, 
        error: error.message || 'Error actualizando metadata de carpeta' 
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

      // Usar /api/folders/create para subcarpetas (no del taskbar)
      // Este endpoint es correcto para carpetas normales dentro de otras carpetas
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
          color: "text-blue-600",
          source: "taskbar"
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      console.log(`✅ ControlFile: Subcarpeta "${folderName}" creada usando /api/folders/create`)
      return { success: true, folderId: result.folderId }
    } catch (error: any) {
      console.error('❌ ControlFile: Error creando subcarpeta:', error)
      return { 
        success: false, 
        error: error.message || 'Error creando subcarpeta' 
      }
    }
  }

  // Subir archivo usando proxy para evitar problemas de CORS
  async uploadFile(file: File, type?: 'Comprobantes' | 'Facturas' | 'Recibos' | 'Otros'): Promise<{ success: boolean; fileId?: string; fileUrl?: string; shareUrl?: string; shareToken?: string; fileName?: string; fileSize?: number; error?: string }> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
      }

      console.log(`📤 ControlFile: Subiendo archivo ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

      // Determinar carpeta de destino (siempre carpeta del mes actual)
      let targetFolderId: string | null = null

      // Subir a carpeta del mes actual (año/mes)
      const monthFolder = await this.getCurrentMonthFolder()
      if (monthFolder.success && monthFolder.folderId) {
        targetFolderId = monthFolder.folderId
        console.log('📁 ControlFile: Subiendo a carpeta del mes actual')
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

      // Usar proxy interno para evitar problemas de CORS
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', file.name)
      formData.append('fileSize', file.size.toString())
      formData.append('mimeType', file.type)
      formData.append('parentId', targetFolderId || '')
      formData.append('authToken', token)

      const uploadResponse = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Error subiendo archivo: ${uploadResponse.status}`)
      }

      const result = await uploadResponse.json()

      if (!result.success) {
        throw new Error(result.error || 'Error subiendo archivo')
      }

      console.log(`✅ ControlFile: Archivo subido exitosamente - ID: ${result.fileId}`)
      
      return {
        success: true,
        fileId: result.fileId,
        fileUrl: result.fileUrl,
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
  async listFiles(parentId?: string, pageSize: number = 50): Promise<{ success: boolean; files?: any[]; nextPage?: string; error?: string }> {
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

      console.log(`🔍 ControlFile: Listando archivos en carpeta ${parentId || 'null'}`)

      const response = await fetch(`${this.backendUrl}/api/files/list?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ ControlFile: Error en listFiles:', errorData.error || `HTTP: ${response.status}`)
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      console.log(`📁 ControlFile: Encontrados ${result.items?.length || 0} elementos en carpeta ${parentId || 'null'}`)
      
      if (result.items && result.items.length > 0) {
        console.log('📁 ControlFile: Elementos encontrados:', result.items.map((item: any) => ({
          name: item.name,
          type: item.type,
          id: item.id
        })))
      }
      
      return { 
        success: true, 
        files: result.items || [],
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

  // Debug: Verificar estructura de carpetas
  async debugFolderStructure(): Promise<void> {
    try {
      console.log('🔍 ControlFile: Debug - Verificando estructura de carpetas...')
      
      // 1. Verificar carpeta principal "Gastos"
      const mainFolder = await this.createMainFolder()
      if (mainFolder.success && mainFolder.folderId) {
        console.log('✅ Carpeta principal "Gastos":', mainFolder.folderId)
        
        // 2. Listar contenido de "Gastos"
        const gastosContent = await this.listFiles(mainFolder.folderId)
        if (gastosContent.success && gastosContent.files) {
          console.log('📁 Contenido de "Gastos":', gastosContent.files.map(f => ({
            name: f.name,
            type: f.type,
            id: f.id,
            source: f.source
          })))
        }
        
        // 3. Verificar carpeta del año actual
        const year = new Date().getFullYear()
        const yearFolder = gastosContent.files?.find(f => f.type === 'folder' && f.name === year.toString())
        if (yearFolder) {
          console.log('✅ Carpeta del año encontrada:', yearFolder.id)
          
          // 4. Listar contenido del año
          const yearContent = await this.listFiles(yearFolder.id)
          if (yearContent.success && yearContent.files) {
            console.log('📁 Contenido del año:', yearContent.files.map(f => ({
              name: f.name,
              type: f.type,
              id: f.id
            })))
          }
        } else {
          console.log('❌ Carpeta del año NO encontrada')
        }
      } else {
        console.log('❌ No se pudo obtener carpeta principal "Gastos"')
      }
    } catch (error: any) {
      console.error('❌ ControlFile: Error en debug:', error)
    }
  }
}

// Instancia singleton
export const controlFileService = new ControlFileService()

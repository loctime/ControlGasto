/**
 * Helper para generar rutas de Firestore organizadas por app
 */

// ID de la app ControlGastos
export const APP_ID = 'controlgastos'

/**
 * Genera la ruta base para las colecciones de la app
 * Estructura: apps/{appId}
 */
export const getAppPath = (appId: string = APP_ID) => `apps/${appId}`

/**
 * Genera rutas específicas para colecciones de ControlGastos
 */
export const FIRESTORE_PATHS = {
  // Base path de la app
  APP: getAppPath(),
  
  // Colecciones principales
  EXPENSES: `${getAppPath()}/expenses`,
  USERS: `${getAppPath()}/users`,
  CATEGORIES: `${getAppPath()}/categories`,
  RECEIPTS: `${getAppPath()}/receipts`,
  
  // Subcolecciones específicas
  USER_EXPENSES: (userId: string) => `${getAppPath()}/users/${userId}/expenses`,
  USER_RECEIPTS: (userId: string) => `${getAppPath()}/users/${userId}/receipts`,
  USER_SETTINGS: (userId: string) => `${getAppPath()}/users/${userId}/settings`,
  
  // Para ControlFile (si necesitamos almacenar algo localmente)
  CONTROLFILE_SESSIONS: `${getAppPath()}/controlfile_sessions`,
} as const

/**
 * Helper para obtener el path de una colección específica
 */
export const getCollectionPath = (collection: keyof typeof FIRESTORE_PATHS, userId?: string): string => {
  const path = FIRESTORE_PATHS[collection]
  
  if (typeof path === 'function' && userId) {
    return path(userId)
  }
  
  if (typeof path === 'string') {
    return path
  }
  
  // Fallback para casos donde no se proporciona userId
  return 'apps/controlgastos'
}

/**
 * Helper para obtener el path de un documento específico
 */
export const getDocumentPath = (collection: keyof typeof FIRESTORE_PATHS, docId: string, userId?: string) => {
  const basePath = getCollectionPath(collection, userId)
  return `${basePath}/${docId}`
}

// Estructura resultante en Firestore:
/*
apps/
  └── controlgastos/
      ├── expenses/           # Gastos globales (opcional)
      ├── users/             # Usuarios de la app
      │   └── {userId}/
      │       ├── expenses/  # Gastos del usuario
      │       ├── receipts/  # Comprobantes del usuario
      │       └── settings/  # Configuraciones del usuario
      ├── categories/        # Categorías de gastos
      ├── receipts/          # Comprobantes globales (opcional)
      └── controlfile_sessions/ # Sesiones de ControlFile
*/

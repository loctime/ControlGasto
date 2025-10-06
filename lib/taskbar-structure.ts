import { auth } from './firebase';

// Configuración de ControlFile
const CONTROLFILE_CONFIG = {
  backendUrl: process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL || "https://controlfile.onrender.com"
}

export class TaskbarStructureService {
  private auth: any;
  private backendUrl: string;
  private cache: { [key: string]: string } = {};

  constructor() {
    this.auth = auth;
    this.backendUrl = CONTROLFILE_CONFIG.backendUrl;
  }

  // Crear estructura completa: Gastos > Año > Mes
  async createGastosStructure(): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const user = this.auth?.currentUser;
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Verificar cache primero
      const cacheKey = 'gastos-structure';
      if (this.cache[cacheKey]) {
        console.log('✅ Usando estructura cacheada:', this.cache[cacheKey]);
        return { success: true, folderId: this.cache[cacheKey] };
      }

      console.log('🏗️ Creando estructura Gastos > Año > Mes');

      // 1. Crear carpeta principal "Gastos" en el taskbar
      const gastosFolder = await this.createMainFolder('Gastos');
      if (!gastosFolder.success || !gastosFolder.folderId) {
        return { success: false, error: gastosFolder.error };
      }

      // 2. Crear carpeta del año actual
      const currentYear = new Date().getFullYear();
      const yearFolder = await this.createYearFolder(gastosFolder.folderId, currentYear);
      if (!yearFolder.success || !yearFolder.folderId) {
        return { success: false, error: yearFolder.error };
      }

      // 3. Crear carpeta del mes actual
      const currentMonth = new Date().getMonth();
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const monthName = monthNames[currentMonth];
      
      const monthFolder = await this.createMonthFolder(yearFolder.folderId, monthName);
      if (!monthFolder.success || !monthFolder.folderId) {
        return { success: false, error: monthFolder.error };
      }

      // Guardar en cache
      this.cache[cacheKey] = monthFolder.folderId;

      console.log('✅ Estructura Gastos > Año > Mes creada exitosamente');
      return { success: true, folderId: monthFolder.folderId };

    } catch (error: any) {
      console.error('❌ Error creando estructura Gastos:', error);
      return { success: false, error: error.message || 'Error creando estructura' };
    }
  }

  // Crear carpeta principal "Gastos" en el taskbar
  private async createMainFolder(name: string): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const user = this.auth?.currentUser;
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Verificar cache
      const cacheKey = `main-${name}`;
      if (this.cache[cacheKey]) {
        console.log(`✅ Usando carpeta principal cacheada "${name}":`, this.cache[cacheKey]);
        return { success: true, folderId: this.cache[cacheKey] };
      }

      const token = await user.getIdToken();

      console.log(`🔄 Creando carpeta principal "${name}" en el taskbar...`);

      // Usar POST para crear con metadata de taskbar
      const response = await fetch(`${this.backendUrl}/api/folders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name,
          parentId: null, // Carpeta raíz
          icon: 'Taskbar',
          color: 'text-blue-600',
          source: 'taskbar',
          isMainFolder: true,
          isDefault: false,
          isPublic: false,
          pin: 1,
          metadata: {
            source: 'taskbar',
            icon: 'Taskbar',
            color: 'text-blue-600',
            isMainFolder: true,
            isDefault: false,
            isPublic: false
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.folderId) {
        // Guardar en cache
        this.cache[cacheKey] = result.folderId;
        console.log(`✅ Carpeta principal "${name}" creada en taskbar:`, result.folderId);
        return { success: true, folderId: result.folderId };
      } else {
        return { success: false, error: 'No se pudo crear la carpeta principal' };
      }
    } catch (error: any) {
      console.error(`❌ Error creando carpeta principal "${name}":`, error);
      return { success: false, error: error.message || 'Error creando carpeta principal' };
    }
  }

  // Crear carpeta del año
  private async createYearFolder(parentId: string, year: number): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const user = this.auth?.currentUser;
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const token = await user.getIdToken();

      console.log(`🔄 Creando carpeta del año ${year} dentro de ${parentId}...`);

      // Verificar si ya existe la carpeta del año
      try {
        const checkResponse = await fetch(`${this.backendUrl}/api/files/list?parentId=${parentId}&pageSize=10`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          const existingYear = checkResult.files?.find((f: any) => f.type === 'folder' && f.name === year.toString());
          if (existingYear) {
            console.log(`✅ Carpeta del año ${year} ya existe:`, existingYear.id);
            return { success: true, folderId: existingYear.id };
          }
        }
      } catch (checkError) {
        console.log('⚠️ No se pudo verificar carpetas existentes, continuando...');
      }

      const response = await fetch(`${this.backendUrl}/api/folders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: year.toString(),
          parentId: parentId,
          icon: 'Folder',
          color: 'text-blue-600',
          source: 'taskbar',
          metadata: {
            source: 'taskbar',
            icon: 'Folder',
            color: 'text-blue-600'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error creando carpeta del año:', errorData);
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.folderId) {
        console.log(`✅ Carpeta del año ${year} creada:`, result.folderId);
        return { success: true, folderId: result.folderId };
      } else {
        return { success: false, error: 'No se pudo crear la carpeta del año' };
      }
    } catch (error: any) {
      console.error(`❌ Error creando carpeta del año ${year}:`, error);
      return { success: false, error: error.message || 'Error creando carpeta del año' };
    }
  }

  // Crear carpeta del mes
  private async createMonthFolder(parentId: string, monthName: string): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const user = this.auth?.currentUser;
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const token = await user.getIdToken();

      console.log(`🔄 Creando carpeta del mes ${monthName} dentro de ${parentId}...`);

      // Verificar si ya existe la carpeta del mes
      try {
        const checkResponse = await fetch(`${this.backendUrl}/api/files/list?parentId=${parentId}&pageSize=10`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          const existingMonth = checkResult.files?.find((f: any) => f.type === 'folder' && f.name === monthName);
          if (existingMonth) {
            console.log(`✅ Carpeta del mes ${monthName} ya existe:`, existingMonth.id);
            return { success: true, folderId: existingMonth.id };
          }
        }
      } catch (checkError) {
        console.log('⚠️ No se pudo verificar carpetas existentes, continuando...');
      }

      const response = await fetch(`${this.backendUrl}/api/folders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: monthName,
          parentId: parentId,
          icon: 'Folder',
          color: 'text-green-600',
          source: 'taskbar',
          metadata: {
            source: 'taskbar',
            icon: 'Folder',
            color: 'text-green-600'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error creando carpeta del mes:', errorData);
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.folderId) {
        console.log(`✅ Carpeta del mes ${monthName} creada:`, result.folderId);
        return { success: true, folderId: result.folderId };
      } else {
        return { success: false, error: 'No se pudo crear la carpeta del mes' };
      }
    } catch (error: any) {
      console.error(`❌ Error creando carpeta del mes ${monthName}:`, error);
      return { success: false, error: error.message || 'Error creando carpeta del mes' };
    }
  }

  // Obtener carpeta del mes actual (para subir archivos)
  async getCurrentMonthFolder(): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      const user = this.auth?.currentUser;
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      console.log('🔍 Obteniendo carpeta del mes actual...');

      // Crear estructura directamente (evitar bucle infinito)
      return await this.createGastosStructure();
    } catch (error: any) {
      console.error('❌ Error obteniendo carpeta del mes actual:', error);
      return { success: false, error: error.message || 'Error obteniendo carpeta del mes actual' };
    }
  }

  // Limpiar cache (para forzar recreación)
  clearCache(): void {
    this.cache = {};
    console.log('🗑️ Cache limpiado');
  }

}

// Instancia singleton
export const taskbarStructureService = new TaskbarStructureService();

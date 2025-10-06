import { auth } from './firebase';

// Configuración de ControlFile
const CONTROLFILE_CONFIG = {
  backendUrl: process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL || "https://controlfile.onrender.com"
}

export class TaskbarStructureService {
  private auth: any;
  private backendUrl: string;

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

      const token = await user.getIdToken();

      const response = await fetch(`${this.backendUrl}/api/folders/root?name=${encodeURIComponent(name)}&pin=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.folderId) {
        console.log(`✅ Carpeta principal "${name}" creada/obtenida:`, result.folderId);
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
          source: 'taskbar'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
          source: 'taskbar'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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

      // Crear estructura si no existe
      const structure = await this.createGastosStructure();
      if (!structure.success) {
        return { success: false, error: structure.error };
      }

      return { success: true, folderId: structure.folderId };
    } catch (error: any) {
      console.error('❌ Error obteniendo carpeta del mes actual:', error);
      return { success: false, error: error.message || 'Error obteniendo carpeta del mes actual' };
    }
  }
}

// Instancia singleton
export const taskbarStructureService = new TaskbarStructureService();

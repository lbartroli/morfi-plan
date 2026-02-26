import { AppData, Menu, Assignment } from './types';

const JSONBIN_API_KEY = process.env.NEXT_PUBLIC_JSONBIN_API_KEY;
const JSONBIN_COLLECTION_ID = process.env.NEXT_PUBLIC_JSONBIN_COLLECTION_ID || '699f9abdae596e708f4a689a';
const JSONBIN_API_URL = 'https://api.jsonbin.io/v3/b';

// Datos por defecto
const defaultData: AppData = {
  menus: [],
  assignments: [],
  config: {
    email: 'lgbartroli@gmail.com',
    sendDay: 'sunday',
    sendHour: 9,
  },
};

export class JsonBinClient {
  private apiKey: string | undefined;
  private binId: string | null = null;
  private collectionId: string;

  constructor() {
    this.apiKey = JSONBIN_API_KEY;
    this.collectionId = JSONBIN_COLLECTION_ID;
    // Intentar recuperar binId del localStorage
    if (typeof window !== 'undefined') {
      this.binId = localStorage.getItem('morfi-bin-id');
    }
  }

  private async createBin(): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      // Crear bin dentro de la colección
      const response = await fetch(`${JSONBIN_API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.apiKey,
          'X-Collection-Id': this.collectionId,
          'X-Bin-Name': 'morfi-plan-data',
          'X-Bin-Private': 'false',
        },
        body: JSON.stringify(defaultData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error creating bin:', response.status, errorText);
        throw new Error(`Failed to create bin: ${response.status}`);
      }

      const result = await response.json();
      const newBinId = result.metadata?.id;
      
      if (newBinId) {
        console.log('Nuevo bin creado:', newBinId);
        this.binId = newBinId;
        // Guardar en localStorage el nuevo binId
        if (typeof window !== 'undefined') {
          localStorage.setItem('morfi-bin-id', newBinId);
        }
        return newBinId;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating bin:', error);
      return null;
    }
  }

  private async findExistingBin(): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      // Buscar bins en la colección
      const response = await fetch(`https://api.jsonbin.io/v3/c/${this.collectionId}/bins`, {
        method: 'GET',
        headers: {
          'X-Master-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        console.error('Error finding bins:', response.status);
        return null;
      }

      const result = await response.json();
      const bins = result.bins || [];
      
      // Buscar un bin con el nombre 'morfi-plan-data'
      const existingBin = bins.find((bin: any) => bin.name === 'morfi-plan-data');
      
      if (existingBin) {
        console.log('Bin existente encontrado:', existingBin.id);
        this.binId = existingBin.id;
        if (typeof window !== 'undefined') {
          localStorage.setItem('morfi-bin-id', existingBin.id);
        }
        return existingBin.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding bin:', error);
      return null;
    }
  }

  private async request(method: string, body?: unknown): Promise<AppData> {
    if (!this.apiKey) {
      console.warn('JSONBin no configurado, usando datos locales');
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('morfi-data');
        if (local) return JSON.parse(local);
      }
      return defaultData;
    }

    // Si no hay binId, intentar encontrar uno existente o crear uno nuevo
    if (!this.binId) {
      const existingBinId = await this.findExistingBin();
      if (!existingBinId) {
        const newBinId = await this.createBin();
        if (newBinId && method === 'PUT' && body) {
          return body as AppData;
        }
        if (newBinId) {
          return defaultData;
        }
      }
    }

    if (!this.binId) {
      console.warn('No se pudo crear o encontrar bin, usando datos locales');
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('morfi-data');
        if (local) return JSON.parse(local);
      }
      return defaultData;
    }

    const url = `${JSONBIN_API_URL}/${this.binId}`;
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.apiKey,
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, options);

      // Si el bin no existe (404), intentar crearlo
      if (response.status === 404) {
        console.log('Bin no encontrado, creando nuevo...');
        this.binId = null;
        localStorage.removeItem('morfi-bin-id');
        const newBinId = await this.createBin();
        if (newBinId) {
          if (method === 'PUT' && body) {
            return body as AppData;
          }
          return defaultData;
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.record || defaultData;
    } catch (error) {
      console.error('Error con JSONBin:', error);
      // Fallback a localStorage
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('morfi-data');
        if (local) return JSON.parse(local);
      }
      return defaultData;
    }
  }

  async getData(): Promise<AppData> {
    const data = await this.request('GET');
    // Guardar en localStorage como backup
    if (typeof window !== 'undefined') {
      localStorage.setItem('morfi-data', JSON.stringify(data));
    }
    return data;
  }

  async updateData(data: AppData): Promise<AppData> {
    // Actualizar localStorage primero
    if (typeof window !== 'undefined') {
      localStorage.setItem('morfi-data', JSON.stringify(data));
    }
    
    // Luego intentar actualizar JSONBin
    if (this.apiKey) {
      return await this.request('PUT', data);
    }
    
    return data;
  }

  // Menús
  async getMenus(): Promise<Menu[]> {
    const data = await this.getData();
    return data.menus;
  }

  async addMenu(menu: Menu): Promise<Menu[]> {
    const data = await this.getData();
    data.menus.push(menu);
    await this.updateData(data);
    return data.menus;
  }

  async updateMenu(updatedMenu: Menu): Promise<Menu[]> {
    const data = await this.getData();
    const index = data.menus.findIndex(m => m.id === updatedMenu.id);
    if (index !== -1) {
      data.menus[index] = updatedMenu;
      await this.updateData(data);
    }
    return data.menus;
  }

  async deleteMenu(menuId: string): Promise<Menu[]> {
    const data = await this.getData();
    data.menus = data.menus.filter(m => m.id !== menuId);
    // También eliminar asignaciones relacionadas
    data.assignments = data.assignments.filter(a => a.menuId !== menuId);
    await this.updateData(data);
    return data.menus;
  }

  // Asignaciones
  async getAssignments(): Promise<Assignment[]> {
    const data = await this.getData();
    return data.assignments;
  }

  async addAssignment(assignment: Assignment): Promise<Assignment[]> {
    const data = await this.getData();
    // Eliminar asignación existente para ese día/tipo si existe
    data.assignments = data.assignments.filter(
      a => !(a.day === assignment.day && a.mealType === assignment.mealType && a.weekOffset === assignment.weekOffset)
    );
    data.assignments.push(assignment);
    await this.updateData(data);
    return data.assignments;
  }

  async removeAssignment(assignmentId: string): Promise<Assignment[]> {
    const data = await this.getData();
    data.assignments = data.assignments.filter(a => a.id !== assignmentId);
    await this.updateData(data);
    return data.assignments;
  }

  // Configuración
  async getConfig(): Promise<AppData['config']> {
    const data = await this.getData();
    return data.config;
  }

  async updateConfig(config: AppData['config']): Promise<AppData['config']> {
    const data = await this.getData();
    data.config = config;
    await this.updateData(data);
    return config;
  }

  // Generar lista de compras
  getShoppingList(menus: Menu[], assignments: Assignment[]): string[] {
    const ingredients = new Set<string>();
    
    assignments.forEach(assignment => {
      const menu = menus.find(m => m.id === assignment.menuId);
      if (menu) {
        menu.ingredients.forEach(ingredient => {
          ingredients.add(ingredient.toLowerCase().trim());
        });
      }
    });
    
    return Array.from(ingredients).sort();
  }
}

export const jsonBinClient = new JsonBinClient();

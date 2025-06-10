const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
}

export const apiClient = new ApiClient();

// Funciones específicas para el TOTEM
export const totemApi = {
  // Dashboard y estadísticas
  getEstadisticas: () => apiClient.get('/totem/estadisticas'),
  getEstadisticasLite: () => apiClient.get('/totem/estadisticas-lite'), // Versión ligera
  getEstadisticasSimple: () => apiClient.get('/totem/estadisticas-simple'), // Versión depuración
  
  // Sincronización
  sincronizar: () => apiClient.post('/totem/sync'),
  
  // Datos TOTEM
  getDatosTotem: (page = 1, limit = 10) => 
    apiClient.get(`/totem?page=${page}&limit=${limit}`),
  
  // Facultades
  getFacultades: () => apiClient.get('/facultades'),
  getFacultad: (id: number) => apiClient.get(`/facultades/${id}`),
  crearFacultad: (data: any) => apiClient.post('/facultades', data),
  
  // Mapeos de Sectores
  getMapeosSectores: (includeNoMapeados = false) => 
    apiClient.get(`/totem/mapeos/sectores?includeNoMapeados=${includeNoMapeados}`),
  crearMapeoSector: (data: { sector: string; facultadId: number }) => 
    apiClient.post('/totem/mapeos/sectores', data),
  actualizarMapeoSector: (id: number, data: any) => 
    apiClient.put(`/totem/mapeos/sectores?id=${id}`, data),
  eliminarMapeoSector: (id: number) => 
    apiClient.delete(`/totem/mapeos/sectores?id=${id}`),
  
  // Mapeos de Carreras
  getMapeoCarreras: (soloNoMapeadas = false) => 
    apiClient.get(`/totem/mapeos/carreras?soloNoMapeadas=${soloNoMapeadas}`),
  crearMapeoCarrera: (data: { codigoTotem: string; carreraId: number }) => 
    apiClient.post('/totem/mapeos/carreras', data),
  actualizarMapeoCarrera: (codigoTotem: string, data: any) => 
    apiClient.put(`/totem/mapeos/carreras?codigoTotem=${codigoTotem}`, data),
};

// Tipos de datos
export interface Facultad {
  id: number;
  nombre: string;
  codigo: string;
  carreras: Carrera[];
  _count: {
    carreras: number;
    syncLogs: number;
  };
}

export interface Carrera {
  id: number;
  nombre: string;
  facultadId: number;
  facultad?: Facultad;
}

export interface MapeoSector {
  id: number;
  sector: string;
  facultadId: number;
  activo: boolean;
  facultad: {
    id: number;
    nombre: string;
  };
}

export interface MapeoCarrera {
  id: number;
  codigoTotem: string;
  carreraId?: number;
  nombreTotem: string;
  esMapeada: boolean;
  carrera?: {
    id: number;
    nombre: string;
    facultad: {
      nombre: string;
    };
  };
}

export interface EstadisticasTotem {
  totalRegistrosTotem: number;
  totalExamenesCreados: number;
  sectoresNoMapeados: number;
  carrerasNoMapeadas: number;
  listaSectoresNoMapeados: string[];
  listaCarrerasNoMapeadas: Array<{
    codigoTotem: string;
    nombreTotem: string;
    esMapeada: boolean;
  }>;
}    
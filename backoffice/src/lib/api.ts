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
  
  // Configuración Visual
  getConfiguracionVisual: () => apiClient.get('/configuracion/visual'),
  actualizarConfiguracionVisual: (data: ConfiguracionVisual) => 
    apiClient.put('/configuracion/visual', data),

  // 🆕 AULAS
  getAulas: () => apiClient.get('/aulas'),
  getAula: (id: number) => apiClient.get(`/aulas/${id}`),
  crearAula: (data: CrearAulaData) => apiClient.post('/aulas', data),
  actualizarAula: (id: number, data: Partial<CrearAulaData>) => 
    apiClient.put(`/aulas/${id}`, data),
  eliminarAula: (id: number) => apiClient.delete(`/aulas/${id}`),

  // 🆕 EXÁMENES  
  getExamenes: (filtros?: FiltrosExamenes) => {
    const params = new URLSearchParams();
    if (filtros?.facultadId) params.append('facultadId', filtros.facultadId.toString());
    if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    if (filtros?.soloSinAula) params.append('soloSinAula', 'true');
    if (filtros?.soloProximos) params.append('soloProximos', 'true');
    
    return apiClient.get(`/examenes${params.toString() ? `?${params.toString()}` : ''}`);
  },
  
  getExamenInscripciones: (id: number, filtros?: { rendida?: boolean; fechaDesde?: string; fechaHasta?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.rendida !== undefined) params.append('rendida', filtros.rendida.toString());
    if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    
    return apiClient.get(`/examenes/${id}/inscripciones${params.toString() ? `?${params.toString()}` : ''}`);
  },

  // 🆕 ASIGNACIONES
  asignarAulaManual: (examenId: number, aulaId: number) => 
    apiClient.post(`/examenes/${examenId}/asignar-aula`, { aulaId }),
  
  asignarAulaAutomatica: (examenId: number) =>
    apiClient.post(`/examenes/${examenId}/asignar-automatico`),
  
  asignacionMasiva: (filtros: { facultadId?: number; carreraId?: number; fechaDesde?: string; fechaHasta?: string; soloSinAula?: boolean }) =>
    apiClient.post('/examenes/asignacion-masiva', filtros),

  sincronizarInscripciones: (filtros: SincronizacionInscripcionesData) =>
    apiClient.post('/examenes/sincronizar-inscripciones', filtros),

  // 🆕 DASHBOARD INTEGRACIÓN
  getDashboardIntegracion: () => apiClient.get('/dashboard/integracion-completa'),
};

// Tipos de datos existentes
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

export interface ConfiguracionVisual {
  id?: number;
  backgroundImage?: string;
  titulo?: string;
  subtitulo?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  activa?: boolean;
}

// 🆕 NUEVOS TIPOS PARA AULAS Y EXÁMENES

export interface Aula {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion: string;
  disponible: boolean;
  _count?: {
    examenes: number;
  };
}

export interface CrearAulaData {
  nombre: string;
  capacidad: number;
  ubicacion: string;
  disponible: boolean;
}

export interface Examen {
  id: number;
  fecha: string;
  hora: string;
  estado: string;
  materia: {
    id: number;
    nombre: string;
    codigo?: string;
  };
  carrera: {
    id: number;
    nombre: string;
  };
  facultad: {
    id: number;
    nombre: string;
  };
  aula?: {
    id: number;
    nombre: string;
    capacidad: number;
    ubicacion: string;
  };
  totemData?: {
    data: {
      SECTOR: string;
      CARRERA: string;
      MATERIA: string;
      'NOMBRE CORTO': string;
      FECHA: string;
      Hora: string;
      'Tipo Examen': string;
      Docente: string;
    };
  };
}

export interface FiltrosExamenes {
  facultadId?: number;
  carreraId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  soloSinAula?: boolean;
  soloProximos?: boolean;
}

export interface ExamenConInscripciones {
  examen: Examen;
  inscripciones: {
    totalActas: number;
    totalAlumnos: number;
    actas: Array<{
      acta: number;
      folio: number;
      fecActa: string;
      alumnos: Array<{
        ndocu: number;
        apen: string;
        nombreMateria: string;
        nombreSector: string;
      }>;
      coincideDatos: {
        sector: boolean;
        carrera: boolean;
        materia: boolean;
        fecha: boolean;
        porcentajeCoincidencia: number;
      };
      aulaInfo?: {
        capacidad: number;
        disponible: boolean;
        deficit: number;
      };
    }>;
  };
  resumen: {
    tieneAulaAsignada: boolean;
    capacidadSuficiente: boolean | null;
    requiereAccion: boolean;
  };
}

export interface SincronizacionInscripcionesData {
  facultadId?: number;
  carreraId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  soloSinAula?: boolean;
  rendida?: boolean;
}

export interface DashboardIntegracion {
  resumenGeneral: {
    totalExamenes: number;
    examenesSinAula: number;
    examenesConAula: number;
    totalAulas: number;
    totalFacultades: number;
    porcentajeAsignacion: string;
  };
  examenesProximos: {
    total: number;
    conCapacidadConocida: number;
    conProblemas: number;
    problemas: Array<{
      id: number;
      materia: string;
      fecha: string;
      problema: 'capacidad_insuficiente' | 'sin_aula';
      totalAlumnos: number;
      capacidadAula: number;
    }>;
  };
  facultades: Array<{
    id: number;
    nombre: string;
    codigo: string;
    totalExamenes: number;
    totalCarreras: number;
    examenesFuturos: number;
    examenesFuturosSinAula: number;
    porcentajeAsignacion: string;
  }>;
  aulas: {
    totalAulas: number;
    capacidadTotal: number;
    aulasEnUso: number;
    aulasSinUso: number;
    distribucionUso: Array<{
      nombre: string;
      capacidad: number;
      examenesAsignados: number;
      porcentajeUso: string;
    }>;
  };
  estadoIntegracion: {
    sistemaTotem: {
      activo: boolean;
      ultimaSincronizacion: string | null;
    };
    sistemaExterno: {
      disponible: boolean;
      examenesConsultados: number;
      examenesProximos: number;
    };
    sistemaAulas: {
      configurado: boolean;
      porcentajeAsignacion: string;
    };
  };
}    
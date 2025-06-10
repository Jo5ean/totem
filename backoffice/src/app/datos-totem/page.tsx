'use client';

import { useState, useEffect } from 'react';
import { totemApi } from '@/lib/api';
import { showError } from '@/lib/toast';
import { 
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface DatoTotem {
  id: number;
  sheetName: string;
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
  timestamp: string;
  processed: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function DatosTotemPage() {
  const [datos, setDatos] = useState<DatoTotem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const cargarDatos = async (page: number, limit: number) => {
    try {
      setLoading(true);
      const response = await totemApi.getDatosTotem(page, limit) as {
        data: DatoTotem[];
        pagination: PaginationInfo;
      };
      
      setDatos(response.data);
      setPagination(response.pagination);
    } catch (error) {
      showError('Error cargando datos del TOTEM');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarPagina = (nuevaPagina: number) => {
    setCurrentPage(nuevaPagina);
    cargarDatos(nuevaPagina, pageSize);
  };

  const cambiarTamanoPagina = (nuevoTamano: number) => {
    setPageSize(nuevoTamano);
    setCurrentPage(1);
    cargarDatos(1, nuevoTamano);
  };

  useEffect(() => {
    cargarDatos(currentPage, pageSize);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del TOTEM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Datos TOTEM</h1>
            <p className="text-gray-600">Visualiza los datos brutos sincronizados desde el sistema TOTEM</p>
          </div>
          {pagination && (
            <div className="text-sm text-gray-500">
              Total: {pagination.total.toLocaleString()} registros
            </div>
          )}
        </div>
      </div>

      {/* Controles de paginación superiores */}
      {pagination && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">
                  Registros por página:
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => cambiarTamanoPagina(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => cambiarPagina(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className={`px-3 py-1 rounded ${
                  pagination.hasPrev 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              
              <span className="px-3 py-1 text-sm">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              
              <button
                onClick={() => cambiarPagina(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className={`px-3 py-1 rounded ${
                  pagination.hasNext 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de datos */}
      <div className="space-y-4">
        {datos.map((dato) => (
          <div key={dato.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            {/* Header del registro */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {dato.data['NOMBRE CORTO']}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Hoja: {dato.sheetName} | ID: {dato.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dato.processed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {dato.processed ? 'Procesado' : 'Pendiente'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(dato.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Contenido del registro */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Información académica */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-1" />
                    Información Académica
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Sector:</span> {dato.data.SECTOR}
                    </div>
                    <div>
                      <span className="font-medium">Carrera:</span> {dato.data.CARRERA}
                    </div>
                    <div>
                      <span className="font-medium">Materia:</span> {dato.data.MATERIA}
                    </div>
                  </div>
                </div>

                {/* Información del examen */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Datos del Examen
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Fecha:</span> {dato.data.FECHA}
                    </div>
                    <div>
                      <span className="font-medium">Hora:</span> {dato.data.Hora}
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span> {dato.data['Tipo Examen']}
                    </div>
                  </div>
                </div>

                {/* Información del docente */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    Docente
                  </h4>
                  <div className="text-sm">
                    {dato.data.Docente}
                  </div>
                </div>

                {/* Metadatos */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Metadatos
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Sincronizado:</span> 
                      <br />
                      {new Date(dato.timestamp).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Estado:</span> 
                      <br />
                      {dato.processed ? 'Procesado' : 'Pendiente'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de paginación inferiores */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => cambiarPagina(1)}
              disabled={pagination.page === 1}
              className={`px-3 py-2 rounded text-sm ${
                pagination.page === 1 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Primera
            </button>
            
            <button
              onClick={() => cambiarPagina(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className={`px-3 py-2 rounded text-sm ${
                !pagination.hasPrev 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Anterior
            </button>

            {/* Páginas visibles */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNumber = Math.max(1, pagination.page - 2) + i;
              if (pageNumber > pagination.totalPages) return null;
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => cambiarPagina(pageNumber)}
                  className={`px-3 py-2 rounded text-sm ${
                    pageNumber === pagination.page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => cambiarPagina(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className={`px-3 py-2 rounded text-sm ${
                !pagination.hasNext 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Siguiente
            </button>
            
            <button
              onClick={() => cambiarPagina(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className={`px-3 py-2 rounded text-sm ${
                pagination.page === pagination.totalPages 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Última
            </button>
          </div>
        </div>
      )}

      {datos.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron registros del TOTEM. Ejecuta una sincronización para obtener datos.
          </p>
        </div>
      )}
    </div>
  );
} 
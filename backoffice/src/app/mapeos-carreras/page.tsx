'use client';

import { useState, useEffect } from 'react';
import { totemApi, MapeoCarrera } from '@/lib/api';
import { showSuccess, showError } from '@/lib/toast';
import { 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function MapeosCarrerasPage() {
  const [mapeos, setMapeos] = useState<MapeoCarrera[]>([]);
  // const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'mapeadas' | 'no-mapeadas'>('todas');

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const mapeosRes = await totemApi.getMapeoCarreras(false) as { data: MapeoCarrera[] };
      setMapeos(mapeosRes.data);
    } catch (error) {
      showError('Error cargando mapeos de carreras');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // const crearMapeo = async (codigoTotem: string, carreraId: number) => {
  //   try {
  //     await totemApi.crearMapeoCarrera({ codigoTotem, carreraId });
  //     showSuccess('Mapeo creado exitosamente');
  //     await cargarDatos();
  //   } catch (error) {
  //     showError('Error creando mapeo');
  //     console.error(error);
  //   }
  // };

  const mapeosFiltrados = mapeos.filter((mapeo) => {
    if (filtro === 'mapeadas') return mapeo.esMapeada;
    if (filtro === 'no-mapeadas') return !mapeo.esMapeada;
    return true;
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando mapeos de carreras...</p>
        </div>
      </div>
    );
  }

  const carrerasNoMapeadas = mapeos.filter(m => !m.esMapeada).length;
  const carrerasMapeadas = mapeos.filter(m => m.esMapeada).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapeos de Carreras</h1>
            <p className="text-gray-600">Gestiona las carreras del TOTEM y su correspondencia con el sistema local</p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total Carreras</h3>
              <p className="text-3xl font-bold text-blue-600">{mapeos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mapeadas</h3>
              <p className="text-3xl font-bold text-green-600">{carrerasMapeadas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sin Mapear</h3>
              <p className="text-3xl font-bold text-red-600">{carrerasNoMapeadas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta si hay carreras no mapeadas */}
      {carrerasNoMapeadas > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-red-900">
                Atención: {carrerasNoMapeadas} carreras sin mapear
              </h3>
              <p className="text-red-700">
                Estas carreras del TOTEM no podrán procesarse hasta ser mapeadas correctamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFiltro('todas')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filtro === 'todas'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Todas ({mapeos.length})
          </button>
          <button
            onClick={() => setFiltro('mapeadas')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filtro === 'mapeadas'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mapeadas ({carrerasMapeadas})
          </button>
          <button
            onClick={() => setFiltro('no-mapeadas')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filtro === 'no-mapeadas'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sin Mapear ({carrerasNoMapeadas})
          </button>
        </div>
      </div>

      {/* Lista de carreras */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Carreras TOTEM ({mapeosFiltrados.length})
          </h2>
        </div>
        
        {mapeosFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código TOTEM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre TOTEM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carrera Mapeada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mapeosFiltrados.map((mapeo) => (
                  <tr key={mapeo.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {mapeo.codigoTotem}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{mapeo.nombreTotem}</div>
                    </td>
                    <td className="px-6 py-4">
                      {mapeo.carrera ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {mapeo.carrera.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {mapeo.carrera.facultad.nombre}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No mapeada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mapeo.esMapeada 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mapeo.esMapeada ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Mapeada
                          </>
                        ) : (
                          <>
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            Sin Mapear
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!mapeo.esMapeada && (
                        <button
                          onClick={() => {
                            // Aquí podrías abrir un modal para seleccionar la carrera
                            showSuccess('Funcionalidad de mapeo en desarrollo');
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Mapear
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay carreras con este filtro
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Prueba cambiando el filtro para ver diferentes resultados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
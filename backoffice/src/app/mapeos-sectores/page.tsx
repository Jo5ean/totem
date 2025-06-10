'use client';

import { useState, useEffect } from 'react';
import { totemApi, MapeoSector, Facultad } from '@/lib/api';
import { showSuccess, showError } from '@/lib/toast';
import { 
  PlusIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';

export default function MapeosSectoresPage() {
  const [mapeos, setMapeos] = useState<MapeoSector[]>([]);
  const [sectoresNoMapeados, setSectoresNoMapeados] = useState<string[]>([]);
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    sector: '',
    facultadId: ''
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [mapeosRes, facultadesRes] = await Promise.all([
        totemApi.getMapeosSectores(true) as Promise<{ data: { mapeos: MapeoSector[]; sectoresNoMapeados: string[] } }>,
        totemApi.getFacultades() as Promise<{ data: Facultad[] }>
      ]);
      
      setMapeos(mapeosRes.data.mapeos);
      setSectoresNoMapeados(mapeosRes.data.sectoresNoMapeados);
      setFacultades(facultadesRes.data);
    } catch (error) {
      showError('Error cargando datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sector || !formData.facultadId) {
      showError('Sector y facultad son requeridos');
      return;
    }

    try {
      await totemApi.crearMapeoSector({
        sector: formData.sector,
        facultadId: parseInt(formData.facultadId)
      });
      showSuccess('Mapeo creado exitosamente');
      setShowForm(false);
      setFormData({ sector: '', facultadId: '' });
      await cargarDatos();
    } catch (error) {
      showError('Error creando mapeo');
      console.error(error);
    }
  };

  const eliminarMapeo = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este mapeo?')) return;

    try {
      await totemApi.eliminarMapeoSector(id);
      showSuccess('Mapeo eliminado exitosamente');
      await cargarDatos();
    } catch (error) {
      showError('Error eliminando mapeo');
      console.error(error);
    }
  };

  const mapeoRapido = async (sector: string, facultadId: number) => {
    try {
      await totemApi.crearMapeoSector({ sector, facultadId });
      showSuccess(`Sector ${sector} mapeado exitosamente`);
      await cargarDatos();
    } catch (error) {
      showError('Error creando mapeo');
      console.error(error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando mapeos...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Mapeos de Sectores</h1>
            <p className="text-gray-600">Configura qué sectores del TOTEM corresponden a cada facultad</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nuevo Mapeo</span>
          </button>
        </div>
      </div>

      {/* Alerta de sectores no mapeados */}
      {sectoresNoMapeados.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-medium text-orange-900">
              Sectores Sin Mapear ({sectoresNoMapeados.length})
            </h3>
          </div>
          <p className="text-orange-700 mb-3">
            Los siguientes sectores del TOTEM no están mapeados y necesitan asignación:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sectoresNoMapeados.map((sector) => (
              <div key={sector} className="bg-white p-3 rounded border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Sector {sector}</span>
                </div>
                <select 
                  className="w-full mt-2 text-xs border rounded px-2 py-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      mapeoRapido(sector, parseInt(e.target.value));
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">Seleccionar facultad...</option>
                  {facultades.map((facultad) => (
                    <option key={facultad.id} value={facultad.id}>
                      {facultad.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Mapeo</h2>
          <form onSubmit={manejarSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector TOTEM *
                </label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 2, 3, 21"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facultad *
                </label>
                <select
                  value={formData.facultadId}
                  onChange={(e) => setFormData(prev => ({ ...prev, facultadId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar facultad...</option>
                  {facultades.map((facultad) => (
                    <option key={facultad.id} value={facultad.id}>
                      {facultad.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Crear Mapeo
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ sector: '', facultadId: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de mapeos */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Mapeos Configurados ({mapeos.length})
          </h2>
        </div>
        
        {mapeos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facultad
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
                {mapeos.map((mapeo) => (
                  <tr key={mapeo.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ArrowPathIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          Sector {mapeo.sector}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mapeo.facultad.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mapeo.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mapeo.activo ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          'Inactivo'
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => eliminarMapeo(mapeo.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay mapeos configurados</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando mapeos entre sectores del TOTEM y facultades.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
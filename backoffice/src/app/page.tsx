'use client';

import { useState, useEffect } from 'react';
import { totemApi, EstadisticasTotem } from '@/lib/api';
import { showSuccess, showError, showLoading } from '@/lib/toast';
import toast from 'react-hot-toast';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasTotem | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      // Usar versión simple para depuración
      const response = await totemApi.getEstadisticasSimple() as { data: EstadisticasTotem };
      setEstadisticas(response.data);

    } catch (error) {
      // Si falla la versión simple, intentar con la ligera
      try {
        console.warn('Versión simple falló, intentando con versión ligera...');
        const response = await totemApi.getEstadisticasLite() as { data: EstadisticasTotem };
        setEstadisticas(response.data);
      } catch (fallbackError) {
        showError('Error cargando estadísticas. Verifique la conexión con la base de datos.');
        console.error('Error cargando estadísticas:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const manejarSincronizacion = async () => {
    const loadingToast = showLoading('Sincronizando datos del TOTEM...');
    try {
      setSyncing(true);
      await totemApi.sincronizar();
      toast.dismiss(loadingToast);
      showSuccess('Sincronización completada exitosamente');
      await cargarEstadisticas();
    } catch (error) {
      toast.dismiss(loadingToast);
      showError('Error durante la sincronización');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header de la página */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Resumen del sistema TOTEM</p>
          </div>
          <button
            onClick={manejarSincronizacion}
            disabled={syncing}
            className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 ${
              syncing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            <ChartBarIcon className="h-5 w-5" />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar TOTEM'}</span>
          </button>
        </div>
      </div>

      {/* Mensaje informativo sobre versión ligera */}
      {estadisticas && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Modo de vista optimizada</h4>
              <p className="text-sm text-blue-700">
                Se está mostrando una vista optimizada de las estadísticas para mejorar el rendimiento.
                Algunas listas detalladas pueden no estar disponibles temporalmente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Registros TOTEM
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {estadisticas?.totalRegistrosTotem?.toLocaleString() || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Exámenes Creados
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {estadisticas?.totalExamenesCreados?.toLocaleString() || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Sectores Sin Mapear
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {estadisticas?.sectoresNoMapeados || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Carreras Sin Mapear
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {estadisticas?.carrerasNoMapeadas || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas y acciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sectores no mapeados */}
        {estadisticas?.sectoresNoMapeados && estadisticas.sectoresNoMapeados > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Sectores Sin Mapear ({estadisticas.sectoresNoMapeados})
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Hay sectores del TOTEM que no están mapeados a facultades.
            </p>
            <a
              href="/mapeos-sectores"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Configurar Mapeos
            </a>
          </div>
        )}

        {/* Carreras no mapeadas */}
        {estadisticas?.carrerasNoMapeadas && estadisticas.carrerasNoMapeadas > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <ClockIcon className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Carreras Sin Mapear ({estadisticas.carrerasNoMapeadas})
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Carreras del TOTEM que requieren mapeo para poder procesar correctamente.
            </p>
            <a
              href="/mapeos-carreras"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Configurar Mapeos
            </a>
          </div>
        )}

        {/* Estado del sistema */}
        {(!estadisticas?.sectoresNoMapeados && !estadisticas?.carrerasNoMapeadas) && (
          <div className="bg-white p-6 rounded-lg shadow col-span-2">
            <div className="flex items-center mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Sistema Configurado Correctamente
              </h2>
            </div>
            <p className="text-gray-600">
              Todos los sectores y carreras del TOTEM están correctamente mapeados. 
              El sistema está listo para procesar los cronogramas de exámenes.
            </p>
          </div>
        )}

        {/* Información sobre optimización */}
        <div className="bg-white p-6 rounded-lg shadow col-span-2">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Información Técnica
            </h2>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Estado de rendimiento:</strong> Sistema optimizado para manejar grandes volúmenes de datos.
            </p>
            <p>
              <strong>Modo actual:</strong> Vista ligera activada para mejorar la velocidad de carga.
            </p>
            <p>
              <strong>Recomendación:</strong> Si necesitas ver listas detalladas, usa las páginas específicas de Mapeos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

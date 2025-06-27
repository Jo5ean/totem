'use client';

import { useState, useEffect } from 'react';
import { totemApi } from '@/lib/api';
import { showSuccess, showError, showLoading } from '@/lib/toast';
import toast from 'react-hot-toast';
import { 
  Cog6ToothIcon,
  ArrowPathIcon,
  ServerIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function ConfiguracionPage() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const verificarEstadoAPI = async () => {
    try {
      setApiStatus('checking');
      await totemApi.getEstadisticas();
      setApiStatus('online');
    } catch (error) {
      setApiStatus('offline');
      console.error('API no disponible:', error);
    }
  };

  const ejecutarSincronizacion = async () => {
    const loadingToast = showLoading('Ejecutando sincronización completa del TOTEM...');
    try {
      setSyncing(true);
      const response = await totemApi.sincronizar();
      toast.dismiss(loadingToast);
      showSuccess('Sincronización completada exitosamente');
      setLastSync(new Date().toISOString());

    } catch (error) {
      toast.dismiss(loadingToast);
      showError('Error durante la sincronización');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  const configuraciones = [
    {
      titulo: 'URL de la API',
      valor: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
      descripcion: 'Dirección base de la API del sistema TOTEM'
    },
    {
      titulo: 'Entorno',
      valor: process.env.NODE_ENV || 'development',
      descripcion: 'Entorno de ejecución actual'
    },
    {
      titulo: 'Versión',
      valor: '1.0.0',
      descripcion: 'Versión actual del backoffice'
    }
  ];

  useEffect(() => {
    verificarEstadoAPI();
    // Verificar estado cada 30 segundos
    const interval = setInterval(verificarEstadoAPI, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center">
          <Cog6ToothIcon className="h-8 w-8 text-gray-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
            <p className="text-gray-600">Gestiona la configuración y mantenimiento del backoffice TOTEM</p>
          </div>
        </div>
      </div>

      {/* Estado de la API */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ServerIcon className="h-6 w-6 mr-2" />
            Estado de la API
          </h2>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${
                apiStatus === 'online' ? 'text-green-600' :
                apiStatus === 'offline' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {apiStatus === 'checking' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>}
                {apiStatus === 'online' && <CheckCircleIcon className="h-6 w-6" />}
                {apiStatus === 'offline' && <ExclamationTriangleIcon className="h-6 w-6" />}
                <span className="font-medium">
                  {apiStatus === 'checking' && 'Verificando...'}
                  {apiStatus === 'online' && 'API en línea'}
                  {apiStatus === 'offline' && 'API no disponible'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}
              </div>
            </div>
            <button
              onClick={verificarEstadoAPI}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Verificar
            </button>
          </div>
        </div>
      </div>

      {/* Sincronización */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ArrowPathIcon className="h-6 w-6 mr-2" />
            Sincronización TOTEM
          </h2>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-4">
            <p className="text-gray-600">
              Ejecuta una sincronización completa de todos los datos del sistema TOTEM centralizado.
              Esto actualizará todos los registros de exámenes desde Google Sheets.
            </p>
            
            {lastSync && (
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-1" />
                Última sincronización: {new Date(lastSync).toLocaleString()}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Importante</h4>
                  <p className="text-sm text-yellow-700">
                    La sincronización puede tomar varios minutos dependiendo de la cantidad de datos.
                    Asegúrate de que todos los mapeos estén configurados antes de ejecutarla.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={ejecutarSincronizacion}
                disabled={syncing || apiStatus !== 'online'}
                className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 ${
                  syncing || apiStatus !== 'online'
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                <ArrowPathIcon className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Sincronizando...' : 'Ejecutar Sincronización'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración del Sistema */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <DocumentTextIcon className="h-6 w-6 mr-2" />
            Configuración del Sistema
          </h2>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-4">
            {configuraciones.map((config, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{config.titulo}</h4>
                  <p className="text-sm text-gray-500">{config.descripcion}</p>
                </div>
                <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                  {config.valor}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Información del Sistema</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Tecnologías Utilizadas</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Next.js 15.3.3</li>
                <li>• React 19</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Heroicons</li>
                <li>• Recharts</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Funcionalidades</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Dashboard con estadísticas</li>
                <li>• Gestión de facultades</li>
                <li>• Mapeos de sectores y carreras</li>
                <li>• Visualización de datos TOTEM</li>
                <li>• Sincronización automática</li>
                <li>• Gráficos y reportes</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Desarrollado para la Universidad Católica de Salta (UCASAL) - Sistema TOTEM de gestión de cronogramas de exámenes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
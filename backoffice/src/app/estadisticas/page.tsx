'use client';

import { useState, useEffect } from 'react';
import { totemApi, EstadisticasTotem, Facultad } from '@/lib/api';
import { showError } from '@/lib/toast';
import { 
  ChartBarIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

export default function EstadisticasPage() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasTotem | null>(null);
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [estadisticasRes, facultadesRes] = await Promise.all([
        totemApi.getEstadisticas() as Promise<{ data: EstadisticasTotem }>,
        totemApi.getFacultades() as Promise<{ data: Facultad[] }>
      ]);
      
      setEstadisticas(estadisticasRes.data);
      setFacultades(facultadesRes.data);
    } catch (error) {
      showError('Error cargando estadísticas');
      console.error(error);
    } finally {
      setLoading(false);
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
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  // Preparar datos para gráficos
  const datosCarreras = facultades.map((facultad) => ({
    nombre: facultad.nombre.length > 20 ? facultad.nombre.substring(0, 20) + '...' : facultad.nombre,
    carreras: facultad._count.carreras,
    sincronizaciones: facultad._count.syncLogs
  }));

  const datosMapeos = [
    { name: 'Sectores Mapeados', value: (estadisticas?.sectoresNoMapeados || 0) > 0 ? 100 - (estadisticas?.sectoresNoMapeados || 0) : 100 },
    { name: 'Sectores Sin Mapear', value: estadisticas?.sectoresNoMapeados || 0 },
  ];

  const datosCarrerasMapeo = [
    { name: 'Carreras Mapeadas', value: (estadisticas?.totalRegistrosTotem || 0) - (estadisticas?.carrerasNoMapeadas || 0) },
    { name: 'Carreras Sin Mapear', value: estadisticas?.carrerasNoMapeadas || 0 },
  ];

  const eficienciaMapeo = estadisticas ? 
    ((estadisticas.totalExamenesCreados / Math.max(estadisticas.totalRegistrosTotem, 1)) * 100).toFixed(1) : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas del Sistema</h1>
        <p className="text-gray-600">Análisis detallado del rendimiento del TOTEM</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Eficiencia de Mapeo
                </dt>
                <dd className="text-2xl font-bold text-blue-600">
                  {eficienciaMapeo}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Registros TOTEM
                </dt>
                <dd className="text-2xl font-bold text-green-600">
                  {estadisticas?.totalRegistrosTotem?.toLocaleString() || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Exámenes Creados
                </dt>
                <dd className="text-2xl font-bold text-orange-600">
                  {estadisticas?.totalExamenesCreados?.toLocaleString() || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartPieIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Facultades
                </dt>
                <dd className="text-2xl font-bold text-purple-600">
                  {facultades.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gráfico de Carreras por Facultad */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Carreras por Facultad
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosCarreras}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="nombre" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="carreras" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Estado de Mapeos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estado de Mapeos de Sectores
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosMapeos}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {datosMapeos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Carreras Mapeadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estado de Mapeo de Carreras
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosCarrerasMapeo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {datosCarrerasMapeo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sincronizaciones por Facultad */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sincronizaciones por Facultad
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosCarreras}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="nombre" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sincronizaciones" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detalles adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lista de sectores no mapeados */}
        {estadisticas?.listaSectoresNoMapeados && estadisticas.listaSectoresNoMapeados.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sectores Sin Mapear
            </h3>
            <div className="space-y-2">
              {estadisticas.listaSectoresNoMapeados.map((sector) => (
                <div key={sector} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="font-medium">Sector {sector}</span>
                  <span className="text-sm text-orange-600">Requiere mapeo</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de carreras no mapeadas */}
        {estadisticas?.listaCarrerasNoMapeadas && estadisticas.listaCarrerasNoMapeadas.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Carreras Sin Mapear (Top 10)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {estadisticas.listaCarrerasNoMapeadas.slice(0, 10).map((carrera) => (
                <div key={carrera.codigoTotem} className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <div>
                    <span className="font-medium">{carrera.codigoTotem}</span>
                    <p className="text-xs text-gray-600">{carrera.nombreTotem}</p>
                  </div>
                  <span className="text-sm text-red-600">Sin mapear</span>
                </div>
              ))}
              {estadisticas.listaCarrerasNoMapeadas.length > 10 && (
                <p className="text-center text-sm text-gray-500">
                  ... y {estadisticas.listaCarrerasNoMapeadas.length - 10} más
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
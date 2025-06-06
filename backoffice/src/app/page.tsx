'use client';

import { useState, useEffect } from 'react';
import { totemApi } from '@/lib/api';

interface DashboardData {
  resumenGeneral: {
    totalExamenes: number;
    totalEstudiantes: number;
    totalAulas: number;
    examenesConAula: number;
    examenesSinAula: number;
    proximosExamenes: number;
  };
  estadisticasPorFacultad: Array<{
    id: number;
    nombre: string;
    totalExamenes: number;
    totalCarreras: number;
  }>;
  proximosExamenes: Array<{
    id: number;
    fecha: string;
    hora: string;
    materia: string;
    carrera: string;
    aula: string;
    estado: string;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await totemApi.getEstadisticas() as { data: DashboardData };
      setData(response.data);
    } catch (err) {
      setError('Error cargando datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await totemApi.sincronizar();
      await loadData(); // Recargar datos después de sincronizar
      alert('Sincronización completada exitosamente!');
    } catch (err) {
      alert('Error en la sincronización');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">TOTEM Backoffice</h1>
              <p className="text-gray-600">Sistema de Gestión de Exámenes</p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`px-6 py-3 rounded-lg font-medium ${
                syncing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {syncing ? 'Sincronizando...' : '🔄 Sincronizar TOTEM'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Exámenes</h3>
            <p className="text-3xl font-bold text-blue-600">{data?.resumenGeneral.totalExamenes || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Con Aula</h3>
            <p className="text-3xl font-bold text-green-600">{data?.resumenGeneral.examenesConAula || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Sin Aula</h3>
            <p className="text-3xl font-bold text-red-600">{data?.resumenGeneral.examenesSinAula || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Próximos</h3>
            <p className="text-3xl font-bold text-orange-600">{data?.resumenGeneral.proximosExamenes || 0}</p>
          </div>
        </div>

        {/* Facultades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Exámenes por Facultad</h2>
            <div className="space-y-4">
              {data?.estadisticasPorFacultad.map((facultad) => (
                <div key={facultad.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{facultad.nombre}</p>
                    <p className="text-sm text-gray-600">{facultad.totalCarreras} carreras</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {facultad.totalExamenes} exámenes
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos exámenes */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Próximos Exámenes</h2>
            <div className="space-y-3">
              {data?.proximosExamenes.slice(0, 5).map((examen) => (
                <div key={examen.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-medium">{examen.materia}</p>
                  <p className="text-sm text-gray-600">{examen.carrera}</p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{examen.fecha} - {examen.hora}</span>
                    <span className={`px-2 py-1 rounded ${
                      examen.estado === 'Completo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {examen.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

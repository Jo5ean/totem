'use client';

import { useState, useEffect } from 'react';
import { UsersIcon, ClockIcon, BuildingOfficeIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { totemApi } from '@/lib/api';
import { SyncButton, SyncStatus } from './SyncButton';

interface EnrollmentStatistics {
  totalInscriptos: number;
  porFacultad: { [facultadId: string]: number };
  porHora: { [hora: string]: number };
  porFecha: { [fecha: string]: number };
}

interface SyncStatusData {
  lastSync: {
    timestamp: string;
    details: {
      totalExams: number;
      totalUpdated: number;
      totalErrors: number;
    };
  } | null;
  statistics: EnrollmentStatistics;
  status: 'synced' | 'never';
}

export function EnrollmentStats() {
  const [stats, setStats] = useState<EnrollmentStatistics | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResponse, statusResponse] = await Promise.all([
        totemApi.getEnrollmentStatistics(),
        totemApi.getEnrollmentSyncStatus()
      ]);

      if ((statsResponse as any).success) {
        setStats((statsResponse as any).data);
      }

      if ((statusResponse as any).success) {
        setSyncStatus((statusResponse as any).data);
      }
    } catch (error) {
      console.error('Error loading enrollment data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncComplete = () => {
    // Reload data after sync
    loadData();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topHours = Object.entries(stats?.porHora || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  const topDates = Object.entries(stats?.porFecha || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Estadísticas de Inscripciones
            </h3>
            <div className="mt-1 flex items-center gap-4">
              <SyncStatus 
                lastSync={syncStatus?.lastSync ? new Date(syncStatus.lastSync.timestamp) : null}
              />
              {syncStatus?.lastSync && (
                <span className="text-sm text-gray-500">
                  {syncStatus.lastSync.details.totalUpdated}/{syncStatus.lastSync.details.totalExams} exámenes actualizados
                </span>
              )}
            </div>
          </div>
          <SyncButton 
            onSyncComplete={handleSyncComplete}
            variant="primary"
            showLabel={true}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Enrollments */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Inscriptos</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats?.totalInscriptos?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Top Time Slot */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Horario Pico</p>
                <p className="text-lg font-bold text-green-900">
                  {topHours[0] ? `${topHours[0][0]} (${topHours[0][1]})` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Faculty Count */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Facultades</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Object.keys(stats?.porFacultad || {}).length}
                </p>
              </div>
            </div>
          </div>

          {/* Top Date */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Fecha Pico</p>
                <p className="text-sm font-bold text-orange-900">
                  {topDates[0] ? (
                    <>
                      {new Date(topDates[0][0]).toLocaleDateString('es-AR')}
                      <br />
                      <span className="text-xs">({topDates[0][1]} inscriptos)</span>
                    </>
                  ) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Time Slots */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Horarios con Más Inscripciones
            </h4>
            <div className="space-y-2">
              {topHours.map(([hora, count], index) => (
                <div key={hora} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`
                      w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}
                    `}>
                      {index + 1}
                    </span>
                    <span className="font-medium">{hora}</span>
                  </div>
                  <span className="text-sm text-gray-600">{count} inscriptos</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Dates */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Fechas con Más Inscripciones
            </h4>
            <div className="space-y-2">
              {topDates.map(([fecha, count], index) => (
                <div key={fecha} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`
                      w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}
                    `}>
                      {index + 1}
                    </span>
                    <span className="font-medium">
                      {new Date(fecha).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{count} inscriptos</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

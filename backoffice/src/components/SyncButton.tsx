'use client';

import { useState } from 'react';
import { ArrowPathIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { totemApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface SyncButtonProps {
  examId?: number;
  onSyncComplete?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function SyncButton({ 
  examId, 
  onSyncComplete, 
  variant = 'ghost',
  size = 'md',
  showLabel = true,
  className = ''
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      let result: any;
      if (examId) {
        // Sync single exam
        result = await totemApi.syncExamEnrollment(examId);
        toast.success(`Inscripciones actualizadas: ${(result as any).data?.enrollmentCount || 0} estudiantes`);
      } else {
        // Sync all exams
        result = await totemApi.syncAllEnrollments();
        toast.success(`Sincronización completa: ${(result as any).data?.totalUpdated || 0} exámenes actualizados`);
      }
      
      setLastSyncTime(new Date());
      onSyncComplete?.();
      
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error(examId ? 'Error al sincronizar examen' : 'Error en sincronización general');
    } finally {
      setIsSyncing(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'p-1 text-xs';
      case 'lg': return 'p-3 text-base';
      default: return 'p-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600';
      case 'secondary':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300';
      default:
        return 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-transparent';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-6 w-6';
      default: return 'h-4 w-4';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={`
          inline-flex items-center gap-2 rounded-md border font-medium
          transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${getSizeClasses()} ${getVariantClasses()} ${className}
        `}
        title={examId ? 'Sincronizar inscripciones de este examen' : 'Sincronizar todas las inscripciones'}
      >
        <ArrowPathIcon 
          className={`${getIconSize()} ${isSyncing ? 'animate-spin' : ''}`} 
        />
        {showLabel && (
          <span>
            {isSyncing 
              ? 'Sincronizando...' 
              : examId 
                ? 'Sincronizar' 
                : 'Sincronizar Todo'
            }
          </span>
        )}
      </button>
      
      {lastSyncTime && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <CheckCircleIcon className="h-3 w-3 text-green-500" />
          <span>
            {lastSyncTime.toLocaleTimeString('es-AR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      )}
    </div>
  );
}

interface SyncStatusProps {
  lastSync?: Date | null;
  className?: string;
}

export function SyncStatus({ lastSync, className = '' }: SyncStatusProps) {
  const getStatusColor = () => {
    if (!lastSync) return 'text-gray-400';
    
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    if (hoursSinceSync < 1) return 'text-green-600';
    if (hoursSinceSync < 24) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (!lastSync) return <ExclamationTriangleIcon className="h-4 w-4" />;
    
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    if (hoursSinceSync < 1) return <CheckCircleIcon className="h-4 w-4" />;
    return <ClockIcon className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!lastSync) return 'Sin sincronizar';
    
    const now = new Date();
    const diffInHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `Hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className={`flex items-center gap-1 text-sm ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}

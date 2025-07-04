'use client';

import { useState, useEffect } from 'react';
import { totemApi, Facultad } from '@/lib/api';
import { showSuccess, showError } from '@/lib/toast';
import { 
  PlusIcon, 
  BuildingOfficeIcon,
  AcademicCapIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

export default function FacultadesPage() {
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    sheetId: ''
  });

  const cargarFacultades = async () => {
    try {
      setLoading(true);
      const response = await totemApi.getFacultades() as { data: Facultad[] };
      setFacultades(response.data);
    } catch (error) {
      showError('Error cargando facultades');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.codigo) {
      showError('Nombre y código son requeridos');
      return;
    }

    try {
      await totemApi.crearFacultad(formData);
      showSuccess('Facultad creada exitosamente');
      setShowForm(false);
      setFormData({ nombre: '', codigo: '', sheetId: '' });
      await cargarFacultades();
    } catch (error) {
      showError('Error creando facultad');
      console.error(error);
    }
  };

  useEffect(() => {
    cargarFacultades();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando facultades...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Facultades</h1>
            <p className="text-gray-600">Administra las facultades del sistema</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nueva Facultad</span>
          </button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nueva Facultad</h2>
          <form onSubmit={manejarSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: FACULTAD DE ECONOMIA Y ADMINISTRACION"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: ECON"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sheet ID (opcional)
              </label>
              <input
                type="text"
                value={formData.sheetId}
                onChange={(e) => setFormData(prev => ({ ...prev, sheetId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ID de Google Sheet específico"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Crear Facultad
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ nombre: '', codigo: '', sheetId: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de facultades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facultades.map((facultad) => (
          <div key={facultad.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{facultad.nombre}</h3>
                  <p className="text-sm text-gray-600">Código: {facultad.codigo}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Carreras</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {facultad._count?.carreras || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Sincronizaciones</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {facultad._count?.syncLogs || 0}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => {
                  // Aquí podrías abrir un modal con más detalles
                  showSuccess(`Viendo detalles de ${facultad.nombre}`);
                }}
              >
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {facultades.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay facultades</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando una nueva facultad.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Nueva Facultad
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
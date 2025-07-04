'use client';

import { useState, useEffect } from 'react';
import { totemApi, ConfiguracionVisual } from '@/lib/api';
import { showSuccess, showError, showLoading } from '@/lib/toast';
import toast from 'react-hot-toast';
import { 
  PhotoIcon,
  PaintBrushIcon,
  EyeIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function ConfiguracionVisualPage() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionVisual>({
    backgroundImage: '',
    titulo: 'Consultá donde rendís tu examen',
    subtitulo: 'UCASAL - Educación Digital',
    colorPrimario: '#dc2626',
    colorSecundario: '#991b1b'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await totemApi.getConfiguracionVisual() as { data: ConfiguracionVisual };
      setConfiguracion(response.data);
    } catch (error) {
      showError('Error cargando configuración visual');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = showLoading('Guardando configuración...');
    
    try {
      setSaving(true);
      await totemApi.actualizarConfiguracionVisual(configuracion);
      toast.dismiss(loadingToast);
      showSuccess('Configuración visual guardada correctamente');
    } catch (error) {
      toast.dismiss(loadingToast);
      showError('Error al guardar la configuración');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ConfiguracionVisual, value: string) => {
    setConfiguracion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const previsualizarSitio = () => {
    window.open('https://wwwold.ucasal.edu.ar/proyectos-innovalab/web/', '_blank');
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Configuración Visual</h1>
            <p className="text-gray-600">Personaliza la apariencia del sitio web público</p>
          </div>
          <button
            onClick={previsualizarSitio}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <EyeIcon className="h-5 w-5" />
            <span>Previsualizar Sitio</span>
          </button>
        </div>
      </div>

      {/* Información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Configuración en tiempo real</h4>
            <p className="text-sm text-blue-700">
              Los cambios se aplicarán inmediatamente en el sitio web público donde los estudiantes consultan sus exámenes.
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={guardarConfiguracion} className="space-y-8">
        {/* Imagen de fondo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <PhotoIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Imagen de Fondo</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de la imagen de fondo
              </label>
              <input
                type="url"
                value={configuracion.backgroundImage || ''}
                onChange={(e) => handleInputChange('backgroundImage', e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Recomendación: Imagen en formato JPG o PNG, resolución mínima 1920x1080px
              </p>
            </div>

            {/* Vista previa de imagen */}
            {configuracion.backgroundImage && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                <div className="relative h-32 w-full rounded-md overflow-hidden border border-gray-300">
                  <img
                    src={configuracion.backgroundImage}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIGNhcmdhbmRvIGltYWdlbjwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Textos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <PaintBrushIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Textos</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título principal
              </label>
              <input
                type="text"
                value={configuracion.titulo || ''}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                placeholder="Consultá donde rendís tu examen"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtítulo
              </label>
              <input
                type="text"
                value={configuracion.subtitulo || ''}
                onChange={(e) => handleInputChange('subtitulo', e.target.value)}
                placeholder="UCASAL - Educación Digital"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Colores */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <PaintBrushIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Colores</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color primario (botón principal)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={configuracion.colorPrimario || '#dc2626'}
                  onChange={(e) => handleInputChange('colorPrimario', e.target.value)}
                  className="h-12 w-20 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={configuracion.colorPrimario || '#dc2626'}
                  onChange={(e) => handleInputChange('colorPrimario', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color secundario (hover del botón)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={configuracion.colorSecundario || '#991b1b'}
                  onChange={(e) => handleInputChange('colorSecundario', e.target.value)}
                  className="h-12 w-20 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={configuracion.colorSecundario || '#991b1b'}
                  onChange={(e) => handleInputChange('colorSecundario', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vista previa del sitio */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h2>
          <div className="relative h-64 rounded-lg overflow-hidden border border-gray-300"
               style={{
                 backgroundImage: configuracion.backgroundImage ? `url(${configuracion.backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               }}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-red-900/80 to-red-800/90"></div>
            
            {/* Contenido simulado */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center">
              <h1 className="text-2xl font-bold mb-2">
                UCASAL <span className="text-red-300">▷</span>
              </h1>
              <p className="text-red-200 text-sm mb-6">Educación Digital</p>
              <h2 className="text-xl font-semibold mb-6">{configuracion.titulo}</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Ingresá tu DNI"
                  className="px-4 py-2 rounded-full text-gray-800 w-64"
                  disabled
                />
                <button
                  className="px-6 py-2 rounded-full font-semibold w-64"
                  style={{
                    backgroundColor: configuracion.colorPrimario,
                    color: 'white'
                  }}
                  disabled
                >
                  Ir ▶
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botón guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 ${
              saving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            <CheckIcon className="h-5 w-5" />
            <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </form>
    </div>
  );
} 
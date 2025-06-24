'use client';

import { useState, useEffect } from 'react';

export default function AsignacionAulasPage() {
  const [examenes, setExamenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [propuestaGenerada, setPropuestaGenerada] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Aulas predefinidas según especificación
  const aulasDefinidas = [
    { id: 1, nombre: 'Aula 4', capacidad: 72, ubicacion: 'Edificio Principal' },
    { id: 2, nombre: 'Aula 8', capacidad: 71, ubicacion: 'Edificio Principal' },
    { id: 3, nombre: 'Aula 12', capacidad: 69, ubicacion: 'Edificio Principal' },
    { id: 4, nombre: 'Laboratorio Informático', capacidad: 34, ubicacion: 'Laboratorio' }
  ];

  // Cargar exámenes sin aula
  const cargarExamenes = async () => {
    try {
      setLoading(true);
      
      const fechaHoy = new Date().toISOString().split('T')[0];
      const fecha30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(`/api/v1/examenes?soloSinAula=true&fechaDesde=${fechaHoy}&fechaHasta=${fecha30Dias}&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setExamenes(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando exámenes:', error);
      setExamenes([]);
    } finally {
      setLoading(false);
    }
  };

  // Generar propuesta de asignación
  const generarPropuesta = async () => {
    try {
      setProcesando(true);
      
      const response = await fetch('/api/v1/asignacion/automatica', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fechaDesde: new Date().toISOString().split('T')[0],
          fechaHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar exámenes con las propuestas
        const examenesConPropuesta = examenes.map((examen: any) => {
          const propuesta = data.data.propuestaAsignacion.find((p: any) => p.examenId === examen.id);
          if (propuesta) {
            return {
              ...examen,
              propuestaAsignacion: propuesta
            };
          }
          return examen;
        });
        
        setExamenes(examenesConPropuesta);
        setPropuestaGenerada(true);
        alert('¡Propuesta de asignación generada exitosamente!');
      } else {
        alert('Error generando propuesta: ' + data.message);
      }
    } catch (error) {
      console.error('Error generando propuesta:', error);
      alert('Error generando propuesta');
    } finally {
      setProcesando(false);
    }
  };

  // Confirmar asignación individual
  const confirmarAsignacion = async (examen: any) => {
    if (!examen.propuestaAsignacion?.aulaId) return;
    
    try {
      const response = await fetch(`/api/v1/examenes/${examen.id}/asignar-aula`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aulaId: examen.propuestaAsignacion.aulaId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Aula asignada a ${examen.materia.nombre}`);
        // Recargar exámenes
        await cargarExamenes();
        setPropuestaGenerada(false);
      } else {
        alert('Error asignando aula: ' + data.message);
      }
    } catch (error) {
      console.error('Error asignando aula:', error);
      alert('Error asignando aula');
    }
  };

  // Confirmar todas las asignaciones viables
  const confirmarTodas = async () => {
    try {
      setProcesando(true);
      
      const asignacionesViables = examenes.filter(ex => ex.propuestaAsignacion?.aulaId);
      
      for (const examen of asignacionesViables) {
        await confirmarAsignacion(examen);
      }
      
      alert(`${asignacionesViables.length} exámenes asignados exitosamente`);
    } catch (error) {
      console.error('Error en asignación masiva:', error);
      alert('Error en asignación masiva');
    } finally {
      setProcesando(false);
    }
  };

  useEffect(() => {
    cargarExamenes();
  }, []);

  // Estadísticas
  const estadisticas = {
    totalExamenes: examenes.length,
    conPropuesta: examenes.filter(ex => ex.propuestaAsignacion?.aulaId).length,
    sinSolucion: examenes.filter(ex => ex.propuestaAsignacion && !ex.propuestaAsignacion.aulaId).length,
    totalCapacidad: aulasDefinidas.reduce((sum, aula) => sum + aula.capacidad, 0)
  };

  // Agrupar exámenes por fecha y hora
  const examenesPorHorario: { [key: string]: any[] } = {};
  examenes.forEach((examen: any) => {
    const clave = `${examen.fecha}-${examen.hora}`;
    if (!examenesPorHorario[clave]) {
      examenesPorHorario[clave] = [];
    }
    examenesPorHorario[clave].push(examen);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando exámenes sin aula...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Asignación Inteligente de Aulas</h1>
            <p className="text-gray-600">
              Sistema automático basado en inscripciones reales • Organización por facultad • Optimización de capacidad
            </p>
          </div>
          <div className="flex space-x-3">
            {!propuestaGenerada ? (
              <button
                onClick={generarPropuesta}
                disabled={procesando || examenes.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 font-medium"
              >
                <span>▶️</span>
                <span>Generar Propuesta</span>
              </button>
            ) : (
              <button
                onClick={confirmarTodas}
                disabled={procesando || estadisticas.conPropuesta === 0}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 font-medium"
              >
                <span>✅</span>
                <span>Confirmar Todo ({estadisticas.conPropuesta})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Información de aulas */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🏫</span>
          Aulas Disponibles - Capacidad Total: {estadisticas.totalCapacidad} personas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {aulasDefinidas.map((aula) => (
            <div key={aula.id} className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-blue-900">{aula.nombre}</span>
                <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full font-medium">
                  {aula.capacidad} personas
                </span>
              </div>
              <div className="text-xs text-blue-700">{aula.ubicacion}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold">{estadisticas.totalExamenes}</div>
          <div className="text-blue-100">Exámenes Sin Aula</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold">{estadisticas.conPropuesta}</div>
          <div className="text-green-100">Con Propuesta Viable</div>
        </div>
        
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold">{estadisticas.sinSolucion}</div>
          <div className="text-red-100">Sin Solución</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold">{estadisticas.totalCapacidad}</div>
          <div className="text-purple-100">Capacidad Total</div>
        </div>
      </div>

      {/* Algoritmo explicado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3">🧮 Algoritmo de Asignación Inteligente</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="space-y-2">
            <p>• <strong>Paso 1:</strong> Agrupa exámenes por fecha y hora</p>
            <p>• <strong>Paso 2:</strong> Organiza por facultad (mismo aula = misma facultad)</p>
            <p>• <strong>Paso 3:</strong> Ordena aulas por capacidad (mayor → menor)</p>
          </div>
          <div className="space-y-2">
            <p>• <strong>Paso 4:</strong> Optimiza ocupación de cada aula</p>
            <p>• <strong>Paso 5:</strong> Valida capacidad vs inscripciones</p>
            <p>• <strong>Paso 6:</strong> Genera propuesta confirmable</p>
          </div>
        </div>
      </div>

      {/* Lista de exámenes */}
      {examenes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Excelente!</h3>
          <p className="text-gray-600 text-lg">No hay exámenes sin aula asignada en los próximos 30 días.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(examenesPorHorario)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([claveHorario, grupoExamenes]) => {
              const [fecha, hora] = claveHorario.split('-');
              
              return (
                <div key={claveHorario} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">📅</span>
                        <div>
                          <h3 className="text-xl font-bold">
                            {new Date(fecha).toLocaleDateString('es-AR', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </h3>
                          <p className="text-gray-200">
                            🕐 {hora} • {grupoExamenes.length} exámenes
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {grupoExamenes.map((examen) => (
                        <div key={examen.id} className="border-2 rounded-lg p-5 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <span className="text-xl">📚</span>
                                <span className="font-bold text-lg text-gray-900">{examen.materia?.nombre || 'Sin materia'}</span>
                                <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                                  {examen.facultad?.nombre || 'Sin facultad'}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                                <div className="flex items-center">
                                  <span className="mr-1">👥</span>
                                  ~30 alumnos (estimado)
                                </div>
                                <div className="flex items-center">
                                  <span className="mr-1">🎓</span>
                                  {examen.carrera?.nombre || 'Sin carrera'}
                                </div>
                              </div>

                              {/* Propuesta de asignación */}
                              {examen.propuestaAsignacion && (
                                <div className={`p-4 rounded-lg border-l-4 ${
                                  examen.propuestaAsignacion.aulaId 
                                    ? 'border-green-500 bg-green-50' 
                                    : 'border-red-500 bg-red-50'
                                }`}>
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className="font-bold text-base flex items-center">
                                        <span className="mr-2">
                                          {examen.propuestaAsignacion.aulaId ? '✅' : '❌'}
                                        </span>
                                        Propuesta: {examen.propuestaAsignacion.aulaNombre}
                                        {examen.propuestaAsignacion.capacidadAula > 0 && 
                                          ` (${examen.propuestaAsignacion.capacidadAula} personas)`
                                        }
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        📍 {examen.propuestaAsignacion.razon}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        🏢 Facultad: {examen.propuestaAsignacion.facultad}
                                      </div>
                                    </div>
                                    
                                    {examen.propuestaAsignacion.aulaId && (
                                      <button
                                        onClick={() => confirmarAsignacion(examen)}
                                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium flex items-center space-x-1"
                                      >
                                        <span>✅</span>
                                        <span>Confirmar</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Footer informativo */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>💡 <strong>Tip:</strong> El sistema optimiza automáticamente la asignación considerando capacidad de aulas y organización por facultades</p>
        <p>🔄 Los datos se actualizan en tiempo real • ⚡ Asignación instantánea</p>
      </div>
    </div>
  );
} 
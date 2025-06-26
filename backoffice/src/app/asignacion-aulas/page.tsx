/// <reference types="react" />
'use client';

import { useState, useEffect } from 'react';

interface Examen {
  id: number;
  nombre: string;
  hora: string;
  carrera: {
    codigo: string;
    nombre: string;
    facultad: string;
  };
  aula: {
    id: number;
    nombre: string;
    capacidad: number;
    ubicacion: string;
  } | null;
  codigoMateria: string | null;
  inscriptos?: number;
  necesitaAsignacion: boolean;
}

interface Aula {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion: string;
}

export default function AsignacionAulasPage() {
  const [examenesPorFecha, setExamenesPorFecha] = useState<{ [fecha: string]: Examen[] }>({});
  const [aulasDisponibles, setAulasDisponibles] = useState<Aula[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [examenSeleccionado, setExamenSeleccionado] = useState<Examen | null>(null);
  const [inscriptos, setInscriptos] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Cargar exámenes por fecha
  const cargarExamenes = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/v1/examenes/por-fecha?soloSinAula=true');
      const data = await response.json();
      
      if (data.success) {
        setExamenesPorFecha(data.data.examenesPorFecha);
        setAulasDisponibles(data.data.aulasDisponibles);
        
        // Seleccionar la primera fecha disponible
        const fechas = Object.keys(data.data.examenesPorFecha).sort();
        if (fechas.length > 0) {
          setFechaSeleccionada(fechas[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando exámenes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener inscriptos de un examen
  const obtenerInscriptos = async (examen: Examen) => {
    try {
      setProcesando(true);
      const response = await fetch(`http://localhost:3000/api/v1/examenes/${examen.id}/inscripciones`);
      const data = await response.json();
      
      if (data.success || data.data) {
        setInscriptos(data.data.inscriptos || []);
        setExamenSeleccionado({
          ...examen,
          inscriptos: data.data.cantidadInscriptos || 0
        });
        setMostrarModal(true);
      } else {
        alert('Error obteniendo inscriptos: ' + (data.error || 'API externa no disponible'));
        // Aún mostrar el modal pero sin inscriptos
        setInscriptos([]);
        setExamenSeleccionado(examen);
        setMostrarModal(true);
      }
    } catch (error) {
      console.error('Error obteniendo inscriptos:', error);
      alert('Error conectando con el servidor');
    } finally {
      setProcesando(false);
    }
  };

  // Asignar aula a un examen
  const asignarAula = async (examenId: number, aulaId: number, observaciones: string = '') => {
    try {
      setProcesando(true);
      
      const response = await fetch(`http://localhost:3000/api/v1/examenes/${examenId}/asignar-aula`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aulaId: aulaId,
          observaciones: observaciones
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Aula "${data.data.asignacion.aulaNueva.nombre}" asignada exitosamente`);
        setMostrarModal(false);
        await cargarExamenes(); // Recargar para actualizar la lista
      } else {
        alert('❌ Error asignando aula: ' + data.error);
      }
    } catch (error) {
      console.error('Error asignando aula:', error);
      alert('❌ Error conectando con el servidor');
    } finally {
      setProcesando(false);
    }
  };

  useEffect(() => {
    cargarExamenes();
  }, []);

  // Obtener estadísticas
  const obtenerEstadisticas = () => {
    const examenesDelDia = examenesPorFecha[fechaSeleccionada] || [];
    return {
      totalExamenes: examenesDelDia.length,
      porFacultad: examenesDelDia.reduce((acc: any, examen) => {
        const facultad = examen.carrera.facultad;
        acc[facultad] = (acc[facultad] || 0) + 1;
        return acc;
      }, {}),
      porHora: examenesDelDia.reduce((acc: any, examen) => {
        const hora = examen.hora || 'Sin hora';
        acc[hora] = (acc[hora] || 0) + 1;
        return acc;
      }, {})
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando exámenes sin aula asignada...</p>
        </div>
      </div>
    );
  }

  const fechas = Object.keys(examenesPorFecha).sort();
  const examenesDelDia = examenesPorFecha[fechaSeleccionada] || [];
  const estadisticas = obtenerEstadisticas();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎯 Asignación de Aulas por Inscriptos Reales
        </h1>
        <p className="text-gray-600">
          Sistema inteligente que consulta inscriptos reales desde la API externa para asignar aulas óptimas
        </p>
      </div>

      {/* Pestañas por fecha */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {fechas.map((fecha) => {
              const cantidadExamenes = examenesPorFecha[fecha].length;
              return (
                <button
                  key={fecha}
                  onClick={() => setFechaSeleccionada(fecha)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    fechaSeleccionada === fecha
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                  <span className="ml-1 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {cantidadExamenes}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {fechaSeleccionada && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">📊 Total del día</h3>
            <p className="text-3xl font-bold text-blue-600">{estadisticas.totalExamenes}</p>
            <p className="text-sm text-gray-500">exámenes sin aula</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">🏫 Por Facultad</h3>
            <div className="space-y-1">
              {Object.entries(estadisticas.porFacultad).map(([facultad, cantidad]) => (
                <div key={facultad} className="flex justify-between text-sm">
                  <span className="truncate">{facultad.replace('FACULTAD DE ', '')}</span>
                  <span className="font-medium">{cantidad as number}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">🏛️ Aulas Disponibles</h3>
            <div className="space-y-1">
              {aulasDisponibles.map((aula) => (
                <div key={aula.id} className="flex justify-between text-sm">
                  <span>{aula.nombre}</span>
                  <span className="font-medium text-green-600">{aula.capacidad} pers.</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lista de exámenes */}
      {fechaSeleccionada && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Exámenes del {new Date(fechaSeleccionada + 'T12:00:00').toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {examenesDelDia.map((examen) => (
              <div key={examen.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {examen.nombre}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {examen.carrera.nombre} • {examen.carrera.facultad.replace('FACULTAD DE ', '')}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            🕐 {examen.hora || 'Sin hora'}
                          </span>
                          {examen.codigoMateria && (
                            <span className="text-sm text-blue-600">
                              📊 Código: {examen.codigoMateria}
                            </span>
                          )}
                          {examen.inscriptos !== undefined && (
                            <span className="text-sm font-medium text-green-600">
                              👥 {examen.inscriptos} inscriptos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => obtenerInscriptos(examen)}
                      disabled={procesando}
                      className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {procesando ? '⏳ Consultando...' : '👥 Ver Inscriptos'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {examenesDelDia.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay exámenes sin aula para esta fecha
                </h3>
                <p className="text-gray-500">
                  Todos los exámenes ya tienen aula asignada o prueba con otra fecha.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de inscriptos y asignación */}
      {mostrarModal && examenSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {examenSeleccionado.nombre}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {examenSeleccionado.carrera.nombre} • {examenSeleccionado.hora}
                  </p>
                </div>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Información de inscriptos */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  📊 Inscriptos ({inscriptos.length})
                </h3>
                
                {inscriptos.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {inscriptos.slice(0, 20).map((inscripto, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{inscripto.nombre}</span>
                          <span className="text-gray-500 ml-2">DNI: {inscripto.dni}</span>
                        </div>
                      ))}
                    </div>
                    {inscriptos.length > 20 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        ... y {inscriptos.length - 20} inscriptos más
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      ⚠️ No se pudieron obtener los inscriptos. La API externa podría no estar disponible o el examen no tiene código de materia mapeado.
                    </p>
                  </div>
                )}
              </div>

              {/* Selección de aula */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  🏛️ Asignar Aula
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aulasDisponibles.map((aula) => {
                    const suficiente = !inscriptos.length || inscriptos.length <= aula.capacidad;
                    return (
                      <button
                        key={aula.id}
                        onClick={() => {
                          if (confirm(`¿Confirmar asignación de ${aula.nombre}?`)) {
                            asignarAula(examenSeleccionado.id, aula.id, 
                              `Asignación manual: ${inscriptos.length} inscriptos`);
                          }
                        }}
                        disabled={procesando}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          suficiente 
                            ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                            : 'border-red-200 bg-red-50'
                        } disabled:opacity-50`}
                      >
                        <div className="font-medium text-gray-900">{aula.nombre}</div>
                        <div className="text-sm text-gray-600">{aula.ubicacion}</div>
                        <div className={`text-sm font-medium mt-1 ${
                          suficiente ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Capacidad: {aula.capacidad}
                          {inscriptos.length > 0 && (
                            <span className="ml-2">
                              ({suficiente ? '✅' : '❌'} {inscriptos.length} inscriptos)
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
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
  const [examenesAsignadosPorFecha, setExamenesAsignadosPorFecha] = useState<{ [fecha: string]: Examen[] }>({});
  const [aulasDisponibles, setAulasDisponibles] = useState<Aula[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>('');
  const [vistaActual, setVistaActual] = useState<'sin-aula' | 'asignados'>('sin-aula');
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [examenSeleccionado, setExamenSeleccionado] = useState<Examen | null>(null);
  const [aulaSeleccionada, setAulaSeleccionada] = useState<number | null>(null);
  const [inscriptos, setInscriptos] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);


  // Cargar exámenes por fecha
  const cargarExamenes = async () => {
    try {
      setLoading(true);
      
      // Cargar exámenes sin aula y con aula asignada
      const [responseSinAula, responseAsignados] = await Promise.all([
        fetch('http://localhost:3000/api/v1/examenes/por-fecha?soloSinAula=true'),
        fetch('http://localhost:3000/api/v1/examenes/por-fecha?soloConAula=true')
      ]);
      
      const [dataSinAula, dataAsignados] = await Promise.all([
        responseSinAula.json(),
        responseAsignados.json()
      ]);
      
      if (dataSinAula.success) {
        // Mapear exámenes sin aula
        const examenesSinAula: { [fecha: string]: Examen[] } = {};
        Object.entries(dataSinAula.data.examenesPorFecha).forEach(([fecha, examenes]) => {
          examenesSinAula[fecha] = (examenes as any[]).map(examen => ({
            id: examen.id,
            nombre: examen.nombre,
            hora: examen.hora,
            carrera: examen.carrera,
            aula: examen.aula,
            codigoMateria: examen.codigoMateria,
            inscriptos: examen.inscriptos,
            necesitaAsignacion: examen.necesitaAsignacion
          }));
        });
        setExamenesPorFecha(examenesSinAula);
        setAulasDisponibles(dataSinAula.data.aulasDisponibles);
      }
      
      if (dataAsignados.success) {
        // Mapear exámenes con aula asignada
        const examenesConAula: { [fecha: string]: Examen[] } = {};
        Object.entries(dataAsignados.data.examenesPorFecha).forEach(([fecha, examenes]) => {
          examenesConAula[fecha] = (examenes as any[]).map(examen => ({
            id: examen.id,
            nombre: examen.nombre,
            hora: examen.hora,
            carrera: examen.carrera,
            aula: examen.aula,
            codigoMateria: examen.codigoMateria,
            inscriptos: examen.inscriptos,
            necesitaAsignacion: examen.necesitaAsignacion
          }));
        });
        setExamenesAsignadosPorFecha(examenesConAula);
      }
      
      // Seleccionar la primera fecha disponible
      const fechasSinAula = Object.keys(examenesPorFecha).sort();
      const fechasAsignados = Object.keys(examenesAsignadosPorFecha).sort();
      const todasLasFechas = [...new Set([...fechasSinAula, ...fechasAsignados])].sort();
      
      if (todasLasFechas.length > 0) {
        setFechaSeleccionada(todasLasFechas[0]);
        // Obtener las horas disponibles para la primera fecha
        const examenesActuales = vistaActual === 'sin-aula' 
          ? examenesPorFecha[todasLasFechas[0]] || []
          : examenesAsignadosPorFecha[todasLasFechas[0]] || [];
        const horasDisponibles = [...new Set(examenesActuales.map(e => e.hora))].filter(Boolean).sort();
        if (horasDisponibles.length > 0) {
          setHoraSeleccionada(horasDisponibles[0]);
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
        const examenConInscriptos = {
          ...examen,
          inscriptos: data.data.cantidadInscriptos || 0
        };
        setExamenSeleccionado(examenConInscriptos);
        setAulaSeleccionada(examen.aula?.id || null); // Inicializar con aula actual si existe
        setMostrarModal(true);
      } else {
        alert('Error obteniendo inscriptos: ' + (data.error || 'API externa no disponible'));
        // Aún mostrar el modal pero sin inscriptos
        setInscriptos([]);
        setExamenSeleccionado(examen);
        setAulaSeleccionada(examen.aula?.id || null); // Inicializar con aula actual si existe
        setMostrarModal(true);
      }
    } catch (error) {
      console.error('Error obteniendo inscriptos:', error);
      alert('Error conectando con el servidor');
    } finally {
      setProcesando(false);
    }
  };



  // Obtener estadísticas de ocupación por aula y horario
  const obtenerEstadisticasAula = (aulaId: number, hora: string) => {
    const examenesEnAula = Object.values(examenesAsignadosPorFecha)
      .flat()
      .filter(examen => examen.aula?.id === aulaId && examen.hora === hora);
    
    return {
      cantidadExamenes: examenesEnAula.length,
      totalInscriptos: examenesEnAula.reduce((total, examen) => total + (examen.inscriptos || 0), 0),
      examenes: examenesEnAula.map(e => ({ nombre: e.nombre, inscriptos: e.inscriptos || 0 }))
    };
  };

  // Asignar aula a un examen (directo, sin confirmación)
  const asignarAula = async (examenId: number, aulaId: number) => {
    try {
      setProcesando(true);
      setAulaSeleccionada(aulaId);
      
      // Asignación directa con todos los inscriptos
      const observacionesExtra = `Asignación: ${inscriptos.length} inscriptos`;
      
      const response = await fetch(`http://localhost:3000/api/v1/examenes/${examenId}/asignar-aula`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aulaId: aulaId,
          observaciones: observacionesExtra
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const { aulaNueva, inscriptosAsignados, resumenUso } = data.data.asignacion;
        
        // Actualizar el examen seleccionado con el aula asignada
        if (examenSeleccionado) {
          const examenActualizado = {
            ...examenSeleccionado,
            aula: {
              id: aulaId,
              nombre: aulaNueva.nombre,
              capacidad: aulaNueva.capacidad,
              ubicacion: aulaNueva.ubicacion || ''
            }
          };
          setExamenSeleccionado(examenActualizado);
          
          // Actualizar también en la lista de exámenes por fecha
          setExamenesPorFecha(prev => {
            const updated = { ...prev };
            if (updated[fechaSeleccionada]) {
              updated[fechaSeleccionada] = updated[fechaSeleccionada].map(examen => 
                examen.id === examenSeleccionado.id ? examenActualizado : examen
              );
            }
            return updated;
          });
        }
        
        // No mostrar alert, solo feedback visual
        
        // Recargar datos en background para mantener consistencia
        cargarExamenes();
      } else {
        alert('❌ Error asignando aula: ' + data.error);
        setAulaSeleccionada(null);
      }
    } catch (error) {
      console.error('Error asignando aula:', error);
      alert('❌ Error conectando con el servidor');
      setAulaSeleccionada(null);
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

  // Obtener datos según la vista actual
  const examenesActuales = vistaActual === 'sin-aula' ? examenesPorFecha : examenesAsignadosPorFecha;
  const fechas = Object.keys(examenesActuales).sort();
  const examenesDelDia = examenesActuales[fechaSeleccionada] || [];
  
  // Obtener horas disponibles para la fecha seleccionada
  const horasDisponibles = [...new Set(examenesDelDia.map(e => e.hora))].filter(Boolean).sort();
  
  // Filtrar exámenes por hora seleccionada
  const examenesFiltrados = horaSeleccionada 
    ? examenesDelDia.filter(e => e.hora === horaSeleccionada)
    : examenesDelDia;
  
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

      {/* Pestañas principales de vista */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setVistaActual('sin-aula');
                // Resetear fecha y hora al cambiar vista
                const fechasDisponibles = Object.keys(examenesPorFecha).sort();
                if (fechasDisponibles.length > 0) {
                  setFechaSeleccionada(fechasDisponibles[0]);
                  const horasDisponibles = [...new Set((examenesPorFecha[fechasDisponibles[0]] || []).map(e => e.hora))].filter(Boolean).sort();
                  setHoraSeleccionada(horasDisponibles[0] || '');
                }
              }}
              className={`py-3 px-1 border-b-2 font-medium text-base ${
                vistaActual === 'sin-aula'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔴 Sin Aula Asignada
              <span className="ml-2 bg-red-100 text-red-600 py-1 px-2 rounded-full text-xs">
                {Object.values(examenesPorFecha).flat().length}
              </span>
            </button>
            
            <button
              onClick={() => {
                setVistaActual('asignados');
                // Resetear fecha y hora al cambiar vista
                const fechasDisponibles = Object.keys(examenesAsignadosPorFecha).sort();
                if (fechasDisponibles.length > 0) {
                  setFechaSeleccionada(fechasDisponibles[0]);
                  const horasDisponibles = [...new Set((examenesAsignadosPorFecha[fechasDisponibles[0]] || []).map(e => e.hora))].filter(Boolean).sort();
                  setHoraSeleccionada(horasDisponibles[0] || '');
                }
              }}
              className={`py-3 px-1 border-b-2 font-medium text-base ${
                vistaActual === 'asignados'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ✅ Con Aula Asignada
              <span className="ml-2 bg-green-100 text-green-600 py-1 px-2 rounded-full text-xs">
                {Object.values(examenesAsignadosPorFecha).flat().length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Pestañas por fecha */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {fechas.map((fecha) => {
              return (
                <button
                  key={fecha}
                  onClick={() => {
                    setFechaSeleccionada(fecha);
                    // Resetear hora seleccionada y seleccionar la primera disponible
                    const examenesDelDia = examenesActuales[fecha] || [];
                    const horasDisponibles = [...new Set(examenesDelDia.map(e => e.hora))].filter(Boolean).sort();
                    if (horasDisponibles.length > 0) {
                      setHoraSeleccionada(horasDisponibles[0]);
                    } else {
                      setHoraSeleccionada('');
                    }
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    fechaSeleccionada === fecha
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Pestañas por hora */}
      {fechaSeleccionada && horasDisponibles.length > 0 && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4">
              {horasDisponibles.map((hora) => {
                const cantidadExamenes = examenesDelDia.filter(e => e.hora === hora).length;
                return (
                  <button
                    key={hora}
                    onClick={() => setHoraSeleccionada(hora)}
                    className={`py-2 px-3 border-b-2 font-medium text-sm ${
                      horaSeleccionada === hora
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🕐 {hora}
                    <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                      {cantidadExamenes}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      {fechaSeleccionada && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">📊 Total del día</h3>
            <p className="text-3xl font-bold text-blue-600">{estadisticas.totalExamenes}</p>
            <p className="text-sm text-gray-500">
              {vistaActual === 'sin-aula' ? 'exámenes sin aula' : 'exámenes con aula'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">🏫 Por Facultad</h3>
            <div className="space-y-1">
              {Object.entries(estadisticas.porFacultad).map(([facultad, cantidad]) => (
                <div key={facultad} className="flex justify-between text-sm text-gray-500">
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
                <div key={aula.id} className="flex justify-between text-sm text-gray-500">
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
              {vistaActual === 'sin-aula' ? '🔴 Exámenes sin aula del' : '✅ Exámenes con aula del'} {new Date(fechaSeleccionada + 'T12:00:00').toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {examenesFiltrados.map((examen) => (
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
                          {/* Mostrar aula asignada */}
                          {examen.aula ? (
                            <span className="text-sm font-medium px-2 py-1 rounded-md bg-purple-100 text-purple-800">
                              🏛️ {examen.aula.nombre}
                            </span>
                          ) : (
                            <span className="text-sm font-medium px-2 py-1 rounded-md bg-red-100 text-red-800">
                              🏛️ Sin aula asignada
                            </span>
                          )}
                          {/* Mostrar inscriptos con indicador visual mejorado */}
                          {examen.inscriptos !== undefined ? (
                            <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                              examen.inscriptos > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              👥 {examen.inscriptos} inscriptos
                              {examen.inscriptos === 0 && ' (revisar filtros)'}
                            </span>
                          ) : (
                            <span className="text-sm font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                              👥 Sin consultar
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
                      {procesando ? '⏳ Consultando...' : vistaActual === 'sin-aula' ? '👥 Ver Inscriptos' : '🔄 Cambiar Aula'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {examenesFiltrados.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {horaSeleccionada 
                    ? `No hay exámenes para las ${horaSeleccionada}` 
                    : vistaActual === 'sin-aula'
                      ? 'No hay exámenes sin aula para esta fecha'
                      : 'No hay exámenes con aula para esta fecha'
                  }
                </h3>
                <p className="text-gray-500">
                  {horaSeleccionada 
                    ? 'Prueba seleccionando otro horario.'
                    : vistaActual === 'sin-aula'
                      ? 'Todos los exámenes ya tienen aula asignada o prueba con otra fecha.'
                      : 'Prueba con otra fecha o asigna aulas en la pestaña "Sin Aula Asignada".'
                  }
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
                  onClick={() => {
                    setMostrarModal(false);
                    setAulaSeleccionada(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Columna de inscriptos */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    📊 Inscriptos ({inscriptos.length})
                  </h3>
                  
                  {inscriptos.length > 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 flex-1" style={{maxHeight: '400px', overflowY: 'auto'}}>
                      <div className="space-y-2">
                        {inscriptos.map((inscripto, index) => (
                          <div key={index} className="text-sm border-b border-gray-200 pb-2">
                            <div className="font-medium text-gray-900">{inscripto.nombre}</div>
                            <div className="text-gray-500">DNI: {inscripto.dni}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ No se pudieron obtener los inscriptos. La API externa podría no estar disponible o el examen no tiene código de materia mapeado.
                      </p>
                    </div>
                  )}
                </div>

                {/* Columna de aulas */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    🏛️ Seleccionar Aula
                    {examenSeleccionado.aula && (
                      <span className="ml-2 text-sm font-normal text-purple-600">
                        (Actual: {examenSeleccionado.aula.nombre})
                      </span>
                    )}
                  </h3>
                  
                  <div className="space-y-3 flex-1" style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {aulasDisponibles.map((aula) => {
                      const isSelected = aulaSeleccionada === aula.id || examenSeleccionado.aula?.id === aula.id;
                      const isCurrentlyAssigned = examenSeleccionado.aula?.id === aula.id;
                      
                      // Obtener estadísticas de ocupación para contexto
                      const horaExamen = examenSeleccionado.hora || '';
                      const statsAula = obtenerEstadisticasAula(aula.id, horaExamen);
                      

                      
                      return (
                        <button
                          key={aula.id}
                          onClick={() => {
                            if (!procesando) {
                              asignarAula(examenSeleccionado.id, aula.id);
                            }
                          }}
                          disabled={procesando}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                            isSelected 
                              ? isCurrentlyAssigned
                                ? 'border-purple-300 bg-purple-100 shadow-md'
                                : 'border-green-300 bg-green-100 shadow-md'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                          } disabled:opacity-50`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{aula.nombre}</div>
                              <div className="text-sm text-gray-600">{aula.ubicacion}</div>
                              <div className="text-sm text-blue-600 mt-1">
                                📍 Capacidad: {aula.capacidad} personas (puede extenderse)
                              </div>
                              
                              {/* Información contextual de ocupación */}
                              {horaExamen && statsAula.totalInscriptos > 0 && (
                                <div className="text-xs text-amber-600 mt-1 bg-amber-50 px-2 py-1 rounded">
                                  🕐 {horaExamen}: {statsAula.totalInscriptos} alumnos en {statsAula.cantidadExamenes} examen(es)
                                </div>
                              )}
                              
                              {inscriptos.length > 0 && (
                                <div className="text-xs font-medium text-green-600 mt-1 bg-green-50 px-2 py-1 rounded">
                                  ➕ Se asignarán {inscriptos.length} alumnos más
                                </div>
                              )}
                              
                              {/* Total resultante */}
                              {horaExamen && statsAula.totalInscriptos > 0 && inscriptos.length > 0 && (
                                <div className="text-xs font-bold text-purple-600 mt-1">
                                  📊 Total en horario: {statsAula.totalInscriptos + inscriptos.length} alumnos
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              {isCurrentlyAssigned ? (
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              ) : isSelected ? (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">●</span>
                                </div>
                              ) : (
                                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { SyncButton } from '@/components/SyncButton';
import { UsersIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
    sede: string;
  } | null;
  codigoMateria: string | null;
  inscriptos?: number;
  necesitaAsignacion: boolean;
}

interface Aula {
  id: number;
  nombre: string;
  capacidad: number;
  sede: string;
  activa?: boolean;
}

interface Estadisticas {
  totalExamenes: number;
  totalInscriptos: number;
  porFacultad: { [facultad: string]: number };
  porHora: { [hora: string]: number };
}

interface Inscripto {
  dni: string;
  nombre: string;
}

interface ExamenAPI {
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
    sede: string;
  } | null;
  codigoMateria: string;
  cantidadInscriptos: number;
  necesitaAsignacion: boolean;
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
  const [inscriptos, setInscriptos] = useState<Inscripto[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);


  // Cargar exámenes por fecha
  const cargarExamenes = async () => {
    try {
      setLoading(true);
      
      // Cargar exámenes sin aula y con aula asignada
      const [responseSinAula, responseAsignados] = await Promise.all([
        fetch('https://totem-api-production.up.railway.app/api/v1/examenes/por-fecha?soloSinAula=true'),
        fetch('https://totem-api-production.up.railway.app/api/v1/examenes/por-fecha?soloConAula=true')
      ]);
      
      const [dataSinAula, dataAsignados] = await Promise.all([
        responseSinAula.json(),
        responseAsignados.json()
      ]);
      
      if (dataSinAula.success) {
        console.log('Datos recibidos de la API (sin aula):', dataSinAula);
        // Mapear exámenes sin aula
        const examenesSinAula: { [fecha: string]: Examen[] } = {};
        Object.entries(dataSinAula.data.examenesPorFecha).forEach(([fecha, examenes]) => {
          examenesSinAula[fecha] = (examenes as ExamenAPI[]).map((examen) => ({
            id: examen.id,
            nombre: examen.nombre,
            hora: examen.hora,
            carrera: examen.carrera,
            aula: examen.aula ? {
              ...examen.aula,
              sede: (examen.aula as any).sede || (examen.aula as any).ubicacion || ''
            } : null,
            codigoMateria: examen.codigoMateria,
            inscriptos: examen.cantidadInscriptos, // ✅ PERSISTIR: Ya viene del backend
            necesitaAsignacion: examen.necesitaAsignacion
          }));
        });
        console.log('Aulas disponibles a establecer:', dataSinAula.data.aulasDisponibles);
        setExamenesPorFecha(examenesSinAula);
        setAulasDisponibles(dataSinAula.data.aulasDisponibles || []);
      }
      
      if (dataAsignados.success) {
        // Mapear exámenes con aula asignada
        const examenesConAula: { [fecha: string]: Examen[] } = {};
        Object.entries(dataAsignados.data.examenesPorFecha).forEach(([fecha, examenes]) => {
          examenesConAula[fecha] = (examenes as ExamenAPI[]).map((examen) => ({
            id: examen.id,
            nombre: examen.nombre,
            hora: examen.hora,
            carrera: examen.carrera,
            aula: examen.aula ? {
              ...examen.aula,
              sede: (examen.aula as any).sede || (examen.aula as any).ubicacion || ''
            } : null,
            codigoMateria: examen.codigoMateria,
            inscriptos: examen.cantidadInscriptos, // ✅ PERSISTIR: Ya viene del backend
            necesitaAsignacion: examen.necesitaAsignacion
          }));
        });
        setExamenesAsignadosPorFecha(examenesConAula);
      }
    } catch (error) {
      console.error('Error cargando exámenes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar solo un examen específico después de sincronización
  const actualizarExamenEspecifico = async (examId: number, nuevoCantidadInscriptos: number) => {
    // Actualizar en examenesPorFecha
    setExamenesPorFecha(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(fecha => {
        newState[fecha] = newState[fecha].map(examen => 
          examen.id === examId 
            ? { ...examen, inscriptos: nuevoCantidadInscriptos }
            : examen
        );
      });
      return newState;
    });

    // Actualizar en examenesAsignadosPorFecha
    setExamenesAsignadosPorFecha(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(fecha => {
        newState[fecha] = newState[fecha].map(examen => 
          examen.id === examId 
            ? { ...examen, inscriptos: nuevoCantidadInscriptos }
            : examen
        );
      });
      return newState;
    });
  };

  // Obtener inscriptos de un examen
  const obtenerInscriptos = async (examen: Examen) => {
    try {
      setProcesando(true);
      const response = await fetch(`https://totem-api-production.up.railway.app/api/v1/examenes/${examen.id}/inscripciones`);
      const data = await response.json();
      
      if (data.success || data.data) {
        const cantidadInscriptos = data.data.cantidadInscriptos || 0;
        setInscriptos(data.data.inscriptos || []);
        const examenConInscriptos = {
          ...examen,
          inscriptos: cantidadInscriptos
        };
        setExamenSeleccionado(examenConInscriptos);
        setAulaSeleccionada(examen.aula?.id || null); // Inicializar con aula actual si existe
        setMostrarModal(true);
        
        // 🔧 ARREGLO: También actualizar la lista principal de exámenes
        actualizarExamenEspecifico(examen.id, cantidadInscriptos);
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

  // Eliminar asignación de aula
  const eliminarAsignacion = async (examenId: number, sinConfirmacion = false) => {
    if (!sinConfirmacion && !window.confirm('¿Estás seguro de que quieres eliminar la asignación de aula? El examen quedará como "Sin Asignar".')) {
      return;
    }

    try {
      setProcesando(true);
      
      const response = await fetch(`https://totem-api-production.up.railway.app/api/v1/examenes/${examenId}/asignar-aula`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`🗑️ Asignación eliminada: Examen ${examenId} → Sin aula`);
        
        // Actualizar estados locales inmediatamente
        setExamenesPorFecha(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(fecha => {
            updated[fecha] = updated[fecha].map(examen => 
              examen.id === examenId 
                ? { ...examen, aula: null, necesitaAsignacion: true }
                : examen
            );
          });
          return updated;
        });
        
        setExamenesAsignadosPorFecha(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(fecha => {
            updated[fecha] = updated[fecha].map(examen => 
              examen.id === examenId 
                ? { ...examen, aula: null, necesitaAsignacion: true }
                : examen
            );
          });
          return updated;
        });
        
        // Actualizar examen seleccionado si está abierto el modal
        if (examenSeleccionado && examenSeleccionado.id === examenId) {
          setExamenSeleccionado(prev => ({
            ...prev!,
            aula: null,
            necesitaAsignacion: true
          }));
          setAulaSeleccionada(null);
        }
        
      } else {
        alert('❌ Error eliminando asignación: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('Error eliminando asignación:', error);
      alert('❌ Error conectando con el servidor');
    } finally {
      setProcesando(false);
    }
  };



  // Obtener estadísticas de ocupación por aula y horario (CORREGIDO: usa vista actual)
  const obtenerEstadisticasAula = (aulaId: number, hora: string) => {
    // 🔧 CORRECCIÓN: Usar datos según la vista actual - si estoy en "sin-aula", mostrar ocupación de los asignados
    const examenesDelDiaAsignados = examenesAsignadosPorFecha[fechaSeleccionada] || [];
    const examenesEnAula = examenesDelDiaAsignados
      .filter(examen => examen.aula?.id === aulaId && examen.hora === hora);
    

    
    return {
      cantidadExamenes: examenesEnAula.length,
      totalInscriptos: examenesEnAula.reduce((total, examen) => total + (examen.inscriptos || 0), 0),
      examenes: examenesEnAula.map(e => ({ nombre: e.nombre, inscriptos: e.inscriptos || 0 }))
    };
  };

  // Asignar aula a un examen (directo desde selector en carta)
  const asignarAula = async (examenId: number, aulaId: number) => {
    try {
      setProcesando(true);
      
      // Encontrar el aula seleccionada para obtener info
      const aulaSeleccionadaInfo = aulasDisponibles.find(a => a.id === aulaId);
      if (!aulaSeleccionadaInfo) {
        alert('❌ Aula no encontrada');
        return;
      }
      
      console.log(`🏛️ Asignando aula "${aulaSeleccionadaInfo.nombre}" al examen ${examenId}`);
      
      const response = await fetch(`https://totem-api-production.up.railway.app/api/v1/examenes/${examenId}/asignar-aula`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aulaId: aulaId,
          observaciones: `Asignación desde selector de carta`
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // ✅ CORREGIR: Acceso correcto a la estructura de respuesta
        const aulaNueva = data.data.asignacion?.aulaNueva || data.data.examen.aula;
        const tipo = data.data.asignacion?.tipo || 'ASIGNACION';
        
        console.log(`✅ ${tipo}: Examen ${examenId} → ${aulaNueva.nombre}`);
        
        // Actualizar estados locales inmediatamente
        const aulaInfo = {
          id: aulaNueva.id,
          nombre: aulaNueva.nombre,
          capacidad: aulaNueva.capacidad,
          sede: (aulaNueva as any).sede || (aulaNueva as any).ubicacion || ''
        };
        
        // Actualizar en ambas listas (sin aula y con aula)
        setExamenesPorFecha(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(fecha => {
            updated[fecha] = updated[fecha].map(examen => 
              examen.id === examenId 
                ? { ...examen, aula: aulaInfo, necesitaAsignacion: false }
                : examen
            );
          });
          return updated;
        });
        
        setExamenesAsignadosPorFecha(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(fecha => {
            updated[fecha] = updated[fecha].map(examen => 
              examen.id === examenId 
                ? { ...examen, aula: aulaInfo, necesitaAsignacion: false }
                : examen
            );
          });
          return updated;
        });
        
        // Actualizar examen seleccionado si está abierto el modal
        if (examenSeleccionado && examenSeleccionado.id === examenId) {
          setExamenSeleccionado(prev => ({
            ...prev!,
            aula: aulaInfo,
            necesitaAsignacion: false
          }));
          setAulaSeleccionada(aulaId);
        }
        
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
  }, [vistaActual]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🔧 MEJORA: Inicializar fecha y hora más próximas automáticamente después de cargar datos
  useEffect(() => {
    if (loading) return; // Esperar a que termine la carga
    
    const examenesActuales = vistaActual === 'sin-aula' ? examenesPorFecha : examenesAsignadosPorFecha;
    const fechasDisponibles = Object.keys(examenesActuales).sort();
    
    if (fechasDisponibles.length > 0 && !fechaSeleccionada) {
      // Buscar la fecha más próxima (hoy o la siguiente disponible)
      const hoy = new Date().toISOString().split('T')[0];
      const fechaMasProxima = fechasDisponibles.find(fecha => fecha >= hoy) || fechasDisponibles[0];
      
      console.log('🔧 Inicializando fecha más próxima:', fechaMasProxima);
      setFechaSeleccionada(fechaMasProxima);
      
      // Obtener las horas disponibles para la fecha más próxima
      const examenesDelDia = examenesActuales[fechaMasProxima] || [];
      const horasDisponibles = [...new Set(examenesDelDia.map((e: Examen) => e.hora))].filter(Boolean).sort();
      
      if (horasDisponibles.length > 0) {
        console.log('🔧 Inicializando hora:', horasDisponibles[0]);
        setHoraSeleccionada(horasDisponibles[0]);
      }
    }
  }, [loading, vistaActual, examenesPorFecha, examenesAsignadosPorFecha, fechaSeleccionada]);

  // Obtener estadísticas
  const obtenerEstadisticas = (): Estadisticas => {
    const examenesActualesDelDia = examenesActuales[fechaSeleccionada] || [];
    
    // Solo contar inscriptos de exámenes que han sido consultados (no undefined)
    const totalInscriptos = examenesActualesDelDia.reduce((total, examen) => {
      return total + (examen.inscriptos !== undefined ? examen.inscriptos : 0);
    }, 0);
    
    return {
      totalExamenes: examenesActualesDelDia.length,
      totalInscriptos: totalInscriptos,
      porFacultad: examenesActualesDelDia.reduce((acc: { [facultad: string]: number }, examen) => {
        const facultad = examen.carrera.facultad;
        acc[facultad] = (acc[facultad] || 0) + 1;
        return acc;
      }, {}),
      porHora: examenesActualesDelDia.reduce((acc: { [hora: string]: number }, examen) => {
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
  
  // 🔧 CORRECCIÓN: No filtrar por inscriptos, solo por hora (mostrar todos los exámenes)
  const examenesFiltrados = horaSeleccionada 
    ? examenesDelDia.filter(e => e.hora === horaSeleccionada)
    : examenesDelDia;
  
  // Separar exámenes por estado de inscriptos para mejor UX
  const examenesConInscriptos = examenesFiltrados.filter(e => e.inscriptos !== undefined && e.inscriptos > 0);
  const examenesSinConsultar = examenesFiltrados.filter(e => e.inscriptos === undefined);
  const examenesSinInscriptos = examenesFiltrados.filter(e => e.inscriptos === 0);
  
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
                // 🔧 MEJORA: Usar fecha más próxima al cambiar vista
                const fechasDisponibles = Object.keys(examenesPorFecha).sort();
                if (fechasDisponibles.length > 0) {
                  const hoy = new Date().toISOString().split('T')[0];
                  const fechaMasProxima = fechasDisponibles.find(fecha => fecha >= hoy) || fechasDisponibles[0];
                  setFechaSeleccionada(fechaMasProxima);
                  const horasDisponibles = [...new Set((examenesPorFecha[fechaMasProxima] || []).map(e => e.hora))].filter(Boolean).sort();
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
                // 🔧 MEJORA: Usar fecha más próxima al cambiar vista
                const fechasDisponibles = Object.keys(examenesAsignadosPorFecha).sort();
                if (fechasDisponibles.length > 0) {
                  const hoy = new Date().toISOString().split('T')[0];
                  const fechaMasProxima = fechasDisponibles.find(fecha => fecha >= hoy) || fechasDisponibles[0];
                  setFechaSeleccionada(fechaMasProxima);
                  const horasDisponibles = [...new Set((examenesAsignadosPorFecha[fechaMasProxima] || []).map(e => e.hora))].filter(Boolean).sort();
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
                    // 🔧 MEJORA: Seleccionar primera hora disponible (extendida por defecto)
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

      {/* 🔧 MEJORA: Pestañas por hora con iconos informativos */}
      {fechaSeleccionada && horasDisponibles.length > 0 && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 overflow-x-auto">
              {horasDisponibles.map((hora) => {
                const examenesDelHorario = examenesDelDia.filter(e => e.hora === hora);
                const cantidadExamenes = examenesDelHorario.length;
                const inscriptosDelHorario = examenesDelHorario.reduce((total, examen) => {
                  return total + (examen.inscriptos !== undefined ? examen.inscriptos : 0);
                }, 0);
                const examenesSinConsultarHorario = examenesDelHorario.filter(e => e.inscriptos === undefined).length;
                
                return (
                  <button
                    key={hora}
                    onClick={() => setHoraSeleccionada(hora)}
                    className={`py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                      horaSeleccionada === hora
                        ? 'border-green-500 text-green-600 bg-green-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* Fila principal con hora */}
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">🕐</span>
                      <span className="font-bold">{hora}</span>
                    </div>
                    
                    {/* Fila de estadísticas */}
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="flex items-center space-x-1">
                        <span>📄</span>
                        <span className="font-medium">{cantidadExamenes}</span>
                        <span className="text-gray-400">exam{cantidadExamenes !== 1 ? 'es' : ''}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span>👥</span>
                        <span className="font-medium text-green-600">{inscriptosDelHorario}</span>
                        {examenesSinConsultarHorario > 0 && (
                          <span className="text-orange-500 font-medium">+{examenesSinConsultarHorario}?</span>
                        )}
                      </div>
                    </div>
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.totalExamenes}</p>
                <p className="text-sm text-gray-500">
                  {vistaActual === 'sin-aula' ? 'exámenes sin aula' : 'exámenes con aula'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{estadisticas.totalInscriptos}</p>
                <p className="text-sm text-gray-500">
                  inscriptos consultados
                  {examenesSinConsultar.length > 0 && (
                    <span className="block text-orange-600 font-medium">
                      +{examenesSinConsultar.length} sin consultar
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">🏫 Exámenes por Facultad</h3>
            <div className="space-y-2">
              {Object.entries(estadisticas.porFacultad).map(([facultad, cantidad]) => {
                // Calcular inscriptos por facultad
                const examenesDelDiaFacultad = (examenesActuales[fechaSeleccionada] || [])
                  .filter(e => e.carrera.facultad === facultad);
                const inscriptosFacultad = examenesDelDiaFacultad.reduce((total, examen) => {
                  return total + (examen.inscriptos !== undefined ? examen.inscriptos : 0);
                }, 0);
                const sinConsultarFacultad = examenesDelDiaFacultad.filter(e => e.inscriptos === undefined).length;
                
                return (
                  <div key={facultad} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-700 truncate flex-1">
                        {facultad.replace('FACULTAD DE ', '').replace('CIENCIAS ', '')}
                      </span>
                      <div className="text-right ml-2">
                        <div className="text-sm font-bold text-blue-600">{cantidad as number} exámenes</div>
                        <div className="text-xs text-green-600">
                          {inscriptosFacultad} inscriptos
                          {sinConsultarFacultad > 0 && (
                            <span className="text-orange-500"> +{sinConsultarFacultad}?</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              🏛️ Ocupación de Aulas
              {horaSeleccionada && (
                <span className="text-sm font-normal text-gray-500 ml-2">({horaSeleccionada})</span>
              )}
            </h3>
            <div className="space-y-2">
              {aulasDisponibles.map((aula) => {
                // Obtener ocupación del aula en el horario seleccionado
                const statsAula = horaSeleccionada ? obtenerEstadisticasAula(aula.id, horaSeleccionada) : null;
                const porcentajeOcupacion = statsAula && statsAula.totalInscriptos > 0 
                  ? Math.round((statsAula.totalInscriptos / aula.capacidad) * 100) 
                  : 0;
                
                return (
                  <div key={aula.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">{aula.nombre}</div>
                        <div className="text-xs text-gray-500">{aula.sede}</div>
                      </div>
                      <div className="text-right ml-2">
                        {horaSeleccionada && statsAula ? (
                          <div>
                            <div className={`text-sm font-bold ${
                              statsAula.totalInscriptos > 0 ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                              {statsAula.totalInscriptos > 0 
                                ? `${statsAula.totalInscriptos}/${aula.capacidad}`
                                : 'Libre'
                              }
                            </div>
                            {statsAula.totalInscriptos > 0 && (
                              <div className={`text-xs ${
                                porcentajeOcupacion > 80 ? 'text-red-600' 
                                : porcentajeOcupacion > 50 ? 'text-orange-600' 
                                : 'text-green-600'
                              }`}>
                                {porcentajeOcupacion}% ({statsAula.cantidadExamenes} exam{statsAula.cantidadExamenes !== 1 ? 'es' : ''})
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-gray-400">
                            {aula.capacidad} cap.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!horaSeleccionada && (
              <div className="text-center text-sm text-gray-400 mt-4">
                Selecciona un horario para ver ocupación en tiempo real
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de exámenes */}
      {fechaSeleccionada && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {vistaActual === 'sin-aula' ? '🔴 Exámenes sin aula del' : '✅ Exámenes con aula del'} {new Date(fechaSeleccionada + 'T12:00:00').toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
              
              {/* Indicador de estado de inscriptos */}
              {(horaSeleccionada && examenesFiltrados.length > 0) && (
                <div className="flex items-center space-x-3 text-sm">
                  {examenesConInscriptos.length > 0 && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md">
                      ✅ {examenesConInscriptos.length} con inscriptos
                    </span>
                  )}
                  {examenesSinConsultar.length > 0 && (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md">
                      ❓ {examenesSinConsultar.length} sin consultar
                    </span>
                  )}
                  {examenesSinInscriptos.length > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md">
                      ⚠️ {examenesSinInscriptos.length} sin inscriptos
                    </span>
                  )}
                </div>
              )}
            </div>
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
                          {/* Mostrar inscriptos con indicador visual mejorado y más claro */}
                          <div className="flex items-center space-x-2">
                            {examen.inscriptos !== undefined && examen.inscriptos !== null ? (
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium px-2 py-1 rounded-md flex items-center gap-1 ${
                                  examen.inscriptos > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  <UsersIcon className="h-4 w-4" />
                                  {examen.inscriptos} inscriptos
                                  {examen.inscriptos === 0 && ' (confirmado: cero)'}
                                </span>
                                <SyncButton 
                                  examId={examen.id} 
                                  onSyncComplete={(examId, newInscriptos) => {
                                    if (examId && newInscriptos !== undefined) {
                                      actualizarExamenEspecifico(examId, newInscriptos);
                                    }
                                  }}
                                  size="sm"
                                  showLabel={false}
                                  className="border-gray-300"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-600 border border-dashed border-gray-300 flex items-center gap-1">
                                  <ExclamationTriangleIcon className="h-4 w-4" />
                                  Sin datos de inscripción
                                </span>
                                <SyncButton 
                                  examId={examen.id} 
                                  onSyncComplete={(examId, newInscriptos) => {
                                    if (examId && newInscriptos !== undefined) {
                                      actualizarExamenEspecifico(examId, newInscriptos);
                                    }
                                  }}
                                  size="sm"
                                  showLabel={false}
                                  variant="secondary"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Selector de aulas directo en la carta */}
                    <div className="flex items-center space-x-2">
                      <select
                        value={examen.aula?.id || ''}
                        onChange={(e) => {
                          const aulaId = e.target.value;
                          if (aulaId) {
                            asignarAula(examen.id, parseInt(aulaId));
                          } else {
                            // Si selecciona "Sin asignar", eliminar aula sin confirmación
                            eliminarAsignacion(examen.id, true);
                          }
                        }}
                        disabled={procesando}
                        className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                      >
                        <option value="" className="text-gray-700">
                          {examen.aula ? '🚫 Sin asignar' : '🏛️ Seleccionar aula...'}
                        </option>
                        {aulasDisponibles
                          .filter(aula => aula.activa !== false) // Solo aulas activas
                          .map(aula => (
                          <option key={aula.id} value={aula.id} className="text-gray-900">
                            {aula.nombre} (Cap: {aula.capacidad})
                          </option>
                        ))}
                      </select>
                      
                      {/* Indicador visual del estado del aula */}
                      {examen.aula && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          ✅ {examen.aula.nombre}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => obtenerInscriptos(examen)}
                      disabled={procesando}
                      className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {procesando ? '⏳ Consultando...' : '👥 Ver Detalle'}
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
                    ? `No hay exámenes programados para las ${horaSeleccionada}` 
                    : vistaActual === 'sin-aula'
                      ? 'No hay exámenes sin aula para esta fecha'
                      : 'No hay exámenes con aula para esta fecha'
                  }
                </h3>
                <p className="text-gray-500">
                  {horaSeleccionada 
                    ? 'Esto significa que no hay ningún examen programado para este horario en esta fecha específica. Prueba seleccionando otro horario.'
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      🏛️ Seleccionar Aula
                      {examenSeleccionado.aula && (
                        <span className="ml-2 text-sm font-normal text-purple-600">
                          (Actual: {examenSeleccionado.aula.nombre})
                        </span>
                      )}
                    </h3>
                    
                    {/* Botón DELETE para eliminar asignación */}
                    {examenSeleccionado.aula && (
                      <button
                        onClick={() => eliminarAsignacion(examenSeleccionado.id)}
                        disabled={procesando}
                        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-200 disabled:opacity-50"
                        title="Eliminar asignación de aula"
                      >
                        {procesando ? (
                          <>🔄 Eliminando...</>
                        ) : (
                          <>🗑️ Sin Asignar</>
                        )}
                      </button>
                    )}
                  </div>
                  
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
                              <div className="text-sm text-gray-600">{aula.sede}</div>
                              <div className="text-sm text-blue-600 mt-1">
                                📍 Capacidad: {aula.capacidad} personas (puede extenderse)
                              </div>
                              
                              {/* Información contextual de ocupación */}
                              {horaExamen && statsAula.totalInscriptos > 0 && (
                                <div className="text-xs text-amber-600 mt-1 bg-amber-50 px-2 py-1 rounded">
                                  🕐 {horaExamen}: Ya asignados {statsAula.totalInscriptos} alumnos ({statsAula.cantidadExamenes} examen{statsAula.cantidadExamenes !== 1 ? 'es' : ''})
                                </div>
                              )}
                              
                              {inscriptos.length > 0 && (
                                <div className="text-xs font-medium text-green-600 mt-1 bg-green-50 px-2 py-1 rounded">
                                  ➕ Se asignarán {inscriptos.length} alumnos{horaExamen && statsAula.totalInscriptos === 0 ? ' (primer examen en este horario)' : ' más'}
                                </div>
                              )}
                              
                              {/* Total resultante */}
                              {horaExamen && statsAula.totalInscriptos > 0 && inscriptos.length > 0 && (
                                <div className="text-xs font-bold text-purple-600 mt-1 bg-purple-50 px-2 py-1 rounded">
                                  📊 Total resultante: {statsAula.totalInscriptos + inscriptos.length} alumnos ({statsAula.totalInscriptos} ya asignados + {inscriptos.length} nuevos)
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
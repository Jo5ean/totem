import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { fechaDesde, fechaHasta, facultadId } = req.body;

    // Aulas disponibles según especificación
    const aulasDisponibles = [
      { id: 1, nombre: 'Aula 4', capacidad: 72 },
      { id: 2, nombre: 'Aula 8', capacidad: 71 },
      { id: 3, nombre: 'Aula 12', capacidad: 69 },
      { id: 4, nombre: 'Laboratorio Informático', capacidad: 34 }
    ];

    // Filtros para exámenes
    const where = {
      aulaId: null, // Solo exámenes sin aula
      fecha: {
        gte: fechaDesde ? new Date(fechaDesde) : new Date(),
        lte: fechaHasta ? new Date(fechaHasta) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    };

    if (facultadId) {
      where.facultadId = parseInt(facultadId);
    }

    // Obtener exámenes sin aula
    const examenes = await prisma.examen.findMany({
      where,
      include: {
        materia: true,
        carrera: true,
        facultad: true
      },
      orderBy: [
        { fecha: 'asc' },
        { hora: 'asc' }
      ]
    });

    // Algoritmo de asignación
    const asignaciones = [];
    const examenesPorHorario = {};

    // Agrupar por fecha y hora
    examenes.forEach(examen => {
      const clave = `${examen.fecha.toISOString().split('T')[0]}-${examen.hora}`;
      if (!examenesPorHorario[clave]) {
        examenesPorHorario[clave] = [];
      }
      examenesPorHorario[clave].push(examen);
    });

    // Procesar cada horario
    for (const [horario, grupoExamenes] of Object.entries(examenesPorHorario)) {
      // Agrupar por facultad
      const examenesPorFacultad = {};
      grupoExamenes.forEach(examen => {
        const facultadId = examen.facultad.id;
        if (!examenesPorFacultad[facultadId]) {
          examenesPorFacultad[facultadId] = [];
        }
        examenesPorFacultad[facultadId].push(examen);
      });

      // Asignar aulas por facultad
      let aulaIndex = 0;
      for (const [facultadId, examenesFacultad] of Object.entries(examenesPorFacultad)) {
        let capacidadUsada = 0;
        let aulaActual = aulasDisponibles[aulaIndex];

        for (const examen of examenesFacultad) {
          // Estimación de alumnos (30 por defecto, se puede mejorar)
          const alumnosEstimados = 30;

          if (!aulaActual || capacidadUsada + alumnosEstimados > aulaActual.capacidad) {
            aulaIndex++;
            aulaActual = aulasDisponibles[aulaIndex];
            capacidadUsada = 0;
          }

          if (aulaActual) {
            asignaciones.push({
              examenId: examen.id,
              aulaId: aulaActual.id,
              aulaNombre: aulaActual.nombre,
              capacidadAula: aulaActual.capacidad,
              alumnosEstimados,
              facultad: examen.facultad.nombre,
              razon: `Asignación automática por facultad`
            });
            capacidadUsada += alumnosEstimados;
          } else {
            asignaciones.push({
              examenId: examen.id,
              aulaId: null,
              aulaNombre: 'Sin aula disponible',
              capacidadAula: 0,
              alumnosEstimados,
              facultad: examen.facultad.nombre,
              razon: 'No hay aulas con capacidad suficiente'
            });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        propuestaAsignacion: asignaciones,
        resumen: {
          totalExamenes: examenes.length,
          asignacionesViables: asignaciones.filter(a => a.aulaId !== null).length,
          sinSolucion: asignaciones.filter(a => a.aulaId === null).length
        },
        aulasDisponibles
      },
      message: 'Propuesta de asignación generada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en asignación automática:', error);

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 
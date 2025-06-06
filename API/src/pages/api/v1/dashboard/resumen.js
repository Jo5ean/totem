import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['GET']
    });
  }

  try {
    // Obtener estadísticas generales en paralelo
    const [
      totalExamenes,
      totalEstudiantes,
      totalAulas,
      totalInscripciones,
      examenesConAula,
      examenesSinAula,
      aulasDisponibles,
      proximosExamenes,
      estudiantesActivos
    ] = await Promise.all([
      // Total de exámenes
      prisma.examen.count(),
      
      // Total de estudiantes
      prisma.estudiante.count(),
      
      // Total de aulas
      prisma.aula.count(),
      
      // Total de inscripciones (actas)
      prisma.actaExamen.count(),
      
      // Exámenes con aula asignada
      prisma.examen.count({ where: { aulaId: { not: null } } }),
      
      // Exámenes sin aula
      prisma.examen.count({ where: { aulaId: null } }),
      
      // Aulas disponibles
      prisma.aula.count({ where: { disponible: true } }),
      
      // Próximos exámenes (próximos 30 días)
      prisma.examen.count({
        where: {
          fecha: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Estudiantes con exámenes próximos
      prisma.estudiante.count({
        where: {
          actasExamen: {
            some: {
              examen: {
                fecha: {
                  gte: new Date(),
                  lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }
      })
    ]);

    // Obtener estadísticas por facultad
    const estadisticasPorFacultad = await prisma.facultad.findMany({
      include: {
        _count: {
          select: {
            carreras: true
          }
        },
        carreras: {
          include: {
            _count: {
              select: {
                examenes: true
              }
            }
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    // Obtener próximos exámenes con detalles
    const proximosExamenesDetalle = await prisma.examen.findMany({
      where: {
        fecha: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // próximos 7 días
        }
      },
      include: {
        carrera: true,
        aula: true,
        _count: {
          select: { actasExamen: true }
        }
      },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      take: 10
    });

    // Calcular porcentajes
    const porcentajeExamenesConAula = totalExamenes > 0 
      ? Math.round((examenesConAula / totalExamenes) * 100) 
      : 0;

    // Alertas del sistema
    const alertas = [];
    
    if (examenesSinAula > 0) {
      alertas.push({
        tipo: 'warning',
        mensaje: `${examenesSinAula} exámenes sin aula asignada`,
        cantidad: examenesSinAula
      });
    }

    if (aulasDisponibles === 0) {
      alertas.push({
        tipo: 'error',
        mensaje: 'No hay aulas disponibles',
        cantidad: 0
      });
    }

    const proximosConflictos = await verificarConflictosProximos();
    if (proximosConflictos.length > 0) {
      alertas.push({
        tipo: 'error',
        mensaje: `${proximosConflictos.length} conflictos de horario detectados`,
        cantidad: proximosConflictos.length,
        detalles: proximosConflictos
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        resumenGeneral: {
          totalExamenes,
          totalEstudiantes,
          totalAulas,
          totalInscripciones,
          examenesConAula,
          examenesSinAula,
          porcentajeExamenesConAula,
          aulasDisponibles,
          proximosExamenes,
          estudiantesActivos
        },
        estadisticasPorFacultad: estadisticasPorFacultad.map(facultad => {
          const totalExamenes = facultad.carreras.reduce((total, carrera) => 
            total + carrera._count.examenes, 0
          );
          return {
            id: facultad.id,
            nombre: facultad.nombre,
            totalExamenes,
            totalCarreras: facultad._count.carreras
          };
        }),
        proximosExamenes: proximosExamenesDetalle.map(examen => ({
          id: examen.id,
          fecha: examen.fecha.toISOString().split('T')[0],
          hora: examen.hora,
          materia: examen.nombreMateria,
          carrera: examen.carrera.nombre,
          aula: examen.aula ? examen.aula.nombre : 'Sin asignar',
          estudiantesInscriptos: examen._count.actasExamen,
          estado: examen.aula ? 'Completo' : 'Pendiente asignación'
        })),
        alertas
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo resumen del dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Función auxiliar para verificar conflictos de horario
async function verificarConflictosProximos() {
  const examenes = await prisma.examen.findMany({
    where: {
      aulaId: { not: null },
      fecha: {
        gte: new Date(),
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    },
    include: {
      aula: true
    },
    orderBy: [{ fecha: 'asc' }, { hora: 'asc' }]
  });

  const conflictos = [];
  const ocupaciones = new Map();

  for (const examen of examenes) {
    const clave = `${examen.aulaId}-${examen.fecha.toISOString().split('T')[0]}-${examen.hora}`;
    
    if (ocupaciones.has(clave)) {
      const examenConflicto = ocupaciones.get(clave);
      conflictos.push({
        aula: examen.aula.nombre,
        fecha: examen.fecha.toISOString().split('T')[0],
        hora: examen.hora,
        examenes: [
          { id: examenConflicto.id, materia: examenConflicto.nombreMateria },
          { id: examen.id, materia: examen.nombreMateria }
        ]
      });
    } else {
      ocupaciones.set(clave, examen);
    }
  }

  return conflictos;
} 
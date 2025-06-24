import prisma from '../../../../lib/db.js';
import ActaExternaService from '../../../../services/actaExternaService.js';

const actaService = new ActaExternaService();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    console.log('📊 Generando dashboard de integración completa...');

    // 1. Estadísticas generales del sistema
    const [
      totalExamenes,
      examenesSinAula,
      examenesConAula,
      totalAulas,
      totalFacultades
    ] = await Promise.all([
      prisma.examen.count(),
      prisma.examen.count({ where: { aulaId: null } }),
      prisma.examen.count({ where: { aulaId: { not: null } } }),
      prisma.aula.count(),
      prisma.facultad.count()
    ]);

    // 2. Exámenes próximos (7 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 7);

    const examenesProximos = await prisma.examen.findMany({
      where: {
        fecha: {
          gte: new Date(),
          lte: fechaLimite
        }
      },
      include: {
        materia: true,
        carrera: true,
        facultad: true,
        aula: true,
        totemData: true
      },
      orderBy: { fecha: 'asc' }
    });

    // 3. Análisis de capacidad para exámenes próximos
    let totalExamenesProximos = examenesProximos.length;
    let examenesConCapacidadConocida = 0;
    let examenesConProblemas = [];

    for (const examen of examenesProximos) {
      if (examen.totemData?.data?.MATERIA) {
        try {
          // Intentar obtener inscripciones (sin esperar mucho tiempo)
          const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 3000)
          );
          
          const consulta = actaService.relacionarAlumnosConExamen(examen.id, {
            rendida: false
          });

          const resultado = await Promise.race([consulta, timeout]);
          
          examenesConCapacidadConocida++;
          
          if (resultado.resumen.requiereAccion) {
            examenesConProblemas.push({
              id: examen.id,
              materia: examen.materia?.nombre || 'N/A',
              fecha: examen.fecha,
              problema: resultado.resumen.tieneAulaAsignada ? 'capacidad_insuficiente' : 'sin_aula',
              totalAlumnos: resultado.inscripciones.totalAlumnos,
              capacidadAula: examen.aula?.capacidad || 0
            });
          }
        } catch (error) {
          // Silenciosamente continuar si hay error de conectividad
          console.log(`⚠️ No se pudo consultar inscripciones para examen ${examen.id}`);
        }
      }
    }

    // 4. Estadísticas por facultad
    const estadisticasPorFacultad = await prisma.facultad.findMany({
      include: {
        _count: {
          select: {
            examenes: true,
            carreras: true
          }
        },
        examenes: {
          where: {
            fecha: {
              gte: new Date()
            }
          },
          select: {
            aulaId: true
          }
        }
      }
    });

    const facultadesConEstadisticas = estadisticasPorFacultad.map(facultad => ({
      id: facultad.id,
      nombre: facultad.nombre,
      codigo: facultad.codigo,
      totalExamenes: facultad._count.examenes,
      totalCarreras: facultad._count.carreras,
      examenesFuturos: facultad.examenes.length,
      examenesFuturosSinAula: facultad.examenes.filter(e => !e.aulaId).length,
      porcentajeAsignacion: facultad.examenes.length > 0 ? 
        ((facultad.examenes.filter(e => e.aulaId).length / facultad.examenes.length) * 100).toFixed(1) : 0
    }));

    // 5. Estado de aulas
    const aulasConUso = await prisma.aula.findMany({
      include: {
        _count: {
          select: {
            examenes: {
              where: {
                fecha: {
                  gte: new Date()
                }
              }
            }
          }
        }
      },
      orderBy: { capacidad: 'desc' }
    });

    const estadisticasAulas = {
      totalAulas,
      capacidadTotal: aulasConUso.reduce((sum, aula) => sum + aula.capacidad, 0),
      aulasEnUso: aulasConUso.filter(aula => aula._count.examenes > 0).length,
      aulasSinUso: aulasConUso.filter(aula => aula._count.examenes === 0).length,
      distribucionUso: aulasConUso.map(aula => ({
        nombre: aula.nombre,
        capacidad: aula.capacidad,
        examenesAsignados: aula._count.examenes,
        porcentajeUso: ((aula._count.examenes / Math.max(totalExamenes, 1)) * 100).toFixed(1)
      }))
    };

    // 6. Resumen de integración
    const estadoIntegracion = {
      sistemaTotem: {
        activo: true,
        ultimaSincronizacion: await obtenerUltimaSincronizacion()
      },
      sistemaExterno: {
        disponible: examenesConCapacidadConocida > 0,
        examenesConsultados: examenesConCapacidadConocida,
        examenesProximos: totalExamenesProximos
      },
      sistemaAulas: {
        configurado: totalAulas > 0,
        porcentajeAsignacion: totalExamenes > 0 ? 
          ((examenesConAula / totalExamenes) * 100).toFixed(1) : 0
      }
    };

    return res.status(200).json({
      success: true,
      data: {
        resumenGeneral: {
          totalExamenes,
          examenesSinAula,
          examenesConAula,
          totalAulas,
          totalFacultades,
          porcentajeAsignacion: totalExamenes > 0 ? 
            ((examenesConAula / totalExamenes) * 100).toFixed(1) : 0
        },
        examenesProximos: {
          total: totalExamenesProximos,
          conCapacidadConocida: examenesConCapacidadConocida,
          conProblemas: examenesConProblemas.length,
          problemas: examenesConProblemas
        },
        facultades: facultadesConEstadisticas,
        aulas: estadisticasAulas,
        estadoIntegracion
      },
      metadata: {
        generadoEn: new Date().toISOString(),
        rangoAnalisis: '7 días próximos',
        sistemaExterno: 'sistemasweb-desa.ucasal.edu.ar'
      }
    });

  } catch (error) {
    console.error('❌ Error generando dashboard:', error);

    return res.status(500).json({
      success: false,
      message: 'Error generando dashboard de integración',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function obtenerUltimaSincronizacion() {
  try {
    const ultimoTotem = await prisma.totemData.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    });
    return ultimoTotem?.timestamp || null;
  } catch (error) {
    return null;
  }
} 
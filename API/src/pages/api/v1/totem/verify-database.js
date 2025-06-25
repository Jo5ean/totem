import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido. Usa GET.`
    });
  }

  try {
    console.log('🔍 Verificando datos en la base de datos...');

    // 1. Conteos generales
    const [
      totalExamenes,
      totalExamenesActivos,
      totalExamenesConAula,
      totalExamenesTotem,
      totalCarreras,
      totalFacultades,
      totalAulas,
      totalSectoresMapeados,
      totalCarrerasTotem
    ] = await Promise.all([
      prisma.examen.count(),
      prisma.examen.count({ where: { activo: true } }),
      prisma.examen.count({ where: { aulaId: { not: null } } }),
      prisma.examenTotem.count(),
      prisma.carrera.count(),
      prisma.facultad.count(),
      prisma.aula.count(),
      prisma.sectorFacultad.count(),
      prisma.carreraTotem.count()
    ]);

    // 2. Últimos exámenes creados
    const ultimosExamenes = await prisma.examen.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        carrera: {
          include: {
            facultad: true
          }
        },
        aula: true,
        examenTotem: true
      }
    });

    // 3. Distribución por fecha
    const examenesPorFecha = await prisma.examen.groupBy({
      by: ['fecha'],
      _count: {
        id: true
      },
      orderBy: {
        fecha: 'asc'
      },
      take: 10
    });

    // 4. Exámenes sin aula asignada
    const examenesSinAula = await prisma.examen.findMany({
      where: { aulaId: null },
      take: 5,
      include: {
        carrera: {
          include: {
            facultad: true
          }
        }
      }
    });

    // 5. Estadísticas de TotemData
    const ultimosTotemData = await prisma.totemData.findMany({
      take: 3,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        sheetName: true,
        timestamp: true,
        processed: true
      }
    });

    // 6. Mapeos pendientes
    const carrerasNoMapeadas = await prisma.carreraTotem.count({
      where: { esMapeada: false }
    });

    const sectoresUnicos = await prisma.examenTotem.groupBy({
      by: ['sectorTotem'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    return res.status(200).json({
      success: true,
      message: 'Verificación de base de datos completada',
      timestamp: new Date().toISOString(),
      data: {
        resumen: {
          totalExamenes,
          totalExamenesActivos,
          totalExamenesConAula,
          totalExamenesSinAula: totalExamenes - totalExamenesConAula,
          totalExamenesTotem,
          totalCarreras,
          totalFacultades,
          totalAulas,
          totalSectoresMapeados,
          totalCarrerasTotem,
          carrerasNoMapeadas,
          porcentajeConAula: totalExamenes > 0 ? Math.round((totalExamenesConAula / totalExamenes) * 100) : 0
        },
        ultimosExamenes: ultimosExamenes.map(e => ({
          id: e.id,
          nombreMateria: e.nombreMateria,
          fecha: e.fecha.toISOString().split('T')[0],
          hora: e.hora,
          facultad: e.carrera?.facultad?.nombre,
          carrera: e.carrera?.nombre,
          aula: e.aula?.nombre || 'Sin asignar',
          tieneTotemData: !!e.examenTotem,
          createdAt: e.createdAt
        })),
        examenesPorFecha: examenesPorFecha.map(e => ({
          fecha: e.fecha.toISOString().split('T')[0],
          cantidad: e._count.id
        })),
        examenesSinAula: examenesSinAula.slice(0, 3).map(e => ({
          id: e.id,
          nombreMateria: e.nombreMateria,
          fecha: e.fecha.toISOString().split('T')[0],
          facultad: e.carrera?.facultad?.nombre,
          carrera: e.carrera?.nombre
        })),
        ultimosTotemData: ultimosTotemData,
        sectoresUnicos: sectoresUnicos.map(s => ({
          sector: s.sectorTotem,
          cantidad: s._count.id
        })),
        status: {
          baseDatosOperativa: totalExamenes > 0,
          sincronizacionReciente: ultimosTotemData.length > 0,
          mapeosPendientes: carrerasNoMapeadas > 0,
          asignacionAulasPendiente: (totalExamenes - totalExamenesConAula) > 0
        }
      }
    });

  } catch (error) {
    console.error('❌ ERROR verificando base de datos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error verificando base de datos',
      message: error.message
    });
  }
} 
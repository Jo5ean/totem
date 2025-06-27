import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido'
    });
  }

  try {
    const { fechaDesde, fechaHasta, soloSinAula, soloConAula } = req.query;

    // Construir filtros
    const where = {};

    if (fechaDesde) {
      where.fecha = {
        ...where.fecha,
        gte: new Date(fechaDesde)
      };
    }

    if (fechaHasta) {
      where.fecha = {
        ...where.fecha,
        lte: new Date(fechaHasta)
      };
    }

    // Si no se especifican fechas, usar próximos 30 días
    if (!fechaDesde && !fechaHasta) {
      const hoy = new Date();
      const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      where.fecha = {
        gte: hoy,
        lte: en30Dias
      };
    }

    // Filtrar solo exámenes sin aula si se solicita
    if (soloSinAula === 'true') {
      where.aulaId = null;
    }
    
    // Filtrar solo exámenes con aula si se solicita
    if (soloConAula === 'true') {
      where.aulaId = { not: null };
    }

    console.log(`📅 Consultando exámenes con filtros:`, where);

    // Obtener exámenes con include (no select para evitar problemas)
    const examenes = await prisma.examen.findMany({
      where,
      include: {
        carrera: {
          include: {
            facultad: true
          }
        },
        aula: true,
        examenTotem: true // ✅ Incluir todo el objeto examenTotem
      },
      orderBy: [
        { fecha: 'asc' },
        { hora: 'asc' },
        { nombreMateria: 'asc' }
      ]
    });

    console.log(`✅ Encontrados ${examenes.length} exámenes`);

    // Agrupar por fecha usando datos locales optimizados
    const examenesPorFecha = {};
    const fechasUnicas = new Set();

    console.log(`📊 Procesando ${examenes.length} exámenes con datos locales (actualizado)...`);

    for (const examen of examenes) {
      const fechaStr = examen.fecha ? examen.fecha.toISOString().split('T')[0] : 'Sin fecha';
      fechasUnicas.add(fechaStr);

      if (!examenesPorFecha[fechaStr]) {
        examenesPorFecha[fechaStr] = [];
      }

      // Obtener código de materia (examenTotem es un objeto, no array)
      const codigoMateria = examen.examenTotem?.materiaTotem || null;
      
      // DEBUG: Log específico para examen 6177
      if (examen.id === 6177) {
        console.log(`🔍 DEBUG Examen 6177:`);
        console.log(`   cantidadInscriptos: ${JSON.stringify(examen.cantidadInscriptos)}`);
        console.log(`   fechaUltConsulta: ${examen.fechaUltConsulta}`);
        console.log(`   Resultado inscriptos: ${examen.cantidadInscriptos || 0}`);
        console.log(`   Todas las propiedades:`, Object.keys(examen));
      }

      examenesPorFecha[fechaStr].push({
        id: examen.id,
        nombre: examen.nombreMateria,
        hora: examen.hora ? examen.hora.toTimeString().split(' ')[0].substring(0, 5) : null,
        carrera: {
          codigo: examen.carrera.codigo,
          nombre: examen.carrera.nombre,
          facultad: examen.carrera.facultad.nombre
        },
        aula: examen.aula ? {
          id: examen.aula.id,
          nombre: examen.aula.nombre,
          capacidad: examen.aula.capacidad,
          ubicacion: examen.aula.ubicacion
        } : null,
        tipoExamen: examen.tipoExamen,
        modalidad: examen.modalidadExamen || 'presencial',
        observaciones: examen.observaciones,
        requierePc: examen.requierePc || false,
        // Datos del TOTEM (corregido: examenTotem es objeto, no array)
        codigoMateria: codigoMateria,
        areaTema: examen.examenTotem?.areaTemaTotem || null,
        carreraTotem: examen.examenTotem?.carreraTotem || null,
        docente: examen.examenTotem?.docenteTotem || null,
        monitoreo: examen.examenTotem?.monitoreoTotem || null,
        control: examen.examenTotem?.controlTotem || null,
        // Datos de inscriptos (ahora desde BD local)
        inscriptos: examen.cantidadInscriptos || 0,
        estadoInscriptos: examen.cantidadInscriptos !== null ? 'success' : 'sin-consultar',
        ultimaActualizacion: examen.fechaUltConsulta,
        // Estado de asignación
        necesitaAsignacion: !examen.aula,
        createdAt: examen.createdAt
      });
    }

    // Obtener estadísticas de aulas disponibles
    const aulas = await prisma.aula.findMany({
      where: { disponible: true },
      orderBy: { capacidad: 'asc' }
    });

    // Calcular estadísticas por fecha
    const estadisticasPorFecha = {};
    for (const fecha of fechasUnicas) {
      const examenesDelDia = examenesPorFecha[fecha];
      estadisticasPorFecha[fecha] = {
        total: examenesDelDia.length,
        conAula: examenesDelDia.filter(e => e.aula).length,
        sinAula: examenesDelDia.filter(e => !e.aula).length,
        porcentajeAsignado: examenesDelDia.length > 0 
          ? Math.round((examenesDelDia.filter(e => e.aula).length / examenesDelDia.length) * 100)
          : 0
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        examenesPorFecha,
        estadisticasPorFecha,
        aulasDisponibles: aulas.map(a => ({
          id: a.id,
          nombre: a.nombre,
          capacidad: a.capacidad,
          ubicacion: a.ubicacion
        })),
        resumen: {
          totalExamenes: examenes.length,
          fechasUnicas: Array.from(fechasUnicas).sort(),
          totalConAula: examenes.filter(e => e.aula).length,
          totalSinAula: examenes.filter(e => !e.aula).length,
          porcentajeAsignado: examenes.length > 0 
            ? Math.round((examenes.filter(e => e.aula).length / examenes.length) * 100)
            : 0
        }
      },
      filtros: {
        fechaDesde: fechaDesde || 'hoy',
        fechaHasta: fechaHasta || 'próximos 30 días',
        soloSinAula: soloSinAula === 'true',
        soloConAula: soloConAula === 'true'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo exámenes por fecha:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 
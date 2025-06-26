import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido'
    });
  }

  try {
    const { fechaDesde, fechaHasta, soloSinAula } = req.query;

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

    console.log(`📅 Consultando exámenes con filtros:`, where);

    // Obtener exámenes
    const examenes = await prisma.examen.findMany({
      where,
      include: {
        carrera: {
          include: {
            facultad: true
          }
        },
        aula: true,
        examenTotem: {
          select: {
            materiaTotem: true,
            docenteTotem: true,
            monitoreoTotem: true,
            controlTotem: true
          }
        }
      },
      orderBy: [
        { fecha: 'asc' },
        { hora: 'asc' },
        { nombreMateria: 'asc' }
      ]
    });

    console.log(`✅ Encontrados ${examenes.length} exámenes`);

    // Agrupar por fecha y consultar inscriptos
    const examenesPorFecha = {};
    const fechasUnicas = new Set();

    console.log(`🔍 Consultando inscriptos para ${examenes.length} exámenes...`);

    for (const examen of examenes) {
      const fechaStr = examen.fecha ? examen.fecha.toISOString().split('T')[0] : 'Sin fecha';
      fechasUnicas.add(fechaStr);

      if (!examenesPorFecha[fechaStr]) {
        examenesPorFecha[fechaStr] = [];
      }

      // Obtener código de materia
      const codigoMateria = examen.examenTotem && examen.examenTotem.length > 0 
        ? examen.examenTotem[0].materiaTotem 
        : null;

      // Consultar inscriptos si tiene código de materia
      let inscriptos = 0;
      let estadoInscriptos = 'sin-codigo'; // sin-codigo, consultando, error, success

      if (codigoMateria) {
        try {
          estadoInscriptos = 'consultando';
          
          const fechaDesde = new Date().toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          
          const fechaHasta = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          const apiUrl = `https://sistemasweb-desa.ucasal.edu.ar/api/v1/acta/materia/${codigoMateria}?rendida=false&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
          
          const response = await fetch(apiUrl);
          
          if (response.ok) {
            const inscriptosData = await response.json();
            if (Array.isArray(inscriptosData)) {
              inscriptos = inscriptosData.length;
              estadoInscriptos = 'success';
            } else {
              estadoInscriptos = 'error';
            }
          } else {
            estadoInscriptos = 'error';
          }
        } catch (error) {
          console.log(`⚠️ Error consultando inscriptos para materia ${codigoMateria}:`, error.message);
          estadoInscriptos = 'error';
        }
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
        // Datos del TOTEM
        codigoMateria: codigoMateria,
        docente: examen.examenTotem && examen.examenTotem.length > 0 
          ? examen.examenTotem[0].docenteTotem 
          : null,
        monitoreo: examen.examenTotem && examen.examenTotem.length > 0 
          ? examen.examenTotem[0].monitoreoTotem 
          : null,
        control: examen.examenTotem && examen.examenTotem.length > 0 
          ? examen.examenTotem[0].controlTotem 
          : null,
        // Datos de inscriptos
        inscriptos: inscriptos,
        estadoInscriptos: estadoInscriptos,
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
        soloSinAula: soloSinAula === 'true'
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
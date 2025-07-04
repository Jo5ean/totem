import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    const {
      facultadId,
      carreraId,
      fechaDesde,
      fechaHasta,
      soloSinAula,
      soloProximos,
      page = 1,
      limit = 50
    } = req.query;

    // Construir filtros dinámicos
    const where = {};

    if (facultadId) {
      where.facultadId = parseInt(facultadId);
    }

    if (carreraId) {
      where.carreraId = parseInt(carreraId);
    }

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

    if (soloSinAula === 'true') {
      where.aulaId = null;
    }

    if (soloProximos === 'true') {
      where.fecha = {
        ...where.fecha,
        gte: new Date()
      };
    }

    // Calcular paginación
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Obtener exámenes con relaciones
    const [examenes, total] = await Promise.all([
      prisma.examen.findMany({
        where,
        include: {
          materia: {
            select: {
              id: true,
              nombre: true,
              codigo: true
            }
          },
          carrera: {
            select: {
              id: true,
              nombre: true
            }
          },
          facultad: {
            select: {
              id: true,
              nombre: true,
              codigo: true
            }
          },
          aula: {
            select: {
              id: true,
              nombre: true,
              capacidad: true,
              ubicacion: true
            }
          },
          totemData: {
            select: {
              data: true
            }
          }
        },
        orderBy: [
          { fecha: 'asc' },
          { hora: 'asc' }
        ],
        skip,
        take: limitNumber
      }),
      prisma.examen.count({ where })
    ]);

    // Información de paginación
    const totalPages = Math.ceil(total / limitNumber);
    const hasNext = pageNumber < totalPages;
    const hasPrev = pageNumber > 1;

    return res.status(200).json({
      success: true,
      data: examenes,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages,
        hasNext,
        hasPrev
      },
      metadata: {
        filtrosAplicados: {
          facultadId: facultadId ? parseInt(facultadId) : null,
          carreraId: carreraId ? parseInt(carreraId) : null,
          fechaDesde,
          fechaHasta,
          soloSinAula: soloSinAula === 'true',
          soloProximos: soloProximos === 'true'
        },
        consultadoEn: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo exámenes:', error);

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 
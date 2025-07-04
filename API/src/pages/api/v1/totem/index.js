import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  // Validar método HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['GET']
    });
  }

  try {
    // Obtener parámetros de paginación
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Validar parámetros de paginación
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro page debe ser un número mayor a 0'
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro limit debe ser un número entre 1 y 100'
      });
    }

    const offset = (pageNum - 1) * limitNum;

    // Obtener datos
    const [data, total] = await Promise.all([
      prisma.totemData.findMany({
        skip: offset,
        take: limitNum,
        orderBy: {
          timestamp: 'desc'
        },
        select: {
          id: true,
          sheetName: true,
          data: true,
          timestamp: true,
          processed: true
        }
      }),
      prisma.totemData.count()
    ]);

    // Calcular paginación
    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo datos TOTEM:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener datos',
      message: error.message
    });
  }
}

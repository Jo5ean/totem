import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        return res.status(405).json({
          success: false,
          error: `Método ${req.method} no permitido`,
          allowedMethods: ['GET', 'POST']
        });
    }
  } catch (error) {
    console.error('Error en aulas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

async function handleGet(req, res) {
  const { page = 1, limit = 20, disponible, search } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // Construir filtros
  const where = {};
  if (disponible !== undefined) {
    where.disponible = disponible === 'true';
  }
  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { ubicacion: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [aulas, total] = await Promise.all([
    prisma.aula.findMany({
      where,
      skip: offset,
      take: limitNum,
      include: {
        _count: {
          select: { examenes: true }
        }
      },
      orderBy: { nombre: 'asc' }
    }),
    prisma.aula.count({ where })
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return res.status(200).json({
    success: true,
    data: aulas,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    }
  });
}

async function handlePost(req, res) {
  const { nombre, capacidad, ubicacion, disponible = true } = req.body;

  // Validaciones
  if (!nombre) {
    return res.status(400).json({
      success: false,
      error: 'El nombre del aula es requerido'
    });
  }

  // Verificar que no exista aula con el mismo nombre
  const existingAula = await prisma.aula.findUnique({
    where: { nombre }
  });

  if (existingAula) {
    return res.status(409).json({
      success: false,
      error: 'Ya existe un aula con ese nombre'
    });
  }

  const aula = await prisma.aula.create({
    data: {
      nombre,
      capacidad: capacidad ? parseInt(capacidad) : null,
      ubicacion,
      disponible
    }
  });

  return res.status(201).json({
    success: true,
    data: aula,
    message: 'Aula creada exitosamente'
  });
} 
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
    console.error('Error en actas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

async function handleGet(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    examenId, 
    estudianteId, 
    dni,
    search 
  } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // Construir filtros
  const where = {};
  if (examenId) where.examenId = parseInt(examenId);
  if (estudianteId) where.estudianteId = parseInt(estudianteId);
  
  // Filtro por DNI del estudiante
  if (dni) {
    where.estudiante = {
      dni: dni
    };
  }

  // Búsqueda general
  if (search) {
    where.OR = [
      {
        estudiante: {
          OR: [
            { dni: { contains: search } },
            { nombre: { contains: search, mode: 'insensitive' } },
            { apellido: { contains: search, mode: 'insensitive' } }
          ]
        }
      },
      {
        examen: {
          materia: {
            nombre: { contains: search, mode: 'insensitive' }
          }
        }
      }
    ];
  }

  const [actas, total] = await Promise.all([
    prisma.actaExamen.findMany({
      where,
      skip: offset,
      take: limitNum,
      include: {
        estudiante: true,
        examen: {
          include: {
            materia: true,
            carrera: true,
            aula: true
          }
        }
      },
      orderBy: [
        { examen: { fecha: 'asc' } },
        { estudiante: { apellido: 'asc' } }
      ]
    }),
    prisma.actaExamen.count({ where })
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return res.status(200).json({
    success: true,
    data: actas,
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
  const { examenId, estudiantes } = req.body;

  // Validaciones
  if (!examenId || !estudiantes || !Array.isArray(estudiantes)) {
    return res.status(400).json({
      success: false,
      error: 'examenId y estudiantes (array) son requeridos'
    });
  }

  // Verificar que el examen existe
  const examen = await prisma.examen.findUnique({
    where: { id: parseInt(examenId) }
  });

  if (!examen) {
    return res.status(404).json({
      success: false,
      error: 'Examen no encontrado'
    });
  }

  const resultados = {
    creados: [],
    errores: [],
    duplicados: []
  };

  for (const estudianteData of estudiantes) {
    try {
      const { dni, nombre, apellido, email } = estudianteData;

      if (!dni || !nombre || !apellido) {
        resultados.errores.push({
          dni,
          error: 'DNI, nombre y apellido son requeridos'
        });
        continue;
      }

      // Buscar o crear estudiante
      let estudiante = await prisma.estudiante.findUnique({
        where: { dni }
      });

      if (!estudiante) {
        estudiante = await prisma.estudiante.create({
          data: { dni, nombre, apellido, email }
        });
      }

      // Verificar si ya existe el acta
      const actaExistente = await prisma.actaExamen.findUnique({
        where: {
          examenId_estudianteId: {
            examenId: parseInt(examenId),
            estudianteId: estudiante.id
          }
        }
      });

      if (actaExistente) {
        resultados.duplicados.push({
          dni,
          estudiante: `${nombre} ${apellido}`,
          message: 'Ya está inscripto en este examen'
        });
        continue;
      }

      // Crear el acta
      const acta = await prisma.actaExamen.create({
        data: {
          examenId: parseInt(examenId),
          estudianteId: estudiante.id,
          presente: false
        },
        include: {
          estudiante: true,
          examen: {
            include: {
              materia: true,
              carrera: true
            }
          }
        }
      });

      resultados.creados.push(acta);

    } catch (error) {
      resultados.errores.push({
        dni: estudianteData.dni,
        error: error.message
      });
    }
  }

  return res.status(201).json({
    success: true,
    data: resultados,
    message: `Procesados ${estudiantes.length} estudiantes. Creados: ${resultados.creados.length}, Duplicados: ${resultados.duplicados.length}, Errores: ${resultados.errores.length}`
  });
} 
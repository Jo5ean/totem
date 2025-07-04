import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  // Validar que el ID sea un número
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      error: 'ID de aula inválido'
    });
  }

  const aulaId = parseInt(id);

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, aulaId);
      case 'PUT':
        return await handlePut(req, res, aulaId);
      case 'DELETE':
        return await handleDelete(req, res, aulaId);
      default:
        return res.status(405).json({
          success: false,
          error: `Método ${req.method} no permitido`,
          allowedMethods: ['GET', 'PUT', 'DELETE']
        });
    }
  } catch (error) {
    console.error('Error en aula específica:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

async function handleGet(req, res, aulaId) {
  const aula = await prisma.aula.findUnique({
    where: { id: aulaId },
    include: {
      examenes: {
        include: {
          materia: true,
          carrera: true
        },
        orderBy: { fecha: 'asc' }
      },
      _count: {
        select: { examenes: true }
      }
    }
  });

  if (!aula) {
    return res.status(404).json({
      success: false,
      error: 'Aula no encontrada'
    });
  }

  return res.status(200).json({
    success: true,
    data: aula
  });
}

async function handlePut(req, res, aulaId) {
  const { nombre, capacidad, ubicacion, disponible } = req.body;

  // Verificar que el aula existe
  const existingAula = await prisma.aula.findUnique({
    where: { id: aulaId }
  });

  if (!existingAula) {
    return res.status(404).json({
      success: false,
      error: 'Aula no encontrada'
    });
  }

  // Si se cambia el nombre, verificar que no exista otro aula con ese nombre
  if (nombre && nombre !== existingAula.nombre) {
    const aulaConMismoNombre = await prisma.aula.findUnique({
      where: { nombre }
    });

    if (aulaConMismoNombre) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un aula con ese nombre'
      });
    }
  }

  const datosActualizacion = {};
  if (nombre !== undefined) datosActualizacion.nombre = nombre;
  if (capacidad !== undefined) datosActualizacion.capacidad = capacidad ? parseInt(capacidad) : null;
  if (ubicacion !== undefined) datosActualizacion.ubicacion = ubicacion;
  if (disponible !== undefined) datosActualizacion.disponible = disponible;

  const aulaActualizada = await prisma.aula.update({
    where: { id: aulaId },
    data: datosActualizacion
  });

  return res.status(200).json({
    success: true,
    data: aulaActualizada,
    message: 'Aula actualizada exitosamente'
  });
}

async function handleDelete(req, res, aulaId) {
  // Verificar que el aula existe
  const existingAula = await prisma.aula.findUnique({
    where: { id: aulaId },
    include: {
      _count: {
        select: { examenes: true }
      }
    }
  });

  if (!existingAula) {
    return res.status(404).json({
      success: false,
      error: 'Aula no encontrada'
    });
  }

  // Verificar si tiene exámenes asociados
  if (existingAula._count.examenes > 0) {
    return res.status(409).json({
      success: false,
      error: 'No se puede eliminar el aula porque tiene exámenes asociados',
      examenes_asociados: existingAula._count.examenes
    });
  }

  await prisma.aula.delete({
    where: { id: aulaId }
  });

  return res.status(200).json({
    success: true,
    message: 'Aula eliminada exitosamente'
  });
} 
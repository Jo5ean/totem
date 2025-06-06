import TotemService from '../../../../../services/totemService.js';
import prisma from '../../../../../lib/db.js';

const totemService = new TotemService();

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({
          success: false,
          error: `Método ${req.method} no permitido`,
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
        });
    }
  } catch (error) {
    console.error('Error en mapeos de sectores:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

async function handleGet(req, res) {
  const { includeNoMapeados } = req.query;
  
  const mapeos = await prisma.sectorFacultad.findMany({
    include: {
      facultad: true
    },
    orderBy: { sector: 'asc' }
  });

  let sectoresNoMapeados = [];
  if (includeNoMapeados === 'true') {
    sectoresNoMapeados = await totemService.getSectoresNoMapeados();
  }

  return res.status(200).json({
    success: true,
    data: {
      mapeos,
      sectoresNoMapeados
    }
  });
}

async function handlePost(req, res) {
  const { sector, facultadId } = req.body;

  if (!sector || !facultadId) {
    return res.status(400).json({
      success: false,
      error: 'Sector y facultadId son requeridos'
    });
  }

  // Verificar que la facultad existe
  const facultad = await prisma.facultad.findUnique({
    where: { id: parseInt(facultadId) }
  });

  if (!facultad) {
    return res.status(404).json({
      success: false,
      error: 'Facultad no encontrada'
    });
  }

  const mapeo = await totemService.createSectorFacultadMapping(sector, parseInt(facultadId));

  return res.status(201).json({
    success: true,
    data: mapeo,
    message: 'Mapeo creado exitosamente'
  });
}

async function handlePut(req, res) {
  const { id } = req.query;
  const { facultadId, activo } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID del mapeo es requerido'
    });
  }

  const updateData = {};
  if (facultadId !== undefined) updateData.facultadId = parseInt(facultadId);
  if (activo !== undefined) updateData.activo = activo;

  const mapeo = await prisma.sectorFacultad.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: { facultad: true }
  });

  return res.status(200).json({
    success: true,
    data: mapeo,
    message: 'Mapeo actualizado exitosamente'
  });
}

async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID del mapeo es requerido'
    });
  }

  await prisma.sectorFacultad.delete({
    where: { id: parseInt(id) }
  });

  return res.status(200).json({
    success: true,
    message: 'Mapeo eliminado exitosamente'
  });
} 
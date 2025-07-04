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
      default:
        return res.status(405).json({
          success: false,
          error: `Método ${req.method} no permitido`,
          allowedMethods: ['GET', 'POST', 'PUT']
        });
    }
  } catch (error) {
    console.error('Error en mapeos de carreras:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

async function handleGet(req, res) {
  const { soloNoMapeadas } = req.query;
  
  const whereClause = soloNoMapeadas === 'true' ? { esMapeada: false } : {};
  
  const carrerasTotem = await prisma.carreraTotem.findMany({
    where: whereClause,
    include: {
      carrera: {
        include: {
          facultad: true
        }
      }
    },
    orderBy: { codigoTotem: 'asc' }
  });

  return res.status(200).json({
    success: true,
    data: carrerasTotem
  });
}

async function handlePost(req, res) {
  const { codigoTotem, carreraId } = req.body;

  if (!codigoTotem || !carreraId) {
    return res.status(400).json({
      success: false,
      error: 'codigoTotem y carreraId son requeridos'
    });
  }

  // Verificar que la carrera existe
  const carrera = await prisma.carrera.findUnique({
    where: { id: parseInt(carreraId) },
    include: { facultad: true }
  });

  if (!carrera) {
    return res.status(404).json({
      success: false,
      error: 'Carrera no encontrada'
    });
  }

  const mapeo = await totemService.mapCarreraTotemToCarrera(codigoTotem, parseInt(carreraId));

  return res.status(200).json({
    success: true,
    data: mapeo,
    message: 'Mapeo de carrera actualizado exitosamente'
  });
}

async function handlePut(req, res) {
  const { codigoTotem } = req.query;
  const { carreraId, nombreTotem, activo } = req.body;

  if (!codigoTotem) {
    return res.status(400).json({
      success: false,
      error: 'codigoTotem es requerido'
    });
  }

  const updateData = {};
  if (carreraId !== undefined) {
    updateData.carreraId = carreraId ? parseInt(carreraId) : null;
    updateData.esMapeada = !!carreraId;
  }
  if (nombreTotem !== undefined) updateData.nombreTotem = nombreTotem;
  if (activo !== undefined) updateData.activo = activo;

  const carreraTotem = await prisma.carreraTotem.update({
    where: { codigoTotem },
    data: updateData,
    include: {
      carrera: {
        include: { facultad: true }
      }
    }
  });

  return res.status(200).json({
    success: true,
    data: carreraTotem,
    message: 'Carrera TOTEM actualizada exitosamente'
  });
} 
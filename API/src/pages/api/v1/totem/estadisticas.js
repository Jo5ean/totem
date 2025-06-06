import TotemService from '../../../../services/totemService.js';

const totemService = new TotemService();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['GET']
    });
  }

  try {
    const estadisticas = await totemService.getEstadisticasTotem();
    
    return res.status(200).json({
      success: true,
      data: estadisticas,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas TOTEM:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas',
      message: error.message
    });
  }
} 
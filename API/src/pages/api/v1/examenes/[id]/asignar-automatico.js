import AsignacionAulaService from '../../../../../services/AsignacionAulaService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['POST']
    });
  }

  const { id } = req.query;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      error: 'ID de examen inválido'
    });
  }

  try {
    const examenId = parseInt(id);
    const resultado = await AsignacionAulaService.asignarAulaAutomatica(examenId);

    if (resultado.success) {
      return res.status(200).json({
        success: true,
        data: resultado.examen,
        message: resultado.message,
        criterio: resultado.criterio,
        detalles: resultado.detalles
      });
    } else {
      return res.status(409).json({
        success: false,
        error: resultado.message,
        data: resultado.examen,
        cantidadEstudiantes: resultado.cantidadEstudiantes
      });
    }

  } catch (error) {
    console.error('Error en asignación automática:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 
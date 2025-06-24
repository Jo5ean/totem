import ActaExternaService from '../../../../../services/actaExternaService.js';

const actaService = new ActaExternaService();

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    // Validar ID del examen
    const examenId = parseInt(id);
    if (isNaN(examenId) || examenId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de examen inválido'
      });
    }

    // Extraer filtros de query params
    const filtros = {};
    
    if (req.query.rendida !== undefined) {
      filtros.rendida = req.query.rendida === 'true';
    }
    
    if (req.query.fechaDesde) {
      filtros.fechaDesde = req.query.fechaDesde;
    }
    
    if (req.query.fechaHasta) {
      filtros.fechaHasta = req.query.fechaHasta;
    }

    console.log(`📋 Consultando inscripciones para examen ${examenId}...`);

    // Obtener datos relacionados
    const datosCompletos = await actaService.relacionarAlumnosConExamen(
      examenId, 
      filtros
    );

    return res.status(200).json({
      success: true,
      data: datosCompletos,
      metadata: {
        consultadoEn: new Date().toISOString(),
        filtrosAplicados: filtros,
        sistemaExterno: 'sistemasweb-desa.ucasal.edu.ar'
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo inscripciones:', error);

    // Errores específicos
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('sistema externo')) {
      return res.status(503).json({
        success: false,
        message: 'Error de conectividad con sistema externo',
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 
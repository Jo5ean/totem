import express from 'express';
import TotemService from '../../services/totemService.js';
import SheetBestService from '../../services/sheetBestService.js';

const router = express.Router();
const totemService = new TotemService();
const sheetBestService = new SheetBestService();

// POST /api/v1/totem/sync - Sincronizar datos del TOTEM usando Sheet.best
router.post('/sync', async (req, res) => {
  try {
    console.log('Iniciando sincronización TOTEM con Sheet.best...');
    
    const result = await totemService.syncTotemData();
    
    return res.status(200).json({
      success: true,
      message: 'Sincronización TOTEM completada exitosamente con Sheet.best',
      data: result
    });
    
  } catch (error) {
    console.error('Error en sincronización TOTEM:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en la sincronización TOTEM',
      message: error.message
    });
  }
});

// GET /api/v1/totem/detect-sheets - Detectar datos disponibles desde Sheet.best
router.get('/detect-sheets', async (req, res) => {
  try {
    console.log('🔍 Obteniendo datos desde Sheet.best...');
    
    const startTime = Date.now();
    
    // Obtener y procesar datos desde Sheet.best
    const result = await sheetBestService.fetchAndProcessData();
    
    // Detectar tipos y categorías
    const analysis = sheetBestService.detectExamTypes(result.data);
    
    const duration = Date.now() - startTime;
    
    return res.status(200).json({
      success: true,
      data: {
        source: 'sheet.best',
        totalRows: result.metadata.totalRows,
        validRows: result.metadata.validRows,
        examTypes: analysis.examTypes,
        sectors: analysis.sectors,
        careers: analysis.careers,
        detectionTime: `${duration}ms`
      },
      message: `Datos obtenidos desde Sheet.best: ${result.metadata.validRows} filas válidas encontradas`
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo datos desde Sheet.best:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo datos desde Sheet.best',
      message: error.message
    });
  }
});

// GET /api/v1/totem/hojas-disponibles - Información disponible desde Sheet.best
router.get('/hojas-disponibles', async (req, res) => {
  try {
    const result = await sheetBestService.fetchAndProcessData();
    const analysis = sheetBestService.detectExamTypes(result.data);
    
    return res.status(200).json({
      success: true,
      data: {
        source: 'sheet.best',
        totalRows: result.metadata.totalRows,
        validRows: result.metadata.validRows,
        availableData: {
          examTypes: analysis.examTypes,
          sectors: analysis.sectors,
          careers: analysis.careers
        }
      },
      total: result.metadata.validRows
    });
    
  } catch (error) {
    console.error('Error obteniendo datos disponibles:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo datos disponibles',
      message: error.message
    });
  }
});

// GET /api/v1/totem/csv-download - Obtener datos desde Sheet.best
router.get('/csv-download', async (req, res) => {
  try {
    const result = await sheetBestService.fetchAndProcessData();
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Datos obtenidos desde Sheet.best exitosamente'
    });
    
  } catch (error) {
    console.error('Error obteniendo datos desde Sheet.best:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo datos desde Sheet.best',
      message: error.message
    });
  }
});

// GET /api/v1/totem/debug - Debug del procesamiento
router.get('/debug', async (req, res) => {
  try {
    const debug = await totemService.getEstadisticasTotem();
    
    return res.status(200).json({
      success: true,
      data: debug
    });
    
  } catch (error) {
    console.error('Error en debug TOTEM:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo debug',
      message: error.message
    });
  }
});

// GET /api/v1/totem/debug-processing - Debug detallado del procesamiento
router.get('/debug-processing', async (req, res) => {
  try {
    const sectoresNoMapeados = await totemService.getSectoresNoMapeados();
    const carrerasNoMapeadas = await totemService.getCarrerasTotemNoMapeadas();
    
    return res.status(200).json({
      success: true,
      data: {
        sectoresNoMapeados,
        carrerasNoMapeadas,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error en debug processing:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo debug processing',
      message: error.message
    });
  }
});

// GET /api/v1/totem/estadisticas - Estadísticas del TOTEM
router.get('/estadisticas', async (req, res) => {
  try {
    const estadisticas = await totemService.getEstadisticasTotem();
    
    return res.status(200).json({
      success: true,
      data: estadisticas
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas TOTEM:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas',
      message: error.message
    });
  }
});

// GET /api/v1/totem/consulta - Consulta general
router.get('/consulta', async (req, res) => {
  try {
    const { tipo } = req.query;
    
    let resultado;
    switch (tipo) {
      case 'sectores':
        resultado = await totemService.getSectoresNoMapeados();
        break;
      case 'carreras':
        resultado = await totemService.getCarrerasTotemNoMapeadas();
        break;
      default:
        resultado = await totemService.getEstadisticasTotem();
    }
    
    return res.status(200).json({
      success: true,
      data: resultado
    });
    
  } catch (error) {
    console.error('Error en consulta TOTEM:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en consulta',
      message: error.message
    });
  }
});

// GET /api/v1/totem - Lista de endpoints disponibles
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API TOTEM - Node.js/Express',
    endpoints: {
      sync: 'POST /sync - Sincronizar datos del TOTEM',
      detectSheets: 'GET /detect-sheets - Detectar hojas disponibles',
      hojasDisponibles: 'GET /hojas-disponibles - Listar hojas',
      csvDownload: 'GET /csv-download - Descargar datos desde Sheet.best',
      debug: 'GET /debug - Debug del procesamiento',
      debugProcessing: 'GET /debug-processing - Debug detallado',
      estadisticas: 'GET /estadisticas - Estadísticas del TOTEM',
      consulta: 'GET /consulta?tipo=X - Consulta general'
    }
  });
});

export default router; 
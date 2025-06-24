import express from 'express';
import TotemService from '../../services/totemService.js';
import CSVDownloadService from '../../services/csvDownloadService.js';

const router = express.Router();
const totemService = new TotemService();
const csvService = new CSVDownloadService();
const TOTEM_SHEET_ID = '12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8';

// POST /api/v1/totem/sync - Sincronizar datos del TOTEM
router.post('/sync', async (req, res) => {
  try {
    console.log('Iniciando sincronización TOTEM centralizada...');
    
    const result = await totemService.syncTotemData();
    
    return res.status(200).json({
      success: true,
      message: 'Sincronización TOTEM completada exitosamente',
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

// GET /api/v1/totem/detect-sheets - Detectar hojas disponibles
router.get('/detect-sheets', async (req, res) => {
  try {
    console.log('🔍 Probando detección automática de hojas...');
    
    const startTime = Date.now();
    
    // Detectar hojas disponibles
    const detectedSheets = await csvService.detectAvailableSheets(TOTEM_SHEET_ID);
    
    // Obtener nombres para procesamiento
    const sheetNames = await csvService.getSheetNamesToProcess(TOTEM_SHEET_ID);
    
    const duration = Date.now() - startTime;
    
    return res.status(200).json({
      success: true,
      data: {
        detectedSheets,
        sheetNamesForProcessing: sheetNames,
        totalDetected: detectedSheets.length,
        totalForProcessing: sheetNames.length,
        detectionTime: `${duration}ms`
      },
      message: `Detección completada: ${detectedSheets.length} hojas encontradas`
    });
    
  } catch (error) {
    console.error('❌ Error en detección de hojas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error detectando hojas',
      message: error.message
    });
  }
});

// GET /api/v1/totem/hojas-disponibles - Listar hojas disponibles
router.get('/hojas-disponibles', async (req, res) => {
  try {
    const hojas = await csvService.detectAvailableSheets(TOTEM_SHEET_ID);
    
    return res.status(200).json({
      success: true,
      data: hojas,
      total: hojas.length
    });
    
  } catch (error) {
    console.error('Error obteniendo hojas disponibles:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo hojas disponibles',
      message: error.message
    });
  }
});

// GET /api/v1/totem/csv-download - Descargar y procesar CSV
router.get('/csv-download', async (req, res) => {
  try {
    const { sheetName } = req.query;
    
    if (!sheetName) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro sheetName requerido'
      });
    }
    
    const result = await csvService.downloadAndParseCSV(TOTEM_SHEET_ID, sheetName);
    
    return res.status(200).json({
      success: true,
      data: result,
      message: `CSV de ${sheetName} descargado y procesado exitosamente`
    });
    
  } catch (error) {
    console.error('Error en descarga CSV:', error);
    return res.status(500).json({
      success: false,
      error: 'Error descargando CSV',
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
      data: resultado,
      tipo
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
      csvDownload: 'GET /csv-download?sheetName=X - Descargar CSV',
      debug: 'GET /debug - Debug del procesamiento',
      debugProcessing: 'GET /debug-processing - Debug detallado',
      estadisticas: 'GET /estadisticas - Estadísticas del TOTEM',
      consulta: 'GET /consulta?tipo=X - Consulta general'
    }
  });
});

export default router; 
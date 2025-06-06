import CSVDownloadService from '../../../../services/csvDownloadService.js';

const csvService = new CSVDownloadService();
const TOTEM_SHEET_ID = '12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['GET']
    });
  }

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
} 
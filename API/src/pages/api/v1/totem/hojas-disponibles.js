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
    console.log('🔍 Obteniendo hojas disponibles...');
    
    const startTime = Date.now();
    
    // Detectar hojas disponibles
    const detectedSheets = await csvService.detectAvailableSheets(TOTEM_SHEET_ID);
    
    const duration = Date.now() - startTime;
    
    return res.status(200).json({
      success: true,
      data: {
        sheets: detectedSheets,
        totalSheets: detectedSheets.length,
        detectionTime: `${duration}ms`
      },
      message: `${detectedSheets.length} hojas detectadas exitosamente`
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo hojas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo hojas disponibles',
      message: error.message
    });
  }
} 
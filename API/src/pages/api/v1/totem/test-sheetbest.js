import SheetBestService from '../../../../services/sheetBestService.js';

const sheetBestService = new SheetBestService();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['GET']
    });
  }

  try {
    console.log('🧪 Probando Sheet.best API...');
    
    const startTime = Date.now();
    
    // Obtener datos usando Sheet.best
    const result = await sheetBestService.fetchAndProcessData();
    
    const duration = Date.now() - startTime;
    
    return res.status(200).json({
      success: true,
      test: 'Sheet.best API Test',
      timestamp: new Date().toISOString(),
      data: {
        source: 'sheet.best',
        totalRows: result.metadata.totalRows,
        validRows: result.metadata.validRows,
        sampleData: result.data.slice(0, 3),
        headers: result.data.length > 0 ? Object.keys(result.data[0]) : [],
        performance: {
          duration: `${duration}ms`,
          rowsPerSecond: Math.round(result.metadata.validRows / (duration / 1000))
        }
      },
      message: `Sheet.best API funcionando correctamente: ${result.metadata.validRows} filas válidas procesadas en ${duration}ms`
    });
    
  } catch (error) {
    console.error('❌ Error probando Sheet.best:', error);
    return res.status(500).json({
      success: false,
      error: 'Error probando Sheet.best API',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 
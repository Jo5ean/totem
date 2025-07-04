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
    console.log('🔍 Detectando datos disponibles desde Sheet.best...');
    
    const startTime = Date.now();
    
    // Obtener y procesar datos desde Sheet.best
    const result = await sheetBestService.fetchAndProcessData();
    
    // Detectar tipos de exámenes y otros metadatos
    const analysis = sheetBestService.detectExamTypes(result.data);
    
    const duration = Date.now() - startTime;
    
    return res.status(200).json({
      success: true,
      data: {
        totalRows: result.metadata.totalRows,
        validRows: result.metadata.validRows,
        examTypes: analysis.examTypes,
        sectors: analysis.sectors,
        careers: analysis.careers,
        source: 'sheet.best',
        processedAt: result.metadata.processedAt,
        detectionTime: `${duration}ms`
      },
      message: `Detección completada: ${result.metadata.validRows} filas válidas encontradas desde Sheet.best`
    });
    
  } catch (error) {
    console.error('❌ Error en detección de datos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error detectando datos desde Sheet.best',
      message: error.message
    });
  }
} 
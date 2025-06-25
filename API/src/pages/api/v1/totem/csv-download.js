import SheetBestService from '../../../../services/sheetBestService.js';

const sheetBestService = new SheetBestService();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['POST']
    });
  }

  try {
    console.log('🚀 Obteniendo datos desde Sheet.best...');
    
    // Obtener datos desde Sheet.best
    const result = await sheetBestService.fetchAndProcessData();
    
    // Analizar los primeros datos
    const sampleData = result.data.slice(0, 5);
    const headers = result.data.length > 0 ? Object.keys(result.data[0]) : [];
    
    // Verificar si tenemos los campos esperados
    const expectedFields = ['SECTOR', 'CARRERA', 'MATERIA', 'FECHA'];
    const hasExpectedFields = expectedFields.some(field => headers.includes(field));
    
    // Detectar tipos y categorías
    const analysis = sheetBestService.detectExamTypes(result.data);
    
    return res.status(200).json({
      success: true,
      data: {
        source: 'sheet.best',
        totalRows: result.metadata.totalRows,
        validRows: result.metadata.validRows,
        analysis: {
          headers,
          hasExpectedFields,
          expectedFields,
          sampleData,
          examTypes: analysis.examTypes,
          sectors: analysis.sectors,
          careers: analysis.careers
        }
      },
      message: `Datos obtenidos exitosamente desde Sheet.best: ${result.metadata.validRows} filas válidas procesadas`
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo datos desde Sheet.best:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo datos desde Sheet.best',
      message: error.message,
      details: 'Verificar la configuración de Sheet.best API'
    });
  }
} 
import CSVDownloadService from '../../../../services/csvDownloadService.js';

const csvService = new CSVDownloadService();
const TOTEM_SHEET_ID = '12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['POST']
    });
  }

  try {
    const { sheetName = 'Especial Junio', sheetId = null } = req.body;
    
    console.log(`🚀 Intentando descargar CSV: ${sheetName}`);
    
    // Intentar descarga directa
    const result = await csvService.downloadAndParseCSV(
      TOTEM_SHEET_ID, 
      sheetName, 
      sheetId
    );
    
    // Analizar los primeros datos
    const sampleData = result.parsedData.slice(0, 5);
    const headers = Object.keys(result.parsedData[0] || {});
    
    // Verificar si tenemos los campos esperados
    const expectedFields = ['SECTOR', 'CARRERA', 'MATERIA', 'FECHA'];
    const hasExpectedFields = expectedFields.some(field => headers.includes(field));
    
    return res.status(200).json({
      success: true,
      data: {
        download: {
          fileName: result.fileName,
          size: result.size,
          totalRows: result.totalRows
        },
        analysis: {
          headers,
          hasExpectedFields,
          expectedFields,
          sampleData
        },
        rawContent: result.content.substring(0, 500) + '...' // Primeros 500 caracteres
      },
      message: `CSV descargado exitosamente: ${result.totalRows} filas procesadas`
    });
    
  } catch (error) {
    console.error('❌ Error en descarga CSV:', error);
    
    // Si falla, intentar con diferentes métodos
    const fallbackAttempts = [
      { sheetId: null, name: 'primera_hoja' },
      { sheetId: '0', name: 'hoja_0' },
      { sheetId: '848244318', name: 'hoja_especifica' } // GID de ejemplo
    ];
    
    let fallbackResult = null;
    
    for (const attempt of fallbackAttempts) {
      try {
        console.log(`🔄 Intentando fallback: ${attempt.name}`);
        fallbackResult = await csvService.downloadAndParseCSV(
          TOTEM_SHEET_ID, 
          attempt.name, 
          attempt.sheetId
        );
        break;
      } catch (fallbackError) {
        console.log(`❌ Fallback ${attempt.name} falló:`, fallbackError.message);
      }
    }
    
    if (fallbackResult) {
      return res.status(200).json({
        success: true,
        warning: 'Descarga principal falló, pero fallback exitoso',
        data: {
          download: {
            fileName: fallbackResult.fileName,
            size: fallbackResult.size,
            totalRows: fallbackResult.totalRows
          },
          analysis: {
            headers: Object.keys(fallbackResult.parsedData[0] || {}),
            sampleData: fallbackResult.parsedData.slice(0, 3)
          }
        },
        originalError: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Error descargando CSV',
      message: error.message,
      details: 'Tanto el método principal como los fallbacks fallaron'
    });
  }
} 
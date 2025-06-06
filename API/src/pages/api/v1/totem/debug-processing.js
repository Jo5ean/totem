import TotemService from '../../../../services/totemService.js';
import CSVDownloadService from '../../../../services/csvDownloadService.js';

const totemService = new TotemService();
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
    console.log('🔍 Debug del procesamiento de exámenes...');
    
    // 1. Obtener datos CSV de una sola hoja
    const csvResult = await csvService.downloadAndParseCSV(TOTEM_SHEET_ID, 'Especial Junio');
    
    console.log(`📊 Datos obtenidos: ${csvResult.parsedData.length} filas`);
    
    // 2. Tomar las primeras 3 filas para analizar
    const sampleRows = csvResult.parsedData.slice(0, 3);
    
    const processingResults = [];
    
    for (let i = 0; i < sampleRows.length; i++) {
      const row = sampleRows[i];
      
      try {
        console.log(`\n🔍 Procesando fila ${i + 1}:`, row);
        
        // Extraer datos como lo hace el TotemService
        const totemData = totemService.extractTotemRowData(row);
        console.log('📋 Datos extraídos:', totemData);
        
        // Verificar campos requeridos
        const isComplete = !!(totemData.sector && totemData.carrera && totemData.materia && totemData.fecha);
        console.log('✅ Datos completos:', isComplete);
        
        let facultadResult = null;
        let carreraResult = null;
        
        if (isComplete) {
          try {
            // 1. Mapear sector a facultad
            facultadResult = await totemService.mapSectorToFacultad(totemData.sector);
            console.log('🏢 Facultad mapeada:', facultadResult?.nombre || 'No encontrada');
            
            if (facultadResult) {
              // 2. Mapear carrera
              carreraResult = await totemService.mapCarreraTotem(totemData.carrera, facultadResult.id);
              console.log('🎓 Carrera mapeada:', carreraResult?.nombre || 'No encontrada');
            }
          } catch (mappingError) {
            console.log('❌ Error en mapeo:', mappingError.message);
          }
        }
        
        processingResults.push({
          rowIndex: i + 1,
          originalData: row,
          extractedData: totemData,
          isComplete,
          hasRequiredFields: {
            sector: !!totemData.sector,
            carrera: !!totemData.carrera,
            materia: !!totemData.materia,
            fecha: !!totemData.fecha
          },
          facultad: facultadResult ? {
            id: facultadResult.id,
            nombre: facultadResult.nombre
          } : null,
          carrera: carreraResult ? {
            id: carreraResult.id,
            nombre: carreraResult.nombre
          } : null,
          wouldCreateExam: !!(isComplete && facultadResult && carreraResult)
        });
        
      } catch (error) {
        console.error(`❌ Error procesando fila ${i + 1}:`, error);
        processingResults.push({
          rowIndex: i + 1,
          error: error.message,
          wouldCreateExam: false
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      debug: {
        totalRowsInCSV: csvResult.parsedData.length,
        sampleRowsAnalyzed: sampleRows.length,
        processingResults,
        summary: {
          completeRows: processingResults.filter(r => r.isComplete).length,
          withFacultad: processingResults.filter(r => r.facultad).length,
          withCarrera: processingResults.filter(r => r.carrera).length,
          wouldCreateExam: processingResults.filter(r => r.wouldCreateExam).length
        }
      },
      message: 'Debug de procesamiento completado'
    });
    
  } catch (error) {
    console.error('❌ Error en debug de procesamiento:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en debug de procesamiento',
      message: error.message
    });
  }
} 
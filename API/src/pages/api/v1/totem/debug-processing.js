import TotemService from '../../../../services/totemService.js';
import SheetBestService from '../../../../services/sheetBestService.js';

const totemService = new TotemService();
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
    console.log('🔍 Debug del procesamiento de exámenes con Sheet.best...');
    
    // 1. Obtener datos desde Sheet.best
    const result = await sheetBestService.fetchAndProcessData();
    
    console.log(`📊 Datos obtenidos: ${result.data.length} filas válidas`);
    
    // 2. Tomar las primeras 3 filas para analizar
    const sampleRows = result.data.slice(0, 3);
    
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
        source: 'sheet.best',
        totalRowsFromAPI: result.metadata.totalRows,
        validRowsProcessed: result.data.length,
        sampleRowsAnalyzed: sampleRows.length,
        processingResults,
        summary: {
          completeRows: processingResults.filter(r => r.isComplete).length,
          withFacultad: processingResults.filter(r => r.facultad).length,
          withCarrera: processingResults.filter(r => r.carrera).length,
          wouldCreateExam: processingResults.filter(r => r.wouldCreateExam).length
        }
      },
      message: 'Debug de procesamiento completado con Sheet.best'
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
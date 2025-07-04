import axios from 'axios';

class SheetBestService {
  constructor() {
    // URL base de la API de Sheet.best para tu Google Sheet
    this.apiUrl = 'https://api.sheetbest.com/sheets/16ccd035-8c9e-4218-b5f1-2da9939d7b3d';
  }

  /**
   * Obtener datos directamente desde Sheet.best API
   */
  async fetchSheetData() {
    try {
      console.log('📥 Obteniendo datos desde Sheet.best API...');
      
      const response = await axios.get(this.apiUrl, {
        timeout: 30000, // 30 segundos timeout
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Respuesta inválida de Sheet.best API');
      }

      console.log(`✅ Datos obtenidos: ${response.data.length} filas desde Sheet.best`);
      
      return {
        success: true,
        data: response.data,
        totalRows: response.data.length,
        source: 'sheet.best',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error obteniendo datos de Sheet.best:', error);
      throw new Error(`Error en Sheet.best API: ${error.message}`);
    }
  }

  /**
   * Procesar y limpiar datos de Sheet.best
   */
  processSheetBestData(rawData) {
    try {
      console.log('🔄 Procesando datos de Sheet.best...');

      // Encontrar la fila de headers (la que contiene "SECTOR", "CARRERA", etc.)
      let headerRowIndex = -1;
      let headers = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && typeof row === 'object') {
          // Buscar fila que contenga los headers esperados
          const values = Object.values(row);
          if (values.includes('SECTOR') && values.includes('CARRERA') && values.includes('MATERIA')) {
            headerRowIndex = i;
            headers = values.filter(val => val !== null);
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        throw new Error('No se encontraron headers válidos en los datos');
      }

      console.log(`📋 Headers encontrados en fila ${headerRowIndex}:`, headers);

      // Procesar filas de datos (después de los headers)
      const processedData = [];
      
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        if (!row || typeof row !== 'object') continue;

        // Convertir objeto numérico a objeto con nombres de campos
        const rowData = {};
        const values = Object.values(row);
        
        // Verificar que la fila tenga datos válidos (no solo nulls)
        const hasValidData = values.some(val => val !== null && val !== '');
        if (!hasValidData) continue;

        // Mapear valores a headers conocidos
        rowData.SECTOR = values[0] || null;
        rowData.CARRERA = values[1] || null;
        rowData.MODO = values[2] || null;
        rowData.AREATEMA = values[3] || null;
        rowData.MATERIA = values[4] || null;
        rowData.AÑO = values[5] || null;
        rowData['NOMBRE CORTO'] = values[6] || null;
        rowData.FECHA = values[7] || null;
        rowData.URL = values[8] || null;
        rowData.CÁTEDRA = values[9] || null;
        rowData.Docente = values[10] || null;
        rowData.Hora = values[11] || null;
        rowData['Tipo Examen'] = values[12] || null;
        rowData.Monitoreo = values[13] || null;
        rowData['Control a cargo de:'] = values[14] || null;
        rowData.Observaciones = values[15] || null;
        rowData['Material Permitido'] = values[16] || null;

        // Solo agregar si tiene datos mínimos requeridos
        if (rowData.SECTOR && rowData.CARRERA && rowData.MATERIA && rowData.FECHA) {
          processedData.push(rowData);
        }
      }

      console.log(`✅ Datos procesados: ${processedData.length} filas válidas`);

      return {
        processedData,
        totalProcessed: processedData.length,
        headersFound: headers,
        headerRowIndex
      };

    } catch (error) {
      console.error('❌ Error procesando datos Sheet.best:', error);
      throw error;
    }
  }

  /**
   * Obtener y procesar datos en un solo paso
   */
  async fetchAndProcessData() {
    try {
      // 1. Obtener datos de Sheet.best
      const fetchResult = await this.fetchSheetData();
      
      // 2. Procesar datos
      const processResult = this.processSheetBestData(fetchResult.data);
      
      return {
        success: true,
        data: processResult.processedData,
        metadata: {
          totalRows: fetchResult.totalRows,
          validRows: processResult.totalProcessed,
          headers: processResult.headersFound,
          source: 'sheet.best',
          processedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error en fetchAndProcessData:', error);
      throw error;
    }
  }

  /**
   * Detectar diferentes tipos de exámenes en los datos
   */
  detectExamTypes(processedData) {
    const examTypes = new Set();
    const sectors = new Set();
    const careers = new Set();

    processedData.forEach(row => {
      if (row['Tipo Examen']) {
        examTypes.add(row['Tipo Examen']);
      }
      if (row.SECTOR) {
        sectors.add(row.SECTOR);
      }
      if (row.CARRERA) {
        careers.add(row.CARRERA);
      }
    });

    return {
      examTypes: Array.from(examTypes),
      sectors: Array.from(sectors),
      careers: Array.from(careers),
      totalUniqueExamTypes: examTypes.size,
      totalUniqueSectors: sectors.size,
      totalUniqueCareers: careers.size
    };
  }

  /**
   * Validar estructura de datos
   */
  validateDataStructure(processedData) {
    const requiredFields = ['SECTOR', 'CARRERA', 'MATERIA', 'FECHA'];
    const issues = [];

    processedData.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field]) {
          issues.push({
            row: index + 1,
            field,
            message: `Campo requerido '${field}' está vacío`
          });
        }
      });
    });

    return {
      isValid: issues.length === 0,
      issues,
      totalRows: processedData.length,
      validRows: processedData.length - issues.length
    };
  }
}

export default SheetBestService; 
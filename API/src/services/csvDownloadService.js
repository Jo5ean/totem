import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CSVDownloadService {
  constructor() {
    this.downloadDir = path.join(__dirname, '..', '..', 'csv_downloads');
    this.ensureDownloadDir();
  }

  ensureDownloadDir() {
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  /**
   * Generar URL de descarga CSV para Google Sheets
   */
  generateCSVUrl(spreadsheetId, sheetId = null) {
    if (sheetId) {
      // Para una hoja específica
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetId}`;
    } else {
      // Para la primera hoja del spreadsheet
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    }
  }

  /**
   * Descargar CSV desde Google Sheets
   */
  async downloadCSV(spreadsheetId, sheetName = null, sheetId = null) {
    try {
      const url = this.generateCSVUrl(spreadsheetId, sheetId);
      
      console.log(`📥 Descargando CSV desde: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const csvContent = await response.text();
      
      // Verificar que no esté vacío
      if (!csvContent || csvContent.trim().length === 0) {
        throw new Error('El CSV descargado está vacío');
      }
      
      // Generar nombre de archivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${sheetName || 'sheet'}_${timestamp}.csv`;
      const filePath = path.join(this.downloadDir, fileName);
      
      // Guardar archivo
      fs.writeFileSync(filePath, csvContent, 'utf8');
      
      console.log(`✅ CSV guardado: ${fileName} (${csvContent.length} caracteres)`);
      
      return {
        success: true,
        fileName,
        filePath,
        size: csvContent.length,
        downloadUrl: url,
        content: csvContent
      };
      
    } catch (error) {
      console.error('❌ Error descargando CSV:', error);
      throw new Error(`Error descargando CSV: ${error.message}`);
    }
  }

  /**
   * Procesar CSV a array de objetos
   */
  parseCSV(csvContent) {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
      
      if (lines.length === 0) {
        return [];
      }
      
      // Buscar la línea de headers (primera línea que no esté completamente vacía)
      let headerLineIndex = -1;
      let headers = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        
        // Si la línea tiene contenido real (no solo comas vacías)
        if (values.some(val => val && val.length > 0)) {
          headers = values;
          headerLineIndex = i;
          break;
        }
      }
      
      if (headerLineIndex === -1 || headers.length === 0) {
        throw new Error('No se encontraron headers válidos en el CSV');
      }
      
      console.log(`📋 Headers encontrados en línea ${headerLineIndex}:`, headers);
      
      // Procesar filas de datos (después de los headers)
      const data = [];
      for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
        
        // Verificar que la fila tenga contenido real
        if (values.some(val => val && val.length > 0)) {
          const rowObject = {};
          headers.forEach((header, index) => {
            rowObject[header] = values[index] || null;
          });
          
          data.push(rowObject);
        }
      }
      
      console.log(`📊 CSV procesado: ${data.length} filas de datos válidas`);
      
      return data;
      
    } catch (error) {
      console.error('❌ Error procesando CSV:', error);
      throw new Error(`Error procesando CSV: ${error.message}`);
    }
  }

  /**
   * Descargar y procesar CSV en un solo paso
   */
  async downloadAndParseCSV(spreadsheetId, sheetName = null, sheetId = null) {
    try {
      const downloadResult = await this.downloadCSV(spreadsheetId, sheetName, sheetId);
      const parsedData = this.parseCSV(downloadResult.content);
      
      return {
        ...downloadResult,
        parsedData,
        totalRows: parsedData.length
      };
      
    } catch (error) {
      throw new Error(`Error en descarga y procesamiento: ${error.message}`);
    }
  }

  /**
   * Listar archivos CSV descargados
   */
  listDownloadedFiles() {
    try {
      const files = fs.readdirSync(this.downloadDir)
        .filter(file => file.endsWith('.csv'))
        .map(file => {
          const filePath = path.join(this.downloadDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.modified - a.modified);
        
      return files;
      
    } catch (error) {
      console.error('❌ Error listando archivos:', error);
      return [];
    }
  }

  /**
   * Limpiar archivos antiguos
   */
  cleanOldFiles(maxAgeHours = 24) {
    try {
      const files = this.listDownloadedFiles();
      const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      
      let deletedCount = 0;
      
      files.forEach(file => {
        if (file.modified < cutoffTime) {
          fs.unlinkSync(file.path);
          deletedCount++;
          console.log(`🗑️ Archivo eliminado: ${file.name}`);
        }
      });
      
      console.log(`🧹 Limpieza completada: ${deletedCount} archivos eliminados`);
      return deletedCount;
      
    } catch (error) {
      console.error('❌ Error limpiando archivos:', error);
      return 0;
    }
  }

  /**
   * Detectar hojas disponibles en un Google Sheets
   * Intenta descargar diferentes hojas y ve cuáles existen realmente
   */
  async detectAvailableSheets(spreadsheetId) {
    console.log('🔍 Detectando hojas disponibles...');
    
    // Lista más específica de hojas conocidas del TOTEM
    const knownSheets = [
      '1° Turno Ordinario',
      '2° Turno Ordinario', 
      'Especial Abril',
      'Extraordinario Mayo',
      'Especial Junio'
    ];
    
    // Lista adicional para probar
    const additionalSheets = [
      '3° Turno Ordinario',
      'Especial Mayo',
      'Especial Julio',
      'Especial Agosto',
      'Especial Septiembre',
      'Especial Octubre',
      'Especial Noviembre',
      'Especial Diciembre',
      'Extraordinario Abril',
      'Extraordinario Junio',
      'Extraordinario Julio',
      'Extraordinario Agosto',
      'Extraordinario Septiembre',
      'Extraordinario Octubre',
      'Extraordinario Noviembre',
      'Extraordinario Diciembre'
    ];
    
    const availableSheets = [];
    const seenSizes = new Set(); // Para detectar duplicados
    
    // Primero probar las hojas conocidas
    for (const sheetName of knownSheets) {
      try {
        console.log(`🔍 Probando hoja conocida: ${sheetName}`);
        
        const csvResult = await this.downloadCSV(spreadsheetId, sheetName);
        
        if (csvResult.content && csvResult.content.trim().length > 0) {
          const parsedData = this.parseCSV(csvResult.content);
          
          if (parsedData && parsedData.length > 0) {
            const sizeKey = `${csvResult.size}-${parsedData.length}`;
            
            // Solo agregar si no hemos visto este tamaño antes
            if (!seenSizes.has(sizeKey)) {
              seenSizes.add(sizeKey);
              
              availableSheets.push({
                name: sheetName,
                rowCount: parsedData.length,
                size: csvResult.size,
                hasData: true,
                priority: 'known'
              });
              
              console.log(`✅ Hoja conocida encontrada: ${sheetName} (${parsedData.length} filas)`);
            } else {
              console.log(`⚠️ Hoja duplicada ignorada: ${sheetName}`);
            }
          }
        }
      } catch (error) {
        console.log(`❌ Hoja conocida no disponible: ${sheetName}`);
      }
    }
    
    // Si encontramos pocas hojas conocidas, probar adicionales
    if (availableSheets.length < 3) {
      console.log('🔍 Probando hojas adicionales...');
      
      for (const sheetName of additionalSheets) {
        try {
          const csvResult = await this.downloadCSV(spreadsheetId, sheetName);
          
          if (csvResult.content && csvResult.content.trim().length > 0) {
            const parsedData = this.parseCSV(csvResult.content);
            
            if (parsedData && parsedData.length > 0) {
              const sizeKey = `${csvResult.size}-${parsedData.length}`;
              
              // Solo agregar si es único
              if (!seenSizes.has(sizeKey)) {
                seenSizes.add(sizeKey);
                
                availableSheets.push({
                  name: sheetName,
                  rowCount: parsedData.length,
                  size: csvResult.size,
                  hasData: true,
                  priority: 'additional'
                });
                
                console.log(`✅ Hoja adicional encontrada: ${sheetName} (${parsedData.length} filas)`);
              }
            }
          }
        } catch (error) {
          // Ignorar errores silenciosamente para hojas adicionales
        }
        
        // Limitar búsqueda adicional
        if (availableSheets.length >= 10) break;
      }
    }
    
    console.log(`📊 Hojas únicas detectadas: ${availableSheets.length}`);
    return availableSheets;
  }

  /**
   * Obtener hojas dinámicamente o usar fallback
   */
  async getSheetNamesToProcess(spreadsheetId, fallbackSheets = null) {
    try {
      // Intentar detección automática
      const detectedSheets = await this.detectAvailableSheets(spreadsheetId);
      
      if (detectedSheets.length > 0) {
        console.log(`✅ Detección automática exitosa: ${detectedSheets.length} hojas`);
        return detectedSheets.map(sheet => sheet.name);
      }
      
      // Si no detecta nada, usar fallback
      if (fallbackSheets && fallbackSheets.length > 0) {
        console.log(`⚠️ Usando hojas fallback: ${fallbackSheets.length} hojas`);
        return fallbackSheets;
      }
      
      throw new Error('No se detectaron hojas disponibles');
      
    } catch (error) {
      console.error('❌ Error en detección de hojas:', error);
      
      // Como último recurso, usar hojas por defecto
      const defaultSheets = [
        '1° Turno Ordinario',
        '2° Turno Ordinario', 
        'Especial Abril',
        'Extraordinario Mayo',
        'Especial Junio'
      ];
      
      console.log(`🔄 Usando hojas por defecto: ${defaultSheets.length} hojas`);
      return defaultSheets;
    }
  }
}

export default CSVDownloadService; 
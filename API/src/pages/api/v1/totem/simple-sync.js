import axios from 'axios';
import TotemService from '../../../../services/totemService.js';

const SHEET_BEST_URL = 'https://api.sheetbest.com/sheets/16ccd035-8c9e-4218-b5f1-2da9939d7b3d';
const totemService = new TotemService();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido. Usa POST.`
    });
  }

  try {
    console.log('🚀 INICIO: Sincronización simple con Sheet.best y guardado en MySQL');
    
    // 1. FETCH A SHEET.BEST (simple como en Postman)
    console.log('📥 Haciendo fetch a Sheet.best...');
    const response = await axios.get(SHEET_BEST_URL, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const rawData = response.data;
    console.log(`✅ Datos obtenidos: ${rawData.length} filas desde Sheet.best`);

    // 2. PROCESAR DATOS (simple y directo)
    console.log('🔄 Procesando datos...');
    
    // Encontrar la fila de headers
    let headerRowIndex = -1;
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (row && typeof row === 'object') {
        const values = Object.values(row);
        if (values.includes('SECTOR') && values.includes('CARRERA') && values.includes('MATERIA')) {
          headerRowIndex = i;
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('No se encontraron headers válidos');
    }

    // Procesar filas de datos (después de headers)
    const processedData = [];
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || typeof row !== 'object') continue;

      const values = Object.values(row);
      
      // Verificar que tenga datos válidos
      const hasValidData = values.some(val => val !== null && val !== '');
      if (!hasValidData) continue;

      // Mapear a estructura simple
      const processedRow = {
        SECTOR: values[0] || null,
        CARRERA: values[1] || null,
        MODO: values[2] || null,
        AREATEMA: values[3] || null,
        MATERIA: values[4] || null,
        AÑO: values[5] || null,
        'NOMBRE CORTO': values[6] || null,
        FECHA: values[7] || null,
        URL: values[8] || null,
        CÁTEDRA: values[9] || null,
        Docente: values[10] || null,
        Hora: values[11] || null,
        'Tipo Examen': values[12] || null,
        Monitoreo: values[13] || null,
        'Control a cargo de:': values[14] || null,
        Observaciones: values[15] || null,
        'Material Permitido': values[16] || null
      };

      // Solo agregar si tiene datos mínimos
      if (processedRow.SECTOR && processedRow.CARRERA && processedRow.MATERIA && processedRow.FECHA) {
        processedData.push(processedRow);
      }
    }

    console.log(`✅ Procesadas ${processedData.length} filas válidas`);

    // 3. GUARDAR EN MYSQL usando TotemService (REAL)
    console.log('💾 Guardando en MySQL usando Prisma...');
    
    const createdExams = await totemService.processTotemDataToExams(processedData);
    
    console.log(`✅ Datos guardados en MySQL: ${createdExams.length} exámenes creados`);

    return res.status(200).json({
      success: true,
      message: 'Sincronización simple completada con guardado real en MySQL',
      data: {
        fetched: rawData.length,
        processed: processedData.length,
        examensCreated: createdExams.length,
        sample: processedData.slice(0, 3),
        examensSample: createdExams.slice(0, 3).map(e => ({
          id: e.id,
          nombreMateria: e.nombreMateria,
          fecha: e.fecha,
          carreraId: e.carreraId
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERROR en sincronización simple:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en sincronización simple',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 
import express from 'express';
import SheetBestService from '../../services/sheetBestService.js';
import ActaExternaService from '../../services/actaExternaService.js';

const router = express.Router();
const actaService = new ActaExternaService();
const sheetBestService = new SheetBestService();

// GET /api/v1/dashboard/convergencia-inscripciones - Análisis de convergencia
router.get('/convergencia-inscripciones', async (req, res) => {
  try {
    console.log('🔄 Iniciando análisis de convergencia e inscripciones...');

    // 1. Leer datos del Google Sheet "convergencia"
    const datosConvergencia = await leerDatosConvergencia();
    
    // 2. Extraer IDs únicos de materias
    const idsMateriasUnicos = extraerIdsUnicos(datosConvergencia);
    
    // 3. Consultar inscripciones para cada ID
    const resultadosInscripciones = await consultarInscripcionesMasivas(idsMateriasUnicos);
    
    // 4. Hacer matching y procesar datos
    const materiasConInscriptos = await procesarMatching(datosConvergencia, resultadosInscripciones);
    
    // 5. Generar resumen
    const resumen = generarResumen(materiasConInscriptos);

    return res.status(200).json({
      success: true,
      data: {
        materias: materiasConInscriptos,
        resumen,
        procesadoEn: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error procesando convergencia e inscripciones:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /api/v1/dashboard/integracion-completa - Integración completa del sistema
router.get('/integracion-completa', async (req, res) => {
  try {
    console.log('🔄 Iniciando integración completa del dashboard...');

    // Aquí puedes agregar lógica para integración completa
    // Por ahora retornamos un placeholder
    
    return res.status(200).json({
      success: true,
      data: {
        message: 'Integración completa en desarrollo',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error en integración completa:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en integración completa',
      message: error.message
    });
  }
});

// GET /api/v1/dashboard/resumen - Resumen general del dashboard
router.get('/resumen', async (req, res) => {
  try {
    console.log('📊 Generando resumen del dashboard...');

    // Aquí puedes agregar lógica para resumen general
    // Por ahora retornamos un placeholder
    
    return res.status(200).json({
      success: true,
      data: {
        message: 'Resumen general en desarrollo',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generando resumen:', error);
    return res.status(500).json({
      success: false,
      error: 'Error generando resumen',
      message: error.message
    });
  }
});

// GET /api/v1/dashboard/debug-convergencia - Debug del procesamiento
router.get('/debug-convergencia', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Iniciando debug de convergencia...');
    
    console.log('🔍 DEBUG: Obteniendo datos desde Sheet.best...');
    
    const result = await sheetBestService.fetchAndProcessData();
    const sampleData = result.data.slice(0, 3);
    
    // Los datos ya están procesados por SheetBestService
    const headers = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
    
    return res.json({
      success: true,
      debug: {
        source: 'sheet.best',
        totalRows: result.metadata.totalRows,
        validRows: result.metadata.validRows,
        headers: headers,
        cantidadHeaders: headers.length,
        primerasFilas: sampleData,
        processedAt: result.metadata.processedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error en debug convergencia:', error);
    return res.status(500).json({
      success: false,
      error: 'Error general en debug',
      message: error.message,
      stack: error.stack
    });
  }
});

// GET /api/v1/dashboard - Lista de endpoints disponibles
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Dashboard - Node.js/Express',
    endpoints: {
      convergenciaInscripciones: 'GET /convergencia-inscripciones - Análisis de convergencia',
      debugConvergencia: 'GET /debug-convergencia - Debug del procesamiento',
      integracionCompleta: 'GET /integracion-completa - Integración completa',
      resumen: 'GET /resumen - Resumen general'
    }
  });
});

// Funciones auxiliares (migradas del archivo original)

/**
 * Parser mejorado de CSV que maneja comillas y comas dentro de campos
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current); // Agregar el último campo
  return result;
}

/**
 * Leer datos del Google Sheet convergencia
 */
async function leerDatosConvergencia() {
  try {
    console.log('📊 Obteniendo datos desde Sheet.best para convergencia...');
    
    const result = await sheetBestService.fetchAndProcessData();
    
    // Usar los datos procesados directamente
    const datos = result.data.filter(row => {
      // Filtrar solo las filas que tengan datos de convergencia válidos
      return row.MATERIA && row.AREATEMA && row.SECTOR;
    });
    
    console.log(`📖 Encontradas ${datos.length} materias válidas para convergencia`);
    
    // Transformar al formato esperado por el resto del código
    return datos.map(row => ({
      sector: row.SECTOR,
      carrera: row.CARRERA,
      codigo: row.CODIGO || '',
      materiaId: row.MATERIA,
      areaTema: row.AREATEMA,
      año: row.AÑO,
      nombreCorto: row['NOMBRE CORTO'],
      fecha: row.FECHA,
      urlCampus: row.URL || '',
      clase: row.CÁTEDRA || '',
      docente: row.Docente,
      hora: row.Hora,
      tipoExamen: row['Tipo Examen'],
      coordinador: row['Control a cargo de:']
         }));

  } catch (error) {
    console.error('❌ Error leyendo datos de convergencia:', error);
    throw new Error(`Error accediendo a Google Sheet: ${error.message}`);
  }
}

/**
 * Extraer IDs únicos de materias
 */
function extraerIdsUnicos(datosConvergencia) {
  const idsUnicos = [...new Set(datosConvergencia.map(item => item.materiaId))];
  console.log(`🔍 Encontrados ${idsUnicos.length} IDs únicos de materias`);
  return idsUnicos;
}

/**
 * Consultar inscripciones para múltiples IDs de materias
 */
async function consultarInscripcionesMasivas(idsMateriasUnicos) {
  const resultados = {};
  const fechaHoy = new Date().toLocaleDateString('es-AR'); // dd/mm/yyyy
  
  console.log(`📞 Consultando inscripciones para ${idsMateriasUnicos.length} materias...`);
  
  // Procesar en lotes para evitar saturar el servidor
  const LOTE_SIZE = 5;
  for (let i = 0; i < idsMateriasUnicos.length; i += LOTE_SIZE) {
    const lote = idsMateriasUnicos.slice(i, i + LOTE_SIZE);
    
    const promesasLote = lote.map(async (materiaId) => {
      try {
        console.log(`  📋 Consultando materia ${materiaId}...`);
        
        const inscripciones = await actaService.obtenerAlumnosInscritos(materiaId, {
          rendida: false,
          fechaDesde: fechaHoy
        });
        
        return {
          materiaId,
          inscripciones,
          totalInscriptos: inscripciones.reduce((total, acta) => total + (acta.alumnos?.length || 0), 0),
          areasTemasEncontradas: [...new Set(inscripciones.map(acta => acta.areaTema || acta.areasTemas).filter(Boolean))]
        };
        
      } catch (error) {
        console.warn(`⚠️ Error consultando materia ${materiaId}:`, error.message);
        return {
          materiaId,
          error: error.message,
          inscripciones: [],
          totalInscriptos: 0,
          areasTemasEncontradas: []
        };
      }
    });
    
    const resultadosLote = await Promise.all(promesasLote);
    resultadosLote.forEach(resultado => {
      resultados[resultado.materiaId] = resultado;
    });
    
    // Pausa entre lotes para no saturar
    if (i + LOTE_SIZE < idsMateriasUnicos.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return resultados;
}

/**
 * Hacer matching entre datos de convergencia e inscripciones
 */
async function procesarMatching(datosConvergencia, resultadosInscripciones) {
  const materiasConInscriptos = [];
  
  console.log('🔗 Procesando matching MATERIA + AREATEMA...');
  
  for (const itemConvergencia of datosConvergencia) {
    const { materiaId, areaTema } = itemConvergencia;
    const resultadoInscripciones = resultadosInscripciones[materiaId];
    
    if (!resultadoInscripciones) {
      // No se pudo consultar esta materia
      materiasConInscriptos.push({
        ...itemConvergencia,
        inscriptos: 0,
        estado: 'sin_consultar',
        error: 'No se pudo consultar el sistema externo'
      });
      continue;
    }
    
    if (resultadoInscripciones.error) {
      // Error al consultar esta materia
      materiasConInscriptos.push({
        ...itemConvergencia,
        inscriptos: 0,
        estado: 'error',
        error: resultadoInscripciones.error
      });
      continue;
    }
    
    // Buscar matching exacto por AREATEMA
    const inscripcionesMatching = resultadoInscripciones.inscripciones.filter(acta => {
      const actaAreaTema = acta.areaTema || acta.areasTemas;
      return actaAreaTema && actaAreaTema.toString() === areaTema;
    });
    
    const totalInscriptosMatching = inscripcionesMatching.reduce((total, acta) => 
      total + (acta.alumnos?.length || 0), 0);
    
    materiasConInscriptos.push({
      ...itemConvergencia,
      inscriptos: totalInscriptosMatching,
      estado: totalInscriptosMatching > 0 ? 'con_inscriptos' : 'sin_inscriptos',
      inscripcionesDetalle: inscripcionesMatching,
      areasTemasDisponibles: resultadoInscripciones.areasTemasEncontradas
    });
  }
  
  return materiasConInscriptos;
}

/**
 * Generar resumen de resultados
 */
function generarResumen(materiasConInscriptos) {
  const totalMaterias = materiasConInscriptos.length;
  const conInscriptos = materiasConInscriptos.filter(m => m.inscriptos > 0).length;
  const sinInscriptos = materiasConInscriptos.filter(m => m.inscriptos === 0).length;
  const conError = materiasConInscriptos.filter(m => m.estado === 'error').length;
  const totalInscriptos = materiasConInscriptos.reduce((total, m) => total + m.inscriptos, 0);
  
  return {
    totalMaterias,
    conInscriptos,
    sinInscriptos,
    conError,
    totalInscriptos,
    porcentajeConInscriptos: totalMaterias > 0 ? ((conInscriptos / totalMaterias) * 100).toFixed(2) : 0
  };
}

export default router; 
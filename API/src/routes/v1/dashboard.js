import express from 'express';
import csvDownloadService from '../../services/csvDownloadService.js';
import ActaExternaService from '../../services/actaExternaService.js';

const router = express.Router();
const actaService = new ActaExternaService();
const csvService = new csvDownloadService();

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
    
    const spreadsheetId = '12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8';
    const sheetName = 'convergencia';
    
    const resultadoCSV = await csvService.downloadCSV(spreadsheetId, sheetName);
    const datosRaw = resultadoCSV.content;
    
    // Parsear CSV básico
    const lineas = datosRaw.split('\n');
    const headerLine = lineas[0];
    const headers = parseCSVLine(headerLine);
    
    // Parsear primeras 3 filas de datos
    const muestraDatos = [];
    for (let i = 1; i <= Math.min(3, lineas.length - 1); i++) {
      if (lineas[i].trim()) {
        const valores = parseCSVLine(lineas[i]);
        const fila = {};
        headers.forEach((header, index) => {
          fila[header.trim()] = valores[index]?.trim() || '';
        });
        muestraDatos.push(fila);
      }
    }
    
    return res.json({
      success: true,
      debug: {
        totalLineas: lineas.length,
        headers: headers,
        cantidadHeaders: headers.length,
        primerasFilas: muestraDatos,
        headerOriginal: headerLine,
        linea1Cruda: lineas[1],
        linea1Parseada: lineas[1] ? parseCSVLine(lineas[1]) : null
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
    // Usar el mismo spreadsheet ID del sistema TOTEM
    const spreadsheetId = '12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8';
    const sheetName = 'convergencia'; // Nombre de la hoja
    
    const resultadoCSV = await csvService.downloadCSV(spreadsheetId, sheetName);
    const datosRaw = resultadoCSV.content;
    
    if (!datosRaw || typeof datosRaw !== 'string') {
      throw new Error('No se pudo obtener contenido válido del CSV');
    }
    
    // Procesar CSV y estructurar datos - PARSER MEJORADO
    const lineas = datosRaw.split('\n');
    
    // Los headers del Google Sheet están vacíos, usamos estructura fija basada en datos observados
    const headers = [
      'SECTOR',       // Columna 0: ej. "2"
      'CARRERA',      // Columna 1: ej. "133" 
      'CODIGO',       // Columna 2: ej. "7"
      'MATERIA',      // Columna 3: ej. "60", "710", "640"
      'AREATEMA',     // Columna 4: ej. "710", "640"
      'AÑO',          // Columna 5: ej. "2° AÑO"
      'NOMBRE_CORTO', // Columna 6: ej. "DERECHO II"
      'FECHA',        // Columna 7: ej. "4/7/2025"
      'URL_CAMPUS',   // Columna 8: URL del campus virtual
      'CLASE',        // Columna 9: Ej. "A", "B", "-"
      'DOCENTE',      // Columna 10
      'HORA',         // Columna 11: ej. "18:00"
      'TIPO_EXAMEN',  // Columna 12: ej. "Oral en domicilio"
      'CAMPO13',      // Columna 13
      'COORDINADOR',  // Columna 14: ej. "ANDREA TEJERINA"
      'CAMPO15',      // Columna 15
      'CAMPO16',      // Columna 16
      'OBSERVACIONES' // Columna 17
    ];
    
    console.log(`📋 Usando headers fijos (${headers.length}): ${JSON.stringify(headers.slice(0, 8))}...`);
    
    const datos = [];
    // Procesar desde línea 0 ya que no hay headers reales
    for (let i = 0; i < lineas.length; i++) {
      if (!lineas[i].trim()) continue; // Saltar líneas vacías
      
      const valores = parseCSVLine(lineas[i]);
      
      if (valores.length >= 5) { // Al menos sector, carrera, código, materia, areatema
        const fila = {};
        headers.forEach((header, index) => {
          fila[header] = valores[index]?.trim() || '';
        });
        
        // Extraer campos principales usando la estructura fija
        const materiaId = fila.MATERIA || '';
        const areaTema = fila.AREATEMA || '';
        const sector = fila.SECTOR || '';
        
        // Debug: mostrar las primeras filas procesadas
        if (datos.length < 3) {
          console.log(`📋 Fila ${i} procesada:`, {
            sector: sector,
            carrera: fila.CARRERA,
            materiaId: materiaId,
            areaTema: areaTema,
            nombreCorto: fila.NOMBRE_CORTO,
            fecha: fila.FECHA,
            valoresRaw: valores.slice(0, 8)
          });
        }
        
        // Solo incluir filas con MATERIA y AREATEMA válidos
        if (materiaId && materiaId !== '' && materiaId !== 'null' && 
            areaTema && areaTema !== '' && areaTema !== 'null') {
          datos.push({
            sector: sector,
            carrera: fila.CARRERA,
            codigo: fila.CODIGO,
            materiaId: materiaId,
            areaTema: areaTema,
            año: fila.AÑO,
            nombreCorto: fila.NOMBRE_CORTO,
            fecha: fila.FECHA,
            urlCampus: fila.URL_CAMPUS,
            clase: fila.CLASE,
            docente: fila.DOCENTE,
            hora: fila.HORA,
            tipoExamen: fila.TIPO_EXAMEN,
            coordinador: fila.COORDINADOR
          });
        }
      }
    }
    
    console.log(`📖 Leídas ${datos.length} materias del sheet convergencia`);
    
    // Debug: mostrar algunas muestras
    if (datos.length > 0) {
      console.log(`📋 Primera materia procesada:`, JSON.stringify(datos[0], null, 2));
      console.log(`📋 Muestra de IDs de materias:`, datos.slice(0, 5).map(d => d.materiaId));
    } else {
      console.log(`⚠️ No se procesaron materias. Revisando raw data...`);
      console.log(`📋 Primeras 3 líneas raw:`, lineas.slice(0, 3));
      console.log(`📋 Headers parseados:`, headers);
      if (lineas.length > 1) {
        const primeraLinea = parseCSVLine(lineas[1]);
        console.log(`📋 Primera línea parseada:`, primeraLinea);
      }
    }
    
    return datos;

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
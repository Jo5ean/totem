import csvDownloadService from '../../../../services/csvDownloadService.js';
import ActaExternaService from '../../../../services/actaExternaService.js';

const actaService = new ActaExternaService();
const csvService = new csvDownloadService();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido',
      allowedMethods: ['GET']
    });
  }

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
    
    // Procesar CSV y estructurar datos
    const lineas = datosRaw.split('\n');
    const headers = lineas[0].split(',');
    
    const datos = [];
    for (let i = 1; i < lineas.length; i++) {
      const valores = lineas[i].split(',');
      if (valores.length >= headers.length) {
        const fila = {};
        headers.forEach((header, index) => {
          fila[header.trim()] = valores[index]?.trim() || '';
        });
        
        // Solo procesar filas con datos válidos
        if (fila.MATERIA && fila.MATERIA !== '') {
          datos.push({
            sector: fila.SECTOR,
            carrera: fila.CARRERA,
            areaTema: fila.AREATEMA,
            materiaId: fila.MATERIA,
            nombreCorto: fila['NOMBRE CORTO'],
            fecha: fila.FECHA,
            hora: fila.Hora,
            tipoExamen: fila['Tipo Examen'],
            docente: fila.Docente,
            catedra: fila.CATEDRA
          });
        }
      }
    }
    
    console.log(`📖 Leídas ${datos.length} materias del sheet convergencia`);
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
    
    // Buscar coincidencia exacta de MATERIA + AREATEMA
    const inscripcionesMatching = resultadoInscripciones.inscripciones.filter(acta => {
      const areaTemaAcata = acta.areaTema || acta.areasTemas;
      return areaTemaAcata && areaTemaAcata.toString() === areaTema.toString();
    });
    
    const totalInscriptosMatching = inscripcionesMatching.reduce((total, acta) => 
      total + (acta.alumnos?.length || 0), 0
    );
    
    materiasConInscriptos.push({
      ...itemConvergencia,
      inscriptos: totalInscriptosMatching,
      inscripcionesPorAreaTema: inscripcionesMatching.length,
      totalInscriptosMateria: resultadoInscripciones.totalInscriptos,
      areasTemasDisponibles: resultadoInscripciones.areasTemasEncontradas,
      estado: totalInscriptosMatching > 0 ? 'con_inscriptos' : 'sin_inscriptos',
      tieneMatching: inscripcionesMatching.length > 0
    });
  }
  
  return materiasConInscriptos;
}

/**
 * Generar resumen de resultados
 */
function generarResumen(materiasConInscriptos) {
  const total = materiasConInscriptos.length;
  const conInscriptos = materiasConInscriptos.filter(m => m.inscriptos > 0).length;
  const sinInscriptos = materiasConInscriptos.filter(m => m.inscriptos === 0 && m.estado !== 'error').length;
  const conError = materiasConInscriptos.filter(m => m.estado === 'error').length;
  const totalInscriptos = materiasConInscriptos.reduce((sum, m) => sum + m.inscriptos, 0);
  
  return {
    totalMaterias: total,
    materiasConInscriptos: conInscriptos,
    materiasSinInscriptos: sinInscriptos,
    materiasConError: conError,
    totalInscriptosGeneral: totalInscriptos,
    porcentajeConInscriptos: total > 0 ? ((conInscriptos / total) * 100).toFixed(1) : 0,
    
    // Top 5 materias con más inscriptos
    top5Materias: materiasConInscriptos
      .filter(m => m.inscriptos > 0)
      .sort((a, b) => b.inscriptos - a.inscriptos)
      .slice(0, 5)
      .map(m => ({
        nombreCorto: m.nombreCorto,
        inscriptos: m.inscriptos,
        carrera: m.carrera,
        fecha: m.fecha
      }))
  };
} 
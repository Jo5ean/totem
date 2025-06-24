import ActaExternaService from '../../../../services/actaExternaService.js';

const actaService = new ActaExternaService();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido. Use POST.' 
    });
  }

  try {
    const {
      facultadId,
      carreraId,
      fechaDesde,
      fechaHasta,
      soloSinAula = false,
      rendida = false
    } = req.body;

    console.log('🔄 Iniciando sincronización masiva de inscripciones...');

    // Configurar filtros para exámenes
    const filtrosExamenes = {};
    
    if (facultadId) {
      filtrosExamenes.facultadId = facultadId;
    }
    
    if (carreraId) {
      filtrosExamenes.carreraId = carreraId;
    }
    
    if (soloSinAula) {
      filtrosExamenes.aulaId = null;
    }

    // Configurar filtros para consultas externas
    const filtrosConsulta = { rendida };
    
    if (fechaDesde) {
      filtrosConsulta.fechaDesde = fechaDesde;
    }
    
    if (fechaHasta) {
      filtrosConsulta.fechaHasta = fechaHasta;
    }

    // Ejecutar sincronización
    const resultado = await actaService.sincronizarInscripcionesExamenes({
      whereExamenes: filtrosExamenes,
      filtrosConsulta
    });

    // Generar estadísticas adicionales
    const examenesProblemáticos = resultado.resultados
      .filter(r => r.exito && r.datos.resumen.requiereAccion)
      .map(r => ({
        examenId: r.examenId,
        problema: r.datos.resumen.tieneAulaAsignada ? 'capacidad_insuficiente' : 'sin_aula',
        totalAlumnos: r.datos.inscripciones.totalAlumnos,
        capacidadAula: r.datos.examen.aula?.capacidad || 0
      }));

    return res.status(200).json({
      success: true,
      data: {
        sincronizacion: resultado,
        estadisticas: {
          examenesProcesados: resultado.total,
          exitosos: resultado.exitosos,
          fallidos: resultado.fallidos,
          examenesProblemáticos: examenesProblemáticos.length,
          detalleProblemas: examenesProblemáticos
        }
      },
      metadata: {
        ejecutadoEn: new Date().toISOString(),
        filtrosAplicados: {
          examenes: filtrosExamenes,
          consultas: filtrosConsulta
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en sincronización masiva:', error);

    return res.status(500).json({
      success: false,
      message: 'Error en sincronización masiva de inscripciones',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 
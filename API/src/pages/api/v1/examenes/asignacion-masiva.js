import AsignacionAulaService from '../../../../services/AsignacionAulaService.js';
import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['POST']
    });
  }

  try {
    const { examenesIds, soloSinAula = true } = req.body;

    let idsAProcesar = [];

    if (examenesIds && Array.isArray(examenesIds)) {
      // Procesar IDs específicos proporcionados
      idsAProcesar = examenesIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    } else if (soloSinAula) {
      // Procesar todos los exámenes sin aula asignada
      const examenesSinAula = await prisma.examen.findMany({
        where: { aulaId: null },
        select: { id: true }
      });
      idsAProcesar = examenesSinAula.map(e => e.id);
    }

    if (idsAProcesar.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay exámenes para procesar'
      });
    }

    console.log(`Iniciando asignación masiva para ${idsAProcesar.length} exámenes...`);

    const resultados = await AsignacionAulaService.procesarAsignacionMasiva(idsAProcesar);

    // Obtener estadísticas finales
    const estadisticas = await AsignacionAulaService.obtenerEstadisticasAsignacion();

    return res.status(200).json({
      success: true,
      data: resultados,
      estadisticas,
      resumen: {
        totalProcesados: idsAProcesar.length,
        exitosos: resultados.exitosos.length,
        sinCapacidad: resultados.sinCapacidad.length,
        errores: resultados.errores.length,
        porcentajeExito: idsAProcesar.length > 0 
          ? Math.round((resultados.exitosos.length / idsAProcesar.length) * 100) 
          : 0
      },
      message: `Asignación masiva completada. ${resultados.exitosos.length} de ${idsAProcesar.length} exámenes asignados exitosamente.`
    });

  } catch (error) {
    console.error('Error en asignación masiva:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 
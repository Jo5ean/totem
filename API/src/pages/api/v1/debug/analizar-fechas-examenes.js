import prisma from '../../../../lib/db.js';
import { withCors } from '../../../../lib/cors.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Usa GET.'
    });
  }

  try {
    console.log('📅 ANALIZANDO FECHAS DE EXÁMENES...');

    const hoy = new Date();
    const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. Contar exámenes totales
    const totalExamenes = await prisma.examen.count();

    // 2. Contar exámenes en rango de backoffice (próximos 30 días)
    const examenesProximos30Dias = await prisma.examen.count({
      where: {
        fecha: {
          gte: hoy,
          lte: en30Dias
        }
      }
    });

    // 3. Contar exámenes PASADOS
    const examenesPasados = await prisma.examen.count({
      where: {
        fecha: {
          lt: hoy
        }
      }
    });

    // 4. Contar exámenes MUY FUTUROS (más de 30 días)
    const examenesMuyFuturos = await prisma.examen.count({
      where: {
        fecha: {
          gt: en30Dias
        }
      }
    });

    // 5. Obtener fechas límite
    const fechaMinima = await prisma.examen.findFirst({
      orderBy: { fecha: 'asc' },
      select: { fecha: true, nombreMateria: true }
    });

    const fechaMaxima = await prisma.examen.findFirst({
      orderBy: { fecha: 'desc' },
      select: { fecha: true, nombreMateria: true }
    });

    // 6. Contar exámenes sin aula en rango backoffice
    const examenesProximosSinAula = await prisma.examen.count({
      where: {
        aulaId: null,
        fecha: {
          gte: hoy,
          lte: en30Dias
        }
      }
    });

    const analisis = {
      totalExamenes,
      examenesProximos30Dias,
      examenesPasados,
      examenesMuyFuturos,
      examenesProximosSinAula,
      diferencia: totalExamenes - examenesProximos30Dias,
      fechaLimites: {
        minima: fechaMinima?.fecha,
        maxima: fechaMaxima?.fecha,
        ejemploMinimo: fechaMinima?.nombreMateria,
        ejemploMaximo: fechaMaxima?.nombreMateria
      },
      rangosAnalisis: {
        hoy: hoy.toISOString().split('T')[0],
        limite30Dias: en30Dias.toISOString().split('T')[0]
      }
    };

    console.log('📊 Análisis de fechas:', analisis);

    return res.status(200).json({
      success: true,
      message: 'Análisis de fechas completado',
      data: {
        resumen: `${totalExamenes} totales, ${examenesProximos30Dias} en próximos 30 días (${totalExamenes - examenesProximos30Dias} fuera del rango)`,
        ...analisis,
        explicacion: {
          backoffice: `El backoffice muestra ${examenesProximos30Dias} exámenes (solo próximos 30 días)`,
          excluidos: `${totalExamenes - examenesProximos30Dias} exámenes excluidos por fechas:`,
          desglose: [
            `${examenesPasados} exámenes pasados (antes de hoy)`,
            `${examenesMuyFuturos} exámenes muy futuros (más de 30 días)`
          ],
          asignables: `${examenesProximosSinAula} exámenes próximos sin aula asignada`
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en análisis de fechas:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error durante el análisis',
      message: error.message
    });
  }
}

export default withCors(handler); 
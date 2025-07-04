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
    console.log('🔍 ANALIZANDO DIFERENCIA EN EXÁMENES...');

    // 1. Contar exámenes totales
    const totalExamenes = await prisma.examen.count();

    // 2. Contar exámenes ACTIVOS
    const examenesActivos = await prisma.examen.count({
      where: { activo: true }
    });

    // 3. Contar exámenes por modalidad
    const examenesPresenciales = await prisma.examen.count({
      where: { 
        modalidadExamen: 'presencial',
        activo: true 
      }
    });

    const examenesVirtuales = await prisma.examen.count({
      where: { 
        modalidadExamen: 'virtual',
        activo: true 
      }
    });

    const examenesSinModalidad = await prisma.examen.count({
      where: { 
        modalidadExamen: null,
        activo: true 
      }
    });

    // 4. Contar exámenes YA asignados a aula
    const examenesConAula = await prisma.examen.count({
      where: { 
        aulaId: { not: null },
        activo: true 
      }
    });

    const examenesSinAula = await prisma.examen.count({
      where: { 
        aulaId: null,
        activo: true 
      }
    });

    // 5. Exámenes que PUEDEN ser asignados (presenciales + sin modalidad, sin aula, activos)
    const examenesAsignables = await prisma.examen.count({
      where: {
        AND: [
          { activo: true },
          { aulaId: null },
          {
            OR: [
              { modalidadExamen: 'presencial' },
              { modalidadExamen: null }
            ]
          }
        ]
      }
    });

    // 6. Obtener ejemplos de exámenes NO asignables
    const ejemplosNoAsignables = await prisma.examen.findMany({
      where: {
        OR: [
          { activo: false },
          { modalidadExamen: 'virtual' },
          { aulaId: { not: null } }
        ]
      },
      take: 5,
      select: {
        id: true,
        nombreMateria: true,
        modalidadExamen: true,
        activo: true,
        aulaId: true,
        aula: {
          select: { nombre: true }
        }
      }
    });

    const analisis = {
      totalExamenes,
      examenesActivos,
      examenesAsignables,
      diferencia: totalExamenes - examenesAsignables,
      porModalidad: {
        presenciales: examenesPresenciales,
        virtuales: examenesVirtuales,
        sinModalidad: examenesSinModalidad
      },
      porAsignacion: {
        conAula: examenesConAula,
        sinAula: examenesSinAula
      },
      ejemplosNoAsignables
    };

    console.log('📊 Análisis:', analisis);

    return res.status(200).json({
      success: true,
      message: 'Análisis de exámenes completado',
      data: {
        resumen: `${totalExamenes} totales, ${examenesAsignables} asignables (${totalExamenes - examenesAsignables} no asignables)`,
        ...analisis,
        explicacion: {
          noAsignables: `Los ${totalExamenes - examenesAsignables} exámenes no asignables pueden ser:`,
          razones: [
            `${examenesVirtuales} exámenes virtuales`,
            `${examenesConAula} ya tienen aula asignada`,
            `${totalExamenes - examenesActivos} están inactivos`
          ]
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en análisis:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error durante el análisis',
      message: error.message
    });
  }
}

export default withCors(handler); 
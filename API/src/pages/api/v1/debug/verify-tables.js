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
    console.log('🔍 VERIFICANDO ESTADO DE TABLAS...');

    // Contar registros en todas las tablas relacionadas
    const counts = {
      examenes: await prisma.examen.count(),
      examenTotem: await prisma.examenTotem.count(),
      totemData: await prisma.totemData.count(),
      carreras: await prisma.carrera.count(),
      facultades: await prisma.facultad.count(),
      carreraTotem: await prisma.carreraTotem.count(),
      sectorFacultad: await prisma.sectorFacultad.count()
    };

    // Obtener algunos registros de ExamenTotem para ver qué hay
    const sampleExamenTotem = await prisma.examenTotem.findMany({
      take: 5,
      select: {
        id: true,
        examenId: true,
        sectorTotem: true,
        carreraTotem: true,
        materiaTotem: true,
        examen: {
          select: {
            id: true,
            fecha: true,
            activo: true
          }
        }
      }
    });

    // Obtener algunos registros de TotemData
    const sampleTotemData = await prisma.totemData.findMany({
      take: 3,
      select: {
        id: true,
        sheetName: true,
        timestamp: true
      }
    });

    console.log('📊 Conteos:', counts);

    return res.status(200).json({
      success: true,
      message: 'Verificación de tablas completada',
      data: {
        counts,
        sampleExamenTotem,
        sampleTotemData,
        diagnosis: {
          problemaPosible: counts.examenTotem > 0 && counts.examenes === 0 ? 
            'ExamenTotem tiene datos pero Examen está vacío' : 
            'Configuración normal',
          solucion: counts.examenTotem > 0 && counts.examenes === 0 ?
            'Limpiar ExamenTotem también' :
            'Verificar mapeos de carreras/sectores'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en verificación:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error durante la verificación',
      message: error.message
    });
  }
}

export default withCors(handler); 
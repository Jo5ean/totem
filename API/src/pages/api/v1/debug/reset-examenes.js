import prisma from '../../../../lib/db.js';
import { withCors } from '../../../../lib/cors.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Usa POST.'
    });
  }

  try {
    console.log('🔥 INICIANDO RESET DE EXÁMENES...');

    // 1. Contar exámenes antes
    const totalAntes = await prisma.examen.count();
    console.log(`📊 Exámenes antes del reset: ${totalAntes}`);

    // 2. Eliminar TODOS los exámenes y sus datos relacionados
    await prisma.examenTotem.deleteMany({});
    console.log('✅ ExamenTotem eliminados');

    await prisma.examen.deleteMany({});
    console.log('✅ Examen eliminados');

    // 3. Verificar que la limpieza funcionó
    const totalDespues = await prisma.examen.count();
    console.log(`📊 Exámenes después del reset: ${totalDespues}`);

    if (totalDespues > 0) {
      throw new Error(`Error: Aún quedan ${totalDespues} exámenes`);
    }

    return res.status(200).json({
      success: true,
      message: 'Reset de exámenes completado exitosamente',
      data: {
        examenesEliminados: totalAntes,
        examenesRestantes: totalDespues,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error en reset:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error durante el reset',
      message: error.message
    });
  }
}

export default withCors(handler); 
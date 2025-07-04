// Endpoint ultra simple para depurar errores
import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });
  }

  try {
    console.log('Iniciando consultas simples...');

    // Consulta 1: Contar registros TOTEM
    let totalRegistros = 0;
    try {
      totalRegistros = await prisma.totemData.count();
      console.log('✅ totemData.count() exitoso:', totalRegistros);
    } catch (error) {
      console.error('❌ Error en totemData.count():', error.message);
    }

    // Consulta 2: Contar exámenes
    let examenes = 0;
    try {
      examenes = await prisma.examenTotem.count();
      console.log('✅ examenTotem.count() exitoso:', examenes);
    } catch (error) {
      console.error('❌ Error en examenTotem.count():', error.message);
    }

    // Consulta 3: Contar carreras no mapeadas (sin consulta SQL raw)
    let carrerasNoMapeadas = 0;
    try {
      carrerasNoMapeadas = await prisma.carreraTotem.count({
        where: { esMapeada: false }
      });
      console.log('✅ carreraTotem.count() exitoso:', carrerasNoMapeadas);
    } catch (error) {
      console.error('❌ Error en carreraTotem.count():', error.message);
    }

    const estadisticas = {
      totalRegistrosTotem: Number(totalRegistros),
      totalExamenesCreados: Number(examenes),
      sectoresNoMapeados: 0, // Temporalmente en 0 para evitar consulta compleja
      carrerasNoMapeadas: Number(carrerasNoMapeadas),
      listaSectoresNoMapeados: [],
      listaCarrerasNoMapeadas: []
    };

    console.log('✅ Respuesta final:', estadisticas);

    res.status(200).json({
      success: true,
      data: estadisticas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error general:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 
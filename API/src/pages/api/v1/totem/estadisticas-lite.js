// Endpoint ligero para estadísticas básicas del TOTEM
import prisma from '../../../../lib/db.js';
import TotemService from '../../../../services/totemService.js';

const totemService = new TotemService();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });
  }

  try {
    // Obtener solo estadísticas básicas sin cargar listas grandes
    const [totalRegistros, examenes] = await Promise.all([
      prisma.totemData.count(),
      prisma.examenTotem.count()
    ]);

    // Contar sectores no mapeados de forma más eficiente
    const sectoresNoMapeadosCount = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(data, '$[*].SECTOR'))) as count
      FROM totem_data 
      WHERE JSON_EXTRACT(data, '$[*].SECTOR') IS NOT NULL
      LIMIT 1
    `;

    // Contar carreras no mapeadas
    const carrerasNoMapeadasCount = await prisma.carreraTotem.count({
      where: { esMapeada: false }
    });

    const estadisticas = {
      totalRegistrosTotem: Number(totalRegistros),
      totalExamenesCreados: Number(examenes),
      sectoresNoMapeados: Number(sectoresNoMapeadosCount[0]?.count || 0),
      carrerasNoMapeadas: Number(carrerasNoMapeadasCount),
      // Solo incluir listas si son pocas para evitar problemas de memoria
      listaSectoresNoMapeados: [],
      listaCarrerasNoMapeadas: []
    };

    res.status(200).json({
      success: true,
      data: estadisticas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas ligeras TOTEM:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 
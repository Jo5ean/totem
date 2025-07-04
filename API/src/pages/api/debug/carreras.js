import prisma from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { facultadId } = req.query;

    const whereClause = {};
    if (facultadId) {
      whereClause.facultadId = parseInt(facultadId);
    }

    const carreras = await prisma.carrera.findMany({
      where: whereClause,
      include: {
        facultad: true,
        _count: {
          select: { examenes: true }
        }
      },
      orderBy: { codigo: 'asc' }
    });

    const carrerasFormateadas = carreras.map(carrera => ({
      id: carrera.id,
      codigo: carrera.codigo,
      nombre: carrera.nombre,
      facultad: carrera.facultad.nombre,
      totalExamenes: carrera._count.examenes,
      activa: carrera.activa,
      fechaCreacion: carrera.createdAt.toISOString().split('T')[0]
    }));

    return res.status(200).json({
      total: carreras.length,
      carreras: carrerasFormateadas
    });

  } catch (error) {
    console.error('Error obteniendo carreras:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
} 
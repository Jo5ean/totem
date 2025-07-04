import prisma from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { facultadId, carreraId, limit = 50 } = req.query;

    const whereClause = {};
    
    if (carreraId) {
      whereClause.carreraId = parseInt(carreraId);
    } else if (facultadId) {
      whereClause.carrera = {
        facultadId: parseInt(facultadId)
      };
    }

    const examenes = await prisma.examen.findMany({
      where: whereClause,
      include: {
        carrera: {
          include: {
            facultad: true
          }
        }
      },
      orderBy: [
        { fecha: 'asc' },
        { hora: 'asc' }
      ],
      take: parseInt(limit)
    });

    // Formatear para mejor lectura
    const examenesFormateados = examenes.map(examen => ({
      id: examen.id,
      materia: examen.nombreMateria,
      fecha: examen.fecha ? examen.fecha.toISOString().split('T')[0] : null,
      hora: examen.hora ? examen.hora.toTimeString().split(' ')[0] : null,
      tipo: examen.tipoExamen,
      carrera: {
        codigo: examen.carrera.codigo,
        nombre: examen.carrera.nombre
      },
      facultad: examen.carrera.facultad.nombre,
      observaciones: examen.observaciones
    }));

    return res.status(200).json({
      total: examenes.length,
      examenes: examenesFormateados
    });

  } catch (error) {
    console.error('Error obteniendo exámenes:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
} 
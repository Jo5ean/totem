import prisma from '../../../lib/db.js';

export default async function handler(req, res) {
  
  if (req.method === 'GET') {
    // LISTAR exámenes sin aula
    try {
      const examenes = await prisma.examen.findMany({
        where: {
          aulaId: null, // Sin aula asignada
          examenTotem: {
            isNot: null // Solo exámenes con datos TOTEM (nombres reales)
          }
        },
        include: {
          carrera: {
            include: { facultad: true }
          },
          examenTotem: true // INCLUIR datos TOTEM con nombre corto
        },
        take: 50, // Máximo 50
        orderBy: { fecha: 'asc' }
      });

      // Obtener aulas disponibles
      const aulas = await prisma.aula.findMany({
        where: { disponible: true },
        orderBy: { nombre: 'asc' }
      });

      return res.status(200).json({
        success: true,
        data: {
          examenes: examenes.map(ex => {
            // Buscar nombre corto en datos originales TOTEM
            const nombreCorto = ex.examenTotem?.dataOriginal?.['NOMBRE CORTO'] || 
                               ex.nombreMateria;
            
            return {
              id: ex.id,
              materia: nombreCorto, // USAR NOMBRE CORTO REAL
              fecha: ex.fecha.toISOString().split('T')[0],
              hora: ex.hora ? ex.hora.toISOString().split('T')[1].substring(0, 5) : null,
              carrera: ex.carrera.nombre,
              tipoExamen: ex.tipoExamen || 'N/A'
            };
          }),
          aulas: aulas.map(a => ({
            id: a.id,
            nombre: a.nombre,
            capacidad: a.capacidad || 0
          }))
        }
      });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error obteniendo datos'
      });
    }
  }

  if (req.method === 'POST') {
    // ASIGNAR aula
    try {
      const { examenId, aulaId } = req.body;

      const examenActualizado = await prisma.examen.update({
        where: { id: parseInt(examenId) },
        data: { aulaId: parseInt(aulaId) }
      });

      return res.status(200).json({
        success: true,
        message: 'Aula asignada exitosamente'
      });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error asignando aula'
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Método no permitido'
  });
} 
import prisma from '../../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Usa POST.'
    });
  }

  const { id } = req.query;
  const { aulaId, observaciones } = req.body;

  // Validar parámetros
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      error: 'ID de examen inválido'
    });
  }

  if (!aulaId || isNaN(parseInt(aulaId))) {
    return res.status(400).json({
      success: false,
      error: 'ID de aula inválido'
    });
  }

  try {
    // 1. Verificar que el examen existe
    const examen = await prisma.examen.findUnique({
      where: { id: parseInt(id) },
      include: {
        carrera: {
          include: { facultad: true }
        },
        aula: true
      }
    });

    if (!examen) {
      return res.status(404).json({
        success: false,
        error: 'Examen no encontrado'
      });
    }

    // 2. Verificar que el aula existe y está disponible
    const aula = await prisma.aula.findUnique({
      where: { id: parseInt(aulaId) }
    });

    if (!aula) {
      return res.status(404).json({
        success: false,
        error: 'Aula no encontrada'
      });
    }

    if (!aula.disponible) {
      return res.status(400).json({
        success: false,
        error: 'El aula seleccionada no está disponible'
      });
    }

    // 3. Verificar conflictos de horario (opcional, pero recomendado)
    const conflictos = await prisma.examen.findMany({
      where: {
        aulaId: parseInt(aulaId),
        fecha: examen.fecha,
        hora: examen.hora,
        id: { not: parseInt(id) } // Excluir el examen actual
      },
      include: {
        carrera: true
      }
    });

    if (conflictos.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Conflicto de horario detectado',
        data: {
          conflictos: conflictos.map(c => ({
            id: c.id,
            materia: c.nombreMateria,
            carrera: c.carrera.nombre,
            fecha: c.fecha?.toISOString().split('T')[0],
            hora: c.hora?.toTimeString().split(' ')[0]
          }))
        }
      });
    }

    // 4. Asignar el aula al examen
    const examenActualizado = await prisma.examen.update({
      where: { id: parseInt(id) },
      data: {
        aulaId: parseInt(aulaId),
        observaciones: observaciones || examen.observaciones,
        updatedAt: new Date()
      },
      include: {
        carrera: {
          include: { facultad: true }
        },
        aula: true
      }
    });

    console.log(`✅ Aula asignada: Examen ${id} → Aula ${aula.nombre}`);

    return res.status(200).json({
      success: true,
      message: `Aula "${aula.nombre}" asignada exitosamente`,
      data: {
        examen: {
          id: examenActualizado.id,
          nombre: examenActualizado.nombreMateria,
          fecha: examenActualizado.fecha?.toISOString().split('T')[0],
          hora: examenActualizado.hora?.toTimeString().split(' ')[0],
          carrera: {
            nombre: examenActualizado.carrera.nombre,
            facultad: examenActualizado.carrera.facultad.nombre
          },
          aula: {
            id: examenActualizado.aula.id,
            nombre: examenActualizado.aula.nombre,
            capacidad: examenActualizado.aula.capacidad,
            ubicacion: examenActualizado.aula.ubicacion
          },
          observaciones: examenActualizado.observaciones
        },
        asignacion: {
          realizada: true,
          timestamp: new Date().toISOString(),
          aulaAnterior: examen.aula ? {
            id: examen.aula.id,
            nombre: examen.aula.nombre
          } : null,
          aulaNueva: {
            id: aula.id,
            nombre: aula.nombre,
            capacidad: aula.capacidad
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error asignando aula:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 
import prisma from '../../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['PUT']
    });
  }

  const { id } = req.query;
  const { aulaId } = req.body;

  // Validaciones
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
    const examenId = parseInt(id);
    const aulaIdNum = parseInt(aulaId);

    // Verificar que el examen existe
    const examen = await prisma.examen.findUnique({
      where: { id: examenId },
      include: {
        materia: true,
        carrera: true,
        _count: {
          select: { actasExamen: true }
        }
      }
    });

    if (!examen) {
      return res.status(404).json({
        success: false,
        error: 'Examen no encontrado'
      });
    }

    // Verificar que el aula existe y está disponible
    const aula = await prisma.aula.findUnique({
      where: { id: aulaIdNum }
    });

    if (!aula) {
      return res.status(404).json({
        success: false,
        error: 'Aula no encontrada'
      });
    }

    if (!aula.disponible) {
      return res.status(409).json({
        success: false,
        error: 'El aula no está disponible'
      });
    }

    // Verificar conflictos de horario (misma fecha y hora)
    const conflictos = await prisma.examen.findMany({
      where: {
        aulaId: aulaIdNum,
        fecha: examen.fecha,
        hora: examen.hora,
        id: { not: examenId } // Excluir el examen actual
      },
      include: {
        materia: true,
        carrera: true
      }
    });

    if (conflictos.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Conflicto de horario: el aula ya está ocupada en esa fecha y hora',
        conflictos: conflictos.map(c => ({
          id: c.id,
          materia: c.materia.nombre,
          carrera: c.carrera.nombre,
          fecha: c.fecha.toISOString().split('T')[0],
          hora: c.hora
        }))
      });
    }

    // Verificar capacidad del aula vs cantidad de estudiantes inscriptos
    const cantidadEstudiantes = examen._count.actasExamen;
    if (aula.capacidad && cantidadEstudiantes > aula.capacidad) {
      return res.status(409).json({
        success: false,
        error: `El aula tiene capacidad para ${aula.capacidad} estudiantes, pero hay ${cantidadEstudiantes} inscriptos`,
        capacidadAula: aula.capacidad,
        estudiantesInscriptos: cantidadEstudiantes
      });
    }

    // Asignar el aula al examen
    const examenActualizado = await prisma.examen.update({
      where: { id: examenId },
      data: { aulaId: aulaIdNum },
      include: {
        materia: true,
        carrera: true,
        facultad: true,
        aula: true,
        _count: {
          select: { actasExamen: true }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: examenActualizado,
      message: `Aula ${aula.nombre} asignada exitosamente al examen de ${examenActualizado.materia.nombre}`,
      resumen: {
        examen: {
          materia: examenActualizado.materia.nombre,
          carrera: examenActualizado.carrera.nombre,
          fecha: examenActualizado.fecha.toISOString().split('T')[0],
          hora: examenActualizado.hora
        },
        aula: {
          nombre: aula.nombre,
          ubicacion: aula.ubicacion,
          capacidad: aula.capacidad
        },
        estudiantes: {
          inscriptos: cantidadEstudiantes,
          espaciosDisponibles: aula.capacidad ? aula.capacidad - cantidadEstudiantes : 'Sin límite'
        }
      }
    });

  } catch (error) {
    console.error('Error asignando aula:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 
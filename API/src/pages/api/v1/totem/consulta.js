import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['GET']
    });
  }

  try {
    const { dni } = req.query;

    if (!dni) {
      return res.status(400).json({
        success: false,
        error: 'El DNI es requerido para la consulta'
      });
    }

    // Buscar estudiante por DNI
    const estudiante = await prisma.estudiante.findUnique({
      where: { dni: dni.toString() }
    });

    if (!estudiante) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró un estudiante con ese DNI',
        dni: dni
      });
    }

    // Buscar todos los exámenes del estudiante
    const examenes = await prisma.actaExamen.findMany({
      where: {
        estudianteId: estudiante.id
      },
      include: {
        examen: {
          include: {
            materia: true,
            carrera: true,
            aula: true,
            facultad: true
          }
        }
      },
      orderBy: {
        examen: { fecha: 'asc' }
      }
    });

    if (examenes.length === 0) {
      return res.status(200).json({
        success: true,
        estudiante: {
          dni: estudiante.dni,
          nombre: estudiante.nombre,
          apellido: estudiante.apellido
        },
        examenes: [],
        message: 'El estudiante no tiene exámenes programados'
      });
    }

    // Formatear los datos para la consulta TOTEM
    const examenesFormateados = examenes.map(acta => ({
      id: acta.examen.id,
      fecha: acta.examen.fecha.toISOString().split('T')[0],
      hora: acta.examen.hora,
      materia: {
        codigo: acta.examen.materia.codigo,
        nombre: acta.examen.materia.nombre
      },
      carrera: {
        codigo: acta.examen.carrera.codigo,
        nombre: acta.examen.carrera.nombre
      },
      facultad: {
        nombre: acta.examen.facultad.nombre
      },
      aula: acta.examen.aula ? {
        nombre: acta.examen.aula.nombre,
        ubicacion: acta.examen.aula.ubicacion,
        capacidad: acta.examen.aula.capacidad
      } : null,
      estado: {
        tieneAula: !!acta.examen.aula,
        presente: acta.presente,
        nota: acta.nota
      }
    }));

    // Separar exámenes próximos y pasados
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proximos = examenesFormateados.filter(exam => 
      new Date(exam.fecha) >= hoy
    );

    const pasados = examenesFormateados.filter(exam => 
      new Date(exam.fecha) < hoy
    );

    return res.status(200).json({
      success: true,
      estudiante: {
        dni: estudiante.dni,
        nombre: estudiante.nombre,
        apellido: estudiante.apellido,
        email: estudiante.email
      },
      resumen: {
        totalExamenes: examenes.length,
        proximosExamenes: proximos.length,
        examenesRendidos: pasados.length,
        examenesConAula: examenesFormateados.filter(e => e.estado.tieneAula).length,
        examenesSinAula: examenesFormateados.filter(e => !e.estado.tieneAula).length
      },
      examenes: {
        proximos,
        pasados
      }
    });

  } catch (error) {
    console.error('Error en consulta TOTEM:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 
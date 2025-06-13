import db from '../../../../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`
    });
  }

  try {
    const { dni } = req.query;

    // Validar DNI
    if (!dni || typeof dni !== 'string' || dni.length < 7 || dni.length > 8) {
      return res.status(400).json({
        success: false,
        error: 'DNI inválido. Debe tener entre 7 y 8 dígitos'
      });
    }

    // Buscar estudiante por DNI
    const estudiante = await db.estudiante.findUnique({
      where: { dni: dni },
      include: {
        actasExamen: {
          include: {
            examen: {
              include: {
                carrera: {
                  include: {
                    facultad: true
                  }
                },
                aula: true
              }
            }
          }
        }
      }
    });

    if (!estudiante) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró ningún estudiante con este DNI'
      });
    }

    // Formatear datos de exámenes
    const examenes = estudiante.actasExamen.map(acta => ({
      id: acta.examen.id,
      nombreMateria: acta.examen.nombreMateria,
      fecha: acta.examen.fecha,
      hora: acta.examen.hora,
      tipoExamen: acta.examen.tipoExamen,
      modalidadExamen: acta.examen.modalidadExamen,
      observaciones: acta.examen.observaciones,
      materialPermitido: acta.examen.materialPermitido,
      requierePc: acta.examen.requierePc,
      aula: acta.examen.aula ? acta.examen.aula.nombre : null,
      ubicacionAula: acta.examen.aula ? acta.examen.aula.ubicacion : null,
      carrera: acta.examen.carrera.nombre,
      facultad: acta.examen.carrera.facultad.nombre,
      // Datos del acta del estudiante
      presente: acta.presente,
      nota: acta.nota,
      observacionesActa: acta.observaciones
    }));

    // Ordenar por fecha
    examenes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    return res.status(200).json({
      success: true,
      data: {
        estudiante: {
          dni: estudiante.dni,
          nombre: estudiante.nombre,
          apellido: estudiante.apellido,
          email: estudiante.email,
          telefono: estudiante.telefono
        },
        examenes: examenes,
        totalExamenes: examenes.length
      }
    });

  } catch (error) {
    console.error('Error al consultar exámenes por DNI:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al consultar los exámenes'
    });
  }
} 
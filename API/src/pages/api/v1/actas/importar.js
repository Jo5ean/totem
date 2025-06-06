import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['POST']
    });
  }

  try {
    const { tipo, datos, examenId, validarExistencia = true } = req.body;

    // Validaciones
    if (!datos || !Array.isArray(datos)) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de datos para importar'
      });
    }

    if (!examenId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el ID del examen'
      });
    }

    // Verificar que el examen existe
    const examen = await prisma.examen.findUnique({
      where: { id: parseInt(examenId) },
      include: {
        materia: true,
        carrera: true
      }
    });

    if (!examen) {
      return res.status(404).json({
        success: false,
        error: 'Examen no encontrado'
      });
    }

    const resultados = {
      totalProcesados: datos.length,
      estudiantesCreados: [],
      actasCreadas: [],
      duplicados: [],
      errores: []
    };

    // Procesar datos según el tipo
    for (let i = 0; i < datos.length; i++) {
      const fila = datos[i];
      
      try {
        let estudianteData;

        // Determinar el formato de los datos
        if (tipo === 'csv' || Array.isArray(fila)) {
          // Formato CSV: [dni, apellido, nombre, email]
          const [dni, apellido, nombre, email] = Array.isArray(fila) ? fila : fila.split(',');
          estudianteData = {
            dni: dni?.toString().trim(),
            apellido: apellido?.toString().trim(),
            nombre: nombre?.toString().trim(),
            email: email?.toString().trim() || null
          };
        } else {
          // Formato JSON objeto
          estudianteData = {
            dni: fila.dni?.toString().trim(),
            apellido: fila.apellido?.toString().trim(),
            nombre: fila.nombre?.toString().trim(),
            email: fila.email?.toString().trim() || null
          };
        }

        // Validar datos requeridos
        if (!estudianteData.dni || !estudianteData.apellido || !estudianteData.nombre) {
          resultados.errores.push({
            fila: i + 1,
            datos: estudianteData,
            error: 'DNI, apellido y nombre son requeridos'
          });
          continue;
        }

        // Buscar o crear estudiante
        let estudiante = await prisma.estudiante.findUnique({
          where: { dni: estudianteData.dni }
        });

        let estudianteCreado = false;
        if (!estudiante) {
          estudiante = await prisma.estudiante.create({
            data: estudianteData
          });
          estudianteCreado = true;
          resultados.estudiantesCreados.push({
            id: estudiante.id,
            dni: estudiante.dni,
            nombre: `${estudiante.nombre} ${estudiante.apellido}`
          });
        }

        // Verificar si ya existe el acta (si validarExistencia está habilitado)
        if (validarExistencia) {
          const actaExistente = await prisma.actaExamen.findUnique({
            where: {
              examenId_estudianteId: {
                examenId: parseInt(examenId),
                estudianteId: estudiante.id
              }
            }
          });

          if (actaExistente) {
            resultados.duplicados.push({
              fila: i + 1,
              dni: estudiante.dni,
              estudiante: `${estudiante.nombre} ${estudiante.apellido}`,
              message: 'Ya está inscripto en este examen'
            });
            continue;
          }
        }

        // Crear el acta
        const acta = await prisma.actaExamen.create({
          data: {
            examenId: parseInt(examenId),
            estudianteId: estudiante.id,
            presente: false
          }
        });

        resultados.actasCreadas.push({
          id: acta.id,
          estudiante: {
            id: estudiante.id,
            dni: estudiante.dni,
            nombre: `${estudiante.nombre} ${estudiante.apellido}`,
            esNuevo: estudianteCreado
          }
        });

      } catch (error) {
        resultados.errores.push({
          fila: i + 1,
          datos: fila,
          error: error.message
        });
      }
    }

    // Calcular estadísticas finales
    const examenActualizado = await prisma.examen.findUnique({
      where: { id: parseInt(examenId) },
      include: {
        _count: {
          select: { actasExamen: true }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: resultados,
      examen: {
        id: examen.id,
        materia: examen.materia.nombre,
        carrera: examen.carrera.nombre,
        totalInscriptos: examenActualizado._count.actasExamen
      },
      resumen: {
        totalProcesados: resultados.totalProcesados,
        exitosos: resultados.actasCreadas.length,
        duplicados: resultados.duplicados.length,
        errores: resultados.errores.length,
        estudiantesNuevos: resultados.estudiantesCreados.length,
        porcentajeExito: resultados.totalProcesados > 0 
          ? Math.round((resultados.actasCreadas.length / resultados.totalProcesados) * 100) 
          : 0
      },
      message: `Importación completada. ${resultados.actasCreadas.length} actas creadas de ${resultados.totalProcesados} registros procesados.`
    });

  } catch (error) {
    console.error('Error en importación de actas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 
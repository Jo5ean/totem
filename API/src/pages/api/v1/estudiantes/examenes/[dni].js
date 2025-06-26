import prisma from '../../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido'
    });
  }

  const { dni } = req.query;

  if (!dni || !/^[0-9]{7,8}$/.test(dni)) {
    return res.status(400).json({
      success: false,
      error: 'DNI inválido. Debe contener 7-8 dígitos'
    });
  }

  try {
    // 1. Consultar API externa de UCASAL
    const fechaDesde = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    
    const fechaHasta = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const apiUrl = `https://sistemasweb-desa.ucasal.edu.ar/api/v1/acta/DNI-LE-LC/${dni}?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
    
    console.log('Consultando API externa:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('Error en API externa:', response.status, response.statusText);
      return res.status(404).json({
        success: false,
        error: 'No se encontraron datos para el DNI proporcionado'
      });
    }

    const examenesExternos = await response.json();
    
    if (!Array.isArray(examenesExternos) || examenesExternos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron exámenes programados para este DNI',
        data: { dni, examenes: [] }
      });
    }

    console.log(`Encontrados ${examenesExternos.length} exámenes en API externa`);

    // 2. Para cada examen externo, buscar match en base de datos local
    const examenesCompletos = [];
    
    for (const examenExterno of examenesExternos) {
      console.log('Procesando examen externo:', {
        materia: examenExterno.materia,
        areaTema: examenExterno.areaTema,
        carrera: examenExterno.carrera,
        nombreMateria: examenExterno.nombreMateria
      });

      // Buscar match en tabla examenes_totem primero
      const matchTotem = await prisma.examenTotem.findFirst({
        where: {
          AND: [
            { materiaTotem: examenExterno.materia },
            { carreraTotem: examenExterno.carrera },
            ...(examenExterno.areaTema ? [{ areaTemaTotem: examenExterno.areaTema }] : [])
          ]
        },
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
      });

      if (matchTotem) {
        // Match encontrado en examenes_totem
        const examen = matchTotem.examen;
        
        examenesCompletos.push({
          // Datos del estudiante desde API externa
          estudiante: {
            dni: examenExterno.ndocu,
            nombre: examenExterno.apen,
            lugar: examenExterno.nombreLugar,
            sector: examenExterno.nombreSector,
            modo: examenExterno.nombreModo
          },
          
          // Datos del examen combinados
          examen: {
            id: examen.id,
            materia: {
              codigo: examenExterno.materia,
              nombre: examenExterno.nombreMateria,
              nombreCorto: examen.nombreMateria,
              areaTema: examenExterno.areaTema
            },
            carrera: {
              codigo: examenExterno.carrera,
              nombre: examen.carrera.nombre,
              facultad: examen.carrera.facultad.nombre
            },
            fecha: examen.fecha ? examen.fecha.toISOString().split('T')[0] : null,
            hora: examen.hora ? examen.hora.toTimeString().split(' ')[0] : null,
            fechaExterna: examenExterno.fecActa,
            aula: examen.aula ? {
              id: examen.aula.id,
              nombre: examen.aula.nombre,
              capacidad: examen.aula.capacidad,
              ubicacion: examen.aula.ubicacion
            } : null,
            tipoExamen: examen.tipoExamen || 'No especificado',
            modalidad: examen.modalidadExamen || 'presencial',
            observaciones: examen.observaciones,
            materialPermitido: examen.materialPermitido,
            requierePc: examen.requierePc || false,
            // Datos adicionales del tótem
            docente: matchTotem.docenteTotem,
            monitoreo: matchTotem.monitoreoTotem,
            control: matchTotem.controlTotem,
            url: matchTotem.urlTotem
          },
          
          // Estado del match
          matchStatus: {
            found: true,
            source: 'totem_database',
            matchedBy: ['materia', 'carrera', 'areaTema'].filter(field => 
              examenExterno[field] && matchTotem[`${field}Totem`]
            )
          }
        });
      } else {
        // No se encontró match exacto, buscar por nombre de materia
        const matchPorNombre = await prisma.examen.findFirst({
          where: {
            nombreMateria: {
              contains: examenExterno.nombreMateria,
              mode: 'insensitive'
            },
            carrera: {
              codigo: examenExterno.carrera
            }
          },
          include: {
            carrera: {
              include: {
                facultad: true
              }
            },
            aula: true
          }
        });

        if (matchPorNombre) {
          examenesCompletos.push({
            estudiante: {
              dni: examenExterno.ndocu,
              nombre: examenExterno.apen,
              lugar: examenExterno.nombreLugar,
              sector: examenExterno.nombreSector,
              modo: examenExterno.nombreModo
            },
            examen: {
              id: matchPorNombre.id,
              materia: {
                codigo: examenExterno.materia,
                nombre: examenExterno.nombreMateria,
                nombreCorto: matchPorNombre.nombreMateria,
                areaTema: examenExterno.areaTema
              },
              carrera: {
                codigo: examenExterno.carrera,
                nombre: matchPorNombre.carrera.nombre,
                facultad: matchPorNombre.carrera.facultad.nombre
              },
              fecha: matchPorNombre.fecha ? matchPorNombre.fecha.toISOString().split('T')[0] : null,
              hora: matchPorNombre.hora ? matchPorNombre.hora.toTimeString().split(' ')[0] : null,
              fechaExterna: examenExterno.fecActa,
              aula: matchPorNombre.aula ? {
                id: matchPorNombre.aula.id,
                nombre: matchPorNombre.aula.nombre,
                capacidad: matchPorNombre.aula.capacidad,
                ubicacion: matchPorNombre.aula.ubicacion
              } : null,
              tipoExamen: matchPorNombre.tipoExamen || 'No especificado',
              modalidad: matchPorNombre.modalidadExamen || 'presencial',
              observaciones: matchPorNombre.observaciones,
              materialPermitido: matchPorNombre.materialPermitido,
              requierePc: matchPorNombre.requierePc || false
            },
            matchStatus: {
              found: true,
              source: 'name_match',
              matchedBy: ['nombreMateria', 'carrera']
            }
          });
        } else {
          // No se encontró match, pero incluir datos básicos de la API externa
          examenesCompletos.push({
            estudiante: {
              dni: examenExterno.ndocu,
              nombre: examenExterno.apen,
              lugar: examenExterno.nombreLugar,
              sector: examenExterno.nombreSector,
              modo: examenExterno.nombreModo
            },
            examen: {
              materia: {
                codigo: examenExterno.materia,
                nombre: examenExterno.nombreMateria,
                areaTema: examenExterno.areaTema
              },
              carrera: {
                codigo: examenExterno.carrera
              },
              fechaExterna: examenExterno.fecActa,
              aula: null, // Sin asignar
              tipoExamen: 'No especificado',
              modalidad: 'presencial',
              observaciones: 'Examen no encontrado en base de datos local'
            },
            matchStatus: {
              found: false,
              source: 'external_only',
              message: 'Examen registrado solo en sistema externo'
            }
          });
        }
      }
    }

    // 3. Construir respuesta final
    const estudianteInfo = examenesCompletos[0]?.estudiante || {
      dni: dni,
      nombre: 'No disponible'
    };

    return res.status(200).json({
      success: true,
      data: {
        estudiante: estudianteInfo,
        examenes: examenesCompletos.map(item => item.examen),
        totalExamenes: examenesCompletos.length,
        examenesEncontrados: examenesCompletos.filter(item => item.matchStatus.found).length,
        consultadoEn: new Date().toISOString()
      },
      debug: {
        apiExterna: {
          url: apiUrl,
          totalRespuesta: examenesExternos.length
        },
        matches: examenesCompletos.map(item => ({
          materia: item.examen.materia.codigo,
          carrera: item.examen.carrera.codigo,
          found: item.matchStatus.found,
          source: item.matchStatus.source
        }))
      }
    });

  } catch (error) {
    console.error('Error en consulta de exámenes:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 
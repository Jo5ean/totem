import prisma from '../../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido'
    });
  }

  const { id } = req.query;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      error: 'ID de examen inválido'
    });
  }

  try {
    // 1. Buscar el examen en la base de datos local
    const examen = await prisma.examen.findUnique({
      where: { id: parseInt(id) },
      include: {
        carrera: {
          include: {
            facultad: true
          }
        },
        aula: true,
        examenTotem: true
      }
    });

    if (!examen) {
      return res.status(404).json({
        success: false,
        error: 'Examen no encontrado'
      });
    }

    // 2. Si tiene datos del TOTEM, obtener el código de materia
    let codigoMateria = null;
    if (examen.examenTotem && examen.examenTotem.length > 0) {
      codigoMateria = examen.examenTotem[0].materiaTotem;
    }

    if (!codigoMateria) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró código de materia para consultar inscriptos',
        data: {
          examen: {
            id: examen.id,
            nombre: examen.nombreMateria,
            fecha: examen.fecha,
            hora: examen.hora
          }
        }
      });
    }

    // 3. Consultar inscriptos desde API externa de UCASAL
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

    const apiUrl = `https://sistemasweb-desa.ucasal.edu.ar/api/v1/acta/materia/${codigoMateria}?rendida=false&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
    
    console.log(`Consultando inscriptos para materia ${codigoMateria}:`, apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('Error en API externa:', response.status, response.statusText);
      
      // Si la API está caída, devolver información básica del examen
      return res.status(200).json({
        success: true,
        warning: 'API externa no disponible - mostrando datos locales únicamente',
        data: {
          examen: {
            id: examen.id,
            nombre: examen.nombreMateria,
            fecha: examen.fecha?.toISOString().split('T')[0],
            hora: examen.hora?.toTimeString().split(' ')[0],
            carrera: {
              nombre: examen.carrera.nombre,
              facultad: examen.carrera.facultad.nombre
            },
            aula: examen.aula ? {
              id: examen.aula.id,
              nombre: examen.aula.nombre,
              capacidad: examen.aula.capacidad
            } : null,
            codigoMateria: codigoMateria
          },
          inscriptos: [],
          cantidadInscriptos: 0,
          apiExternaDisponible: false
        }
      });
    }

    const inscriptos = await response.json();
    
    if (!Array.isArray(inscriptos)) {
      console.warn('Respuesta de API externa no es un array:', inscriptos);
      return res.status(200).json({
        success: true,
        data: {
          examen: {
            id: examen.id,
            nombre: examen.nombreMateria,
            fecha: examen.fecha?.toISOString().split('T')[0],
            hora: examen.hora?.toTimeString().split(' ')[0],
            carrera: {
              nombre: examen.carrera.nombre,
              facultad: examen.carrera.facultad.nombre
            },
            aula: examen.aula ? {
              id: examen.aula.id,
              nombre: examen.aula.nombre,
              capacidad: examen.aula.capacidad
            } : null,
            codigoMateria: codigoMateria
          },
          inscriptos: [],
          cantidadInscriptos: 0,
          apiExternaDisponible: true
        }
      });
    }

    console.log(`✅ Encontrados ${inscriptos.length} inscriptos para examen ${id}`);

    // 4. Procesar y formatear inscriptos
    const inscriptosFormateados = inscriptos.map(inscripto => ({
      dni: inscripto.ndocu,
      nombre: inscripto.apen,
      lugar: inscripto.nombreLugar,
      sector: inscripto.nombreSector,
      modo: inscripto.nombreModo,
      fechaInscripcion: inscripto.fecActa
    }));

    // 5. Determinar si necesita asignación de aula
    const necesitaAsignacion = !examen.aula && inscriptos.length > 0;
    const sugerenciaAula = necesitaAsignacion ? await sugerirAula(inscriptos.length) : null;

    return res.status(200).json({
      success: true,
      data: {
        examen: {
          id: examen.id,
          nombre: examen.nombreMateria,
          fecha: examen.fecha?.toISOString().split('T')[0],
          hora: examen.hora?.toTimeString().split(' ')[0],
          carrera: {
            nombre: examen.carrera.nombre,
            facultad: examen.carrera.facultad.nombre
          },
          aula: examen.aula ? {
            id: examen.aula.id,
            nombre: examen.aula.nombre,
            capacidad: examen.aula.capacidad
          } : null,
          codigoMateria: codigoMateria,
          tipoExamen: examen.tipoExamen,
          observaciones: examen.observaciones,
          requierePc: examen.requierePc
        },
        inscriptos: inscriptosFormateados,
        cantidadInscriptos: inscriptos.length,
        necesitaAsignacion: necesitaAsignacion,
        sugerenciaAula: sugerenciaAula,
        apiExternaDisponible: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error consultando inscriptos:', error);
    
    // En caso de error, devolver datos básicos del examen
    const examenBasico = await prisma.examen.findUnique({
      where: { id: parseInt(id) },
      include: {
        carrera: { include: { facultad: true } },
        aula: true
      }
    });

    return res.status(200).json({
      success: false,
      error: 'Error consultando inscriptos desde API externa',
      data: {
        examen: examenBasico ? {
          id: examenBasico.id,
          nombre: examenBasico.nombreMateria,
          fecha: examenBasico.fecha?.toISOString().split('T')[0],
          hora: examenBasico.hora?.toTimeString().split(' ')[0],
          carrera: {
            nombre: examenBasico.carrera.nombre,
            facultad: examenBasico.carrera.facultad.nombre
          },
          aula: examenBasico.aula ? {
            id: examenBasico.aula.id,
            nombre: examenBasico.aula.nombre,
            capacidad: examenBasico.aula.capacidad
          } : null
        } : null,
        inscriptos: [],
        cantidadInscriptos: 0,
        apiExternaDisponible: false
      },
      message: error.message
    });
  }
}

// Función auxiliar para sugerir aula basada en cantidad de inscriptos
async function sugerirAula(cantidadInscriptos) {
  try {
    const aulas = await prisma.aula.findMany({
      where: { 
        disponible: true,
        capacidad: {
          gte: cantidadInscriptos
        }
      },
      orderBy: { capacidad: 'asc' }
    });

    if (aulas.length === 0) {
      return {
        sugerida: null,
        razon: `No hay aulas disponibles con capacidad para ${cantidadInscriptos} inscriptos`
      };
    }

    return {
      sugerida: {
        id: aulas[0].id,
        nombre: aulas[0].nombre,
        capacidad: aulas[0].capacidad,
        ubicacion: aulas[0].ubicacion
      },
      razon: `Aula más pequeña disponible con capacidad suficiente (${aulas[0].capacidad} >= ${cantidadInscriptos})`
    };

  } catch (error) {
    console.error('Error sugiriendo aula:', error);
    return null;
  }
} 
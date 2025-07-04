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

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      error: 'ID de examen inválido'
    });
  }

  try {
    const examenId = parseInt(id);
    const { 
      modalidadExamen, 
      requierePc, 
      asignacionAuto, 
      criterioAsignacion 
    } = req.body;

    // Verificar que el examen existe
    const examen = await prisma.examen.findUnique({
      where: { id: examenId },
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

    // Construir datos de actualización
    const datosActualizacion = {};
    
    if (modalidadExamen !== undefined) {
      datosActualizacion.modalidadExamen = modalidadExamen;
    }
    
    if (requierePc !== undefined) {
      datosActualizacion.requierePc = requierePc;
    }
    
    if (asignacionAuto !== undefined) {
      datosActualizacion.asignacionAuto = asignacionAuto;
    }
    
    if (criterioAsignacion !== undefined) {
      datosActualizacion.criterioAsignacion = criterioAsignacion;
    }

    // Si se cambia a examen informático, quitar aula actual si no es compatible
    if (requierePc === true && examen.aula && 
        !['Notebooks', 'Laboratorio Informático'].includes(examen.aula.nombre)) {
      datosActualizacion.aulaId = null;
      datosActualizacion.criterioAsignacion = null;
    }

    // Si se desactiva asignación automática, mantener el aula actual
    if (asignacionAuto === false && examen.aulaId) {
      datosActualizacion.criterioAsignacion = 'MANUAL';
    }

    const examenActualizado = await prisma.examen.update({
      where: { id: examenId },
      data: datosActualizacion,
      include: {
        carrera: {
          include: { facultad: true }
        },
        aula: true,
        _count: {
          select: { actasExamen: true }
        }
      }
    });

    // Información para el response
    let recomendaciones = [];
    
    if (requierePc === true) {
      const cantidadEstudiantes = examenActualizado._count.actasExamen;
      if (cantidadEstudiantes <= 26) {
        recomendaciones.push('Se recomienda asignar Notebooks (26 disponibles)');
      } else {
        recomendaciones.push('Se requiere Laboratorio Informático (capacidad 34)');
      }
    }

    if (asignacionAuto === true && !examenActualizado.aulaId) {
      recomendaciones.push('Ejecutar asignación automática para obtener aula');
    }

    return res.status(200).json({
      success: true,
      data: examenActualizado,
      message: 'Configuración del examen actualizada exitosamente',
      cambios: {
        modalidadAnterior: examen.modalidadExamen,
        modalidadNueva: examenActualizado.modalidadExamen,
        requeriaPcAntes: examen.requierePc,
        requierePcAhora: examenActualizado.requierePc,
        aulaAnterior: examen.aula?.nombre || 'Sin asignar',
        aulaNueva: examenActualizado.aula?.nombre || 'Sin asignar'
      },
      recomendaciones,
      estadisticas: {
        cantidadEstudiantes: examenActualizado._count.actasExamen,
        tieneAula: !!examenActualizado.aulaId,
        esAutomatico: examenActualizado.asignacionAuto
      }
    });

  } catch (error) {
    console.error('Error configurando examen:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 
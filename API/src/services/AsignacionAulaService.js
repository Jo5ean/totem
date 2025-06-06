import prisma from '../lib/db.js';

class AsignacionAulaService {
  
  // Configuración de aulas disponibles según la imagen
  static AULAS_CONFIG = {
    NOTEBOOKS: {
      nombre: 'Notebooks',
      capacidad: 26,
      tipo: 'VIRTUAL',
      esParaInformatica: true
    },
    LABORATORIO: {
      nombre: 'Laboratorio Informático',
      capacidad: 34,
      tipo: 'LABORATORIO',
      esParaInformatica: true
    },
    REGULARES: [
      { nombre: 'Aula 4', capacidad: 72 },
      { nombre: 'Aula 8', capacidad: 71 },
      { nombre: 'Aula 12', capacidad: 69 }
    ]
  };

  /**
   * Asignar aula automáticamente a un examen
   */
  static async asignarAulaAutomatica(examenId) {
    try {
      // Obtener información completa del examen
      const examen = await prisma.examen.findUnique({
        where: { id: examenId },
        include: {
          carrera: {
            include: { facultad: true }
          },
          _count: {
            select: { actasExamen: true }
          }
        }
      });

      if (!examen) {
        throw new Error('Examen no encontrado');
      }

      const cantidadEstudiantes = examen._count.actasExamen;
      
      // Si ya tiene aula asignada y asignación automática está deshabilitada
      if (examen.aulaId && !examen.asignacionAuto) {
        return {
          success: false,
          message: 'Examen tiene asignación manual, no se puede reasignar automáticamente',
          examen
        };
      }

      let aulaAsignada = null;
      let criterio = '';

      // LÓGICA 1: EXÁMENES INFORMÁTICOS
      if (examen.requierePc || 
          examen.modalidadExamen === 'INFORMATICO' || 
          examen.tipoExamen?.includes('INFORMATICO')) {
        
        aulaAsignada = await this.asignarAulaInformatica(cantidadEstudiantes);
        criterio = 'INFORMATICO';
      } 
      // LÓGICA 2: EXÁMENES REGULARES
      else {
        aulaAsignada = await this.asignarAulaRegular(examen, cantidadEstudiantes);
        criterio = 'POR_FACULTAD';
      }

      // Actualizar el examen con la asignación
      if (aulaAsignada) {
        const examenActualizado = await prisma.examen.update({
          where: { id: examenId },
          data: {
            aulaId: aulaAsignada.id,
            criterioAsignacion: criterio,
            asignacionAuto: true
          },
          include: {
            aula: true,
            carrera: {
              include: { facultad: true }
            }
          }
        });

        return {
          success: true,
          message: `Aula "${aulaAsignada.nombre}" asignada automáticamente`,
          examen: examenActualizado,
          criterio,
          detalles: {
            cantidadEstudiantes,
            capacidadAula: aulaAsignada.capacidad,
            espaciosLibres: aulaAsignada.capacidad - cantidadEstudiantes
          }
        };
      } else {
        return {
          success: false,
          message: 'No se encontró aula disponible con la capacidad necesaria',
          examen,
          cantidadEstudiantes
        };
      }

    } catch (error) {
      console.error('Error en asignación automática:', error);
      throw error;
    }
  }

  /**
   * Asignar aula para exámenes informáticos
   */
  static async asignarAulaInformatica(cantidadEstudiantes) {
    // Si son 26 estudiantes o menos → Notebooks (sin aula física)
    if (cantidadEstudiantes <= 26) {
      // Buscar o crear el registro de "Notebooks"
      let aulaNotebooks = await prisma.aula.findFirst({
        where: { nombre: 'Notebooks' }
      });

      if (!aulaNotebooks) {
        aulaNotebooks = await prisma.aula.create({
          data: {
            nombre: 'Notebooks',
            capacidad: 26,
            ubicacion: 'Virtual - Notebooks portátiles',
            disponible: true
          }
        });
      }

      return aulaNotebooks;
    } 
    // Si son más de 26 → Laboratorio Informático
    else {
      let aulaLab = await prisma.aula.findFirst({
        where: { nombre: 'Laboratorio Informático' }
      });

      if (!aulaLab) {
        aulaLab = await prisma.aula.create({
          data: {
            nombre: 'Laboratorio Informático',
            capacidad: 34,
            ubicacion: 'Laboratorio de computación',
            disponible: true
          }
        });
      }

      // Verificar conflictos de horario si tiene fecha y hora definidas
      if (examen && examen.fecha && examen.hora) {
        const tieneConflicto = await this.verificarConflictoHorario(aulaLab.id, examen.fecha, examen.hora);
        
        if (tieneConflicto) {
          throw new Error(`Laboratorio Informático no disponible en esa fecha y hora`);
        }
      }

      return aulaLab;
    }
  }

  /**
   * Asignar aula regular agrupando por facultad
   */
  static async asignarAulaRegular(examen, cantidadEstudiantes) {
    // Buscar aulas regulares disponibles
    const aulasRegulares = await prisma.aula.findMany({
      where: {
        nombre: { in: ['Aula 4', 'Aula 8', 'Aula 12'] },
        disponible: true,
        capacidad: { gte: cantidadEstudiantes }
      },
      orderBy: { capacidad: 'asc' } // Priorizar aula más pequeña que cubra la necesidad
    });

    if (aulasRegulares.length === 0) {
      return null;
    }

    // CRITERIO 1: Buscar aula ya asignada a la misma facultad en la misma fecha
    const aulaEnUsoFacultad = await this.buscarAulaEnUsoMismaFacultad(
      examen.carrera.facultadId,
      examen.fecha,
      aulasRegulares
    );

    if (aulaEnUsoFacultad) {
      // Verificar si tiene capacidad adicional
      const capacidadDisponible = await this.calcularCapacidadDisponible(
        aulaEnUsoFacultad.id,
        examen.fecha,
        examen.hora
      );

      if (capacidadDisponible >= cantidadEstudiantes) {
        return aulaEnUsoFacultad;
      }
    }

    // CRITERIO 2: Asignar nueva aula con capacidad suficiente
    for (const aula of aulasRegulares) {
      const tieneConflicto = await this.verificarConflictoHorario(
        aula.id,
        examen.fecha,
        examen.hora
      );

      if (!tieneConflicto) {
        return aula;
      }
    }

    return null;
  }

  /**
   * Buscar aula ya en uso por la misma facultad
   */
  static async buscarAulaEnUsoMismaFacultad(facultadId, fecha, aulasDisponibles) {
    const aulaEnUso = await prisma.examen.findFirst({
      where: {
        fecha: fecha,
        carrera: { facultadId: facultadId },
        aulaId: { in: aulasDisponibles.map(a => a.id) }
      },
      include: { aula: true }
    });

    return aulaEnUso?.aula || null;
  }

  /**
   * Verificar conflictos de horario
   */
  static async verificarConflictoHorario(aulaId, fecha, hora) {
    const conflicto = await prisma.examen.findFirst({
      where: {
        aulaId: aulaId,
        fecha: fecha,
        hora: hora
      }
    });

    return !!conflicto;
  }

  /**
   * Calcular capacidad disponible en un aula para una fecha/hora específica
   */
  static async calcularCapacidadDisponible(aulaId, fecha, hora) {
    const aula = await prisma.aula.findUnique({
      where: { id: aulaId }
    });

    const examenesSimultaneos = await prisma.examen.findMany({
      where: {
        aulaId: aulaId,
        fecha: fecha,
        hora: hora
      },
      include: {
        _count: {
          select: { actasExamen: true }
        }
      }
    });

    const estudiantesOcupados = examenesSimultaneos.reduce(
      (total, examen) => total + examen._count.actasExamen,
      0
    );

    return aula.capacidad - estudiantesOcupados;
  }

  /**
   * Obtener estadísticas de asignación
   */
  static async obtenerEstadisticasAsignacion() {
    const [
      totalExamenes,
      examenesConAula,
      examenesSinAula,
      examenesInformaticos,
      aulasPorFacultad
    ] = await Promise.all([
      prisma.examen.count(),
      prisma.examen.count({ where: { aulaId: { not: null } } }),
      prisma.examen.count({ where: { aulaId: null } }),
      prisma.examen.count({ where: { requierePc: true } }),
      this.obtenerDistribucionPorFacultad()
    ]);

    return {
      totalExamenes,
      examenesConAula,
      examenesSinAula,
      examenesInformaticos,
      porcentajeAsignacion: totalExamenes > 0 ? (examenesConAula / totalExamenes * 100).toFixed(1) : 0,
      distribucionPorFacultad: aulasPorFacultad
    };
  }

  /**
   * Obtener distribución de aulas por facultad
   */
  static async obtenerDistribucionPorFacultad() {
    const distribucion = await prisma.facultad.findMany({
      include: {
        carreras: {
          include: {
            examenes: {
              where: { aulaId: { not: null } },
              include: { aula: true }
            }
          }
        }
      }
    });

    return distribucion.map(facultad => {
      const examenesConAula = facultad.carreras.flatMap(c => c.examenes);
      const aulasUsadas = [...new Set(examenesConAula.map(e => e.aula.nombre))];

      return {
        facultad: facultad.nombre,
        totalExamenes: examenesConAula.length,
        aulasUsadas: aulasUsadas,
        distribucionAulas: this.contarPorAula(examenesConAula)
      };
    });
  }

  /**
   * Contar exámenes por aula
   */
  static contarPorAula(examenes) {
    const contador = {};
    examenes.forEach(examen => {
      const aula = examen.aula.nombre;
      contador[aula] = (contador[aula] || 0) + 1;
    });
    return contador;
  }

  /**
   * Procesar asignación masiva para múltiples exámenes
   */
  static async procesarAsignacionMasiva(examenesIds) {
    const resultados = {
      exitosos: [],
      errores: [],
      sinCapacidad: []
    };

    for (const examenId of examenesIds) {
      try {
        const resultado = await this.asignarAulaAutomatica(examenId);
        
        if (resultado.success) {
          resultados.exitosos.push(resultado);
        } else {
          resultados.sinCapacidad.push({
            examenId,
            mensaje: resultado.message
          });
        }
      } catch (error) {
        resultados.errores.push({
          examenId,
          error: error.message
        });
      }
    }

    return resultados;
  }
}

export default AsignacionAulaService; 
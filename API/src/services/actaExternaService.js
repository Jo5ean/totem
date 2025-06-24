import axios from 'axios';
import prisma from '../lib/db.js';

class ActaExternaService {
  constructor() {
    this.baseURL = 'https://sistemasweb-desa.ucasal.edu.ar/api/v1';
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });
  }

  /**
   * Obtener alumnos inscritos desde el sistema externo
   * @param {number} materiaId - ID de la materia
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Array>} Array de actas con alumnos
   */
  async obtenerAlumnosInscritos(materiaId, options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.rendida !== undefined) {
        params.append('rendida', options.rendida);
      }
      if (options.fechaDesde) {
        params.append('fechaDesde', options.fechaDesde);
      }
      if (options.fechaHasta) {
        params.append('fechaHasta', options.fechaHasta);
      }

      const url = `/acta/materia/${materiaId}${params.toString() ? `?${params.toString()}` : ''}`;
      
      console.log(`🔍 Consultando alumnos: ${this.baseURL}${url}`);
      
      const response = await this.axiosInstance.get(url);
      
      return response.data || [];
    } catch (error) {
      console.error('❌ Error obteniendo alumnos inscritos:', error.message);
      throw new Error(`Error consultando sistema externo: ${error.message}`);
    }
  }

  /**
   * Relacionar alumnos externos con exámenes TOTEM
   * @param {number} examenId - ID del examen en nuestro sistema
   * @param {Object} filtros - Filtros para la consulta externa
   * @returns {Promise<Object>} Datos relacionados completos
   */
  async relacionarAlumnosConExamen(examenId, filtros = {}) {
    try {
      // 1. Obtener datos del examen desde TOTEM
      const examen = await prisma.examen.findUnique({
        where: { id: examenId },
        include: {
          materia: true,
          carrera: true,
          facultad: true,
          aula: true,
          totemData: true
        }
      });

      if (!examen) {
        throw new Error(`Examen con ID ${examenId} no encontrado`);
      }

      // 2. Extraer ID de materia del sistema externo
      const materiaExternaId = examen.totemData?.data?.MATERIA || 
                              examen.materia?.codigoExterno;
      
      if (!materiaExternaId) {
        throw new Error('No se pudo determinar el ID de materia externa');
      }

      // 3. Configurar filtros de fecha basados en el examen
      const filtrosCompletos = {
        rendida: false, // Por defecto, actas no rendidas
        ...filtros
      };

      // Si no hay fechas especificadas, usar la fecha del examen
      if (!filtrosCompletos.fechaDesde && examen.fecha) {
        const fechaExamen = new Date(examen.fecha);
        filtrosCompletos.fechaDesde = fechaExamen.toLocaleDateString('es-AR');
      }

      // 4. Obtener alumnos inscritos
      const actasExternas = await this.obtenerAlumnosInscritos(
        materiaExternaId, 
        filtrosCompletos
      );

      // 5. Procesar y enriquecer datos
      const datosRelacionados = {
        examen: {
          id: examen.id,
          fecha: examen.fecha,
          hora: examen.hora,
          estado: examen.estado,
          materia: examen.materia,
          carrera: examen.carrera,
          facultad: examen.facultad,
          aula: examen.aula,
          totemData: examen.totemData
        },
        inscripciones: {
          totalActas: actasExternas.length,
          totalAlumnos: actasExternas.reduce((total, acta) => total + acta.alumnos.length, 0),
          actas: actasExternas.map(acta => ({
            ...acta,
            // Marcar si coinciden los datos
            coincideDatos: this.verificarCoincidenciaDatos(acta, examen),
            // Información de capacidad vs inscritos
            aulaInfo: examen.aula ? {
              capacidad: examen.aula.capacidad,
              disponible: examen.aula.capacidad >= acta.alumnos.length,
              deficit: Math.max(0, acta.alumnos.length - examen.aula.capacidad)
            } : null
          }))
        },
        resumen: {
          tieneAulaAsignada: !!examen.aula,
          capacidadSuficiente: examen.aula ? 
            examen.aula.capacidad >= actasExternas.reduce((total, acta) => total + acta.alumnos.length, 0) : 
            null,
          requiereAccion: !examen.aula || 
            (examen.aula.capacidad < actasExternas.reduce((total, acta) => total + acta.alumnos.length, 0))
        }
      };

      return datosRelacionados;

    } catch (error) {
      console.error('❌ Error relacionando alumnos con examen:', error);
      throw error;
    }
  }

  /**
   * Verificar coincidencia entre datos del acta externa y examen TOTEM
   */
  verificarCoincidenciaDatos(acta, examen) {
    const coincidencias = {
      sector: false,
      carrera: false,
      materia: false,
      fecha: false
    };

    // Verificar sector
    if (examen.totemData?.data?.SECTOR) {
      coincidencias.sector = acta.sector.toString() === examen.totemData.data.SECTOR;
    }

    // Verificar carrera  
    if (examen.totemData?.data?.CARRERA) {
      coincidencias.carrera = acta.carrera.toString() === examen.totemData.data.CARRERA;
    }

    // Verificar materia
    if (examen.totemData?.data?.MATERIA) {
      coincidencias.materia = acta.materia.toString() === examen.totemData.data.MATERIA;
    }

    // Verificar fecha
    if (examen.fecha && acta.fecActa) {
      const fechaExamen = new Date(examen.fecha).toLocaleDateString('es-AR');
      coincidencias.fecha = fechaExamen === acta.fecActa;
    }

    return {
      ...coincidencias,
      porcentajeCoincidencia: Object.values(coincidencias).filter(Boolean).length / 4 * 100
    };
  }

  /**
   * Sincronizar inscripciones de múltiples exámenes
   */
  async sincronizarInscripcionesExamenes(filtros = {}) {
    try {
      console.log('🔄 Iniciando sincronización masiva de inscripciones...');

      // Obtener exámenes que necesitan sincronización
      const examenes = await prisma.examen.findMany({
        where: {
          fecha: {
            gte: new Date() // Solo exámenes futuros
          },
          ...filtros.whereExamenes
        },
        include: {
          materia: true,
          carrera: true,
          facultad: true,
          aula: true,
          totemData: true
        }
      });

      const resultados = [];

      for (const examen of examenes) {
        try {
          const datosRelacionados = await this.relacionarAlumnosConExamen(
            examen.id,
            filtros.filtrosConsulta || {}
          );
          
          resultados.push({
            examenId: examen.id,
            exito: true,
            datos: datosRelacionados
          });

          // Esperar un poco entre consultas para no sobrecargar el sistema externo
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Error sincronizando examen ${examen.id}:`, error.message);
          resultados.push({
            examenId: examen.id,
            exito: false,
            error: error.message
          });
        }
      }

      const exitosos = resultados.filter(r => r.exito).length;
      const fallidos = resultados.filter(r => !r.exito).length;

      console.log(`✅ Sincronización completada: ${exitosos} exitosos, ${fallidos} fallidos`);

      return {
        total: examenes.length,
        exitosos,
        fallidos,
        resultados
      };

    } catch (error) {
      console.error('❌ Error en sincronización masiva:', error);
      throw error;
    }
  }
}

export default ActaExternaService; 
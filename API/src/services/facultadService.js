import prisma from '../lib/db.js';

class FacultadService {
  async getAllFacultades() {
    try {
      return await prisma.facultad.findMany({
        include: {
          carreras: {
            include: {
              _count: {
                select: { examenes: true }
              }
            }
          },
          _count: {
            select: { 
              carreras: true,
              syncLogs: true 
            }
          }
        }
      });
    } catch (error) {
      throw new Error(`Error obteniendo facultades: ${error.message}`);
    }
  }

  async getFacultadById(id) {
    try {
      return await prisma.facultad.findUnique({
        where: { id: parseInt(id) },
        include: {
          carreras: {
            include: {
              examenes: true,
              _count: {
                select: { examenes: true }
              }
            }
          }
        }
      });
    } catch (error) {
      throw new Error(`Error obteniendo facultad: ${error.message}`);
    }
  }

  async getFacultadByNombre(nombre) {
    try {
      return await prisma.facultad.findUnique({
        where: { nombre },
        include: {
          carreras: {
            include: {
              examenes: true
            }
          }
        }
      });
    } catch (error) {
      throw new Error(`Error obteniendo facultad por nombre: ${error.message}`);
    }
  }

  async createFacultad(data) {
    try {
      return await prisma.facultad.create({
        data: {
          nombre: data.nombre,
          codigo: data.codigo,
          sheetId: data.sheetId
        }
      });
    } catch (error) {
      throw new Error(`Error creando facultad: ${error.message}`);
    }
  }

  async updateFacultad(id, data) {
    try {
      return await prisma.facultad.update({
        where: { id: parseInt(id) },
        data
      });
    } catch (error) {
      throw new Error(`Error actualizando facultad: ${error.message}`);
    }
  }

  async deleteFacultad(id) {
    try {
      return await prisma.facultad.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      throw new Error(`Error eliminando facultad: ${error.message}`);
    }
  }

  async getLastSyncLog(facultadId) {
    try {
      return await prisma.syncLog.findFirst({
        where: { facultadId: parseInt(facultadId) },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new Error(`Error obteniendo último log de sincronización: ${error.message}`);
    }
  }
}

export default FacultadService; 
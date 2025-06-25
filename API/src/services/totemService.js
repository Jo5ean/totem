import prisma from '../lib/db.js';
import SheetBestService from './sheetBestService.js';

// ID del Google Sheet del TOTEM centralizado
const TOTEM_SHEET_ID = '12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8';

class TotemService {
  constructor() {
    this.sheetBestService = new SheetBestService();
  }

  async syncTotemData() {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Iniciando sincronización TOTEM con Sheet.best API...');
      
      // Obtener datos directamente desde Sheet.best
      const sheetResult = await this.sheetBestService.fetchAndProcessData();
      
      if (!sheetResult.success || !sheetResult.data || sheetResult.data.length === 0) {
        throw new Error('No se obtuvieron datos válidos de Sheet.best');
      }

      console.log(`📊 Datos obtenidos: ${sheetResult.data.length} filas válidas`);
      
      // Validar estructura de datos
      const validation = this.sheetBestService.validateDataStructure(sheetResult.data);
      if (!validation.isValid) {
        console.warn(`⚠️ Validación: ${validation.issues.length} problemas encontrados`);
        validation.issues.slice(0, 5).forEach(issue => {
          console.warn(`  - Fila ${issue.row}: ${issue.message}`);
        });
      }

      // Detectar tipos de exámenes y sectores
      const detection = this.sheetBestService.detectExamTypes(sheetResult.data);
      console.log(`🔍 Detectados: ${detection.totalUniqueSectors} sectores, ${detection.totalUniqueCareers} carreras`);

      // Guardar datos brutos en TotemData
      const totemDataRecord = await this.saveRawTotemData('sheet.best', sheetResult.data, sheetResult.metadata);
      
      // Procesar los datos y crear exámenes
      const processedExams = await this.processTotemDataToExams(sheetResult.data);
      
      const duration = Date.now() - startTime;
      
      console.log(`🎉 Sincronización TOTEM completada en ${duration}ms`);
      console.log(`📊 Total: ${processedExams.length} exámenes creados de ${sheetResult.data.length} filas`);
      
      return {
        success: true,
        data: {
          source: 'sheet.best',
          totemDataId: totemDataRecord.id,
          examensCreated: processedExams.length,
          rowsProcessed: sheetResult.data.length,
          validation: validation,
          detection: detection,
          metadata: sheetResult.metadata
        },
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error en sincronización TOTEM:', error);
      throw error;
    }
  }

  async saveRawTotemData(source, sheetData, metadata = {}) {
    return await prisma.totemData.create({
      data: {
        sheetName: source,
        data: {
          rawData: sheetData,
          metadata: metadata,
          savedAt: new Date().toISOString()
        },
        processed: false
      }
    });
  }

  async processTotemDataToExams(sheetData) {
    const createdExams = [];
    
    console.log(`🔄 Procesando ${sheetData.length} filas para crear exámenes...`);
    
    for (const row of sheetData) {
      try {
        // Extraer datos del row (ya viene limpio de Sheet.best)
        const totemData = this.extractTotemRowData(row);
        
        if (!totemData.sector || !totemData.carrera || !totemData.materia || !totemData.fecha) {
          console.log('Fila incompleta, omitiendo:', { 
            sector: totemData.sector, 
            carrera: totemData.carrera, 
            materia: totemData.materia, 
            fecha: totemData.fecha 
          });
          continue;
        }

        // 1. Mapear sector a facultad
        const facultad = await this.mapSectorToFacultad(totemData.sector);
        if (!facultad) {
          console.log(`Sector ${totemData.sector} no mapeado a ninguna facultad`);
          continue;
        }

        // 2. Mapear carrera del TOTEM a carrera local
        const carrera = await this.mapCarreraTotem(totemData.carrera, facultad.id);
        if (!carrera) {
          console.log(`Carrera TOTEM ${totemData.carrera} no mapeada`);
          continue;
        }

        // 3. Buscar o crear aula si hay información
        const aula = await this.findOrCreateAula(totemData);

        // 4. Crear examen
        const examen = await this.createExamenFromTotem(totemData, carrera.id, aula?.id);
        
        // 5. Crear registro de ExamenTotem con datos originales
        await this.createExamenTotemRecord(examen.id, totemData, row);

        createdExams.push(examen);

      } catch (error) {
        console.error('Error procesando fila del TOTEM:', error, row);
      }
    }

    console.log(`✅ Procesamiento completado: ${createdExams.length} exámenes creados`);
    return createdExams;
  }

  extractTotemRowData(row) {
    return {
      sector: row.SECTOR?.toString().trim(),
      carrera: row.CARRERA?.toString().trim(), 
      modo: row.MODO?.toString().trim(),
      areaTema: row.AREATEMA?.toString().trim(),
      materia: row.MATERIA?.toString().trim(),
      nombreCorto: row['NOMBRE CORTO']?.toString().trim(),
      fecha: this.parseTotemDate(row.FECHA),
      url: row.URL?.toString().trim(),
      catedra: row.CÁTEDRA?.toString().trim(),
      docente: row.Docente?.toString().trim(),
      hora: this.parseTotemTime(row.Hora),
      tipoExamen: row['Tipo Examen']?.toString().trim(),
      monitoreo: row.Monitoreo?.toString().trim(),
      control: row['Control a cargo de:']?.toString().trim(),
      observaciones: row.Observaciones?.toString().trim(),
      materialPermitido: row['Material Permitido']?.toString().trim()
    };
  }

  parseTotemDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Formato DD/MM/YYYY del TOTEM (ej: "30/6/2025")
      const parts = dateString.toString().split('/');
      if (parts.length === 3) {
        const [dia, mes, año] = parts;
        return new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
      }
      return null;
    } catch (error) {
      console.error('Error parseando fecha TOTEM:', dateString, error);
      return null;
    }
  }

  parseTotemTime(timeString) {
    if (!timeString) return null;
    
    try {
      // Formato HH:MM del TOTEM (ej: "14:00")
      const parts = timeString.toString().split(':');
      if (parts.length === 2) {
        const [hours, minutes] = parts;
        const time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return time;
      }
      return null;
    } catch (error) {
      console.error('Error parseando hora TOTEM:', timeString, error);
      return null;
    }
  }

  async mapSectorToFacultad(sector) {
    try {
      const mapping = await prisma.sectorFacultad.findFirst({
        where: { 
          sector: sector.toString(),
          activo: true 
        },
        include: { facultad: true }
      });
      
      return mapping?.facultad || null;
    } catch (error) {
      console.error('Error mapeando sector:', error);
      return null;
    }
  }

  async mapCarreraTotem(carreraCodigoTotem, facultadId) {
    try {
      // Buscar mapeo existente
      const mapping = await prisma.carreraTotem.findFirst({
        where: { 
          codigoTotem: carreraCodigoTotem.toString(),
          esMapeada: true,
          activo: true
        },
        include: { carrera: true }
      });

      if (mapping?.carrera) {
        return mapping.carrera;
      }

      // Si no existe mapeo, crear registro de carrera no mapeada
      await prisma.carreraTotem.upsert({
        where: { codigoTotem: carreraCodigoTotem.toString() },
        update: { nombreTotem: `Carrera TOTEM ${carreraCodigoTotem}` },
        create: {
          codigoTotem: carreraCodigoTotem.toString(),
          nombreTotem: `Carrera TOTEM ${carreraCodigoTotem}`,
          esMapeada: false,
          activo: true
        }
      });

      return null;
    } catch (error) {
      console.error('Error mapeando carrera TOTEM:', error);
      return null;
    }
  }

  async findOrCreateAula(totemData) {
    // Por ahora no crear aulas automáticamente
    // Se puede implementar lógica específica según necesidades
    return null;
  }

  async createExamenFromTotem(totemData, carreraId, aulaId = null) {
    return await prisma.examen.create({
      data: {
        carreraId,
        aulaId,
        nombreMateria: totemData.nombreCorto || totemData.materia || 'Sin nombre',
        fecha: totemData.fecha,
        hora: totemData.hora,
        tipoExamen: totemData.tipoExamen,
        monitoreo: totemData.monitoreo,
        materialPermitido: totemData.materialPermitido,
        observaciones: totemData.observaciones,
        activo: true,
        asignacionAuto: true,
        modalidadExamen: totemData.tipoExamen?.includes('Virtual') ? 'virtual' : 'presencial'
      }
    });
  }

  async createExamenTotemRecord(examenId, totemData, originalRow) {
    return await prisma.examenTotem.create({
      data: {
        examenId,
        sectorTotem: totemData.sector,
        carreraTotem: totemData.carrera,
        materiaTotem: totemData.materia,
        areaTemaTotem: totemData.areaTema,
        modoTotem: totemData.modo,
        urlTotem: totemData.url,
        catedraTotem: totemData.catedra,
        docenteTotem: totemData.docente,
        monitoreoTotem: totemData.monitoreo,
        controlTotem: totemData.control,
        dataOriginal: originalRow
      }
    });
  }

  // Métodos de gestión de mapeos (sin cambios)
  async createSectorFacultadMapping(sector, facultadId) {
    return await prisma.sectorFacultad.create({
      data: { sector, facultadId, activo: true }
    });
  }

  async mapCarreraTotemToCarrera(codigoTotem, carreraId) {
    return await prisma.carreraTotem.upsert({
      where: { codigoTotem },
      update: { carreraId, esMapeada: true },
      create: { codigoTotem, carreraId, esMapeada: true, nombreTotem: `Carrera ${codigoTotem}` }
    });
  }

  async getSectoresNoMapeados() {
    // Implementar lógica para detectar sectores desde Sheet.best que no están mapeados
    const sheetResult = await this.sheetBestService.fetchAndProcessData();
    const detection = this.sheetBestService.detectExamTypes(sheetResult.data);
    
    const sectoresEncontrados = detection.sectors;
    const sectoresMapeados = await prisma.sectorFacultad.findMany({
      where: { activo: true },
      select: { sector: true }
    });
    
    const sectoresMapeadosArray = sectoresMapeados.map(s => s.sector);
    const sectoresNoMapeados = sectoresEncontrados.filter(s => !sectoresMapeadosArray.includes(s));
    
    return sectoresNoMapeados;
  }

  async getCarrerasTotemNoMapeadas() {
    return await prisma.carreraTotem.findMany({
      where: { 
        esMapeada: false,
        activo: true 
      },
      orderBy: { codigoTotem: 'asc' }
    });
  }

  async getEstadisticasTotem() {
    const [
      totalTotemData,
      totalExamenes,
      sectoresNoMapeados,
      carrerasNoMapeadas
    ] = await Promise.all([
      prisma.totemData.count(),
      prisma.examen.count(),
      this.getSectoresNoMapeados(),
      this.getCarrerasTotemNoMapeadas()
    ]);

    return {
      totalRegistrosTotem: totalTotemData,
      totalExamenesCreados: totalExamenes,
      sectoresNoMapeados: sectoresNoMapeados.length,
      carrerasNoMapeadas: carrerasNoMapeadas.length,
      listaSectoresNoMapeados: sectoresNoMapeados,
      listaCarrerasNoMapeadas: carrerasNoMapeadas
    };
  }
}

export default TotemService;

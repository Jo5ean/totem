import prisma from '../lib/db.js';
import CSVDownloadService from './csvDownloadService.js';

// ID del Google Sheet del TOTEM centralizado
const TOTEM_SHEET_ID = '12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8';

class TotemService {
  constructor() {
    this.csvService = new CSVDownloadService();
  }

  async syncTotemData() {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Iniciando sincronización TOTEM con detección automática...');
      
      // Detectar hojas disponibles dinámicamente
      const sheetsToProcess = await this.csvService.getSheetNamesToProcess(
        TOTEM_SHEET_ID,
        // Fallback en caso de que la detección automática falle
        [
          '1° Turno Ordinario',
          '2° Turno Ordinario', 
          'Especial Abril',
          'Extraordinario Mayo',
          'Especial Junio'
        ]
      );
      
      console.log(`📋 Hojas a procesar: ${sheetsToProcess.length} - ${sheetsToProcess.join(', ')}`);
      
      const processedSheets = [];
      let totalExamsCreated = 0;

      for (const sheetName of sheetsToProcess) {
        try {
          console.log(`📋 Procesando hoja: ${sheetName}`);
          
          // Descargar y procesar CSV
          const csvResult = await this.csvService.downloadAndParseCSV(
            TOTEM_SHEET_ID, 
            sheetName
          );
          
          if (csvResult.parsedData && csvResult.parsedData.length > 0) {
            // Guardar datos brutos en TotemData
            const totemDataRecord = await this.saveRawTotemData(sheetName, csvResult.parsedData);
            
            // Procesar los datos y crear exámenes
            const processedExams = await this.processTotemDataToExams(csvResult.parsedData, sheetName);
            
            totalExamsCreated += processedExams.length;
            
            processedSheets.push({
              sheetName: sheetName,
              totemDataId: totemDataRecord.id,
              examensCreated: processedExams.length,
              rowsProcessed: csvResult.parsedData.length,
              csvFile: csvResult.fileName,
              detectionMethod: 'automatic'
            });
            
            console.log(`✅ ${sheetName}: ${processedExams.length} exámenes creados de ${csvResult.parsedData.length} filas`);
          } else {
            console.log(`⚠️ ${sheetName}: No hay datos para procesar`);
            processedSheets.push({
              sheetName: sheetName,
              examensCreated: 0,
              error: 'Sin datos válidos en el CSV'
            });
          }
        } catch (error) {
          console.error(`❌ Error procesando hoja ${sheetName}:`, error);
          processedSheets.push({
            sheetName: sheetName,
            error: error.message,
            examensCreated: 0
          });
        }
      }

      const duration = Date.now() - startTime;
      
      console.log(`🎉 Sincronización TOTEM completada en ${duration}ms`);
      console.log(`📊 Total: ${totalExamsCreated} exámenes creados de ${sheetsToProcess.length} hojas`);
      
      return {
        success: true,
        data: {
          processedSheets,
          totalExamsCreated,
          totalSheets: sheetsToProcess.length,
          successfulSheets: processedSheets.filter(s => !s.error).length,
          detectedSheets: sheetsToProcess,
          method: 'CSV_DOWNLOAD_AUTO_DETECT'
        },
        duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error en sincronización TOTEM:', error);
      throw error;
    }
  }

  async saveRawTotemData(sheetName, sheetData) {
    return await prisma.totemData.create({
      data: {
        sheetName,
        data: sheetData,
        processed: false
      }
    });
  }

  async processTotemDataToExams(sheetData, sheetName) {
    const createdExams = [];
    
    for (const row of sheetData) {
      try {
        // Extraer datos del row del TOTEM
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
      // Formato DD/MM/YYYY del TOTEM
      const parts = dateString.toString().split('/');
      if (parts.length === 3) {
        const [dia, mes, año] = parts;
        return new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
      }
      return null;
    } catch (error) {
      console.error('Error parseando fecha:', dateString, error);
      return null;
    }
  }

  parseTotemTime(timeString) {
    if (!timeString || timeString.trim() === '') return null;
    
    try {
      // Formato HH:MM del TOTEM
      const parts = timeString.toString().split(':');
      if (parts.length >= 2) {
        const date = new Date();
        date.setHours(parseInt(parts[0]), parseInt(parts[1]) || 0, 0, 0);
        return date;
      }
      return null;
    } catch (error) {
      console.error('Error parseando hora:', timeString, error);
      return null;
    }
  }

  async mapSectorToFacultad(sector) {
    const sectorFacultad = await prisma.sectorFacultad.findFirst({
      where: { 
        sector: sector,
        activo: true 
      },
      include: { facultad: true }
    });

    return sectorFacultad?.facultad || null;
  }

  async mapCarreraTotem(carreraCodigoTotem, facultadId) {
    // Buscar mapeo existente
    let carreraTotem = await prisma.carreraTotem.findFirst({
      where: { 
        codigoTotem: carreraCodigoTotem,
        activo: true 
      },
      include: { carrera: true }
    });

    // Si no existe, crear registro sin mapear
    if (!carreraTotem) {
      carreraTotem = await prisma.carreraTotem.create({
        data: {
          codigoTotem: carreraCodigoTotem,
          nombreTotem: `Carrera TOTEM ${carreraCodigoTotem}`,
          esMapeada: false
        }
      });
    }

    return carreraTotem.carrera;
  }

  async findOrCreateAula(totemData) {
    // Por ahora, no creamos aulas automáticamente
    // Esto se puede expandir según las necesidades
    return null;
  }

  async createExamenFromTotem(totemData, carreraId, aulaId = null) {
    // Verificar si ya existe un examen similar
    const existingExamen = await prisma.examen.findFirst({
      where: {
        carreraId,
        nombreMateria: totemData.nombreCorto || `Materia ${totemData.materia}`,
        fecha: totemData.fecha
      }
    });

    if (existingExamen) {
      return existingExamen;
    }

    // Crear nuevo examen
    return await prisma.examen.create({
      data: {
        carreraId,
        aulaId,
        nombreMateria: totemData.nombreCorto || `Materia ${totemData.materia}`,
        fecha: totemData.fecha,
        hora: totemData.hora,
        tipoExamen: totemData.tipoExamen,
        materialPermitido: totemData.materialPermitido,
        observaciones: totemData.observaciones
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

  // Métodos de configuración y mapeo

  async createSectorFacultadMapping(sector, facultadId) {
    return await prisma.sectorFacultad.create({
      data: {
        sector,
        facultadId
      }
    });
  }

  async mapCarreraTotemToCarrera(codigoTotem, carreraId) {
    return await prisma.carreraTotem.update({
      where: { codigoTotem },
      data: {
        carreraId,
        esMapeada: true
      }
    });
  }

  async getSectoresNoMapeados() {
    // Obtener sectores del TOTEM que no tienen mapeo
    const totemData = await prisma.totemData.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' }
    });

    const sectores = new Set();
    totemData.forEach(record => {
      if (Array.isArray(record.data)) {
        record.data.forEach(row => {
          if (row.SECTOR) {
            sectores.add(row.SECTOR.toString());
          }
        });
      }
    });

    const sectorArray = Array.from(sectores);
    const mapeados = await prisma.sectorFacultad.findMany({
      where: { sector: { in: sectorArray } }
    });

    const sectoresMapeados = new Set(mapeados.map(m => m.sector));
    
    return sectorArray.filter(sector => !sectoresMapeados.has(sector));
  }

  async getCarrerasTotemNoMapeadas() {
    return await prisma.carreraTotem.findMany({
      where: { esMapeada: false },
      orderBy: { codigoTotem: 'asc' }
    });
  }

  async getEstadisticasTotem() {
    const [totalRegistros, examenes, sectoresNoMapeados, carrerasNoMapeadas] = await Promise.all([
      prisma.totemData.count(),
      prisma.examenTotem.count(),
      this.getSectoresNoMapeados(),
      this.getCarrerasTotemNoMapeadas()
    ]);

    return {
      totalRegistrosTotem: totalRegistros,
      totalExamenesCreados: examenes,
      sectoresNoMapeados: sectoresNoMapeados.length,
      carrerasNoMapeadas: carrerasNoMapeadas.length,
      listaSectoresNoMapeados: sectoresNoMapeados,
      listaCarrerasNoMapeadas: carrerasNoMapeadas
    };
  }
}

export default TotemService;

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
    let duplicatesSkipped = 0;
    
    console.log(`🔄 Procesando ${sheetData.length} filas para crear exámenes...`);
    
    // 🎯 PASO 1: MAPEO COMPLETO PREVIO
    await this.ensureCompleteMapping(sheetData);
    
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

        // 4. VERIFICAR DUPLICADOS REALES Y PROTEGER AULAS ASIGNADAS
        const existeExamen = await this.checkExamenDuplicate(totemData, carrera.id);
        if (existeExamen) {
          const horaStr = totemData.hora ? totemData.hora.getHours() + ':' + totemData.hora.getMinutes() : 'sin-hora';
          
          // ✅ PROTECCIÓN ESPECIAL: Si el examen ya tiene aula asignada
          if (existeExamen.aulaId) {
            console.log(`🔒 EXAMEN PROTEGIDO (CON AULA): ${totemData.sector}/${totemData.carrera}/${totemData.materia} (${totemData.fecha.toDateString()} ${horaStr}) - ID: ${existeExamen.id} - AULA: ${existeExamen.aulaId}`);
          } else {
            console.log(`📋 Examen duplicado detectado en BD: ${totemData.sector}/${totemData.carrera}/${totemData.materia} (${totemData.fecha.toDateString()} ${horaStr}) - Docente: ${totemData.docente} - ID: ${existeExamen.id}`);
          }
          
          duplicatesSkipped++;
          continue; // ❌ NO SOBRESCRIBIR - Preservar examen existente
        }

        // 5. Crear examen
        const examen = await this.createExamenFromTotem(totemData, carrera.id, aula?.id);
        
        // 6. Crear registro de ExamenTotem con datos originales
        await this.createExamenTotemRecord(examen.id, totemData, row);

        // 7. Examen creado exitosamente

        createdExams.push(examen);

      } catch (error) {
        console.error('Error procesando fila del TOTEM:', error, row);
      }
    }

    console.log(`✅ Procesamiento completado: ${createdExams.length} exámenes creados, ${duplicatesSkipped} duplicados saltados`);
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

  /**
   * Verifica si ya existe un examen con los mismos datos clave (MULTIPLE CAMPOS)
   * Campos clave: sector + carrera + modo + areaTema + materia + fecha + docente + tipoExamen + url
   */
  async checkExamenDuplicate(totemData, carreraId) {
    try {
      // DEBUG: Log para ver qué está buscando
      console.log(`🔍 Verificando duplicado: ${totemData.sector}/${totemData.carrera}/${totemData.materia} - ${totemData.fecha?.toDateString()}`);
      
      // Búsqueda robusta: comparando MÚLTIPLES campos del Google Sheet
      const existingExamenTotem = await prisma.examenTotem.findFirst({
        where: {
          sectorTotem: totemData.sector,
          carreraTotem: totemData.carrera,
          materiaTotem: totemData.materia,
          areaTemaTotem: totemData.areaTema,
          modoTotem: totemData.modo,
          docenteTotem: totemData.docente,
          urlTotem: totemData.url
        },
        select: {
          examenId: true,
          examen: {
            select: {
              id: true,
              fecha: true,
              hora: true,
              tipoExamen: true,
              carreraId: true,
              aulaId: true, // ✅ INCLUIR AULA PARA PROTECCIÓN
              activo: true
            }
          }
        }
      });

      // DEBUG: Log resultado de búsqueda
      if (existingExamenTotem) {
        console.log(`🔴 DUPLICADO ENCONTRADO: ExamenTotem ID ${existingExamenTotem.examenId}`);
      } else {
        console.log(`✅ NO ES DUPLICADO - creando nuevo examen`);
      }

      // Si existe, verificar que el examen asociado coincida con fecha, hora, tipo y carrera
      if (existingExamenTotem?.examen) {
        const examen = existingExamenTotem.examen;
        const fechaCoincide = examen.fecha.toDateString() === totemData.fecha.toDateString();
        const horaCoincide = examen.hora?.getHours() === totemData.hora?.getHours() && 
                            examen.hora?.getMinutes() === totemData.hora?.getMinutes();
        const tipoCoincide = examen.tipoExamen === totemData.tipoExamen;
        const carreraCoincide = examen.carreraId === carreraId;
        
        if (fechaCoincide && horaCoincide && tipoCoincide && carreraCoincide && examen.activo) {
          return examen;
        }
      }

      return null;
    } catch (error) {
      console.error('Error verificando duplicado de examen:', error);
      return null;
    }
  }

  /**
   * 🎯 MAPEO COMPLETO PREVIO - Asegura que todo esté mapeado antes de crear exámenes
   */
  async ensureCompleteMapping(sheetData) {
    console.log('🗺️  INICIANDO MAPEO COMPLETO PREVIO...');
    
    // 1. EXTRAER TODOS LOS DATOS ÚNICOS
    const sectoresUnicos = [...new Set(sheetData.map(row => row.SECTOR?.toString().trim()).filter(s => s))];
    const carrerasUnicas = [...new Set(sheetData.map(row => row.CARRERA?.toString().trim()).filter(c => c))];
    const aulasUnicas = [...new Set(sheetData.map(row => row.AULA?.toString().trim()).filter(a => a))];
    
    console.log(`📊 Detectados: ${sectoresUnicos.length} sectores, ${carrerasUnicas.length} carreras, ${aulasUnicas.length} aulas`);
    
    // 2. MAPEAR TODOS LOS SECTORES
    let sectoresMapeados = 0;
    for (const sector of sectoresUnicos) {
      const facultadExistente = await this.mapSectorToFacultad(sector);
      if (!facultadExistente) {
        // Crear facultad por defecto si no existe mapeo
        const nuevaFacultad = await prisma.facultad.create({
          data: {
            nombre: `Facultad ${sector}`,
            codigo: sector.substring(0, 10),
            activo: true
          }
        });
        
        await this.createSectorFacultadMapping(sector, nuevaFacultad.id);
        sectoresMapeados++;
        console.log(`   🆕 Sector "${sector}" → Nueva Facultad "${nuevaFacultad.nombre}"`);
      }
    }
    
    // 3. MAPEAR TODAS LAS CARRERAS
    let carrerasMapeadas = 0;
    for (const carreraCode of carrerasUnicas) {
      // Buscar si ya está mapeada
      const carreraExistente = await prisma.carreraTotem.findUnique({
        where: { codigoTotem: carreraCode },
        include: { carrera: true }
      });
      
      if (!carreraExistente || !carreraExistente.esMapeada) {
        // Crear carrera genérica si no existe
        const nuevaCarrera = await prisma.carrera.create({
          data: {
            nombre: `Carrera ${carreraCode}`,
            codigo: carreraCode.substring(0, 10),
            facultadId: 1, // Facultad por defecto
            activo: true
          }
        });
        
        await this.mapCarreraTotemToCarrera(carreraCode, nuevaCarrera.id);
        carrerasMapeadas++;
        console.log(`   🆕 Carrera "${carreraCode}" → Nueva Carrera "${nuevaCarrera.nombre}"`);
      }
    }
    
    // 4. CREAR AULAS SI ES NECESARIO
    let aulasCreadas = 0;
    for (const aulaInfo of aulasUnicas) {
      if (aulaInfo && aulaInfo !== 'undefined') {
        const aulaExistente = await prisma.aula.findFirst({
          where: { 
            nombre: { contains: aulaInfo, mode: 'insensitive' }
          }
        });
        
        if (!aulaExistente) {
          await prisma.aula.create({
            data: {
              nombre: `Aula ${aulaInfo}`,
              capacidad: 50, // Capacidad por defecto
              activo: true,
              tipoAula: 'regular'
            }
          });
          aulasCreadas++;
          console.log(`   🆕 Aula "${aulaInfo}" creada`);
        }
      }
    }
    
    console.log(`✅ MAPEO COMPLETADO: ${sectoresMapeados} sectores, ${carrerasMapeadas} carreras, ${aulasCreadas} aulas`);
  }
}

export default TotemService;

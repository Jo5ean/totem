import SheetBestService from '../../../../services/sheetBestService.js';
import prisma from '../../../../lib/db.js';

const sheetBestService = new SheetBestService();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido. Usa GET.`
    });
  }

  try {
    console.log('🔍 Analizando filas descartadas...');
    
    // 1. Obtener datos desde Sheet.best
    const sheetResult = await sheetBestService.fetchAndProcessData();
    console.log(`📊 Total filas obtenidas: ${sheetResult.data.length}`);

    // 2. Obtener mapeos existentes
    const sectoresMapeados = await prisma.sectorFacultad.findMany({
      where: { activo: true },
      include: { facultad: true }
    });

    const carrerasMapeadas = await prisma.carreraTotem.findMany({
      where: { esMapeada: true },
      include: { carrera: true }
    });

    console.log(`🏢 Sectores mapeados: ${sectoresMapeados.length}`);
    console.log(`🎓 Carreras mapeadas: ${carrerasMapeadas.length}`);

    // 3. Analizar cada fila para determinar motivo de descarte
    let filasAnalizadas = 0;
    let filasValidas = 0;
    let filasDescartadas = 0;
    
    const motivosDescarte = {
      'Datos incompletos': 0,
      'Sector no mapeado': 0,
      'Carrera no mapeada': 0,
      'Fecha inválida': 0,
      'Otros': 0
    };

    const ejemplosDescarte = {
      'Datos incompletos': [],
      'Sector no mapeado': [],
      'Carrera no mapeada': [],
      'Fecha inválida': [],
      'Otros': []
    };

    for (const row of sheetResult.data) {
      filasAnalizadas++;
      
      // Extraer datos como lo hace el TotemService
      const totemData = extractTotemRowData(row);
      
      // Verificar datos mínimos requeridos
      if (!totemData.sector || !totemData.carrera || !totemData.materia || !totemData.fecha) {
        filasDescartadas++;
        motivosDescarte['Datos incompletos']++;
        if (ejemplosDescarte['Datos incompletos'].length < 3) {
          ejemplosDescarte['Datos incompletos'].push({
            sector: totemData.sector,
            carrera: totemData.carrera,
            materia: totemData.materia,
            fecha: totemData.fecha
          });
        }
        continue;
      }

      // Verificar si el sector está mapeado
      const sectorMapeado = sectoresMapeados.find(s => s.sector === totemData.sector);
      if (!sectorMapeado) {
        filasDescartadas++;
        motivosDescarte['Sector no mapeado']++;
        if (ejemplosDescarte['Sector no mapeado'].length < 3) {
          ejemplosDescarte['Sector no mapeado'].push({
            sector: totemData.sector,
            carrera: totemData.carrera,
            materia: totemData.materia
          });
        }
        continue;
      }

      // Verificar si la carrera está mapeada
      const carreraMapeada = carrerasMapeadas.find(c => c.codigoTotem === totemData.carrera);
      if (!carreraMapeada) {
        filasDescartadas++;
        motivosDescarte['Carrera no mapeada']++;
        if (ejemplosDescarte['Carrera no mapeada'].length < 3) {
          ejemplosDescarte['Carrera no mapeada'].push({
            sector: totemData.sector,
            carrera: totemData.carrera,
            materia: totemData.materia
          });
        }
        continue;
      }

      // Verificar fecha válida
      if (!totemData.fecha || isNaN(totemData.fecha.getTime())) {
        filasDescartadas++;
        motivosDescarte['Fecha inválida']++;
        if (ejemplosDescarte['Fecha inválida'].length < 3) {
          ejemplosDescarte['Fecha inválida'].push({
            sector: totemData.sector,
            carrera: totemData.carrera,
            fechaOriginal: row.FECHA
          });
        }
        continue;
      }

      // Si llegó aquí, es una fila válida
      filasValidas++;
    }

    // 4. Analizar carreras específicas no mapeadas
    const carrerasNoMapeadas = await prisma.carreraTotem.findMany({
      where: { esMapeada: false },
      orderBy: { codigoTotem: 'asc' }
    });

    return res.status(200).json({
      success: true,
      message: 'Análisis de filas descartadas completado',
      data: {
        resumen: {
          filasAnalizadas,
          filasValidas,
          filasDescartadas,
          porcentajeDescarte: Math.round((filasDescartadas / filasAnalizadas) * 100)
        },
        motivosDescarte,
        ejemplosDescarte,
        carrerasNoMapeadas: carrerasNoMapeadas.map(c => ({
          codigo: c.codigoTotem,
          nombre: c.nombreTotem
        })),
        estadisticasMapeado: {
          sectoresMapeados: sectoresMapeados.length,
          carrerasMapeadas: carrerasMapeadas.length,
          carrerasNoMapeadas: carrerasNoMapeadas.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error analizando filas descartadas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error analizando filas descartadas',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

function extractTotemRowData(row) {
  return {
    sector: row.SECTOR?.toString().trim(),
    carrera: row.CARRERA?.toString().trim(), 
    modo: row.MODO?.toString().trim(),
    areaTema: row.AREATEMA?.toString().trim(),
    materia: row.MATERIA?.toString().trim(),
    nombreCorto: row['NOMBRE CORTO']?.toString().trim(),
    fecha: parseTotemDate(row.FECHA),
    url: row.URL?.toString().trim(),
    catedra: row.CÁTEDRA?.toString().trim(),
    docente: row.Docente?.toString().trim(),
    hora: parseTotemTime(row.Hora),
    tipoExamen: row['Tipo Examen']?.toString().trim(),
    monitoreo: row.Monitoreo?.toString().trim(),
    control: row['Control a cargo de:']?.toString().trim(),
    observaciones: row.Observaciones?.toString().trim(),
    materialPermitido: row['Material Permitido']?.toString().trim()
  };
}

function parseTotemDate(dateString) {
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

function parseTotemTime(timeString) {
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
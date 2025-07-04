import prisma from '../../../../lib/db.js';

// Datos de carreras del CSV proporcionado
const CARRERAS_CSV = [
  { codcar: '0', carrera: 'Otra Carrera Presencial' },
  { codcar: '1', carrera: 'Licenciatura en Comunicaciones Sociales' },
  { codcar: '2', carrera: 'Profesorado en Filosofía' },
  { codcar: '4', carrera: 'Profesorado en Inglés' },
  { codcar: '6', carrera: 'Profesorado en Psicología' },
  { codcar: '7', carrera: 'Locutor Nacional' },
  { codcar: '9', carrera: 'Tecnicatura Universitaria en Secretariado Ejecutivo' },
  { codcar: '10', carrera: 'Licenciatura en Economía' },
  { codcar: '11', carrera: 'Licenciatura en Administración de Empresas' },
  { codcar: '14', carrera: 'Contador Público' },
  { codcar: '15', carrera: 'Licenciatura en Comercialización' },
  { codcar: '16', carrera: 'Abogacía' },
  { codcar: '17', carrera: 'Licenciatura en Relaciones Internacionales' },
  { codcar: '18', carrera: 'Ingeniería Civil' },
  { codcar: '19', carrera: 'Ingeniería Industrial' },
  { codcar: '26', carrera: 'Arquitectura' },
  { codcar: '28', carrera: 'Diseño de Interiores' },
  { codcar: '30', carrera: 'Licenciatura en Relaciones Públicas e Institucionales' },
  { codcar: '31', carrera: 'Profesorado en Educación Física' },
  { codcar: '32', carrera: 'Licenciatura en Educación Física' },
  { codcar: '33', carrera: 'Caligrafo Público Nacional' },
  { codcar: '37', carrera: 'Licenciatura en Informática' },
  { codcar: '46', carrera: 'Licenciatura en Criminalística' },
  { codcar: '53', carrera: 'Formación Docente para Profesionales' },
  { codcar: '54', carrera: 'Productor y Director para Radio y Televisión' },
  { codcar: '62', carrera: 'Maestría en Administración de Negocios' },
  { codcar: '67', carrera: 'Perito en Balística' },
  { codcar: '68', carrera: 'Perito en Accidentología' },
  { codcar: '72', carrera: 'Especialización en Seguridad e Higiene en el Trabajo' },
  { codcar: '83', carrera: 'Tecnicatura Universitaria en Higiene y Seguridad en el Trabajo' },
  { codcar: '84', carrera: 'Ingenieria en Informática' },
  { codcar: '86', carrera: 'Licenciatura en Turismo' },
  { codcar: '88', carrera: 'Tecnicatura Univ. en Gestión de Bancos y Empresas Financieras' },
  { codcar: '91', carrera: 'Licenciatura en Gestión Educativa' },
  { codcar: '94', carrera: 'Licenciatura en Inglés (Ciclo de Complementación Curricular)' },
  { codcar: '96', carrera: 'Tecnicatura Universitaria en Gestión de Calidad' },
  { codcar: '97', carrera: 'Tecnicatura Universitaria en Seguros' },
  { codcar: '98', carrera: 'Especialización en Dirección de Recursos Humanos' },
  { codcar: '100', carrera: 'Licenciatura en Filosofía' },
  { codcar: '104', carrera: 'Licenciatura en Educación Física - Ciclo de Complementación Curricular' },
  { codcar: '105', carrera: 'Licenciatura en Psicología' },
  { codcar: '109', carrera: 'Traductor Público en Inglés' },
  { codcar: '113', carrera: 'Licenciatura en Gestión Educativa' },
  { codcar: '117', carrera: 'Ingenieria en Telecomunicaciones' },
  { codcar: '121', carrera: 'Maestría en Gestión Ambiental' },
  { codcar: '123', carrera: 'Ciencias Veterinarias' },
  { codcar: '128', carrera: 'Operador Técnico de Estudio de Radio' },
  { codcar: '133', carrera: 'Licenciatura en Administración Agropecuaria' },
  { codcar: '138', carrera: 'Licenciatura en Higiene y Seguridad en el Trabajo' },
  { codcar: '139', carrera: 'Licenciatura en Artes Musicales' },
  { codcar: '141', carrera: 'Especialización en Dirección y Gestión de Alojamientos Turísticos' },
  { codcar: '142', carrera: 'Licenciatura en Trabajo Social' },
  { codcar: '148', carrera: 'Licenciatura en Diseño de Interiores - Ciclo de complementación Curricular' },
  { codcar: '153', carrera: 'Diplomatura Universitaria en Derecho de Familia' },
  { codcar: '161', carrera: 'Tecnicatura en Gestión de Bancos, Empresas Financieras y de Seguros' },
  { codcar: '185', carrera: 'Licenciatura en Gestión Eficiente de la Energía' },
  { codcar: '186', carrera: 'Licenciatura en Entrenamiento Deportivo - Ciclo de Complementación Curricular' },
  { codcar: '187', carrera: 'Licenciatura en Lenguajes Expresivos - Ciclo de Complementación Curricular' },
  { codcar: '194', carrera: 'Licenciatura en Educación Física - Ciclo de Complementación Curricular' },
  { codcar: '195', carrera: 'Licenciatura en Turismo - Ciclo de Complementación Curricular' },
  { codcar: '196', carrera: 'Licenciatura en Seguridad - Ciclo de Complementación Curricular' },
  { codcar: '212', carrera: 'Tecnicatura Universitaria en Ceremonial y Protocolo' },
  { codcar: '214', carrera: 'Licenciatura en Comercio Internacional' },
  { codcar: '244', carrera: 'Corredor Inmobiliario y Martillero Público' },
  { codcar: '250', carrera: 'Licenciatura en Administración de Negocios Digitales' },
  { codcar: '336', carrera: 'Licenciatura en Recursos Humanos' },
  { codcar: '350', carrera: 'Sin carrera específica encontrada' },
  { codcar: '355', carrera: 'Sin carrera específica encontrada' },
  { codcar: '360', carrera: 'Tecnicatura en Seguridad Informática' },
  { codcar: '361', carrera: 'Sin carrera específica encontrada' },
  { codcar: '363', carrera: 'Procuración' },
  { codcar: '368', carrera: 'Licenciatura en Administración y Gestión Universitaria - Ciclo de Complementación Curricular' },
  { codcar: '378', carrera: 'Sin carrera específica encontrada' },
  { codcar: '383', carrera: 'Tecnicatura en Operaciones Mineras' }
];

function buscarCarreraSimilar(nombreCarrera, carrerasDisponibles) {
  // Normalizar nombre para comparación
  const nombreNormalizado = nombreCarrera.toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Búsqueda exacta (ignorando acentos y mayúsculas)
  for (const carrera of carrerasDisponibles) {
    const nombreBD = carrera.nombre.toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (nombreNormalizado === nombreBD) {
      return carrera;
    }
  }

  // 2. Búsqueda por palabras clave importantes
  const palabrasClave = extraerPalabrasClave(nombreNormalizado);
  
  for (const carrera of carrerasDisponibles) {
    const nombreBD = carrera.nombre.toLowerCase();
    const coincidencias = palabrasClave.filter(palabra => nombreBD.includes(palabra));
    
    // Si coinciden al menos 2 palabras clave importantes, considerar como match
    if (coincidencias.length >= 2) {
      return carrera;
    }
  }

  // 3. Mapeos específicos manuales para casos especiales
  const mapeosEspecificos = {
    'tecnicatura universitaria en secretariado ejecutivo': 'TEC. UNIV. SEC. EJECUTIVO',
    'licenciatura en administracion de empresas': 'LIC EN ADM de EMPRESAS',
    'licenciatura en economia': 'LIC. EN ECONOMIA',
    'contador publico': 'CONTADOR PUBLICO'
  };

  const mapeoEspecifico = mapeosEspecificos[nombreNormalizado];
  if (mapeoEspecifico) {
    return carrerasDisponibles.find(c => c.nombre.toLowerCase().includes(mapeoEspecifico.toLowerCase()));
  }

  return null;
}

function extraerPalabrasClave(texto) {
  // Palabras irrelevantes que se pueden ignorar
  const stopWords = ['en', 'de', 'del', 'la', 'el', 'y', 'para', 'con', 'por', 'universitaria', 'universitario', 'ciclo', 'complementacion', 'curricular'];
  
  return texto.split(' ')
    .filter(palabra => palabra.length > 2 && !stopWords.includes(palabra))
    .slice(0, 5); // Tomar solo las primeras 5 palabras importantes
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido. Usa POST.`
    });
  }

  try {
    console.log('🚀 Iniciando mapeo automático de carreras...');
    
    // 1. Obtener carreras no mapeadas actuales
    const carrerasNoMapeadas = await prisma.carreraTotem.findMany({
      where: { esMapeada: false },
      orderBy: { codigoTotem: 'asc' }
    });

    console.log(`📊 Encontradas ${carrerasNoMapeadas.length} carreras TOTEM sin mapear`);

    // 2. Obtener todas las carreras disponibles en la base de datos
    const carrerasDisponibles = await prisma.carrera.findMany({
      include: { facultad: true }
    });

    console.log(`📚 Carreras disponibles en BD: ${carrerasDisponibles.length}`);

    // 3. Mapear automáticamente
    let mapeosRealizados = 0;
    let mapeosNoEncontrados = [];

    for (const carreraTotem of carrerasNoMapeadas) {
      const codigoTotem = carreraTotem.codigoTotem;
      
      // Buscar en el CSV de carreras
      const carreraEnCSV = CARRERAS_CSV.find(c => c.codcar === codigoTotem);
      
      if (carreraEnCSV) {
        // Buscar carrera similar en la base de datos
        const carreraEncontrada = buscarCarreraSimilar(carreraEnCSV.carrera, carrerasDisponibles);
        
        if (carreraEncontrada) {
          // Realizar mapeo
          await prisma.carreraTotem.update({
            where: { id: carreraTotem.id },
            data: {
              carreraId: carreraEncontrada.id,
              nombreTotem: carreraEnCSV.carrera,
              esMapeada: true
            }
          });
          
          console.log(`✅ Mapeado: TOTEM "${codigoTotem}" → "${carreraEncontrada.nombre}" (ID: ${carreraEncontrada.id})`);
          mapeosRealizados++;
        } else {
          // Actualizar solo el nombre pero sin mapear
          await prisma.carreraTotem.update({
            where: { id: carreraTotem.id },
            data: {
              nombreTotem: carreraEnCSV.carrera
            }
          });
          
          mapeosNoEncontrados.push({
            codigo: codigoTotem,
            nombre: carreraEnCSV.carrera,
            razon: 'No se encontró carrera similar en BD'
          });
          
          console.log(`⚠️ No mapeado: TOTEM "${codigoTotem}" → "${carreraEnCSV.carrera}" (no encontrada en BD)`);
        }
      } else {
        mapeosNoEncontrados.push({
          codigo: codigoTotem,
          nombre: carreraTotem.nombreTotem,
          razon: 'No se encontró en CSV de carreras'
        });
        
        console.log(`❌ No encontrado en CSV: TOTEM "${codigoTotem}"`);
      }
    }

    // 4. Obtener estadísticas finales
    const total = await prisma.carreraTotem.count();
    const mapeadas = await prisma.carreraTotem.count({ where: { esMapeada: true } });
    const noMapeadas = total - mapeadas;
    const porcentaje = total > 0 ? Math.round((mapeadas / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      message: 'Mapeo automático de carreras completado',
      data: {
        mapeosRealizados,
        mapeosNoEncontrados: mapeosNoEncontrados.length,
        estadisticasFinales: {
          total,
          mapeadas,
          noMapeadas,
          porcentaje
        },
        carrerasNoMapeadas: mapeosNoEncontrados,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error en mapeo automático:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en mapeo automático de carreras',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 
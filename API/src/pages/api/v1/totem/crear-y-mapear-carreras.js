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

// Mapeo de tipos de carrera a facultades por palabras clave
const MAPEO_FACULTADES = {
  1: { // ARTES Y CIENCIAS
    palabras: ['comunicaciones', 'filosofia', 'ingles', 'psicologia', 'locutor', 'psicologia', 'filosofia', 'artes', 'musicales'],
    nombre: 'FACULTAD DE ARTES Y CIENCIAS'
  },
  2: { // ECONOMÍA Y ADMINISTRACIÓN  
    palabras: ['economia', 'administracion', 'empresas', 'contador', 'comercializacion', 'recursos humanos', 'negocios', 'comercio'],
    nombre: 'FACULTAD DE ECONOMIA Y ADMINISTRACION'
  },
  3: { // CIENCIAS JURÍDICAS
    palabras: ['abogacia', 'derecho', 'relaciones internacionales', 'criminalistica', 'balistica', 'accidentologia', 'procuracion'],
    nombre: 'FACULTAD DE CIENCIAS JURIDICAS'
  },
  4: { // INGENIERÍA
    palabras: ['ingenieria', 'informatica', 'telecomunicaciones', 'higiene', 'seguridad', 'trabajo', 'gestion eficiente energia'],
    nombre: 'FACULTAD DE INGENIERIA'
  },
  5: { // ARQUITECTURA Y URBANISMO
    palabras: ['arquitectura', 'diseño', 'interiores'],
    nombre: 'FACULTAD DE ARQUITECTURA Y URBANISMO'
  },
  6: { // ESCUELA UNIVERSITARIA DE TRABAJO SOCIAL
    palabras: ['trabajo social'],
    nombre: 'ESCUELA UNIVERSITARIA DE TRABAJO SOCIAL'
  },
  7: { // ESCUELA UNIVERSITARIA DE EDUCACIÓN FÍSICA
    palabras: ['educacion fisica', 'entrenamiento deportivo'],
    nombre: 'ESCUELA UNIVERSITARIA DE EDUCACION FISICA'
  },
  8: { // ESCUELA UNIVERSITARIA DE TURISMO
    palabras: ['turismo', 'alojamientos turisticos'],
    nombre: 'ESCUELA UNIVERSITARIA DE TURISMO'
  },
  9: { // CIENCIAS AGRARIAS Y VETERINARIAS
    palabras: ['veterinarias', 'administracion agropecuaria', 'gestion ambiental', 'operaciones mineras'],
    nombre: 'CIENCIAS AGRARIAS Y VETERINARIAS'
  }
};

function determinarFacultad(nombreCarrera) {
  const nombreNormalizado = nombreCarrera.toLowerCase();
  
  for (const [facultadId, config] of Object.entries(MAPEO_FACULTADES)) {
    for (const palabra of config.palabras) {
      if (nombreNormalizado.includes(palabra)) {
        return parseInt(facultadId);
      }
    }
  }
  
  // Por defecto, asignar a Economía y Administración si no se encuentra
  return 2;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido. Usa POST.`
    });
  }

  try {
    console.log('🚀 Iniciando creación y mapeo automático de carreras...');
    
    // 1. Obtener carreras TOTEM no mapeadas
    const carrerasNoMapeadas = await prisma.carreraTotem.findMany({
      where: { esMapeada: false },
      orderBy: { codigoTotem: 'asc' }
    });

    console.log(`📊 Carreras TOTEM sin mapear: ${carrerasNoMapeadas.length}`);

    // 2. Obtener facultades existentes
    const facultades = await prisma.facultad.findMany();
    console.log(`🏢 Facultades disponibles: ${facultades.length}`);

    let carrerasCreadas = 0;
    let carrerasMapeadas = 0;
    let carrerasOmitidas = [];

    for (const carreraTotem of carrerasNoMapeadas) {
      const codigoTotem = carreraTotem.codigoTotem;
      
      // Buscar en el CSV
      const carreraEnCSV = CARRERAS_CSV.find(c => c.codcar === codigoTotem);
      
      if (carreraEnCSV && !carreraEnCSV.carrera.includes('Sin carrera específica')) {
        try {
          // Determinar facultad apropiada
          const facultadId = determinarFacultad(carreraEnCSV.carrera);
          const facultad = facultades.find(f => f.id === facultadId);
          
          if (facultad) {
            // Crear la carrera en la base de datos
            const nuevaCarrera = await prisma.carrera.create({
              data: {
                facultadId: facultad.id,
                nombre: carreraEnCSV.carrera,
                codigo: codigoTotem,
                activa: true
              }
            });

            // Mapear la carrera TOTEM a la nueva carrera
            await prisma.carreraTotem.update({
              where: { id: carreraTotem.id },
              data: {
                carreraId: nuevaCarrera.id,
                nombreTotem: carreraEnCSV.carrera,
                esMapeada: true
              }
            });

            console.log(`✅ Creada y mapeada: "${carreraEnCSV.carrera}" → Facultad: ${facultad.nombre}`);
            carrerasCreadas++;
            carrerasMapeadas++;
          } else {
            console.log(`⚠️ Facultad no encontrada para: ${carreraEnCSV.carrera}`);
            carrerasOmitidas.push({
              codigo: codigoTotem,
              nombre: carreraEnCSV.carrera,
              razon: 'Facultad no encontrada'
            });
          }
        } catch (error) {
          console.error(`❌ Error creando carrera ${codigoTotem}:`, error.message);
          carrerasOmitidas.push({
            codigo: codigoTotem,
            nombre: carreraEnCSV.carrera,
            razon: `Error: ${error.message}`
          });
        }
      } else {
        console.log(`⏭️ Omitida carrera sin nombre específico: ${codigoTotem}`);
        carrerasOmitidas.push({
          codigo: codigoTotem,
          nombre: carreraTotem.nombreTotem,
          razon: 'Sin carrera específica o no encontrada en CSV'
        });
      }
    }

    // 3. Obtener estadísticas finales
    const estadisticas = await obtenerEstadisticasFinales();

    return res.status(200).json({
      success: true,
      message: 'Creación y mapeo automático de carreras completado',
      data: {
        carrerasCreadas,
        carrerasMapeadas,
        carrerasOmitidas: carrerasOmitidas.length,
        estadisticasFinales: estadisticas,
        detalleOmitidas: carrerasOmitidas,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error en creación automática:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en creación y mapeo automático de carreras',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function obtenerEstadisticasFinales() {
  const totalCarrerasTotem = await prisma.carreraTotem.count();
  const carrerasMapeadas = await prisma.carreraTotem.count({ where: { esMapeada: true } });
  const carrerasNoMapeadas = totalCarrerasTotem - carrerasMapeadas;
  const porcentajeMapeado = totalCarrerasTotem > 0 ? Math.round((carrerasMapeadas / totalCarrerasTotem) * 100) : 0;

  const totalCarreras = await prisma.carrera.count();

  return {
    totalCarrerasTotem,
    carrerasMapeadas,
    carrerasNoMapeadas,
    porcentajeMapeado,
    totalCarrerasEnBD: totalCarreras
  };
} 
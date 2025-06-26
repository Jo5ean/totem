import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Usa POST.'
    });
  }

  try {
    console.log('🚀 Iniciando reseteo completo de mapeos...');
    
    // 1. MAPEO DE SECTORES/FACULTADES (del CSV sectores_202506061224.csv)
    const sectoresMapping = {
      11: { nombre: 'FACULTAD DE ARTES Y CIENCIAS', codigo: '11' },
      12: { nombre: 'FACULTAD DE ECONOMÍA Y ADMINISTRACIÓN', codigo: '12' },
      13: { nombre: 'FACULTAD DE CIENCIAS JURÍDICAS', codigo: '13' },
      14: { nombre: 'FACULTAD DE INGENIERÍA', codigo: '14' },
      15: { nombre: 'FACULTAD DE ARQUITECTURA Y URBANISMO', codigo: '15' },
      16: { nombre: 'ESCUELA UNIVERSITARIA DE TRABAJO SOCIAL', codigo: '16' },
      17: { nombre: 'ESCUELA UNIVERSITARIA DE EDUCACIÓN FÍSICA', codigo: '17' },
      18: { nombre: 'ESCUELA UNIVERSITARIA DE TURISMO', codigo: '18' },
      19: { nombre: 'FACULTAD DE CIENCIAS AGRARIAS Y VETERINARIAS', codigo: '19' },
      20: { nombre: 'FACULTAD DE EDUCACIÓN', codigo: '20' },
      21: { nombre: 'ESCUELA UNIVERSITARIA DE MÚSICA', codigo: '21' },
      23: { nombre: 'ESCUELA DE NEGOCIOS', codigo: '23' },
      24: { nombre: 'FACULTAD DE CIENCIAS DE LA SALUD', codigo: '24' }
    };

    // 2. MAPEO DE CARRERAS COMPLETO (del CSV Codcar_y_Carrera.csv)
    const carrerasMapping = {
      // FACULTAD DE ECONOMÍA Y ADMINISTRACIÓN (12)
      9: { nombre: 'Tecnicatura Universitaria en Secretariado Ejecutivo', facultad_codigo: '12' },
      10: { nombre: 'Licenciatura en Economía', facultad_codigo: '12' },
      11: { nombre: 'Licenciatura en Administración de Empresas', facultad_codigo: '12' },
      14: { nombre: 'Contador Público', facultad_codigo: '12' },
      15: { nombre: 'Licenciatura en Comercialización', facultad_codigo: '12' },
      214: { nombre: 'Licenciatura en Comercio Internacional', facultad_codigo: '12' },
      244: { nombre: 'Corredor Inmobiliario y Martillero Público', facultad_codigo: '12' },
      336: { nombre: 'Licenciatura en Recursos Humanos', facultad_codigo: '12' },
      88: { nombre: 'Tecnicatura Univ. en Gestión de Bancos y Empresas Financieras', facultad_codigo: '12' },
      212: { nombre: 'Tecnicatura Universitaria en Ceremonial y Protocolo', facultad_codigo: '12' },
      97: { nombre: 'Tecnicatura Universitaria en Seguros', facultad_codigo: '12' },
      
      // FACULTAD DE CIENCIAS JURÍDICAS (13)
      16: { nombre: 'Abogacía', facultad_codigo: '13' },
      17: { nombre: 'Licenciatura en Relaciones Internacionales', facultad_codigo: '13' },
      46: { nombre: 'Licenciatura en Criminalística', facultad_codigo: '13' },
      355: { nombre: 'Escribanía', facultad_codigo: '13' },
      363: { nombre: 'Procuración', facultad_codigo: '13' },
      
      // FACULTAD DE INGENIERÍA (14)
      18: { nombre: 'Ingeniería Civil', facultad_codigo: '14' },
      19: { nombre: 'Ingeniería Industrial', facultad_codigo: '14' },
      37: { nombre: 'Licenciatura en Informática', facultad_codigo: '14' },
      84: { nombre: 'Ingeniería en Informática', facultad_codigo: '14' },
      117: { nombre: 'Ingeniería en Telecomunicaciones', facultad_codigo: '14' },
      138: { nombre: 'Licenciatura en Higiene y Seguridad en el Trabajo', facultad_codigo: '14' },
      83: { nombre: 'Tecnicatura Universitaria en Higiene y Seguridad en el Trabajo', facultad_codigo: '14' },
      96: { nombre: 'Tecnicatura Universitaria en Gestión de Calidad', facultad_codigo: '14' },
      250: { nombre: 'Licenciatura en Administración de Negocios Digitales', facultad_codigo: '14' },
      
      // FACULTAD DE ARQUITECTURA Y URBANISMO (15)
      26: { nombre: 'Arquitectura', facultad_codigo: '15' },
      28: { nombre: 'Diseño de Interiores', facultad_codigo: '15' },
      179: { nombre: 'Licenciatura en Diseño de Interiores', facultad_codigo: '15' },
      196: { nombre: 'Licenciatura en Seguridad - Ciclo de Complementación Curricular', facultad_codigo: '15' },
      
      // FACULTAD DE ARTES Y CIENCIAS (11)
      30: { nombre: 'Licenciatura en Relaciones Públicas e Institucionales', facultad_codigo: '11' },
      94: { nombre: 'Licenciatura en Inglés (Ciclo de Complementación Curricular)', facultad_codigo: '11' },
      100: { nombre: 'Licenciatura en Filosofía', facultad_codigo: '11' },
      105: { nombre: 'Licenciatura en Psicología', facultad_codigo: '11' },
      109: { nombre: 'Traductor Público en Inglés', facultad_codigo: '11' },
      216: { nombre: 'Licenciatura en Geografía', facultad_codigo: '11' },
      220: { nombre: 'Licenciatura en Imagen y Sonido', facultad_codigo: '11' },
      221: { nombre: 'Licenciatura en Diseño Gráfico', facultad_codigo: '11' },
      222: { nombre: 'Licenciatura en Publicidad', facultad_codigo: '11' },
      223: { nombre: 'Licenciatura en Periodismo', facultad_codigo: '11' },
      
      // ESCUELA UNIVERSITARIA DE TRABAJO SOCIAL (16)
      142: { nombre: 'Licenciatura en Trabajo Social', facultad_codigo: '16' },
      
      // ESCUELA UNIVERSITARIA DE EDUCACIÓN FÍSICA (17)
      31: { nombre: 'Profesorado en Educación Física', facultad_codigo: '17' },
      32: { nombre: 'Licenciatura en Educación Física', facultad_codigo: '17' },
      194: { nombre: 'Licenciatura en Educación Física - Ciclo de Complementación Curricular', facultad_codigo: '17' },
      186: { nombre: 'Licenciatura en Entrenamiento Deportivo - Ciclo de Complementación Curricular', facultad_codigo: '17' },
      187: { nombre: 'Licenciatura en Lenguajes Expresivos - Ciclo de Complementación Curricular', facultad_codigo: '17' },
      
      // ESCUELA UNIVERSITARIA DE TURISMO (18)
      86: { nombre: 'Licenciatura en Turismo', facultad_codigo: '18' },
      
      // FACULTAD DE CIENCIAS AGRARIAS Y VETERINARIAS (19)
      123: { nombre: 'Ciencias Veterinarias', facultad_codigo: '19' },
      133: { nombre: 'Licenciatura en Administración Agropecuaria', facultad_codigo: '19' },
      
      // FACULTAD DE EDUCACIÓN (20)
      113: { nombre: 'Licenciatura en Gestión Educativa', facultad_codigo: '20' },
      
      // ESCUELA UNIVERSITARIA DE MÚSICA (21)
      139: { nombre: 'Licenciatura en Artes Musicales', facultad_codigo: '21' },
      
      // FACULTAD DE CIENCIAS DE LA SALUD (24)
      340: { nombre: 'Licenciatura en Kinesiología y Fisioterapia', facultad_codigo: '24' },
      342: { nombre: 'Licenciatura en Fonoaudiología', facultad_codigo: '24' },
      4002: { nombre: 'Licenciatura en Nutrición', facultad_codigo: '24' },
      
      // CARRERAS ESPECIALES Y DE GESTIÓN
      368: { nombre: 'Licenciatura en Administración y Gestión Universitaria - Ciclo de Complementación Curricular', facultad_codigo: '12' }
    };

    // 3. CREAR/ACTUALIZAR FACULTADES
    console.log('📚 Creando/actualizando facultades...');
    const facultadesCreadas = {};
    
    for (const [codigo, info] of Object.entries(sectoresMapping)) {
      const facultad = await prisma.facultad.upsert({
        where: { nombre: info.nombre },
        update: { codigo: info.codigo },
        create: {
          nombre: info.nombre,
          codigo: info.codigo,
          activa: true
        }
      });
      facultadesCreadas[info.codigo] = facultad;
      console.log(`✅ Facultad: ${info.nombre}`);
    }

    // 4. CREAR/ACTUALIZAR CARRERAS
    console.log('🎓 Creando/actualizando carreras...');
    const carrerasCreadas = {};
    
    for (const [codigo, info] of Object.entries(carrerasMapping)) {
      const facultad = facultadesCreadas[info.facultad_codigo];
      if (!facultad) {
        console.log(`⚠️ Facultad no encontrada para carrera ${info.nombre} (código facultad: ${info.facultad_codigo})`);
        continue;
      }

      const carrera = await prisma.carrera.upsert({
        where: { 
          facultadId_codigo: {
            facultadId: facultad.id,
            codigo: codigo.toString()
          }
        },
        update: { 
          nombre: info.nombre
        },
        create: {
          nombre: info.nombre,
          codigo: codigo.toString(),
          facultadId: facultad.id,
          activa: true
        }
      });
      carrerasCreadas[codigo] = carrera;
      console.log(`✅ Carrera: ${info.nombre} → ${facultad.nombre}`);
    }

    // 5. ACTUALIZAR EXÁMENES EXISTENTES
    console.log('📝 Actualizando exámenes con mapeos correctos...');
    
    // Obtener exámenes con información TOTEM
    const examenes = await prisma.examen.findMany({
      include: {
        examenTotem: true,
        carrera: {
          include: { facultad: true }
        }
      }
    });

    let examenesActualizados = 0;
    
    for (const examen of examenes) {
      if (!examen.examenTotem || !examen.examenTotem.carrera_totem) continue;

      const codigoCarrera = examen.examenTotem.carrera_totem;
      const carreraNueva = carrerasCreadas[codigoCarrera];

      if (carreraNueva && examen.carrera_id !== carreraNueva.id) {
        await prisma.examen.update({
          where: { id: examen.id },
          data: { carrera_id: carreraNueva.id }
        });
        examenesActualizados++;
        
        if (examenesActualizados % 50 === 0) {
          console.log(`📊 Actualizados ${examenesActualizados} exámenes...`);
        }
      }
    }

    // 6. ESTADÍSTICAS FINALES
    const facultadesActivas = await prisma.facultad.count({ where: { activa: true } });
    const carrerasActivas = await prisma.carrera.count({ where: { activa: true } });
    const totalExamenes = await prisma.examen.count();
    const examenesPorCarrera = await prisma.examen.groupBy({
      by: ['carreraId'],
      _count: { id: true }
    });

    console.log('🎉 Reseteo completo terminado!');

    return res.status(200).json({
      success: true,
      message: 'Mapeos resetados completamente',
      data: {
        facultadesCreadas: Object.keys(facultadesCreadas).length,
        carrerasCreadas: Object.keys(carrerasCreadas).length,
        examenesActualizados: examenesActualizados,
        estadisticas: {
          facultadesActivas: facultadesActivas,
          carrerasActivas: carrerasActivas,
          totalExamenes: totalExamenes,
          examenesPorCarrera: examenesPorCarrera.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en reseteo completo:', error);
    return res.status(500).json({
      success: false,
      error: 'Error resetando mapeos: ' + error.message
    });
  }
} 
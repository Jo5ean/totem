import prisma from './src/lib/db.js';

// Mapeo de sectores a facultades según el CSV
const SECTORES_FACULTADES = [
  { sector: '1', facultad: 'ARTES Y CIENCIAS' },
  { sector: '2', facultad: 'ECONOMÍA Y ADMINISTRACIÓN' },
  { sector: '3', facultad: 'CIENCIAS JURÍDICAS' },
  { sector: '4', facultad: 'INGENIERÍA' },
  { sector: '5', facultad: 'ARQUITECTURA Y URBANISMO' },
  { sector: '6', facultad: 'ESCUELA UNIVERSITARIA DE TRABAJO SOCIAL' },
  { sector: '7', facultad: 'ESCUELA UNIVERSITARIA DE EDUCACIÓN FÍSICA' },
  { sector: '8', facultad: 'ESCUELA UNIVERSITARIA DE TURISMO' },
  { sector: '9', facultad: 'CIENCIAS AGRARIAS Y VETERINARIAS' },
  { sector: '14', facultad: 'FACULTAD DE CIENCIAS DE LA SALUD' },
  { sector: '21', facultad: 'FACULTAD DE EDUCACIÓN' }
];

// Carreras principales por facultad
const CARRERAS_POR_FACULTAD = {
  'ARTES Y CIENCIAS': [
    { codigo: '1', nombre: 'Licenciatura en Comunicaciones Sociales' },
    { codigo: '2', nombre: 'Profesorado en Filosofía' },
    { codigo: '4', nombre: 'Profesorado en Inglés' },
    { codigo: '105', nombre: 'Licenciatura en Psicología' },
    { codigo: '109', nombre: 'Traductor Público en Inglés' },
    { codigo: '139', nombre: 'Licenciatura en Artes Musicales' }
  ],
  'ECONOMÍA Y ADMINISTRACIÓN': [
    { codigo: '10', nombre: 'Licenciatura en Economía' },
    { codigo: '11', nombre: 'Licenciatura en Administración de Empresas' },
    { codigo: '14', nombre: 'Contador Público' },
    { codigo: '15', nombre: 'Licenciatura en Comercialización' },
    { codigo: '88', nombre: 'Tecnicatura Univ. en Gestión de Bancos y Empresas Financieras' }
  ],
  'CIENCIAS JURÍDICAS': [
    { codigo: '16', nombre: 'Abogacía' },
    { codigo: '17', nombre: 'Licenciatura en Relaciones Internacionales' },
    { codigo: '46', nombre: 'Licenciatura en Criminalística' },
    { codigo: '363', nombre: 'Procuración' }
  ],
  'INGENIERÍA': [
    { codigo: '18', nombre: 'Ingeniería Civil' },
    { codigo: '19', nombre: 'Ingeniería Industrial' },
    { codigo: '37', nombre: 'Licenciatura en Informática' },
    { codigo: '84', nombre: 'Ingeniería en Informática' },
    { codigo: '117', nombre: 'Ingeniería en Telecomunicaciones' }
  ],
  'ARQUITECTURA Y URBANISMO': [
    { codigo: '26', nombre: 'Arquitectura' },
    { codigo: '28', nombre: 'Diseño de Interiores' }
  ],
  'ESCUELA UNIVERSITARIA DE EDUCACIÓN FÍSICA': [
    { codigo: '31', nombre: 'Profesorado en Educación Física' },
    { codigo: '32', nombre: 'Licenciatura en Educación Física' }
  ],
  'ESCUELA UNIVERSITARIA DE TURISMO': [
    { codigo: '86', nombre: 'Licenciatura en Turismo' }
  ]
};

async function inicializarSistema() {
  try {
    console.log('🚀 INICIALIZANDO SISTEMA COMPLETO DEL TÓTEM\n');

    // 1. Crear facultades
    console.log('1️⃣ Creando facultades...');
    let facultadesCreadas = 0;
    
    for (const facultadNombre of Object.keys(CARRERAS_POR_FACULTAD)) {
      try {
        const facultad = await prisma.facultad.upsert({
          where: { nombre: facultadNombre },
          update: {},
          create: {
            nombre: facultadNombre,
            activa: true
          }
        });
        facultadesCreadas++;
        console.log(`   ✅ Facultad: ${facultadNombre}`);
      } catch (error) {
        console.log(`   ⚠️ Error con facultad ${facultadNombre}:`, error.message);
      }
    }
    
    console.log(`✅ ${facultadesCreadas} facultades inicializadas\n`);

    // 2. Crear carreras por facultad
    console.log('2️⃣ Creando carreras...');
    let carrerasCreadas = 0;
    
    for (const [facultadNombre, carreras] of Object.entries(CARRERAS_POR_FACULTAD)) {
      const facultad = await prisma.facultad.findUnique({ where: { nombre: facultadNombre } });
      
      if (facultad) {
        for (const carreraData of carreras) {
          try {
            const carrera = await prisma.carrera.upsert({
              where: { 
                facultadId_codigo: {
                  facultadId: facultad.id,
                  codigo: carreraData.codigo
                }
              },
              update: {},
              create: {
                facultadId: facultad.id,
                codigo: carreraData.codigo,
                nombre: carreraData.nombre,
                activa: true
              }
            });
            carrerasCreadas++;
            console.log(`   ✅ ${carreraData.codigo}: ${carreraData.nombre}`);
          } catch (error) {
            console.log(`   ⚠️ Error con carrera ${carreraData.codigo}:`, error.message);
          }
        }
      }
    }
    
    console.log(`✅ ${carrerasCreadas} carreras inicializadas\n`);

    // 3. Crear mapeos de sectores a facultades
    console.log('3️⃣ Creando mapeos de sectores...');
    let sectoresMapeados = 0;
    
    for (const { sector, facultad: facultadNombre } of SECTORES_FACULTADES) {
      try {
        const facultad = await prisma.facultad.findUnique({ where: { nombre: facultadNombre } });
        
        if (facultad) {
          await prisma.sectorFacultad.upsert({
            where: { sector: sector },
            update: {},
            create: {
              sector: sector,
              facultadId: facultad.id,
              activo: true
            }
          });
          sectoresMapeados++;
          console.log(`   ✅ Sector ${sector} → ${facultadNombre}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error mapeando sector ${sector}:`, error.message);
      }
    }
    
    console.log(`✅ ${sectoresMapeados} sectores mapeados\n`);

    // 4. Crear mapeos de carreras totem
    console.log('4️⃣ Creando mapeos de carreras totem...');
    let carrerasTótemCreadas = 0;
    
    for (const [facultadNombre, carreras] of Object.entries(CARRERAS_POR_FACULTAD)) {
      const facultad = await prisma.facultad.findUnique({ where: { nombre: facultadNombre } });
      
      if (facultad) {
        for (const carreraData of carreras) {
          try {
            const carrera = await prisma.carrera.findFirst({
              where: {
                facultadId: facultad.id,
                codigo: carreraData.codigo
              }
            });
            
            if (carrera) {
              await prisma.carreraTotem.upsert({
                where: { codigoTotem: carreraData.codigo },
                update: {},
                create: {
                  codigoTotem: carreraData.codigo,
                  carreraId: carrera.id,
                  nombreTotem: carreraData.nombre,
                  esMapeada: true,
                  activo: true
                }
              });
              carrerasTótemCreadas++;
              console.log(`   ✅ Carrera TOTEM ${carreraData.codigo} → ${carreraData.nombre}`);
            }
          } catch (error) {
            console.log(`   ⚠️ Error con carrera TOTEM ${carreraData.codigo}:`, error.message);
          }
        }
      }
    }
    
    console.log(`✅ ${carrerasTótemCreadas} carreras TOTEM mapeadas\n`);

    // 5. Verificar estado final
    console.log('5️⃣ Verificando estado final...');
    const estadoFinal = {
      facultades: await prisma.facultad.count(),
      carreras: await prisma.carrera.count(),
      sectoresMapeados: await prisma.sectorFacultad.count(),
      carrerasTotemMapeadas: await prisma.carreraTotem.count({ where: { esMapeada: true } })
    };
    
    console.log('📊 ESTADO FINAL:');
    console.log(`   • Facultades: ${estadoFinal.facultades}`);
    console.log(`   • Carreras: ${estadoFinal.carreras}`);
    console.log(`   • Sectores mapeados: ${estadoFinal.sectoresMapeados}`);
    console.log(`   • Carreras TOTEM mapeadas: ${estadoFinal.carrerasTotemMapeadas}`);

    console.log('\n🎉 SISTEMA INICIALIZADO CORRECTAMENTE!');
    console.log('💡 Ahora puedes ejecutar: node ejecutar-sync.js');

  } catch (error) {
    console.error('💥 Error inicializando sistema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inicializarSistema(); 
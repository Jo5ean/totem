import prisma from './src/lib/db.js';

async function verificarDatos() {
  try {
    console.log('🔍 Verificando datos en la base de datos...\n');

    // 1. Verificar tabla examenes
    const totalExamenes = await prisma.examen.count();
    console.log(`📊 Total de exámenes: ${totalExamenes}`);

    // 2. Verificar tabla examenes_totem  
    const totalExamenestotem = await prisma.examenTotem.count();
    console.log(`🎯 Total de examenes_totem: ${totalExamenestotem}`);

    // 3. Verificar tabla carreras_totem
    const totalCarrerastotem = await prisma.carreraTotem.count();
    console.log(`🏫 Total de carreras_totem: ${totalCarrerastotem}`);

    // 4. Verificar tabla totem_data
    const totalTotemData = await prisma.totemData.count();
    console.log(`📋 Total de totem_data: ${totalTotemData}`);

    // 5. Si hay examenes_totem, mostrar algunos ejemplos
    if (totalExamenestotem > 0) {
      console.log('\n📋 Ejemplos de examenes_totem:');
      const ejemplos = await prisma.examenTotem.findMany({
        take: 5,
        select: {
          materiaTotem: true,
          areaTemaTotem: true,
          examen: {
            select: {
              nombreMateria: true
            }
          }
        }
      });
      
      ejemplos.forEach((ej, index) => {
        console.log(`${index + 1}. Materia: ${ej.materiaTotem}, AreaTema: ${ej.areaTemaTotem}, Nombre: ${ej.examen.nombreMateria}`);
      });
    }

    // 6. Si hay exámenes normales, mostrar algunos
    if (totalExamenes > 0) {
      console.log('\n📊 Ejemplos de exámenes:');
      const ejemplosExamenes = await prisma.examen.findMany({
        take: 5,
        select: {
          nombreMateria: true,
          fecha: true,
          carrera: {
            select: {
              nombre: true
            }
          }
        }
      });
      
      ejemplosExamenes.forEach((ex, index) => {
        const fecha = ex.fecha ? ex.fecha.toISOString().split('T')[0] : 'Sin fecha';
        console.log(`${index + 1}. ${ex.nombreMateria} - ${ex.carrera.nombre} (${fecha})`);
      });
    }

    // 7. Estado del último sync
    const ultimoTotemData = await prisma.totemData.findFirst({
      orderBy: { timestamp: 'desc' },
      select: {
        timestamp: true,
        processed: true,
        sheetName: true
      }
    });

    if (ultimoTotemData) {
      console.log('\n📅 Último sync de datos:');
      console.log(`• Fecha: ${ultimoTotemData.timestamp}`);
      console.log(`• Procesado: ${ultimoTotemData.processed ? 'Sí' : 'No'}`);
      console.log(`• Sheet: ${ultimoTotemData.sheetName}`);
    }

    console.log('\n🔧 DIAGNÓSTICO:');
    if (totalExamenestotem === 0 && totalExamenes > 0) {
      console.log('⚠️  Tienes exámenes pero no están vinculados con datos del tótem');
      console.log('💡 Necesitas ejecutar el sync de Sheet.best para crear la relación');
    } else if (totalExamenes === 0) {
      console.log('⚠️  No hay exámenes en la base de datos');
      console.log('💡 Necesitas ejecutar: POST /api/v1/totem/simple-sync');
    } else {
      console.log('✅ Datos parecen estar correctos');
    }

  } catch (error) {
    console.error('💥 Error al verificar datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarDatos(); 
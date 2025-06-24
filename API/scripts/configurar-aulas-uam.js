import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function configurarAulasUAM() {
  console.log('🏫 Configurando aulas UAM según especificación...');

  const aulasUAM = [
    {
      nombre: 'Aula 4',
      capacidad: 72,
      ubicacion: 'Edificio Principal UAM 03',
      disponible: true
    },
    {
      nombre: 'Aula 8', 
      capacidad: 71,
      ubicacion: 'Edificio Principal UAM 03',
      disponible: true
    },
    {
      nombre: 'Aula 12',
      capacidad: 69,
      ubicacion: 'Edificio Principal UAM 03', 
      disponible: true
    },
    {
      nombre: 'Laboratorio Informático',
      capacidad: 34,
      ubicacion: 'Laboratorio UAM 03',
      disponible: true
    }
  ];

  try {
    // Verificar si las aulas ya existen
    const aulasExistentes = await prisma.aula.findMany({
      where: {
        nombre: {
          in: aulasUAM.map(a => a.nombre)
        }
      }
    });

    if (aulasExistentes.length > 0) {
      console.log(`⚠️  Ya existen ${aulasExistentes.length} aulas configuradas:`);
      aulasExistentes.forEach(aula => {
        console.log(`   - ${aula.nombre} (${aula.capacidad} personas)`);
      });
      
      // Actualizar aulas existentes
      for (const aulaData of aulasUAM) {
        const aulaExistente = aulasExistentes.find(a => a.nombre === aulaData.nombre);
        if (aulaExistente) {
          await prisma.aula.update({
            where: { id: aulaExistente.id },
            data: {
              capacidad: aulaData.capacidad,
              ubicacion: aulaData.ubicacion,
              disponible: aulaData.disponible
            }
          });
          console.log(`✅ Actualizada: ${aulaData.nombre}`);
        } else {
          // Crear aula nueva
          await prisma.aula.create({
            data: aulaData
          });
          console.log(`➕ Creada: ${aulaData.nombre}`);
        }
      }
    } else {
      // Crear todas las aulas
      const resultados = await prisma.aula.createMany({
        data: aulasUAM,
        skipDuplicates: true
      });

      console.log(`✅ ${resultados.count} aulas creadas exitosamente:`);
      aulasUAM.forEach(aula => {
        console.log(`   - ${aula.nombre}: ${aula.capacidad} personas (${aula.ubicacion})`);
      });
    }

    // Mostrar resumen final
    const totalAulas = await prisma.aula.count();
    const capacidadTotal = await prisma.aula.aggregate({
      _sum: {
        capacidad: true
      }
    });

    console.log('\n📊 RESUMEN DE CONFIGURACIÓN:');
    console.log(`   🏫 Total de aulas: ${totalAulas}`);
    console.log(`   👥 Capacidad total: ${capacidadTotal._sum.capacidad} personas`);
    console.log(`   🎯 Aulas UAM 03 configuradas correctamente`);
    
    // Mostrar todas las aulas
    const todasLasAulas = await prisma.aula.findMany({
      orderBy: { capacidad: 'desc' }
    });
    
    console.log('\n🏛️  AULAS DISPONIBLES:');
    todasLasAulas.forEach((aula, index) => {
      const estado = aula.disponible ? '🟢' : '🔴';
      console.log(`   ${index + 1}. ${estado} ${aula.nombre} - ${aula.capacidad} personas (${aula.ubicacion})`);
    });

  } catch (error) {
    console.error('❌ Error configurando aulas:', error);
    throw error;
  }
}

async function main() {
  try {
    await configurarAulasUAM();
    console.log('\n🎉 Configuración de aulas UAM completada exitosamente!');
  } catch (error) {
    console.error('💥 Error en la configuración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { configurarAulasUAM }; 
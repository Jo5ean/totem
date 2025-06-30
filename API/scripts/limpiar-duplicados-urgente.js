#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limpiarDuplicados() {
  console.log('🧹 INICIANDO LIMPIEZA DE DUPLICADOS URGENTE');
  console.log('=============================================');

  try {
    // 1. Contar exámenes actuales
    const totalAntes = await prisma.examen.count();
    console.log(`📊 Total de exámenes antes: ${totalAntes}`);

    // 2. Encontrar duplicados usando la misma lógica que checkExamenDuplicate
    console.log('\n🔍 Buscando duplicados...');
    
    const examenes = await prisma.examen.findMany({
      include: {
        totemData: true,
        carrera: true
      },
      orderBy: { id: 'asc' }
    });

    const duplicados = [];
    const procesados = new Set();

    for (const examen of examenes) {
      if (!examen.totemData) continue;
      
      const key = `${examen.totemData.sectorTotem}_${examen.totemData.carreraTotem}_${examen.totemData.materiaTotem}_${examen.totemData.areaTemaTotem}_${examen.totemData.modoTotem}_${examen.totemData.docenteTotem}_${examen.totemData.urlTotem}_${examen.fecha?.toDateString()}_${examen.hora?.getHours()}_${examen.tipoExamen}_${examen.carreraId}`;
      
      if (procesados.has(key)) {
        duplicados.push(examen.id);
        console.log(`🔴 Duplicado encontrado: ID ${examen.id} - ${examen.totemData.sectorTotem}/${examen.totemData.carreraTotem}/${examen.totemData.materiaTotem}`);
      } else {
        procesados.add(key);
      }
    }

    console.log(`\n📋 Duplicados encontrados: ${duplicados.length}`);

    if (duplicados.length === 0) {
      console.log('✅ No se encontraron duplicados. La base de datos está limpia.');
      return;
    }

    // 3. Eliminar duplicados (mantener el más antiguo)
    console.log('\n🗑️ Eliminando duplicados...');
    
    // Primero eliminar registros de ExamenTotem asociados
    await prisma.examenTotem.deleteMany({
      where: {
        examenId: { in: duplicados }
      }
    });

    // Luego eliminar los exámenes duplicados
    const result = await prisma.examen.deleteMany({
      where: {
        id: { in: duplicados }
      }
    });

    // 4. Contar exámenes después
    const totalDespues = await prisma.examen.count();
    
    console.log('\n✅ LIMPIEZA COMPLETADA');
    console.log('=====================');
    console.log(`📊 Exámenes antes: ${totalAntes}`);
    console.log(`📊 Exámenes después: ${totalDespues}`);
    console.log(`🗑️ Duplicados eliminados: ${result.count}`);
    console.log(`💾 Espacio liberado: ${((result.count / totalAntes) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  limpiarDuplicados()
    .then(() => {
      console.log('\n🎉 ¡Limpieza completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

export default limpiarDuplicados; 
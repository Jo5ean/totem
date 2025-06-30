#!/usr/bin/env node

/**
 * 🗑️ LIMPIEZA DIRECTA SQL + SINCRONIZACIÓN
 * =======================================
 * Script que ejecuta SQL directo para limpiar y luego sincroniza
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limpiezaDirecta() {
  console.log('🗑️ LIMPIEZA DIRECTA SQL');
  console.log('=====================');

  try {
    // 1. ELIMINACIÓN DIRECTA CON SQL RAW
    console.log('\n🔥 PASO 1: Eliminación directa...');
    
    // Eliminar todas las tablas relacionadas con exámenes
    await prisma.$executeRaw`DELETE FROM ExamenTotem`;
    console.log('   ✅ ExamenTotem eliminados');
    
    await prisma.$executeRaw`DELETE FROM Examen`;
    console.log('   ✅ Examen eliminados');
    
    // Resetear auto-increment si es necesario
    await prisma.$executeRaw`ALTER TABLE Examen AUTO_INCREMENT = 1`;
    await prisma.$executeRaw`ALTER TABLE ExamenTotem AUTO_INCREMENT = 1`;
    console.log('   ✅ Auto-increment reseteado');

    // 2. VERIFICAR LIMPIEZA
    console.log('\n📊 PASO 2: Verificando limpieza...');
    
    const countExamenes = await prisma.$queryRaw`SELECT COUNT(*) as total FROM Examen`;
    const countTotem = await prisma.$queryRaw`SELECT COUNT(*) as total FROM ExamenTotem`;
    
    const totalExamenes = Number(countExamenes[0].total);
    const totalTotem = Number(countTotem[0].total);
    
    console.log(`   📊 Examen: ${totalExamenes}`);
    console.log(`   📊 ExamenTotem: ${totalTotem}`);
    
    if (totalExamenes > 0 || totalTotem > 0) {
      throw new Error(`❌ Error: Aún quedan registros (${totalExamenes} exámenes, ${totalTotem} totem)`);
    }

    // 3. SINCRONIZACIÓN VIA API
    console.log('\n📥 PASO 3: Sincronización desde Sheet.best...');
    
    const syncResponse = await fetch('http://localhost:3000/api/v1/totem/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!syncResponse.ok) {
      throw new Error(`Error en sincronización: ${syncResponse.status}`);
    }
    
    const syncData = await syncResponse.json();
    console.log('   ✅ Sincronización exitosa');
    
    if (syncData.data?.examensCreated) {
      console.log(`   📊 Exámenes creados: ${syncData.data.examensCreated}`);
      console.log(`   📊 Filas procesadas: ${syncData.data.rowsProcessed || 'N/A'}`);
    }

    // 4. VERIFICACIÓN FINAL
    console.log('\n🔍 PASO 4: Verificación final...');
    
    const finalCountQuery = await prisma.$queryRaw`SELECT COUNT(*) as total FROM Examen`;
    const finalCount = Number(finalCountQuery[0].total);
    
    console.log(`   📊 Exámenes finales: ${finalCount}`);
    
    if (finalCount >= 1200 && finalCount <= 1400) {
      console.log('   ✅ PERFECTO: Cantidad correcta (~1300 esperados)');
    } else if (finalCount < 1200) {
      console.log('   ⚠️ POCOS: Menos exámenes de los esperados');
    } else {
      console.log('   ❌ MUCHOS: Posibles duplicados aún');
    }

    console.log('\n🎉 ¡LIMPIEZA Y SINCRONIZACIÓN COMPLETA!');
    console.log(`📊 RESULTADO: ${finalCount} exámenes únicos`);

  } catch (error) {
    console.error('\n💥 Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  limpiezaDirecta()
    .then(() => {
      console.log('\n🚀 ¡ÉXITO TOTAL!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

export default limpiezaDirecta; 
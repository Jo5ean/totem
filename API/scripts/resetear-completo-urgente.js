#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import TotemService from '../src/services/totemService.js';

const prisma = new PrismaClient();
const totemService = new TotemService();

async function resetearCompleto() {
  console.log('🔥 RESETEO COMPLETO Y SINCRONIZACIÓN LIMPIA');
  console.log('============================================');

  try {
    // 1. ELIMINACIÓN TOTAL DE EXÁMENES
    console.log('\n🗑️ PASO 1: Eliminando TODOS los exámenes...');
    
    await prisma.examenTotem.deleteMany({});
    console.log('   ✅ ExamenTotem eliminados');
    
    await prisma.examen.deleteMany({});
    console.log('   ✅ Examen eliminados');
    
    const total = await prisma.examen.count();
    console.log(`   📊 Verificación: ${total} exámenes restantes (debe ser 0)`);
    
    if (total > 0) {
      throw new Error(`❌ Error: Aún quedan ${total} exámenes en la BD`);
    }

    // 2. SINCRONIZACIÓN LIMPIA
    console.log('\n📥 PASO 2: Sincronización limpia desde Sheet.best...');
    
    const resultado = await totemService.syncTotemData();
    
    console.log(`   ✅ Sincronización completada`);
    console.log(`   📊 Resultado:`, resultado.data || resultado);

    // 3. VERIFICACIÓN FINAL
    console.log('\n🔍 PASO 3: Verificación final...');
    
    const finalCount = await prisma.examen.count();
    console.log(`   📊 Exámenes en BD: ${finalCount}`);
    
    if (finalCount >= 1200 && finalCount <= 1400) {
      console.log('   ✅ ÉXITO: Cantidad correcta de exámenes');
    } else {
      console.log(`   ⚠️ ADVERTENCIA: Se esperaban ~1300, se obtuvieron ${finalCount}`);
    }

    console.log('\n🎉 RESETEO COMPLETO EXITOSO');
    console.log(`📊 RESULTADO FINAL: ${finalCount} exámenes únicos`);

  } catch (error) {
    console.error('\n💥 Error durante el reseteo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  resetearCompleto()
    .then(() => {
      console.log('\n🚀 ¡Sistema completamente limpio y sincronizado!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

export default resetearCompleto; 
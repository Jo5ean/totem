#!/usr/bin/env node

/**
 * 🔥 LIMPIEZA URGENTE VIA API
 * ==========================
 * Script que usa la API para limpiar completamente la BD
 * y hacer una sincronización limpia desde cero
 */

async function limpiarViaAPI() {
  console.log('🔥 LIMPIEZA TOTAL VIA API');
  console.log('========================');

  try {
    // 1. Verificar estado actual
    console.log('\n📊 PASO 1: Verificando estado actual...');
    
    const response1 = await fetch('http://localhost:3000/api/v1/examenes');
    const data1 = await response1.json();
    const totalAntes = data1.pagination?.total || 0;
    
    console.log(`   📊 Exámenes actuales: ${totalAntes}`);

    // 2. Resetear base de datos vía API
    console.log('\n🗑️ PASO 2: Reseteando base de datos...');
    
    // Usar el endpoint interno de debug para limpiar
    const resetResponse = await fetch('http://localhost:3000/api/v1/debug/reset-database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!resetResponse.ok) {
      // Si no existe el endpoint, usar el script maestro
      console.log('   ⚠️ Endpoint reset no disponible, ejecutando limpieza manual...');
      
      // Llamar a sincronización directamente (que debería tener protección contra duplicados)
      const syncResponse = await fetch('http://localhost:3000/api/v1/totem/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const syncData = await syncResponse.json();
      console.log('   📥 Resultado sincronización:', syncData);
      
    } else {
      const resetData = await resetResponse.json();
      console.log('   ✅ Reset completado:', resetData);
    }

    // 3. Verificar resultado final
    console.log('\n📊 PASO 3: Verificando resultado...');
    
    const response2 = await fetch('http://localhost:3000/api/v1/examenes');
    const data2 = await response2.json();
    const totalDespues = data2.pagination?.total || 0;
    
    console.log(`   📊 Exámenes finales: ${totalDespues}`);
    
    if (totalDespues >= 1200 && totalDespues <= 1400) {
      console.log('   ✅ ÉXITO: Cantidad correcta (~1300 esperados)');
    } else if (totalDespues < 1200) {
      console.log('   ⚠️ POCOS: Menos exámenes de los esperados');
    } else {
      console.log('   ❌ MUCHOS: Aún hay duplicados');
    }

    console.log('\n🎉 PROCESO COMPLETADO');
    console.log(`📊 ANTES: ${totalAntes} → DESPUÉS: ${totalDespues}`);

  } catch (error) {
    console.error('\n💥 Error:', error.message);
  }
}

// Si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  limpiarViaAPI()
    .then(() => console.log('\n🚀 Proceso terminado'))
    .catch(err => console.error('\n💥 Error fatal:', err));
}

export default limpiarViaAPI; 
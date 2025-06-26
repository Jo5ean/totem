import prisma from '../src/lib/db.js';

async function pruebaFinalDuplicados() {
  try {
    console.log('🧪 PRUEBA FINAL: ELIMINACIÓN + 2 SINCRONIZACIONES\n');
    
    // PASO 1: ELIMINAR TODOS LOS EXAMENES
    console.log('🗑️  PASO 1: Eliminando todos los exámenes y datos TOTEM...');
    
    // Eliminar en orden correcto (FK constraints)
    await prisma.examenTotem.deleteMany({});
    await prisma.examen.deleteMany({});
    await prisma.totemData.deleteMany({});
    
    console.log('   ✅ Todos los exámenes eliminados');
    
    // Verificar que está vacío
    const examenesDespuesEliminacion = await prisma.examen.count();
    const examenesTotemDespuesEliminacion = await prisma.examenTotem.count();
    console.log(`   📊 Exámenes: ${examenesDespuesEliminacion}, ExamenesTotem: ${examenesTotemDespuesEliminacion}`);
    
    if (examenesDespuesEliminacion > 0 || examenesTotemDespuesEliminacion > 0) {
      throw new Error('ERROR: No se eliminaron todos los datos');
    }
    
    // PASO 2: PRIMERA SINCRONIZACIÓN
    console.log('\n🔄 PASO 2: Primera sincronización...');
    
    const response1 = await fetch('http://localhost:3000/api/v1/totem/sync', {
      method: 'POST'
    });
    const result1 = await response1.json();
    
    console.log(`   📊 Primera sync: ${result1.data?.examensCreated || 0} exámenes creados`);
    
    const examenesDespuesPrimera = await prisma.examen.count();
    const examenesTotemDespuesPrimera = await prisma.examenTotem.count();
    console.log(`   📊 Estado: ${examenesDespuesPrimera} exámenes, ${examenesTotemDespuesPrimera} ExamenesTotem`);
    
    // PASO 3: SEGUNDA SINCRONIZACIÓN (LA CRÍTICA)
    console.log('\n🔄 PASO 3: Segunda sincronización (prueba de duplicados)...');
    
    const response2 = await fetch('http://localhost:3000/api/v1/totem/sync', {
      method: 'POST'
    });
    const result2 = await response2.json();
    
    console.log(`   📊 Segunda sync: ${result2.data?.examensCreated || 0} exámenes creados`);
    
    const examenesDespuesSegunda = await prisma.examen.count();
    const examenesTotemDespuesSegunda = await prisma.examenTotem.count();
    console.log(`   📊 Estado: ${examenesDespuesSegunda} exámenes, ${examenesTotemDespuesSegunda} ExamenesTotem`);
    
    // PASO 4: ANÁLISIS DE RESULTADOS
    console.log('\n📋 PASO 4: Análisis de resultados...');
    
    const diferencia = examenesDespuesSegunda - examenesDespuesPrimera;
    console.log(`   📊 Diferencia entre sincronizaciones: ${diferencia} exámenes`);
    
    // Verificar duplicados
    const duplicados = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM (
        SELECT 
          et.sector_totem, 
          et.carrera_totem, 
          et.materia_totem,
          DATE(e.fecha) as fecha_examen,
          COUNT(*) as cantidad
        FROM examenes_totem et
        JOIN examenes e ON et.examen_id = e.id
        GROUP BY et.sector_totem, et.carrera_totem, et.materia_totem, DATE(e.fecha)
        HAVING COUNT(*) > 1
      ) duplicados
    `;
    
    const totalDuplicados = duplicados[0].total;
    console.log(`   🔍 Grupos duplicados encontrados: ${totalDuplicados}`);
    
    // PASO 5: CONCLUSIÓN
    console.log('\n🎯 PASO 5: CONCLUSIÓN FINAL...');
    
    if (diferencia === 0 && totalDuplicados === 0) {
      console.log('✅ ¡ÉXITO TOTAL! Sistema de prevención de duplicados funcionando PERFECTAMENTE');
      console.log('✅ Segunda sincronización no creó nuevos exámenes');
      console.log('✅ No hay duplicados en el sistema');
      console.log('✅ LISTO para sincronización automática diaria');
    } else if (diferencia > 0) {
      console.log('❌ PROBLEMA: Se crearon nuevos exámenes en la segunda sincronización');
      console.log('❌ El sistema de prevención de duplicados NO está funcionando');
      console.log(`❌ Se crearon ${diferencia} exámenes adicionales`);
    } else if (totalDuplicados > 0) {
      console.log('❌ PROBLEMA: Se detectaron duplicados en el sistema');
      console.log(`❌ ${totalDuplicados} grupos de duplicados encontrados`);
    }
    
    console.log(`\n📊 RESUMEN FINAL:`);
    console.log(`   Primera sincronización: ${examenesDespuesPrimera} exámenes`);
    console.log(`   Segunda sincronización: ${examenesDespuesSegunda} exámenes`);
    console.log(`   Diferencia: ${diferencia} exámenes`);
    console.log(`   Duplicados: ${totalDuplicados} grupos`);
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

pruebaFinalDuplicados(); 
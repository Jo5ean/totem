import prisma from '../src/lib/db.js';

async function verificarNoDuplicados() {
  try {
    console.log('🔍 VERIFICACIÓN POST-SINCRONIZACIÓN\n');
    
    // 1. Contar exámenes totales
    const totalExamenes = await prisma.examen.count();
    console.log(`📊 Total exámenes actuales: ${totalExamenes}`);
    
    // 2. Contar ExamenesTotem
    const totalExamenesTotem = await prisma.examenTotem.count();
    console.log(`📋 Total ExamenesTotem: ${totalExamenesTotem}`);
    
    // 3. Verificar si hay duplicados usando la clave única
    const duplicados = await prisma.$queryRaw`
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
      LIMIT 5
    `;
    
    console.log(`\n🔍 Duplicados encontrados: ${duplicados.length}`);
    
    if (duplicados.length > 0) {
      console.log('❌ PROBLEMA: Se encontraron duplicados:');
      duplicados.forEach(dup => {
        console.log(`   ${dup.sector_totem}/${dup.carrera_totem}/${dup.materia_totem} → ${dup.cantidad} veces`);
      });
    } else {
      console.log('✅ ÉXITO: No hay duplicados detectados');
    }
    
    // 4. Verificar fechas de creación recientes
    const examenesRecientes = await prisma.examen.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Últimos 10 minutos
        }
      }
    });
    
    console.log(`\n⏰ Exámenes creados en últimos 10 minutos: ${examenesRecientes}`);
    
    if (examenesRecientes === 0) {
      console.log('✅ PERFECTO: No se crearon nuevos exámenes en la segunda sincronización');
    } else {
      console.log('⚠️ ATENCIÓN: Se crearon exámenes nuevos recientemente');
    }
    
    console.log('\n🎯 CONCLUSIÓN:');
    if (duplicados.length === 0 && examenesRecientes === 0) {
      console.log('✅ Sistema de prevención de duplicados funcionando PERFECTAMENTE');
      console.log('✅ Listo para sincronización diaria automática');
    } else {
      console.log('❌ Revisar sistema de prevención de duplicados');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarNoDuplicados(); 
import prisma from '../src/lib/db.js';

async function limpiarSegundaSincronizacion() {
  try {
    console.log('🧹 LIMPIANDO DUPLICADOS DE SEGUNDA SINCRONIZACIÓN\n');
    
    // 1. Estado inicial
    const totalInicial = await prisma.examen.count();
    console.log(`📊 Total exámenes inicial: ${totalInicial}`);
    
    // 2. Identificar duplicados por clave única y mantener solo el más antiguo
    console.log('\\n🔍 Identificando duplicados...');
    
    const duplicados = await prisma.$queryRaw`
      SELECT 
        et.sector_totem, 
        et.carrera_totem, 
        et.materia_totem,
        DATE(e.fecha) as fecha_examen,
        COUNT(*) as cantidad,
        GROUP_CONCAT(e.id ORDER BY e.created_at ASC) as examenes_ids
      FROM examenes_totem et
      JOIN examenes e ON et.examen_id = e.id
      GROUP BY et.sector_totem, et.carrera_totem, et.materia_totem, DATE(e.fecha)
      HAVING COUNT(*) > 1
    `;
    
    console.log(`   Encontrados ${duplicados.length} grupos duplicados`);
    
    let totalEliminados = 0;
    
    // 3. Para cada grupo duplicado, eliminar todos excepto el más antiguo
    for (const grupo of duplicados) {
      const idsArray = grupo.examenes_ids.split(',').map(id => parseInt(id));
      const [mantener, ...eliminar] = idsArray; // El primero es el más antiguo
      
      console.log(`   Grupo ${grupo.sector_totem}/${grupo.carrera_totem}/${grupo.materia_totem}: mantener ${mantener}, eliminar [${eliminar.join(', ')}]`);
      
      if (eliminar.length > 0) {
        // Eliminar ExamenesTotem primero (FK constraint)
        await prisma.examenTotem.deleteMany({
          where: { examenId: { in: eliminar } }
        });
        
        // Luego eliminar Examenes
        await prisma.examen.deleteMany({
          where: { id: { in: eliminar } }
        });
        
        totalEliminados += eliminar.length;
      }
    }
    
    // 4. Estado final
    const totalFinal = await prisma.examen.count();
    console.log(`\\n📊 RESULTADO:`);
    console.log(`   Inicial: ${totalInicial} exámenes`);
    console.log(`   Eliminados: ${totalEliminados} exámenes`);
    console.log(`   Final: ${totalFinal} exámenes`);
    console.log(`   ✅ Reducción: ${totalInicial - totalFinal} exámenes`);
    
    // 5. Verificar que no quedan duplicados
    const duplicadosRestantes = await prisma.$queryRaw`
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
    
    const totalDuplicadosRestantes = duplicadosRestantes[0].total;
    
    if (totalDuplicadosRestantes === 0) {
      console.log('\\n✅ ÉXITO: No quedan duplicados en el sistema');
      console.log('✅ Listo para probar prevención de duplicados corregida');
    } else {
      console.log(`\\n⚠️ ATENCIÓN: Aún quedan ${totalDuplicadosRestantes} grupos duplicados`);
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

limpiarSegundaSincronizacion(); 
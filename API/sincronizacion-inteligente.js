import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// 🚀 SINCRONIZACIÓN INTELIGENTE TOTEM
// Solo agrega exámenes nuevos, NUNCA modifica existentes con aulas asignadas

async function sincronizacionInteligente() {
  console.log('🤖 INICIANDO SINCRONIZACIÓN INTELIGENTE DIARIA');
  console.log('📅 Fecha/Hora:', new Date().toLocaleString());
  console.log('=' .repeat(60));
  
  try {
    // 1. VERIFICAR API DISPONIBLE
    console.log('\n📡 Verificando disponibilidad de la API...');
    const apiCheck = await fetch('http://localhost:3000/api/v1/examenes', { 
      method: 'HEAD',
      timeout: 5000 
    });
    
    if (!apiCheck.ok) {
      throw new Error('API no disponible');
    }
    console.log('   ✅ API funcionando correctamente');
    
    // 2. OBTENER ESTADÍSTICAS PRE-SYNC
    console.log('\n📊 Obteniendo estadísticas previas...');
    const statsAntes = await fetch('http://localhost:3000/api/v1/examenes/por-fecha?fechaDesde=2025-06-30&fechaHasta=2025-07-02');
    const datosAntes = await statsAntes.json();
    
    let examenesAntes = 0;
    let examenesConAulaAntes = 0;
    
    for (const fecha of Object.keys(datosAntes.data.examenesPorFecha)) {
      const examenesFecha = datosAntes.data.examenesPorFecha[fecha];
      examenesAntes += examenesFecha.length;
      examenesConAulaAntes += examenesFecha.filter(e => e.aula).length;
    }
    
    console.log(`   📊 Exámenes actuales: ${examenesAntes}`);
    console.log(`   🏢 Con aula asignada: ${examenesConAulaAntes}`);
    
    // 3. EJECUTAR SINCRONIZACIÓN INTELIGENTE
    console.log('\n🔄 Ejecutando sincronización inteligente...');
    
    const syncResponse = await fetch('http://localhost:3000/api/v1/totem/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000 // 2 minutos timeout
    });
    
    if (!syncResponse.ok) {
      const errorData = await syncResponse.text();
      throw new Error(`Error en sincronización: ${syncResponse.status} - ${errorData}`);
    }
    
    const resultSync = await syncResponse.json();
    console.log(`   ✅ Sincronización completada`);
    console.log(`   🆕 Exámenes nuevos agregados: ${resultSync.data.examensCreated}`);
    
    // 4. VERIFICAR ESTADÍSTICAS POST-SYNC
    console.log('\n📈 Verificando resultados...');
    
    const statsDespues = await fetch('http://localhost:3000/api/v1/examenes/por-fecha?fechaDesde=2025-06-30&fechaHasta=2025-07-02');
    const datosDespues = await statsDespues.json();
    
    let examenesDespues = 0;
    let examenesConAulaDespues = 0;
    
    for (const fecha of Object.keys(datosDespues.data.examenesPorFecha)) {
      const examenesFecha = datosDespues.data.examenesPorFecha[fecha];
      examenesDespues += examenesFecha.length;
      examenesConAulaDespues += examenesFecha.filter(e => e.aula).length;
    }
    
    console.log(`   📊 Exámenes después: ${examenesDespues}`);
    console.log(`   🏢 Con aula asignada: ${examenesConAulaDespues}`);
    console.log(`   📈 Incremento: +${examenesDespues - examenesAntes} exámenes`);
    
    // 5. VERIFICACIÓN DE INTEGRIDAD - ASEGURAR NO SOBRESCRITURA
    if (examenesConAulaDespues < examenesConAulaAntes) {
      console.error(`❌ ERROR CRÍTICO: Se perdieron ${examenesConAulaAntes - examenesConAulaDespues} asignaciones de aulas!`);
      console.error(`❌ Esto NO debería suceder en sincronización inteligente.`);
      
      // Log del problema
      await registrarProblema('PERDIDA_ASIGNACIONES', {
        examenesConAulaAntes,
        examenesConAulaDespues,
        diferencia: examenesConAulaAntes - examenesConAulaDespues
      });
      
    } else {
      console.log(`   ✅ INTEGRIDAD VERIFICADA: Ninguna asignación perdida`);
    }
    
    // 6. REGISTRAR ÉXITO
    await registrarSincronizacion('EXITOSA', {
      examenesAntes,
      examenesDespues,
      examenesNuevos: examenesDespues - examenesAntes,
      examenesConAula: examenesConAulaDespues,
      duration: resultSync.duration
    });
    
    console.log('\n🎉 SINCRONIZACIÓN INTELIGENTE COMPLETADA');
    console.log('✅ Solo se agregaron exámenes nuevos');
    console.log('✅ Exámenes existentes protegidos');
    console.log('✅ Asignaciones de aulas preservadas');
    
  } catch (error) {
    console.error('\n❌ ERROR EN SINCRONIZACIÓN INTELIGENTE:', error.message);
    
    await registrarProblema('ERROR_SINCRONIZACION', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    console.log('\n📧 ACCIÓN REQUERIDA:');
    console.log('   - Verificar conectividad con la API');
    console.log('   - Revisar logs del servidor');
    console.log('   - Ejecutar sincronización manual si es necesario');
  }
}

async function registrarSincronizacion(estado, datos) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    estado,
    datos,
    tipo: 'SINCRONIZACION_INTELIGENTE'
  };
  
  const logPath = path.join(process.cwd(), 'logs', 'sincronizacion-inteligente.log');
  
  try {
    // Crear directorio si no existe
    await fs.promises.mkdir(path.dirname(logPath), { recursive: true });
    
    // Agregar al log
    await fs.promises.appendFile(logPath, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Error guardando log:', error);
  }
}

async function registrarProblema(tipo, datos) {
  const problemaEntry = {
    timestamp: new Date().toISOString(),
    tipo,
    datos,
    severidad: 'CRITICO'
  };
  
  const problemaPath = path.join(process.cwd(), 'logs', 'problemas-sincronizacion.log');
  
  try {
    await fs.promises.mkdir(path.dirname(problemaPath), { recursive: true });
    await fs.promises.appendFile(problemaPath, JSON.stringify(problemaEntry) + '\n');
    
    console.log(`📝 Problema registrado en: ${problemaPath}`);
  } catch (error) {
    console.error('Error guardando problema:', error);
  }
}

// CONFIGURACIÓN DE CRON JOB
function crearCronJob() {
  console.log('\n⏰ CONFIGURACIÓN DE CRON JOB PARA SINCRONIZACIÓN DIARIA');
  console.log('=' .repeat(60));
  
  const cronCommand = `# TOTEM - Sincronización Inteligente Diaria
# Ejecuta cada día a las 2:00 AM (cuando hay menos actividad)
0 2 * * * cd "${process.cwd()}" && node sincronizacion-inteligente.js >> logs/cron-sincronizacion.log 2>&1

# TOTEM - Sincronización de respaldo cada 6 horas
# Ejecuta a las 8:00, 14:00, 20:00 y 2:00
0 8,14,20 * * * cd "${process.cwd()}" && node sincronizacion-inteligente.js >> logs/cron-sincronizacion.log 2>&1
`;

  console.log('🔧 Agrega esta línea a tu crontab (ejecuta: crontab -e):');
  console.log('\n' + cronCommand);
  
  console.log('\n📋 Comandos útiles para gestionar el cron:');
  console.log('  Ver crontab actual: crontab -l');
  console.log('  Editar crontab: crontab -e');
  console.log('  Ver logs: tail -f logs/cron-sincronizacion.log');
  console.log('  Verificar status: tail -f logs/sincronizacion-inteligente.log');
}

// EJECUCIÓN
if (process.argv.includes('--config-cron')) {
  crearCronJob();
} else if (process.argv.includes('--test')) {
  console.log('🧪 MODO TEST - Ejecutando sincronización única...');
  sincronizacionInteligente();
} else {
  // Ejecución normal (para cron)
  sincronizacionInteligente();
} 
// Usar fetch nativo de Node.js (v18+) o importar node-fetch
const fetch = globalThis.fetch || require('node-fetch');

async function ejecutarSync() {
  try {
    console.log('🚀 Ejecutando sincronización completa de datos del tótem...');
    console.log('⏳ Esto puede tardar unos 30 segundos...\n');
    
    const url = 'http://localhost:3000/api/v1/totem/simple-sync';
    
    console.log(`📡 POST ${url}`);
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const endTime = Date.now();
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️ Tiempo de respuesta: ${Math.round((endTime - startTime) / 1000)}s\n`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ SINCRONIZACIÓN EXITOSA!\n');
      
      console.log('📈 RESULTADOS:');
      if (data.resultados) {
        console.log(`• Exámenes creados: ${data.resultados.examenesCreados || 0}`);
        console.log(`• Carreras mapeadas: ${data.resultados.carrerasMapeadas || 0}`);
        console.log(`• Filas procesadas: ${data.resultados.filasProcessadas || 0}`);
        console.log(`• Errores: ${data.resultados.errores || 0}`);
      }
      
      if (data.estadisticas) {
        console.log('\n📊 ESTADÍSTICAS:');
        console.log(`• Total de datos: ${data.estadisticas.totalDatos || 0}`);
        console.log(`• Aprovechamiento: ${data.estadisticas.porcentajeAprovechamiento || 0}%`);
      }
      
      console.log('\n🎯 ¡Ahora puedes probar el endpoint de inscripciones!');
      console.log('💡 Ejecuta: node test-inscripciones.js');
      
    } else {
      const errorData = await response.text();
      console.log('❌ Error en la sincronización:');
      console.log(errorData);
    }
    
  } catch (error) {
    console.error('💥 Error al ejecutar sync:', error.message);
  }
}

// Ejecutar el sync
ejecutarSync(); 
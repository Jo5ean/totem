// Usar fetch nativo de Node.js (v18+) o importar node-fetch
const fetch = globalThis.fetch || require('node-fetch');

async function testInscripciones() {
  try {
    console.log('🔍 Probando endpoint de inscripciones por examen...');
    console.log('⏳ Esta consulta puede tardar varios segundos...\n');
    
    const url = 'http://localhost:3000/api/v1/examenes/inscripciones';
    
    console.log(`📡 Consultando: ${url}`);
    
    const startTime = Date.now();
    const response = await fetch(url);
    const endTime = Date.now();
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms\n`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ Respuesta exitosa:');
      console.log('\n📈 ESTADÍSTICAS:');
      console.log(`• Total de exámenes: ${data.data.estadisticas.totalExamenes}`);
      console.log(`• Con inscriptos: ${data.data.estadisticas.examenesConInscriptos}`);
      console.log(`• Sin inscriptos: ${data.data.estadisticas.examenesSinInscriptos}`);
      console.log(`• Con errores: ${data.data.estadisticas.examenesConError}`);
      console.log(`• Total inscriptos: ${data.data.estadisticas.totalInscriptos}`);
      console.log(`• Éxito de consultas: ${data.data.estadisticas.porcentajeExito}%`);
      
      console.log('\n🎯 TOP 10 EXÁMENES CON MÁS INSCRIPTOS:');
      const top10 = data.data.inscripciones.slice(0, 10);
      top10.forEach((examen, index) => {
        console.log(`${index + 1}. ${examen.materia.nombre} (${examen.materia.codigo}) - ${examen.inscriptos} inscriptos`);
      });
      
      if (process.env.SHOW_FULL_RESPONSE) {
        console.log('\n📋 RESPUESTA COMPLETA:');
        console.log(JSON.stringify(data, null, 2));
      }
      
    } else {
      const errorData = await response.text();
      console.log('❌ Error en la respuesta:');
      console.log(errorData);
    }
    
  } catch (error) {
    console.error('💥 Error al hacer la consulta:', error.message);
  }
}

// Ejecutar la prueba
console.log('🚀 Iniciando prueba de inscripciones...');
console.log('💡 Tip: Ejecuta con SHOW_FULL_RESPONSE=true para ver la respuesta completa\n');

testInscripciones(); 
// Usar fetch nativo de Node.js (v18+) o importar node-fetch
const fetch = globalThis.fetch || require('node-fetch');

async function ejecutarMapeos() {
  try {
    console.log('🎯 EJECUTANDO MAPEOS AUTOMÁTICOS NECESARIOS PARA EL SYNC\n');
    
    // 1. Mapear carreras automáticamente
    console.log('1️⃣ Mapeando carreras automáticamente...');
    const carrerasResponse = await fetch('http://localhost:3000/api/v1/totem/mapear-carreras-automatico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (carrerasResponse.ok) {
      const carrerasData = await carrerasResponse.json();
      console.log('✅ Mapeo de carreras exitoso');
      console.log(`   • Carreras mapeadas: ${carrerasData.resultados?.mapeosRealizados || 0}`);
      console.log(`   • No encontradas: ${carrerasData.resultados?.mapeosNoEncontrados?.length || 0}`);
    } else {
      console.log('❌ Error en mapeo de carreras:', await carrerasResponse.text());
    }
    
    // 2. Crear y mapear carreras nuevas (si es necesario)
    console.log('\n2️⃣ Creando carreras nuevas si es necesario...');
    const nuevasCarrerasResponse = await fetch('http://localhost:3000/api/v1/totem/crear-y-mapear-carreras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (nuevasCarrerasResponse.ok) {
      const nuevasData = await nuevasCarrerasResponse.json();
      console.log('✅ Creación de carreras nuevas exitosa');
      console.log(`   • Carreras creadas: ${nuevasData.resultados?.carrerasCreadas || 0}`);
      console.log(`   • Mapeos realizados: ${nuevasData.resultados?.mapeosRealizados || 0}`);
    } else {
      console.log('❌ Error creando carreras nuevas:', await nuevasCarrerasResponse.text());
    }
    
    // 3. Configurar mapeos de sectores (usando el endpoint si existe)
    console.log('\n3️⃣ Configurando mapeos de sectores...');
    const sectoresResponse = await fetch('http://localhost:3000/api/v1/totem/setup-mapeos', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (sectoresResponse.ok) {
      const sectoresData = await sectoresResponse.json();
      console.log('✅ Mapeo de sectores exitoso');
      console.log(`   • Sectores mapeados: ${sectoresData.resultados?.sectoresMapeados || 0}`);
    } else {
      console.log('⚠️ Endpoint de sectores no disponible o error:', sectoresResponse.status);
    }
    
    console.log('\n🎉 MAPEOS COMPLETADOS. Ahora puedes ejecutar el sync!');
    console.log('💡 Ejecuta: node ejecutar-sync.js');
    
  } catch (error) {
    console.error('💥 Error ejecutando mapeos:', error.message);
  }
}

// Ejecutar mapeos
ejecutarMapeos(); 
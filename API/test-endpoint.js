// Usar fetch nativo de Node.js (v18+) o importar node-fetch
const fetch = globalThis.fetch || require('node-fetch');

async function testEndpoint() {
  try {
    console.log('🔍 Probando endpoint de consulta de exámenes...');
    
    // Probar con el DNI del ejemplo
    const dni = '41238626';
    const url = `http://localhost:3000/api/v1/estudiantes/examenes/${dni}`;
    
    console.log(`📡 Consultando: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Respuesta exitosa:');
      console.log(JSON.stringify(data, null, 2));
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
testEndpoint(); 
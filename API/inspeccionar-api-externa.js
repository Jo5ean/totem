// Usar fetch nativo de Node.js (v18+) o importar node-fetch
const fetch = globalThis.fetch || require('node-fetch');

async function inspeccionarAPIExterna() {
  try {
    console.log('🔍 Inspeccionando estructura de la API externa...\n');
    
    // Fechas para la consulta
    const fechaDesde = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    
    const fechaHasta = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    
    console.log(`📅 Consultando desde ${fechaDesde} hasta ${fechaHasta}\n`);
    
    // Probar con materia 550 (Historia Constitucional Argentina)
    const materiaId = '550';
    const url = `https://sistemasweb-desa.ucasal.edu.ar/api/v1/acta/materia/${materiaId}?rendida=false&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
    
    console.log(`📡 Consultando: ${url}\n`);
    
    const response = await fetch(url);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log(`✅ Respuesta exitosa. Total de registros: ${Array.isArray(data) ? data.length : 'No es array'}\n`);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('📋 ESTRUCTURA DEL PRIMER REGISTRO:');
        console.log('=====================================');
        
        const primerRegistro = data[0];
        console.log('Campos disponibles:');
        
        Object.keys(primerRegistro).forEach((key, index) => {
          const valor = primerRegistro[key];
          const tipo = typeof valor;
          console.log(`${index + 1}. ${key}: ${JSON.stringify(valor)} (${tipo})`);
        });
        
        console.log('\n📋 PRIMEROS 3 REGISTROS COMPLETOS:');
        console.log('=====================================');
        
        data.slice(0, 3).forEach((registro, index) => {
          console.log(`\n--- Registro ${index + 1} ---`);
          console.log(JSON.stringify(registro, null, 2));
        });
        
        // Buscar campos que podrían ser DNI
        console.log('\n🔍 POSIBLES CAMPOS DE DNI:');
        console.log('=====================================');
        
        Object.keys(primerRegistro).forEach(key => {
          const valor = primerRegistro[key];
          if (typeof valor === 'string' || typeof valor === 'number') {
            const valorStr = String(valor);
            if (valorStr.match(/^\d{7,8}$/)) {
              console.log(`✅ ${key}: ${valor} (posible DNI)`);
            } else if (key.toLowerCase().includes('dni') || key.toLowerCase().includes('documento') || key.toLowerCase().includes('cedula')) {
              console.log(`🤔 ${key}: ${valor} (campo relacionado a DNI)`);
            }
          }
        });
        
      } else {
        console.log('❌ No hay datos en la respuesta o no es un array');
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ Error en la respuesta: ${errorText}`);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

inspeccionarAPIExterna(); 
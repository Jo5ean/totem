// Usar fetch nativo de Node.js (v18+) o importar node-fetch
const fetch = globalThis.fetch || require('node-fetch');

async function buscarDNIInscripto() {
  try {
    console.log('🔍 Buscando DNIs reales de estudiantes inscriptos...\n');
    
    // Exámenes que sabemos que tienen más inscriptos según nuestro endpoint
    const examenesConInscriptos = [
      { materia: '550', nombre: 'HIS. CONS. ARG.', inscriptos: 72 },
      { materia: '1351', nombre: 'DºPRIV GENERAL', inscriptos: 51 },
      { materia: '510', nombre: 'Dº POLITICO', inscriptos: 44 },
      { materia: '380', nombre: 'MET.Y TEC.DE LA I.II', inscriptos: 29 },
      { materia: '100', nombre: 'MET. DE LA INVEST.', inscriptos: 24 }
    ];
    
    // Fechas para la consulta (actual + un mes)
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
    
    // Consultar API externa para cada examen
    for (const examen of examenesConInscriptos.slice(0, 3)) { // Solo los primeros 3
      console.log(`🎯 Consultando: ${examen.nombre} (ID: ${examen.materia}) - ${examen.inscriptos} inscriptos`);
      
      try {
        const url = `https://sistemasweb-desa.ucasal.edu.ar/api/v1/acta/materia/${examen.materia}?rendida=false&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
        console.log(`📡 ${url}`);
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            console.log(`✅ Encontrados ${data.length} estudiantes inscriptos:`);
            
            // Mostrar primeros 5 DNIs
            const primerosEstudiantes = data.slice(0, 5);
            primerosEstudiantes.forEach((estudiante, index) => {
              console.log(`   ${index + 1}. DNI: ${estudiante.numeroDocumento} - ${estudiante.apellido}, ${estudiante.nombre}`);
            });
            
            // Probar nuestro endpoint con el primer DNI
            const primerDNI = data[0].numeroDocumento;
            console.log(`\n🎯 Probando nuestro endpoint con DNI: ${primerDNI}`);
            
            const testUrl = `http://localhost:3000/api/v1/estudiantes/examenes/${primerDNI}`;
            const testResponse = await fetch(testUrl);
            
            console.log(`📊 Resultado: ${testResponse.status} ${testResponse.statusText}`);
            
            if (testResponse.ok) {
              const testData = await testResponse.json();
              console.log('🎉 ¡ÉXITO! El endpoint encontró el match:');
              console.log(JSON.stringify(testData, null, 2));
            } else {
              const errorData = await testResponse.json();
              console.log('⚠️ No se encontró match en nuestro sistema:');
              console.log(JSON.stringify(errorData, null, 2));
            }
            
            // Retornar el primer DNI válido para más pruebas
            return {
              dni: primerDNI,
              estudiante: data[0],
              examen: examen
            };
            
          } else {
            console.log('❌ No hay estudiantes inscriptos en este período');
          }
        } else {
          console.log(`❌ Error ${response.status}: ${response.statusText}`);
        }
        
      } catch (error) {
        console.log(`💥 Error consultando ${examen.nombre}:`, error.message);
      }
      
      console.log(''); // Línea vacía
    }
    
    console.log('🔍 Si no encontramos matches, podría ser porque:');
    console.log('   • Los exámenes están en fechas diferentes');
    console.log('   • Los IDs de materia no coinciden exactamente');
    console.log('   • Hay diferencias en areaTema entre APIs');
    
  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

buscarDNIInscripto(); 
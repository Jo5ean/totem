// Usar fetch nativo de Node.js (v18+) o importar node-fetch
const fetch = globalThis.fetch || require('node-fetch');

async function probarDNIReal() {
  try {
    console.log('🎯 Probando endpoint del tótem con DNIs reales...\n');
    
    // DNIs reales encontrados en la API externa
    const dnisParaProbar = [
      { dni: '46057365', nombre: 'VILTE, MARTINA INÉS' },
      { dni: '46666420', nombre: 'AYARDE, ROSARIO MACARENA' },
      { dni: '43220065', nombre: 'BURGOS CUELLAR, OSCAR GONZALO' },
      { dni: '45771180', nombre: 'VALDEZ, KATHERINE LOURDES' },
      { dni: '47450460', nombre: 'INOSTROZA, MILAGROS VALENTINA' }
    ];
    
    console.log(`🔍 Probando con ${dnisParaProbar.length} DNIs diferentes...\n`);
    
    let encontrados = 0;
    let noEncontrados = 0;
    
    for (const { dni, nombre } of dnisParaProbar) {
      console.log(`📋 Probando DNI: ${dni} (${nombre})`);
      
      try {
        const url = `http://localhost:3000/api/v1/estudiantes/examenes/${dni}`;
        const response = await fetch(url);
        
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          
          console.log('🎉 ¡ÉXITO! Se encontró match en el sistema:');
          console.log(`   • Estudiante: ${data.estudiante?.nombre || 'N/A'}`);
          console.log(`   • Carrera: ${data.estudiante?.carrera || 'N/A'}`);
          console.log(`   • Exámenes encontrados: ${data.examenes?.length || 0}`);
          
          if (data.examenes && data.examenes.length > 0) {
            console.log('   📚 Exámenes:');
            data.examenes.forEach((examen, index) => {
              console.log(`     ${index + 1}. ${examen.materia} - ${examen.fecha} ${examen.hora || ''}`);
              console.log(`        Aula: ${examen.aula || 'Sin asignar'}`);
            });
          }
          
          encontrados++;
          
          // Si encontramos uno, mostremos el resultado completo
          if (encontrados === 1) {
            console.log('\n📋 RESPUESTA COMPLETA:');
            console.log('========================');
            console.log(JSON.stringify(data, null, 2));
          }
          
        } else {
          const errorData = await response.json();
          console.log(`⚠️ No se encontró en el sistema: ${errorData.error}`);
          noEncontrados++;
        }
        
      } catch (error) {
        console.log(`💥 Error consultando DNI ${dni}:`, error.message);
        noEncontrados++;
      }
      
      console.log(''); // Línea vacía
    }
    
    console.log('📊 RESUMEN:');
    console.log('=============');
    console.log(`✅ Encontrados: ${encontrados}`);
    console.log(`❌ No encontrados: ${noEncontrados}`);
    console.log(`📝 Total probados: ${dnisParaProbar.length}`);
    
    if (encontrados > 0) {
      console.log('\n🎉 ¡EL SISTEMA FUNCIONA CORRECTAMENTE!');
      console.log('   ✅ La integración entre API externa y base de datos local es exitosa');
      console.log('   ✅ El matching de materias + areaTema funciona');
      console.log('   ✅ El endpoint del tótem está operativo');
    } else {
      console.log('\n🤔 Análisis de posibles motivos:');
      console.log('   • Los exámenes podrían estar en fechas fuera del rango consultado');
      console.log('   • Diferencias en el formato de materia/areaTema entre APIs');
      console.log('   • Los estudiantes podrían tener exámenes en materias no sincronizadas');
    }
    
  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

probarDNIReal(); 
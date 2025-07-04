import fetch from 'node-fetch';

async function debugInscriptos() {
  try {
    console.log('🔍 DIAGNOSTICANDO PROBLEMA DE INSCRIPTOS...\n');

    // 1. Verificar estado de inscriptos en la BD mediante API
    console.log('1️⃣ VERIFICANDO ESTADO ACTUAL:');
    const response = await fetch('http://localhost:3000/api/v1/examenes/por-fecha?fechaDesde=2025-06-30&fechaHasta=2025-06-30');
    const data = await response.json();
    
    if (!data.success || !data.data.examenesPorFecha['2025-06-30']) {
      console.log('❌ No se pudieron obtener exámenes del 30/06');
      return;
    }

    const examenes = data.data.examenesPorFecha['2025-06-30'];
    console.log(`   📊 Exámenes del 30/06: ${examenes.length}`);
    
    // Verificar inscriptos en los primeros 3 exámenes
    console.log('\n2️⃣ ESTADOS DE INSCRIPTOS:');
    examenes.slice(0, 5).forEach((examen, i) => {
      console.log(`   ${i + 1}. ${examen.nombre}`);
      console.log(`      ID: ${examen.id}`);
      console.log(`      Inscriptos: ${examen.inscriptos}`);
      console.log(`      Estado: ${examen.estadoInscriptos}`);
      console.log(`      Última actualización: ${examen.ultimaActualizacion || 'nunca'}`);
      console.log('');
    });

    // 3. Verificar si el endpoint de inscriptos funciona para uno de ellos
    const primerExamen = examenes[0];
    console.log(`3️⃣ PROBANDO ENDPOINT DE INSCRIPTOS (Examen ${primerExamen.id}):`);
    
    try {
      const responseInscriptos = await fetch(`http://localhost:3000/api/v1/examenes/${primerExamen.id}/inscripciones`);
      const dataInscriptos = await responseInscriptos.json();
      
      console.log(`   ✅ Respuesta: ${dataInscriptos.success ? 'SUCCESS' : 'ERROR'}`);
      if (dataInscriptos.success && dataInscriptos.data) {
        console.log(`   📊 Inscriptos encontrados: ${dataInscriptos.data.cantidadInscriptos || 0}`);
        console.log(`   📋 Lista inscriptos: ${dataInscriptos.data.inscriptos?.length || 0} elementos`);
      } else {
        console.log(`   ❌ Error: ${dataInscriptos.error || 'Sin error específico'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error conectando: ${error.message}`);
    }

    // 4. Verificar stats generales
    console.log('\n4️⃣ ESTADÍSTICAS GENERALES:');
    const totalExamenes = examenes.length;
    const examenesConInscriptos = examenes.filter(e => e.inscriptos > 0).length;
    const examenesSinConsultar = examenes.filter(e => e.estadoInscriptos === 'sin-consultar').length;
    
    console.log(`   📊 Total exámenes: ${totalExamenes}`);
    console.log(`   ✅ Con inscriptos > 0: ${examenesConInscriptos}`);
    console.log(`   ⏳ Sin consultar: ${examenesSinConsultar}`);
    console.log(`   ❌ Con 0 inscriptos: ${totalExamenes - examenesConInscriptos}`);

    // 5. Diagnóstico
    console.log('\n📋 DIAGNÓSTICO:');
    if (examenesSinConsultar === totalExamenes) {
      console.log('   🔍 PROBLEMA: Ningún examen tiene inscriptos consultados');
      console.log('   💡 POSIBLE CAUSA: Los exámenes son nuevos y nunca se consultaron inscriptos');
      console.log('   🔧 SOLUCIÓN: Ejecutar sincronización de inscriptos masiva');
    } else if (examenesConInscriptos === 0) {
      console.log('   🔍 PROBLEMA: Todos los exámenes tienen 0 inscriptos');
      console.log('   💡 POSIBLE CAUSA: Error en la API externa o en el procesamiento');
    } else {
      console.log('   ✅ Algunos exámenes tienen inscriptos, problema parcial');
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

debugInscriptos(); 
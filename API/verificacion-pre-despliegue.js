import fetch from 'node-fetch';

async function verificacionCompleta() {
  console.log('🚀 VERIFICACIÓN COMPLETA PRE-DESPLIEGUE\n');
  console.log('=' .repeat(60));
  
  const errores = [];
  const advertencias = [];
  
  try {
    // 1. VERIFICAR API FUNCIONANDO
    console.log('\n📡 1. VERIFICANDO API...');
    
    const apiTest = await fetch('http://localhost:3000/api/v1/examenes/por-fecha?fechaDesde=2025-06-30&fechaHasta=2025-06-30');
    if (apiTest.ok) {
      const data = await apiTest.json();
      const examenes = data.data.examenesPorFecha['2025-06-30'];
      console.log(`   ✅ API funcionando - ${examenes.length} exámenes encontrados`);
    } else {
      errores.push('❌ API no responde correctamente');
    }
    
    // 2. VERIFICAR AULAS CONFIGURADAS
    console.log('\n🏢 2. VERIFICANDO AULAS...');
    
    const aulasResponse = await fetch('http://localhost:3000/api/v1/aulas');
    if (aulasResponse.ok) {
      const aulasData = await aulasResponse.json();
      const aulas = aulasData.data;
      
      const aulasEsperadas = ['Aula 4', 'Aula 8', 'Aula 12', 'Laboratorio Informático'];
      const aulasEncontradas = aulas.filter(a => aulasEsperadas.some(esp => a.nombre.includes(esp.split(' ')[1])));
      
      console.log(`   📊 Total aulas en BD: ${aulas.length}`);
      console.log(`   🎯 Aulas configuradas: ${aulasEncontradas.length}/4`);
      
      aulasEsperadas.forEach(esperada => {
        const encontrada = aulas.find(a => a.nombre.includes(esperada.split(' ')[1]));
        if (encontrada) {
          console.log(`   ✅ ${encontrada.nombre} - Capacidad: ${encontrada.capacidad}`);
        } else {
          errores.push(`❌ Falta aula: ${esperada}`);
        }
      });
    }
    
    // 3. VERIFICAR SINCRONIZACIÓN DE INSCRIPTOS
    console.log('\n👥 3. VERIFICANDO SINCRONIZACIÓN DE INSCRIPTOS...');
    
    const examenesSincronizados = await fetch('http://localhost:3000/api/v1/examenes/por-fecha?fechaDesde=2025-06-30&fechaHasta=2025-07-01');
    if (examenesSincronizados.ok) {
      const syncData = await examenesSincronizados.json();
      const examenesConInscriptos = [];
      
      for (const fecha of Object.keys(syncData.data.examenesPorFecha)) {
        const examenesFecha = syncData.data.examenesPorFecha[fecha];
        const conInscriptos = examenesFecha.filter(e => e.inscriptos > 0);
        examenesConInscriptos.push(...conInscriptos);
      }
      
      console.log(`   📊 Exámenes con inscriptos: ${examenesConInscriptos.length}`);
      
      if (examenesConInscriptos.length > 100) {
        console.log(`   ✅ Sincronización correcta`);
      } else {
        advertencias.push(`⚠️ Pocos exámenes sincronizados: ${examenesConInscriptos.length}`);
      }
    }
    
    // 4. VERIFICAR FILTRO SEDE 3
    console.log('\n🏢 4. VERIFICANDO FILTRO SEDE 3...');
    
    const examenTest = await fetch('http://localhost:3000/api/v1/examenes/21/inscripciones');
    if (examenTest.ok) {
      const inscData = await examenTest.json();
      if (inscData.data.cantidadInscriptos > 0) {
        console.log(`   ✅ Filtro funcionando - ${inscData.data.cantidadInscriptos} inscriptos sede 3`);
      } else {
        advertencias.push(`⚠️ Examen test sin inscriptos`);
      }
    }
    
    // 5. VERIFICAR MAPEOS DE CARRERAS
    console.log('\n🎓 5. VERIFICANDO MAPEOS DE CARRERAS...');
    
    const carrerasResponse = await fetch('http://localhost:3000/api/v1/totem/mapeos/carreras');
    if (carrerasResponse.ok) {
      const carrerasData = await carrerasResponse.json();
      const carreras = carrerasData.data;
      const noMapeadas = carreras.filter(c => !c.esMapeada);
      
      console.log(`   📊 Total carreras: ${carreras.length}`);
      console.log(`   ✅ Mapeadas: ${carreras.length - noMapeadas.length}`);
      console.log(`   ⚠️ Sin mapear: ${noMapeadas.length}`);
      
      if (noMapeadas.length > 0) {
        advertencias.push(`⚠️ ${noMapeadas.length} carreras sin mapear - aparecerán como "TOTEM XX"`);
      }
    }
    
    // 6. VERIFICAR PUERTOS
    console.log('\n🌐 6. VERIFICANDO PUERTOS...');
    
    try {
      const backofficeTest = await fetch('http://localhost:3001/');
      console.log('   ✅ Backoffice (3001) funcionando');
    } catch {
      errores.push('❌ Backoffice (puerto 3001) no responde');
    }
    
    try {
      const webTest = await fetch('http://localhost:4321/');
      console.log('   ✅ Web (4321) funcionando');
    } catch {
      errores.push('❌ Web (puerto 4321) no responde');
    }
    
    // RESUMEN FINAL
    console.log('\n' + '=' .repeat(60));
    console.log('📋 RESUMEN DE VERIFICACIÓN:');
    console.log('=' .repeat(60));
    
    if (errores.length === 0 && advertencias.length === 0) {
      console.log('🎉 ¡SISTEMA COMPLETAMENTE LISTO PARA DESPLIEGUE!');
      console.log('✅ Todos los componentes funcionando correctamente');
    } else {
      if (errores.length > 0) {
        console.log('🚨 ERRORES CRÍTICOS:');
        errores.forEach(error => console.log('   ' + error));
      }
      
      if (advertencias.length > 0) {
        console.log('\n⚠️ ADVERTENCIAS:');
        advertencias.forEach(adv => console.log('   ' + adv));
      }
      
      if (errores.length === 0) {
        console.log('\n✅ APTO PARA DESPLIEGUE (con advertencias menores)');
      } else {
        console.log('\n❌ CORREGIR ERRORES ANTES DEL DESPLIEGUE');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
  }
}

verificacionCompleta(); 
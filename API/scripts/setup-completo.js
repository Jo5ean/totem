import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importar scripts individuales
import configurarAulasIniciales from './configurar-aulas-iniciales.js';
import setupTotemMapeos from './setup-totem-mapeos.js';
import mapearCarrerasAutomatico from './mapear-carreras-automatico.js';

// Función para hacer llamadas HTTP
async function llamarEndpoint(endpoint, descripcion) {
  try {
    console.log(`🔄 ${descripcion}...`);
    
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ ${descripcion} completado`);
    
    return data;
  } catch (error) {
    console.error(`❌ Error en ${descripcion}:`, error.message);
    throw error;
  }
}

// Función para verificar si el servidor está corriendo
async function verificarServidor() {
  try {
    const response = await fetch('http://localhost:3000/api/hello');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function setupCompleto() {
  console.log('🚀 INICIANDO SETUP COMPLETO DEL PROYECTO TOTEM');
  console.log('=====================================================\n');

  try {
    // Verificar que el servidor esté corriendo
    console.log('🔍 Verificando servidor...');
    const servidorActivo = await verificarServidor();
    
    if (!servidorActivo) {
      console.log('⚠️  El servidor no está corriendo en puerto 3000');
      console.log('   Por favor ejecuta: npm start o npm run dev');
      console.log('   Y luego ejecuta este script nuevamente.');
      process.exit(1);
    }
    console.log('✅ Servidor detectado en puerto 3000\n');

    // PASO 1: Configurar Aulas
    console.log('📍 PASO 1/6: Configurando Aulas Iniciales');
    console.log('───────────────────────────────────────');
    await configurarAulasIniciales();
    console.log('✅ Aulas configuradas exitosamente\n');

    // PASO 2: Configurar Mapeos de Sectores
    console.log('📍 PASO 2/6: Configurando Mapeos de Sectores');
    console.log('──────────────────────────────────────────');
    await setupTotemMapeos();
    console.log('✅ Mapeos de sectores configurados\n');

    // PASO 3: Mapeo Automático de Carreras
    console.log('📍 PASO 3/6: Mapeo Automático de Carreras');
    console.log('──────────────────────────────────────────');
    await mapearCarrerasAutomatico();
    console.log('✅ Carreras mapeadas automáticamente\n');

    // PASO 4: Sincronización de Datos desde Sheet.best
    console.log('📍 PASO 4/6: Sincronización de Datos');
    console.log('──────────────────────────────────────');
    await llamarEndpoint('/api/v1/totem/simple-sync', 'Sincronizando datos desde Sheet.best');
    console.log('✅ Datos sincronizados desde Sheet.best\n');

    // PASO 5: Verificación de Base de Datos
    console.log('📍 PASO 5/6: Verificación de Base de Datos');
    console.log('───────────────────────────────────────────');
    const estadisticas = await llamarEndpoint('/api/v1/totem/verify-database', 'Verificando estado de la base de datos');
    console.log('✅ Base de datos verificada\n');

    // PASO 6: Reporte Final
    console.log('📍 PASO 6/6: Reporte Final');
    console.log('──────────────────────────');
    
    if (estadisticas && estadisticas.success) {
      const { examenes, carreras, aulas, facultades } = estadisticas.data;
      
      console.log('🎉 SETUP COMPLETADO EXITOSAMENTE');
      console.log('==================================');
      console.log(`📚 Exámenes en BD: ${examenes.total}`);
      console.log(`🎓 Carreras totales: ${carreras.total}`);
      console.log(`✅ Carreras mapeadas: ${carreras.mapeadas}`);
      console.log(`❌ Carreras sin mapear: ${carreras.noMapeadas}`);
      console.log(`🏫 Aulas disponibles: ${aulas.total}`);
      console.log(`🏛️ Facultades: ${facultades.total}`);
      
      const porcentajeMapeado = carreras.total > 0 ? Math.round((carreras.mapeadas / carreras.total) * 100) : 0;
      console.log(`📊 Porcentaje mapeado: ${porcentajeMapeado}%`);
      
      if (carreras.noMapeadas > 0) {
        console.log('\n⚠️  ATENCIÓN: Hay carreras sin mapear');
        console.log('   Puedes revisar y mapear manualmente desde:');
        console.log('   👉 http://localhost:3001/mapeos-carreras (Backoffice)');
        console.log('   👉 GET /api/v1/totem/mapeos/carreras (API)');
      }
      
      if (examenes.total === 0) {
        console.log('\n⚠️  ATENCIÓN: No hay exámenes en la base de datos');
        console.log('   Verifica la conexión con Sheet.best o ejecuta:');
        console.log('   👉 curl http://localhost:3000/api/v1/totem/simple-sync');
      }
    }

    console.log('\n🔗 ENLACES ÚTILES:');
    console.log('──────────────────');
    console.log('📊 Dashboard: http://localhost:3000/api/v1/dashboard/resumen');
    console.log('🏫 Mapeos: http://localhost:3000/api/v1/totem/mapeos/carreras');
    console.log('💻 Backoffice: http://localhost:3001 (ejecutar desde /backoffice)');
    console.log('🌐 Web Pública: http://localhost:4321 (ejecutar desde /web)');

    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('─────────────────');
    console.log('1. Revisar mapeos faltantes en el backoffice');
    console.log('2. Probar asignación automática de aulas');
    console.log('3. Configurar sincronización programada');
    console.log('4. Levantar interfaces web si es necesario');

    console.log('\n🎉 ¡El sistema TOTEM está listo para usar!');

  } catch (error) {
    console.error('\n💥 ERROR EN SETUP COMPLETO:', error);
    console.log('\n🔧 SOLUCIÓN DE PROBLEMAS:');
    console.log('─────────────────────────');
    console.log('1. Verifica que MySQL esté corriendo');
    console.log('2. Verifica que el archivo .env esté configurado');
    console.log('3. Ejecuta: npx prisma generate && npx prisma db push');
    console.log('4. Inicia el servidor: npm start');
    console.log('5. Ejecuta este script nuevamente');
    
    process.exit(1);
  }
}

// Función para mostrar ayuda
function mostrarAyuda() {
  console.log('🚀 Setup Completo - Proyecto TOTEM');
  console.log('===================================');
  console.log('');
  console.log('Este script configura automáticamente todo el sistema TOTEM:');
  console.log('');
  console.log('📋 Pasos que ejecuta:');
  console.log('  1. ✅ Configurar aulas iniciales');
  console.log('  2. 🗺️  Mapear sectores a facultades');
  console.log('  3. 🎓 Mapear carreras automáticamente');
  console.log('  4. 🔄 Sincronizar datos desde Sheet.best');
  console.log('  5. ✔️  Verificar estado de la base de datos');
  console.log('  6. 📊 Mostrar reporte final');
  console.log('');
  console.log('💡 Uso:');
  console.log('  node scripts/setup-completo.js');
  console.log('  node scripts/setup-completo.js --help');
  console.log('');
  console.log('⚠️  Prerrequisitos:');
  console.log('  - MySQL corriendo');
  console.log('  - Archivo .env configurado');
  console.log('  - npx prisma generate ejecutado');
  console.log('  - Servidor API corriendo (npm start)');
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  // Verificar argumentos
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    mostrarAyuda();
    process.exit(0);
  }

  setupCompleto()
    .then(() => {
      console.log('\n🎯 Script maestro ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en script maestro:', error);
      process.exit(1);
    });
}

export default setupCompleto; 
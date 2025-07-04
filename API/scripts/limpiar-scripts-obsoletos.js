import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🧹 LIMPIEZA DE SCRIPTS OBSOLETOS
 * ===============================
 * 
 * Este script elimina todos los archivos obsoletos y deja solo:
 * ✅ totem-master.js (script principal unificado)
 * ✅ README.md (documentación)
 * ✅ limpiar-scripts-obsoletos.js (este script)
 * ✅ sincronizar-inscriptos-masivo.js (útil por separado)
 */

// Scripts que MANTENER (no eliminar)
const SCRIPTS_ESENCIALES = [
  'totem-master.js',
  'README.md', 
  'limpiar-scripts-obsoletos.js',
  'sincronizar-inscriptos-masivo.js'
];

// Scripts que ELIMINAR (obsoletos)
const SCRIPTS_OBSOLETOS = [
  'agregar-carreras-corregidas.js',
  'configurar-aulas-correctas.js',
  'configurar-aulas-iniciales.js',
  'configurar-aulas-uam.js',
  'inicializar-desde-cero.js',
  'limpiar-aulas-incorrectas.js',
  'limpiar-segunda-sincronizacion.js',
  'mapear-carreras-automatico.js',
  'prueba-final-duplicados.js',
  'setup-completo.js',
  'setup-totem-mapeos.js',
  'verificar-no-duplicados.js'
];

async function limpiarScripts() {
  console.log('🧹 LIMPIEZA DE SCRIPTS OBSOLETOS');
  console.log('='.repeat(40));
  
  const scriptsDir = __dirname;
  const archivos = fs.readdirSync(scriptsDir);
  
  let eliminados = 0;
  let conservados = 0;
  
  console.log('\n📁 ARCHIVOS EN /scripts:');
  
  for (const archivo of archivos) {
    const rutaCompleta = path.join(scriptsDir, archivo);
    const stats = fs.statSync(rutaCompleta);
    
    if (stats.isFile()) {
      if (SCRIPTS_ESENCIALES.includes(archivo)) {
        console.log(`   ✅ CONSERVAR: ${archivo}`);
        conservados++;
      } else if (SCRIPTS_OBSOLETOS.includes(archivo)) {
        try {
          fs.unlinkSync(rutaCompleta);
          console.log(`   ❌ ELIMINADO: ${archivo}`);
          eliminados++;
        } catch (error) {
          console.log(`   ⚠️  ERROR al eliminar: ${archivo}`);
        }
      } else {
        console.log(`   ❓ DESCONOCIDO: ${archivo} (conservado)`);
        conservados++;
      }
    }
  }
  
  console.log('\n📊 RESULTADO DE LIMPIEZA:');
  console.log('┌────────────────┬─────────┐');
  console.log('│ Estado         │ Cantidad│');
  console.log('├────────────────┼─────────┤');
  console.log(`│ Eliminados     │ ${eliminados.toString().padStart(7)} │`);
  console.log(`│ Conservados    │ ${conservados.toString().padStart(7)} │`);
  console.log('└────────────────┴─────────┘');
  
  console.log('\n✅ SCRIPTS FINALES DISPONIBLES:');
  const archivosFinales = fs.readdirSync(scriptsDir)
    .filter(archivo => fs.statSync(path.join(scriptsDir, archivo)).isFile())
    .sort();
  
  archivosFinales.forEach(archivo => {
    console.log(`   📄 ${archivo}`);
  });
  
  console.log('\n🎯 INSTRUCCIONES DE USO:');
  console.log('═══════════════════════');
  console.log('');
  console.log('🚀 CONFIGURACIÓN COMPLETA (TODO EN UNO):');
  console.log('   node scripts/totem-master.js');
  console.log('');
  console.log('📊 SINCRONIZAR INSCRIPTOS (OPCIONAL):');
  console.log('   node scripts/sincronizar-inscriptos-masivo.js');
  console.log('');
  console.log('📖 DOCUMENTACIÓN:');
  console.log('   cat scripts/README.md');
  console.log('');
  console.log('✨ ¡Scripts simplificados y optimizados!');
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  limpiarScripts()
    .then(() => {
      console.log('\n🎉 ¡Limpieza completada exitosamente!');
    })
    .catch((error) => {
      console.error('\n💥 Error en limpieza:', error);
    });
} 
import mysql from 'mysql2/promise';
import fs from 'fs';

// 🔧 CONFIGURACIÓN BD DESARROLLO UCASAL
const DB_CONFIG = {
  host: 'mysql-desa.ucasal.edu.ar',
  user: 'web',
  password: 'ucasal4webDesa',
  database: 'ucasal11test',
  charset: 'utf8mb4'
};

// 📋 TABLAS NECESARIAS PARA TOTEM
const TABLAS_REQUERIDAS = [
  'facultades', 'carreras', 'aulas', 'examenes', 
  'sector_facultad', 'carrera_totem', 'examen_totem',
  'inscripciones', 'totem_data', 'sync_logs', 'configuracion_visual'
];

async function verificarYCrearTablas() {
  console.log('🔍 VERIFICANDO BD DESARROLLO UCASAL...');
  console.log(`📍 Servidor: ${DB_CONFIG.host}`);
  console.log(`📊 Base de datos: ${DB_CONFIG.database}`);
  
  let connection;
  
  try {
    // 1. CONECTAR A LA BD
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conexión exitosa a BD desarrollo');
    
    // 2. VERIFICAR TABLAS EXISTENTES
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ?",
      [DB_CONFIG.database]
    );
    
    const tablasExistentes = tables.map(t => t.TABLE_NAME.toLowerCase());
    console.log(`📊 Tablas existentes: ${tablasExistentes.length}`);
    
    // 3. DETECTAR TABLAS FALTANTES
    const tablasFaltantes = TABLAS_REQUERIDAS.filter(tabla => 
      !tablasExistentes.includes(tabla.toLowerCase())
    );
    
    if (tablasFaltantes.length === 0) {
      console.log('🎉 ¡TODAS LAS TABLAS EXISTEN! BD lista para usar.');
      return { success: true, accion: 'ninguna' };
    }
    
    console.log(`⚠️ Faltan ${tablasFaltantes.length} tablas:`, tablasFaltantes);
    
    // 4. CREAR TABLAS FALTANTES
    console.log('🔨 Creando tablas automáticamente...');
    
    const sqlScript = fs.readFileSync('./despliegue-mysql-ucasal.sql', 'utf8');
    
    // Dividir el script en statements individuales
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let tablasCreadas = 0;
    
    for (const statement of statements) {
      try {
        if (statement.toUpperCase().includes('CREATE TABLE') || 
            statement.toUpperCase().includes('INSERT INTO')) {
          await connection.execute(statement);
          tablasCreadas++;
        }
      } catch (error) {
        // Ignorar errores de "tabla ya existe"
        if (!error.message.includes('already exists')) {
          console.warn(`⚠️ Error en statement:`, error.message);
        }
      }
    }
    
    console.log(`✅ ${tablasCreadas} operaciones ejecutadas`);
    
    // 5. VERIFICAR CREACIÓN
    const [newTables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ?",
      [DB_CONFIG.database]
    );
    
    console.log(`📊 Total tablas ahora: ${newTables.length}`);
    
    return { 
      success: true, 
      accion: 'creadas',
      tablasCreadas: tablasCreadas,
      totalTablas: newTables.length
    };
    
  } catch (error) {
    console.error('❌ Error configurando BD desarrollo:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('🔌 No se puede conectar al servidor MySQL de UCASAL');
      console.error('   - Verificar que estés conectado a la red de UCASAL');
      console.error('   - Verificar que el servidor mysql-desa esté disponible');
    }
    
    return { success: false, error: error.message };
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function testearConexionCompleta() {
  console.log('\n🧪 PROBANDO FUNCIONALIDAD COMPLETA...');
  
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Test 1: Verificar facultades
    const [facultades] = await connection.execute('SELECT COUNT(*) as total FROM facultades');
    console.log(`✅ Facultades: ${facultades[0].total}`);
    
    // Test 2: Verificar aulas  
    const [aulas] = await connection.execute('SELECT COUNT(*) as total FROM aulas');
    console.log(`✅ Aulas: ${aulas[0].total}`);
    
    // Test 3: Verificar conexión de tablas
    const [test] = await connection.execute(`
      SELECT f.nombre as facultad, COUNT(c.id) as carreras 
      FROM facultades f 
      LEFT JOIN carreras c ON f.id = c.facultadId 
      GROUP BY f.id
    `);
    
    console.log('✅ Relaciones funcionando:');
    test.forEach(row => {
      console.log(`   - ${row.facultad}: ${row.carreras} carreras`);
    });
    
    console.log('\n🎉 ¡BD DESARROLLO LISTA PARA TOTEM!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// EJECUCIÓN PRINCIPAL
async function main() {
  console.log('🚀 SETUP BD DESARROLLO UCASAL PARA TOTEM');
  console.log('=' .repeat(50));
  
  const resultado = await verificarYCrearTablas();
  
  if (resultado.success) {
    await testearConexionCompleta();
    
    console.log('\n📋 SIGUIENTE PASO:');
    console.log('1. Usar archivo: .env.desarrollo-ucasal');
    console.log('2. Ejecutar: npm start');
    console.log('3. Demostrar funcionamiento a sistemas');
    console.log('4. Solicitar BD de producción');
    
  } else {
    console.log('\n❌ SETUP FALLIDO');
    console.log('   Verificar conexión de red y credenciales');
  }
}

main().catch(console.error); 
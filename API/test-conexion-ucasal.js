import mysql from 'mysql2/promise';

// 🧪 TEST RÁPIDO CONEXIÓN BD DESARROLLO UCASAL

const CONFIG = {
  host: 'mysql-desa.ucasal.edu.ar',
  user: 'web',
  password: 'ucasal4webDesa',
  database: 'ucasal11test',
  charset: 'utf8mb4',
  connectTimeout: 10000
};

async function testConexionRapida() {
  console.log('🧪 PROBANDO CONEXIÓN BD DESARROLLO UCASAL...');
  console.log(`📍 Servidor: ${CONFIG.host}`);
  console.log(`📊 Base de datos: ${CONFIG.database}`);
  console.log('⏳ Conectando...\n');
  
  let connection;
  
  try {
    // 1. CONECTAR
    connection = await mysql.createConnection(CONFIG);
    console.log('✅ ¡CONEXIÓN EXITOSA!');
    
    // 2. VERIFICAR SERVIDOR
    const [serverInfo] = await connection.execute('SELECT VERSION() as version, NOW() as fecha');
    console.log(`📦 MySQL: ${serverInfo[0].version}`);
    console.log(`📅 Fecha servidor: ${serverInfo[0].fecha}`);
    
    // 3. VERIFICAR BASE DE DATOS
    const [dbInfo] = await connection.execute('SELECT DATABASE() as db_actual');
    console.log(`🗄️ BD actual: ${dbInfo[0].db_actual}`);
    
    // 4. VERIFICAR TABLAS EXISTENTES
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME 
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY TABLE_NAME
    `, [CONFIG.database]);
    
    console.log(`\n📊 TABLAS EXISTENTES (${tables.length}):`);
    if (tables.length > 0) {
      tables.forEach(table => {
        console.log(`   - ${table.TABLE_NAME} (${table.TABLE_ROWS || 0} registros)`);
      });
    } else {
      console.log('   🔍 No hay tablas - BD limpia para crear TOTEM');
    }
    
    // 5. VERIFICAR PERMISOS
    console.log('\n🔐 VERIFICANDO PERMISOS...');
    
    try {
      await connection.execute('SHOW GRANTS');
      console.log('✅ Permisos de lectura: OK');
    } catch (error) {
      console.log('⚠️ No se pueden ver grants (normal)');
    }
    
    try {
      await connection.execute('CREATE TABLE test_permisos_totem (id INT PRIMARY KEY)');
      await connection.execute('DROP TABLE test_permisos_totem');
      console.log('✅ Permisos de escritura: OK');
    } catch (error) {
      console.log('❌ Sin permisos de escritura:', error.message);
    }
    
    console.log('\n🎉 ¡CONEXIÓN BD DESARROLLO UCASAL FUNCIONANDO!');
    console.log('✅ Lista para instalar TOTEM');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n🔌 SOLUCIONES:');
      console.error('   1. Verificar conexión a red UCASAL');
      console.error('   2. Verificar que mysql-desa.ucasal.edu.ar esté disponible');
      console.error('   3. Probar desde servidor interno UCASAL');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔑 CREDENCIALES:');
      console.error('   Las credenciales pueden haber cambiado');
      console.error('   Verificar usuario/contraseña en servidor');
    }
    
    return false;
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// EJECUTAR TEST
testConexionRapida()
  .then(success => {
    if (success) {
      console.log('\n🚀 SIGUIENTE PASO: node setup-bd-desarrollo-ucasal.js');
    } else {
      console.log('\n🔧 CORREGIR CONEXIÓN PRIMERO');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Error inesperado:', error);
    process.exit(1);
  }); 
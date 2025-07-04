// 🔧 CONFIGURACIÓN DESARROLLO UCASAL
// Para usar mientras se aprueba la BD de producción

export const CONFIG_DESARROLLO = {
  // Credenciales encontradas en servidor UCASAL
  database: {
    host: 'mysql-desa.ucasal.edu.ar',
    user: 'web',
    password: 'ucasal4webDesa',
    database: 'ucasal11test',
    charset: 'utf8mb4',
    port: 3306
  },
  
  // URL de conexión para Prisma
  databaseUrl: 'mysql://web:ucasal4webDesa@mysql-desa.ucasal.edu.ar:3306/ucasal11test',
  
  // Configuración del entorno
  entorno: {
    nodeEnv: 'development',
    port: 3000,
    autoCreateTables: true,
    dailyResetMode: true
  },
  
  // URLs para desarrollo en UCASAL
  urls: {
    base: 'https://www.ucasal.edu.ar/proyectos-innovalab/api',
    frontend: 'https://www.ucasal.edu.ar/proyectos-innovalab/web',
    backoffice: 'https://www.ucasal.edu.ar/proyectos-innovalab/backoffice'
  },
  
  // CORS permitidos
  allowedOrigins: [
    'https://www.ucasal.edu.ar',
    'https://ucasal.edu.ar',
    'http://localhost:3001',
    'http://localhost:4321'
  ]
};

// Variables de entorno para copiar/pegar
export const ENV_VARS = `
# 🚀 VARIABLES PARA .env (BD DESARROLLO UCASAL)
DATABASE_URL="mysql://web:ucasal4webDesa@mysql-desa.ucasal.edu.ar:3306/ucasal11test"
NODE_ENV=development
PORT=3000
AUTO_CREATE_TABLES=true
DAILY_RESET_MODE=true
BASE_URL="https://www.ucasal.edu.ar/proyectos-innovalab/api"
FRONTEND_URL="https://www.ucasal.edu.ar/proyectos-innovalab/web"
BACKOFFICE_URL="https://www.ucasal.edu.ar/proyectos-innovalab/backoffice"
ALLOWED_ORIGINS="https://www.ucasal.edu.ar,https://ucasal.edu.ar"
`;

console.log('📋 CONFIGURACIÓN DESARROLLO UCASAL CARGADA');
console.log('🔗 BD:', CONFIG_DESARROLLO.database.host);
console.log('📊 Database:', CONFIG_DESARROLLO.database.database);
console.log('🎯 Modo:', CONFIG_DESARROLLO.entorno.dailyResetMode ? 'Reset Diario' : 'Normal'); 
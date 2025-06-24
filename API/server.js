import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rutas
import totemRoutes from './src/routes/v1/totem.js';
import examenesRoutes from './src/routes/v1/examenes.js';
import dashboardRoutes from './src/routes/v1/dashboard.js';
import facultadesRoutes from './src/routes/v1/facultades.js';
import aulasRoutes from './src/routes/v1/aulas.js';
import asignacionRoutes from './src/routes/v1/asignacion.js';
import estudiantesRoutes from './src/routes/v1/estudiantes.js';
import configuracionRoutes from './src/routes/v1/configuracion.js';
import actasRoutes from './src/routes/v1/actas.js';
import debugRoutes from './src/routes/debug.js';

// Configuración de rutas ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware básico
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuración CORS
app.use(cors({
  origin: [
    'http://localhost:3001', // Backoffice (actualizar si es necesario)
    'http://localhost:4321', // Web frontend (Astro)
    'http://localhost:3000'  // Next.js anterior (si aún se usa)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas de la API v1
app.use('/api/v1/totem', totemRoutes);
app.use('/api/v1/examenes', examenesRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/facultades', facultadesRoutes);
app.use('/api/v1/aulas', aulasRoutes);
app.use('/api/v1/asignacion', asignacionRoutes);
app.use('/api/v1/estudiantes', estudiantesRoutes);
app.use('/api/v1/configuracion', configuracionRoutes);
app.use('/api/v1/actas', actasRoutes);

// Rutas de debug
app.use('/api/debug', debugRoutes);

// Ruta raíz de la API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'UCASAL Cronogramas API - Node.js/Express',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      totem: '/api/v1/totem',
      examenes: '/api/v1/examenes',
      dashboard: '/api/v1/dashboard',
      facultades: '/api/v1/facultades',
      aulas: '/api/v1/aulas',
      asignacion: '/api/v1/asignacion',
      estudiantes: '/api/v1/estudiantes',
      configuracion: '/api/v1/configuracion',
      actas: '/api/v1/actas',
      debug: '/api/debug'
    }
  });
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`📍 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
}); 
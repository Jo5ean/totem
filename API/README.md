# 🚀 UCASAL TOTEM API

API REST para gestionar cronogramas de exámenes de la Universidad Católica de Salta usando el sistema TOTEM centralizado.

## 🏗️ Arquitectura

- **Next.js API Routes** - Framework web
- **Prisma** - ORM para base de datos
- **MySQL** - Base de datos
- **Google Sheets API** - Fuente de datos del TOTEM centralizado

## 🎯 Características

- ✅ **Sincronización Centralizada** - Un solo Google Sheet para todas las facultades
- ✅ **Mapeos Configurables** - Sectores y carreras mapeables via API
- ✅ **Trazabilidad Completa** - Datos originales del TOTEM preservados
- ✅ **Sistema Escalable** - Fácil agregar nuevas facultades/carreras
- ✅ **API RESTful** - Endpoints bien documentados

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env

# Configurar base de datos
npm run db:push

# Configurar mapeos iniciales
node scripts/setup-totem-mapeos.js

# Iniciar servidor de desarrollo
npm run dev
```

## 📊 Google Sheet TOTEM

**URL**: [Finales Convergencia 2025](https://docs.google.com/spreadsheets/d/12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8/edit?gid=848244318#gid=848244318)

El sistema utiliza un Google Sheet centralizado que contiene datos de todas las facultades organizados por sectores.

## 📱 Endpoints Principales

La API estará disponible en `http://localhost:3000/api/v1/`

### TOTEM
- `GET /api/v1/totem` - Datos brutos del TOTEM con paginación
- `POST /api/v1/totem/sync` - Sincronizar todos los datos del TOTEM
- `GET /api/v1/totem/estadisticas` - Estadísticas del sistema

### Mapeos
- `GET/POST /api/v1/totem/mapeos/sectores` - Gestionar mapeos sector → facultad
- `GET/POST /api/v1/totem/mapeos/carreras` - Gestionar mapeos carrera TOTEM → carrera local

### Facultades
- `GET /api/v1/facultades` - Lista facultades
- `POST /api/v1/facultades` - Crear nueva facultad

## 🔧 Flujo de Configuración

```bash
# 1. Configurar mapeos de sectores
curl -X POST "http://localhost:3000/api/v1/totem/mapeos/sectores" \
  -H "Content-Type: application/json" \
  -d '{"sector": "2", "facultadId": 1}'

# 2. Sincronizar datos del TOTEM
curl -X POST "http://localhost:3000/api/v1/totem/sync"

# 3. Ver estadísticas
curl -X GET "http://localhost:3000/api/v1/totem/estadisticas"

# 4. Mapear carreras faltantes
curl -X POST "http://localhost:3000/api/v1/totem/mapeos/carreras" \
  -H "Content-Type: application/json" \
  -d '{"codigoTotem": "113", "carreraId": 5}'
```

## 📚 Documentación

Ver [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) para documentación completa de endpoints.

Ver [docs/TOTEM-CENTRALIZADO.md](./docs/TOTEM-CENTRALIZADO.md) para guía detallada del sistema TOTEM.

## 🛠️ Scripts

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Sincronizar esquema BD
npm run db:studio    # Interfaz visual BD
npm run lint         # Linter
```

## 🗄️ Base de Datos

### Nuevas Tablas TOTEM
- `totem_data` - Datos brutos del Google Sheet
- `sectores_facultades` - Mapeos sector → facultad
- `carreras_totem` - Mapeos carrera TOTEM → carrera local
- `examenes_totem` - Metadatos TOTEM de cada examen

### Migración
```bash
# Aplicar cambios de esquema
npx prisma db push

# Configurar mapeos iniciales
node scripts/setup-totem-mapeos.js
```

## 🌍 Variables de Entorno

```env
DATABASE_URL="mysql://user:password@localhost:3306/database"
GOOGLE_CREDENTIALS='{"type":"service_account",...}'
NODE_ENV="development"
```

## 📦 Despliegue

Esta API puede desplegarse en cualquier plataforma que soporte Node.js:
- Vercel
- Railway  
- DigitalOcean
- AWS Lambda

## 🔄 Migración desde Sistema Anterior

El nuevo sistema TOTEM centralizado reemplaza el sistema anterior de sincronización por facultades individuales.

**Eliminados:**
- ❌ `cronogramaService.js`
- ❌ `csvDownloadService.js` 
- ❌ Endpoints `/api/v1/cronogramas/*`
- ❌ Carpeta `csv_downloads/`

**Agregados:**
- ✅ `totemService.js`
- ✅ Endpoints `/api/v1/totem/*`
- ✅ Sistema de mapeos configurables
- ✅ Sincronización centralizada

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch
3. Commit cambios
4. Push al branch
5. Abrir Pull Request

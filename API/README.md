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
- ❌ Endpoints `/api/v1/cronogramas/*`

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

6. Env:
DATABASE_URL="mysql://root:Chuvaca6013.@localhost:3306/ucasal_cronogramas"

# Google Sheets API Credentials - REEMPLAZAR CON VALORES REALES`
GOOGLE_CLIENT_EMAIL="ucasal-cronogramas-sheets@ucasal-cronogramas.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC6BJXg3hFZ4Mlm\nXI0/6bAz0gVzrzAWpvBiguPjdB74H0imBKwViB++YPm8Dakwfretk01RnB88EBbL\n1DURUWXh1uo5N0x+GBxZHlGv6bwZpnPdJ9MUs4Y/WuqNsO4WP8urgmen5t5ocDbr\nbrNVDDakx9AHh2DbkX71d/7b7TXeY2RNn9Ew8LNTcKfXIfr9haQZLfuzEpfoM+1m\nrt6aTMvLMqWXWpcnj56YBv+gRDT3JlG6qmOYL5/J3an3TL+ZTckl2hE3cgkLKU2e\nW29PIXJ1s0Ba5JyDpUltQi4+8wJSJjw08/zbSMrEXczU1sKsISgpd86PnbnRtogx\n1Mo/G1h3AgMBAAECggEARnsZTM/nVB4rQTkdHdPN+vx/K1N8DYEoQLMmZJapa0rz\nLFBF4YyntmspBJtKeUDyGHbhC2Rzoz7XXFil2M92Imlbat1sgrRg/VVTDyupJTDf\n4rJFtKjG23d3usMImu6GHZB19PSxXXHzJSZXFYjgpXO9+zRMuzT4HUrfinXo/L8X\ng5c6F2KdLw0jOUeQPzbqxznnIxcbIlQqXdjJrQYS3pnxkWGNJxZn0SD+HxCpoE/T\nAvuaNSalCU62Lm9r5giA3MHH6YBsGG/RWRpIi65O/nNvo6s7Q5y9I3B2sV4PbvFD\ngkTi1GJGi9xJBSUs4lQ358oJ6FelCIcJdyMs5XWxxQKBgQDkvdzphu1XFD7JekPT\n5Uu3xaafOli6y7IuSGNQnm/dFx3ZqJonuvUg1fbe/dCiR+jp4SYuO4QZqtVgSjCu\nCw2KEolwu+vKn0CMGZuJrYbF3mqtsKrEVvaYDPuxYFHkd9+CYsd/tc8Peq4CpJkT\n3Po7Val7/uT+wQiGtJSZMR0MvQKBgQDQL117xjEmMpqFw46/sAgg30w45hYoNiNl\ntDwVwv+cB6WONidqlnBTkO4RSHzqo+JtH/2sP5VUsA76kJpUn97yUEC6WJpLdue4\n2AyD/D8nsvHOrjeRFPnHiNOfjsJYnI0lMvh7TFdYU1/KF1oR2ONn5uUAWTBjmQL6\nB08MGAC/QwKBgQC78L/M5D6n2IuKETofpPtkgDJaC5+RwwGgg3uOZs80keTFzID0\neekkVIjlSRgd7gWR/JrZS69LQ5DT78E1jwFN29MvXEftEJIBSp0ALyJX+1odYdW9\nQlKUNb6rS5+dn1x2jeCqrt/1MPA+Xa0ko+C51bVOmuzd4A64VzDs+WyL5QKBgQCu\nL5M2JqOk5B4p4W+krvJ+Hpc13D2Zs4J2bBEB3D/mGvfIP0NHiUu+f7rRNyddY3Xl\n/ChRYHnfe9dsimS2fXUapU8jG1Mt5PUI0avXGsz0uGJdnaLcfwJmkvMNw3KUlZf7\nEeSZtUw3mLrC6jrwR9otayEb44P7MWEuNcNLySGG5QKBgQCcPQ0EsPVb3VWrzdwW\n1tln4RIhSstsE5VjCXlVIqbNITNzoJLaFWJQanQhzHM3pvVedSgPFF7c5N95ljWd\nmeBosF1LnOlXO74Msre16gZKtUrfsdqohwCeZU3AFYoxiV1IU2wMCuZ9T47rebEY\nvG6h+xrpukbvjdP5xhINFZn8oA==\n-----END PRIVATE KEY-----\n"

NODE_ENV=development
PORT=3001


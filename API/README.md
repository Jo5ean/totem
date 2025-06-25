# 🚀 UCASAL TOTEM API - Sistema Centralizado Completo

API REST para gestionar cronogramas de exámenes de la Universidad Católica de Salta usando el sistema TOTEM centralizado con **Sheet.best API**.

## 🎯 Estado Actual del Proyecto (Junio 2025)

### ✅ **Migración Completada: Google Sheets → Sheet.best**
- ❌ **Problema Original**: Errores HTTP 401 con Google Sheets CSV
- ✅ **Solución**: Migración completa a Sheet.best API
- ✅ **Resultado**: 100% funcional, sin errores de autorización

### 📊 **Resultados Espectaculares**
- **Antes**: 174 exámenes de 1,314 filas (13.3% aprovechamiento)
- **Después**: 1,176 exámenes de 1,306 filas válidas (90% aprovechamiento)
- **Mejora**: +576% más exámenes procesados
- **Carreras**: 5 → 31 mapeadas (+520% incremento)
- **Nuevas carreras creadas**: 19 carreras agregadas automáticamente a BD

## 🏗️ Arquitectura Final

```
📦 TOTEM API
├── 🌐 Sheet.best API Integration
├── 🗄️ MySQL + Prisma ORM  
├── 🎯 Mapeo Automático de Carreras
├── 🏭 Creación Automática de Carreras
└── 📈 90% Aprovechamiento de Datos
```

**Stack Técnico:**
- **Next.js API Routes** - Framework web
- **Prisma** - ORM para MySQL
- **Sheet.best** - API para Google Sheets (reemplaza CSV directo)
- **MySQL** - Base de datos principal

## 🔗 Fuente de Datos TOTEM

**Google Sheet**: [Finales Convergencia 2025](https://docs.google.com/spreadsheets/d/12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8/edit?gid=848244318#gid=848244318)

**Sheet.best API**: [https://api.sheetbest.com/sheets/16ccd035-8c9e-4218-b5f1-2da9939d7b3d](https://api.sheetbest.com/sheets/16ccd035-8c9e-4218-b5f1-2da9939d7b3d)

**Datos totales**: 1,314 filas → 1,306 válidas → 1,176 exámenes creados

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env

# Configurar base de datos
npm run db:push

# Sincronización completa (recomendado)
curl -X POST "http://localhost:3001/api/v1/totem/simple-sync"

# Verificar resultados
curl -X GET "http://localhost:3001/api/v1/totem/verify-database"

# Iniciar servidor
npm run dev
```

## 📱 Endpoints Principales Funcionales

### 🔄 **Sincronización (FUNCIONA 100%)**
```bash
# Sincronización completa con Sheet.best
POST /api/v1/totem/simple-sync
# Resultado: 1,176 exámenes creados

# Verificación de base de datos
GET /api/v1/totem/verify-database
# Muestra estadísticas completas
```

### 🗺️ **Mapeos Automáticos (IMPLEMENTADOS)**
```bash
# Mapeo automático de carreras existentes en BD
POST /api/v1/totem/mapear-carreras-automatico
# Resultado: +211 exámenes adicionales

# Creación automática de carreras faltantes
POST /api/v1/totem/crear-y-mapear-carreras
# Resultado: 19 carreras nuevas + 791 exámenes más
```

### 🔍 **Análisis de Datos (DIAGNÓSTICO)**
```bash
# Analizar filas no procesadas
GET /api/v1/totem/analizar-filas-descartadas
# Identifica carreras que faltan mapear

# Estadísticas completas
GET /api/v1/totem/estadisticas
```

## 📊 Estado Actual de Carreras

### ✅ **31 Carreras Mapeadas (90% datos procesados)**

**Carreras con mayor volumen de exámenes:**
- Código 10: 167 exámenes (Lic. Economía)
- Código 15: 150 exámenes (Lic. Administración)
- Código 113: 134 exámenes (Lic. Educación)
- Código 88: 92 exámenes (Ing. Industrial)

### ⚠️ **7 Carreras Pendientes (130 filas sin procesar)**

**CÓDIGOS PROBLEMÁTICOS IDENTIFICADOS:**
```
350: 39 exámenes - Sin datos específicos (código genérico)
355: 31 exámenes - Sin datos específicos (código genérico)  
361: 25 exámenes - Sin datos específicos (código genérico)
378: 19 exámenes - Sin datos específicos (código genérico)
58:  8 exámenes  - No existe en CSV proporcionado
86:  4 exámenes  - TURISMO (requiere crear Facultad de Turismo)
383: 4 exámenes  - MINERÍA (requiere crear Facultad de Minería)
```

**Próximos pasos para llegar a 95-98% aprovechamiento:**
1. Crear Facultad de Turismo para código 86
2. Crear Facultad de Minería para código 383  
3. Investigar códigos genéricos 350, 355, 361, 378
4. Buscar información sobre código 58

## 🗄️ Base de Datos MySQL

### Tablas Principales
```sql
-- Datos brutos de Sheet.best
totem_data (10,554 registros)

-- Mapeos configurables  
carrera_totem (31 carreras mapeadas)
sector_facultad (mapeos sector → facultad)

-- Exámenes procesados
examenes (1,176 exámenes creados)
examenes_totem (metadatos TOTEM)
```

### Scripts de Configuración
```bash
# Mapeo automático inicial (YA EJECUTADO)
node scripts/mapear-carreras-automatico.js

# Configuración de aulas (PENDIENTE)
node scripts/configurar-aulas-iniciales.js
node scripts/configurar-aulas-uam.js
```

## 🔧 Archivos de Datos Incluidos

**CSVs de Referencia:**
- `Codcar_y_Carrera.csv` - Mapeo códigos → nombres carreras
- `sectores_202506061224.csv` - Mapeo sectores → facultades
- `consultacarreras.json` - Data estructurada de carreras

**Descargas Históricas:**
- `csv_downloads/` - 100+ archivos CSV históricos del TOTEM

## 🌍 Variables de Entorno

```env
DATABASE_URL="mysql://root:Chuvaca6013.@localhost:3306/ucasal_cronogramas"
NODE_ENV="development"
PORT=3001

# Sheet.best API (NO requiere autenticación adicional)
# URL directa funcional: https://api.sheetbest.com/sheets/16ccd035-8c9e-4218-b5f1-2da9939d7b3d
```

## 📈 Métricas de Rendimiento

### Antes vs Después de Optimización
| Métrica | Antes | Después | Mejora |
|---------|--------|---------|--------|
| Exámenes creados | 174 | 1,176 | +576% |
| Aprovechamiento | 13.3% | 90% | +576% |
| Carreras mapeadas | 5 | 31 | +520% |
| Errores HTTP | 401 continuo | 0 | 100% |
| Tiempo de sync | N/A | <30s | Optimal |

### Distribución por Tipo de Examen
- **1,098 Escritos en sede** (93.4%)
- **78 Orales** (6.6%)
- **0 sin aula asignada** (requerirá configuración manual)

## 🔄 Migración Completada

### ❌ **Sistema Anterior Removido**
- Google Sheets CSV directo (errores 401)
- `cronogramaService.js` (obsoleto)
- Endpoints `/cronogramas/*` (deprecados)

### ✅ **Sistema Actual Implementado**
- Sheet.best API integration
- `totemService.js` completo
- `sheetBestService.js` nuevo
- Endpoints `/totem/*` funcionales
- Mapeos automáticos configurados

## 🎯 Próximas Tareas Sugeridas

### Prioridad Alta
1. **Crear facultades faltantes** (Turismo, Minería)
2. **Investigar códigos genéricos** 350, 355, 361, 378
3. **Configurar asignación de aulas** (actualmente 0% tiene aula)

### Prioridad Media  
4. **Configurar otras 2 entradas** mencionadas por usuario
5. **Implementar consulta de inscriptos** por materia
6. **Sistema de asignación manual** de aulas por admin

### Prioridad Baja
7. Backoffice UI para gestión visual
8. Notificaciones automáticas de cambios
9. Exportación de reportes en PDF

## 🤝 Contexto para Futuros Desarrollos

**El proyecto evolucionó exitosamente de:**
- ❌ Sistema con 87% de datos desperdiciados y errores 401 constantes
- ✅ Sistema con 90% de aprovechamiento y operación 100% estable

**Arquitectura confirmada y funcionando:**
- Frontend: Backoffice en TypeScript/Next.js 
- API: Node.js + Prisma ORM
- Base de datos: MySQL optimizada
- Integración: Sheet.best API (reemplaza Google Sheets)

**El sistema está listo para producción** con las 7 carreras pendientes representando solo el 10% restante de optimización.

## 🎯 Características

- ✅ **Sincronización Centralizada** - Un solo Google Sheet para todas las facultades
- ✅ **Mapeos Configurables** - Sectores y carreras mapeables via API
- ✅ **Trazabilidad Completa** - Datos originales del TOTEM preservados
- ✅ **Sistema Escalable** - Fácil agregar nuevas facultades/carreras
- ✅ **API RESTful** - Endpoints bien documentados

## 📊 Google Sheet TOTEM

**URL**: [Finales Convergencia 2025](https://docs.google.com/spreadsheets/d/12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8/edit?gid=848244318#gid=848244318)

**Sheet.best API**: [https://api.sheetbest.com/sheets/16ccd035-8c9e-4218-b5f1-2da9939d7b3d](https://api.sheetbest.com/sheets/16ccd035-8c9e-4218-b5f1-2da9939d7b3d)

El sistema utiliza **Sheet.best** para obtener datos directamente desde Google Sheets en formato JSON, eliminando la necesidad de descarga y parsing manual de CSV.

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


# Sistema TOTEM Centralizado

## Resumen

El sistema TOTEM centralizado permite sincronizar datos de exámenes desde un Google Sheet único que contiene información de todas las facultades, organizados por sectores.

## Google Sheet de Origen

**URL**: [Finales Convergencia 2025](https://docs.google.com/spreadsheets/d/12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8/edit?gid=848244318#gid=848244318)

### Estructura de Datos del TOTEM

Cada fila del Google Sheet contiene:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| SECTOR | Identificador de facultad | 2, 3, 4, 21 |
| CARRERA | Código de carrera | 9, 15, 88, 113 |
| MODO | Modalidad | 7 |
| AREATEMA | Área temática | 19, 45, 60 |
| MATERIA | Código de materia | 130, 260, 1000 |
| NOMBRE CORTO | Nombre de la materia | "PORTUGUES I", "TEOLOGIA I" |
| FECHA | Fecha del examen | "2/6/2025" |
| URL | URL del campus virtual | "https://..." |
| CÁTEDRA | Información de cátedra | "-" |
| Docente | Nombre del docente | "DENISE FERRAO SANTANNA" |
| Hora | Hora del examen | "18:00" |
| Tipo Examen | Modalidad de examen | "ORAL", "Escrito en sede" |
| Monitoreo | Responsable de monitoreo | "ANDREA TEJERINA" |
| Control a cargo de | Responsable de control | "ANDREA TEJERINA" |
| Observaciones | Notas adicionales | "sin alumnos" |
| Material Permitido | Material permitido | "" |

## Arquitectura del Sistema

### Nuevas Tablas

#### 1. `sectores_facultades`
Mapea sectores del TOTEM a facultades locales.

```sql
CREATE TABLE sectores_facultades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sector VARCHAR(50) UNIQUE,
  facultad_id INT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. `carreras_totem`  
Mapea códigos de carreras del TOTEM a carreras locales.

```sql
CREATE TABLE carreras_totem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  codigo_totem VARCHAR(50) UNIQUE,
  carrera_id INT NULL,
  nombre_totem VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  es_mapeada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. `examenes_totem`
Almacena metadatos del TOTEM para cada examen creado.

```sql
CREATE TABLE examenes_totem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  examen_id INT UNIQUE,
  sector_totem VARCHAR(50),
  carrera_totem VARCHAR(50), 
  materia_totem VARCHAR(50),
  area_tema_totem VARCHAR(50),
  modo_totem VARCHAR(50),
  url_totem TEXT,
  catedra_totem VARCHAR(255),
  docente_totem VARCHAR(255),
  monitoreo_totem VARCHAR(255),
  control_totem VARCHAR(255),
  data_original JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

### Sincronización

#### `POST /api/v1/totem/sync`
Sincroniza todos los datos del TOTEM centralizado.

```bash
curl -X POST http://localhost:3000/api/v1/totem/sync
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Sincronización TOTEM completada exitosamente",
  "data": {
    "duration": 15000,
    "download": {
      "downloadedSheets": 5,
      "totalSheets": 5
    },
    "processedSheets": [
      {
        "sheetName": "Especial Junio",
        "examensCreated": 150
      }
    ],
    "totalExamsCreated": 150
  }
}
```

### Gestión de Mapeos

#### `GET /api/v1/totem/mapeos/sectores`
Obtiene mapeos de sectores a facultades.

```bash
curl "http://localhost:3000/api/v1/totem/mapeos/sectores?includeNoMapeados=true"
```

#### `POST /api/v1/totem/mapeos/sectores`
Crea un nuevo mapeo sector -> facultad.

```bash
curl -X POST http://localhost:3000/api/v1/totem/mapeos/sectores \
  -H "Content-Type: application/json" \
  -d '{"sector": "5", "facultadId": 1}'
```

#### `GET /api/v1/totem/mapeos/carreras`
Obtiene mapeos de carreras del TOTEM.

```bash
curl "http://localhost:3000/api/v1/totem/mapeos/carreras?soloNoMapeadas=true"
```

#### `POST /api/v1/totem/mapeos/carreras`
Mapea una carrera del TOTEM a una carrera local.

```bash
curl -X POST http://localhost:3000/api/v1/totem/mapeos/carreras \
  -H "Content-Type: application/json" \
  -d '{"codigoTotem": "113", "carreraId": 5}'
```

### Estadísticas

#### `GET /api/v1/totem/estadisticas`
Obtiene estadísticas del sistema TOTEM.

```bash
curl http://localhost:3000/api/v1/totem/estadisticas
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalRegistrosTotem": 1500,
    "totalExamenesCreados": 800,
    "sectoresNoMapeados": 2,
    "carrerasNoMapeadas": 15,
    "listaSectoresNoMapeados": ["6", "7"],
    "listaCarrerasNoMapeadas": [
      {
        "codigoTotem": "150",
        "nombreTotem": "Carrera TOTEM 150",
        "esMapeada": false
      }
    ]
  }
}
```

## Flujo de Trabajo

### 1. Configuración Inicial

```bash
# 1. Aplicar migraciones de base de datos
npx prisma db push

# 2. Ejecutar script de configuración inicial
node scripts/setup-totem-mapeos.js

# 3. Verificar mapeos creados
curl http://localhost:3000/api/v1/totem/mapeos/sectores
```

### 2. Primera Sincronización

```bash
# 1. Sincronizar datos del TOTEM
curl -X POST http://localhost:3000/api/v1/totem/sync

# 2. Verificar estadísticas
curl http://localhost:3000/api/v1/totem/estadisticas

# 3. Ver sectores no mapeados
curl "http://localhost:3000/api/v1/totem/mapeos/sectores?includeNoMapeados=true"

# 4. Ver carreras no mapeadas
curl "http://localhost:3000/api/v1/totem/mapeos/carreras?soloNoMapeadas=true"
```

### 3. Configurar Mapeos Faltantes

```bash
# Mapear sectores faltantes
curl -X POST http://localhost:3000/api/v1/totem/mapeos/sectores \
  -H "Content-Type: application/json" \
  -d '{"sector": "6", "facultadId": 2}'

# Mapear carreras faltantes
curl -X POST http://localhost:3000/api/v1/totem/mapeos/carreras \
  -H "Content-Type: application/json" \
  -d '{"codigoTotem": "150", "carreraId": 10}'
```

### 4. Re-sincronizar

```bash
# Volver a sincronizar para procesar datos previamente omitidos
curl -X POST http://localhost:3000/api/v1/totem/sync
```

## Ventajas del Sistema Centralizado

### ✅ Beneficios

1. **Sincronización Única**: Un solo endpoint sincroniza todas las facultades
2. **Datos Unificados**: Estructura consistente en todos los exámenes
3. **Trazabilidad**: Cada examen mantiene referencia a sus datos originales del TOTEM
4. **Flexibilidad**: Mapeos configurables entre códigos TOTEM y entidades locales
5. **Escalabilidad**: Fácil agregar nuevas facultades/carreras
6. **Automatización**: Menos intervención manual que el sistema anterior

### 📊 Comparación con Sistema Anterior

| Aspecto | Sistema Anterior | Sistema TOTEM Centralizado |
|---------|------------------|----------------------------|
| Sincronización | Por facultad individual | Todas las facultades de una vez |
| Configuración | Sheet ID por facultad | Un solo Sheet ID |
| Mapeos | Hardcodeados | Configurables via API |
| Mantenimiento | Alto (múltiples sheets) | Bajo (un sheet centralizado) |
| Consistencia | Variable por facultad | Uniforme |
| Trazabilidad | Limitada | Completa con datos originales |

## Notas Técnicas

### Manejo de Duplicados

El sistema evita duplicados comparando:
- `carreraId` + `nombreMateria` + `fecha`

### Datos Faltantes

- Si un sector no está mapeado → el examen se omite (se loggea)
- Si una carrera no está mapeada → se crea registro en `carreras_totem` sin mapear
- Si faltan datos requeridos → la fila se omite

### Rendimiento

- Procesamiento batch de todos los datos
- Queries optimizadas con índices
- Paginación en endpoints de consulta

## Próximos Pasos

1. **Integración con Aulas**: Mapear códigos de aulas del TOTEM
2. **Sincronización Automática**: Webhook o cron job para sincronización periódica  
3. **Dashboard**: Interface web para gestionar mapeos
4. **Notificaciones**: Alertas para sectores/carreras no mapeados
5. **Backup**: Sistema de respaldo antes de sincronizaciones 
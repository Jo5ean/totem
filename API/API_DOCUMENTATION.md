# 📚 API de TOTEM UCASAL

Esta es una API REST para gestionar cronogramas de exámenes de la Universidad Católica de Salta usando el sistema TOTEM centralizado.

## 🏗️ Arquitectura

```
src/
├── lib/                 # Configuraciones centrales
│   └── db.js           # Conexión a base de datos
├── services/           # Lógica de negocio
│   ├── facultadService.js
│   ├── totemService.js
│   └── googleSheetsService.js
├── controllers/        # Manejo de requests/responses
│   └── facultadController.js
├── middleware/         # Validaciones y middlewares
│   └── validation.js
└── pages/api/         # Endpoints REST
    └── v1/
        ├── facultades/
        └── totem/
            ├── mapeos/
            │   ├── sectores.js
            │   └── carreras.js
            ├── sync.js
            ├── estadisticas.js
            └── index.js
```

## 🔗 Endpoints Principales

### **Facultades**

#### `GET /api/v1/facultades`
Obtener todas las facultades con estadísticas.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "FACULTAD DE ECONOMIA Y ADMINISTRACION",
      "codigo": "ECON",
      "carreras": [...],
      "_count": {
        "carreras": 14,
        "syncLogs": 5
      }
    }
  ],
  "total": 7,
  "timestamp": "2025-06-04T12:00:00.000Z"
}
```

#### `POST /api/v1/facultades`
Crear nueva facultad.

```json
{
  "nombre": "Nueva Facultad",
  "codigo": "NF",
  "sheetId": "1ABC123..."
}
```

#### `GET /api/v1/facultades/[id]`
Obtener facultad específica por ID.

### **TOTEM - Sistema Centralizado**

#### `GET /api/v1/totem`
Obtener datos brutos del TOTEM con paginación.

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10, max: 100)

```json
{
  "success": true,
  "data": [
    {
      "id": 10554,
      "sheetName": "Especial Junio",
      "data": {
        "SECTOR": "21",
        "CARRERA": "113",
        "MATERIA": "2130",
        "NOMBRE CORTO": "GES. REC.HUM(SEM OP)",
        "FECHA": "10/6/2025",
        "Hora": "14:00",
        "Tipo Examen": "Escrito en sede",
        "Docente": "VERONICA ALEJANDRA VARGAS"
      },
      "timestamp": "2025-06-05T14:14:37.851Z",
      "processed": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 10554,
    "totalPages": 2111,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### `POST /api/v1/totem/sync`
Sincronizar todos los datos del TOTEM centralizado.

```bash
curl -X POST "http://localhost:3000/api/v1/totem/sync"
```

**Response:**
```json
{
  "success": true,
  "message": "Sincronización TOTEM completada exitosamente",
  "data": {
    "processedSheets": [
      {
        "sheetName": "Especial Junio",
        "examensCreated": 150,
        "rowsProcessed": 200
      }
    ],
    "totalExamsCreated": 150,
    "totalSheets": 5,
    "successfulSheets": 5,
    "duration": 15000
  }
}
```

#### `GET /api/v1/totem/estadisticas`
Obtener estadísticas del sistema TOTEM.

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

### **Mapeos de Sectores**

#### `GET /api/v1/totem/mapeos/sectores`
Obtener mapeos de sectores a facultades.

**Query Parameters:**
- `includeNoMapeados`: true/false - incluir sectores sin mapear

```json
{
  "success": true,
  "data": {
    "mapeos": [
      {
        "id": 1,
        "sector": "2",
        "facultadId": 1,
        "activo": true,
        "facultad": {
          "id": 1,
          "nombre": "FACULTAD DE ECONOMIA Y ADMINISTRACION"
        }
      }
    ],
    "sectoresNoMapeados": ["6", "7"]
  }
}
```

#### `POST /api/v1/totem/mapeos/sectores`
Crear mapeo sector → facultad.

```json
{
  "sector": "5",
  "facultadId": 1
}
```

#### `PUT /api/v1/totem/mapeos/sectores?id=1`
Actualizar mapeo de sector.

```json
{
  "facultadId": 2,
  "activo": true
}
```

#### `DELETE /api/v1/totem/mapeos/sectores?id=1`
Eliminar mapeo de sector.

### **Mapeos de Carreras**

#### `GET /api/v1/totem/mapeos/carreras`
Obtener mapeos de carreras del TOTEM.

**Query Parameters:**
- `soloNoMapeadas`: true/false - solo carreras sin mapear

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigoTotem": "113",
      "carreraId": 5,
      "nombreTotem": "Carrera TOTEM 113",
      "esMapeada": true,
      "carrera": {
        "id": 5,
        "nombre": "Licenciatura en Educación",
        "facultad": {
          "nombre": "ESCUELA DE EDUCACION"
        }
      }
    }
  ]
}
```

#### `POST /api/v1/totem/mapeos/carreras`
Mapear carrera TOTEM → carrera local.

```json
{
  "codigoTotem": "113",
  "carreraId": 5
}
```

#### `PUT /api/v1/totem/mapeos/carreras?codigoTotem=113`
Actualizar mapeo de carrera.

```json
{
  "carreraId": 6,
  "nombreTotem": "Nuevo nombre",
  "activo": true
}
```

## 🔧 Códigos de Estado

- `200` - OK
- `201` - Creado
- `400` - Error de validación
- `404` - No encontrado
- `405` - Método no permitido
- `500` - Error interno del servidor

## 🛡️ Validaciones

### Paginación
- `page`: Entero mayor a 0
- `limit`: Entero entre 1 y 100

### IDs
- Deben ser números enteros válidos
- `facultadId` debe existir en la base de datos
- `carreraId` debe existir en la base de datos

### Sectores
- `sector`: String requerido, código único del TOTEM

### Códigos TOTEM
- `codigoTotem`: String requerido, código único de carrera en TOTEM

## 🚀 Ejemplos de Uso

### Flujo Completo de Configuración

```bash
# 1. Obtener facultades disponibles
curl -X GET "http://localhost:3000/api/v1/facultades"

# 2. Crear mapeos de sectores
curl -X POST "http://localhost:3000/api/v1/totem/mapeos/sectores" \
  -H "Content-Type: application/json" \
  -d '{"sector": "2", "facultadId": 1}'

# 3. Sincronizar datos del TOTEM
curl -X POST "http://localhost:3000/api/v1/totem/sync"

# 4. Ver estadísticas
curl -X GET "http://localhost:3000/api/v1/totem/estadisticas"

# 5. Ver sectores no mapeados
curl -X GET "http://localhost:3000/api/v1/totem/mapeos/sectores?includeNoMapeados=true"

# 6. Ver carreras no mapeadas
curl -X GET "http://localhost:3000/api/v1/totem/mapeos/carreras?soloNoMapeadas=true"

# 7. Mapear carreras faltantes
curl -X POST "http://localhost:3000/api/v1/totem/mapeos/carreras" \
  -H "Content-Type: application/json" \
  -d '{"codigoTotem": "113", "carreraId": 5}'
```

### Consultar datos TOTEM

```bash
# Obtener datos brutos del TOTEM
curl -X GET "http://localhost:3000/api/v1/totem?page=1&limit=10"

# Obtener estadísticas completas
curl -X GET "http://localhost:3000/api/v1/totem/estadisticas"
```

## 📊 Estructura de Datos

### Google Sheet TOTEM
**URL**: [Finales Convergencia 2025](https://docs.google.com/spreadsheets/d/12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8/edit?gid=848244318#gid=848244318)

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| SECTOR | Identificador de facultad | 2, 3, 4, 21 |
| CARRERA | Código de carrera | 9, 15, 88, 113 |
| MATERIA | Código de materia | 130, 260, 1000 |
| NOMBRE CORTO | Nombre de la materia | "PORTUGUES I" |
| FECHA | Fecha del examen | "2/6/2025" |
| Hora | Hora del examen | "14:00" |
| Tipo Examen | Modalidad | "ORAL", "Escrito en sede" |
| Docente | Nombre del docente | "DENISE FERRAO SANTANNA" |

### Base de Datos

#### TotemData
```typescript
{
  id: number
  sheetName: string
  data: object[]
  timestamp: Date
  processed: boolean
}
```

#### SectorFacultad
```typescript
{
  id: number
  sector: string
  facultadId: number
  activo: boolean
  facultad: Facultad
}
```

#### CarreraTotem
```typescript
{
  id: number
  codigoTotem: string
  carreraId?: number
  nombreTotem: string
  esMapeada: boolean
  activo: boolean
  carrera?: Carrera
}
```

#### ExamenTotem
```typescript
{
  id: number
  examenId: number
  sectorTotem: string
  carreraTotem: string
  materiaTotem: string
  docenteTotem: string
  dataOriginal: object
  examen: Examen
}
```

## 🔄 Migración desde Sistema Anterior

El nuevo sistema TOTEM centralizado reemplaza el sistema anterior de sincronización por facultades individuales. 

**Ventajas:**
- ✅ Sincronización única para todas las facultades
- ✅ Datos unificados y consistentes
- ✅ Mapeos configurables via API
- ✅ Trazabilidad completa de datos originales
- ✅ Menor mantenimiento y configuración

Para migrar del sistema anterior:
1. Ejecutar `node scripts/setup-totem-mapeos.js`
2. Configurar mapeos via API
3. Realizar primera sincronización
4. Los endpoints antiguos de cronogramas han sido removidos 
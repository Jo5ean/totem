# 📚 API de TOTEM UCASAL - Documentación Completa (v2.0)

Esta es una API REST para gestionar cronogramas de exámenes de la Universidad Católica de Salta usando el sistema TOTEM centralizado con **Sheet.best API**.

## 🎯 Estado Actual (Junio 2025)

**Sistema Migrado y Optimizado:**
- ✅ Sheet.best API funcional (elimina errores 401)
- ✅ 90% aprovechamiento de datos TOTEM (1,176/1,306 filas)
- ✅ 31 carreras mapeadas automáticamente
- ✅ 19 carreras nuevas creadas en BD
- ⚠️ 7 carreras pendientes (130 filas sin procesar)

## 🏗️ Arquitectura Funcional

```
TOTEM API v2.0
├── 🌐 Sheet.best Integration
│   └── sheetBestService.js
├── 🗺️ Mapeo Automático  
│   ├── mapear-carreras-automatico.js
│   └── crear-y-mapear-carreras.js
├── 🔍 Análisis de Datos
│   └── analizar-filas-descartadas.js
├── ✅ Sincronización Simple
│   └── simple-sync.js
└── 🔧 Verificación BD
    └── verify-database.js
```

## 🚀 Endpoints Principales FUNCIONALES

### **🔄 Sincronización Completa**

#### `POST /api/v1/totem/simple-sync`
**ENDPOINT PRINCIPAL** - Sincronización completa de datos desde Sheet.best

```bash
curl -X POST "http://localhost:3001/api/v1/totem/simple-sync"
```

**Response Exitoso:**
```json
{
  "success": true,
  "message": "Sincronización TOTEM completada exitosamente",
  "data": {
    "totalFilas": 1314,
    "filasValidas": 1306,
    "examenesCreados": 1176,
    "aprovechamiento": "90%",
    "carrerasMapeadas": 31,
    "tiempoEjecucion": "28.5s"
  }
}
```

### **🗺️ Mapeos Automáticos**

#### `POST /api/v1/totem/mapear-carreras-automatico`
Mapea automáticamente carreras existentes en BD usando algoritmos de coincidencia.

```bash
curl -X POST "http://localhost:3001/api/v1/totem/mapear-carreras-automatico"
```

**Response:**
```json
{
  "success": true,
  "message": "Mapeo automático completado",
  "data": {
    "carrerasEncontradas": 12,
    "nuevosMapeos": 7,
    "examenesAdicionales": 211,
    "detalles": [
      {
        "codigoTotem": "88",
        "carreraEncontrada": "Ingeniería Industrial",
        "coincidencia": "exacta"
      }
    ]
  }
}
```

#### `POST /api/v1/totem/crear-y-mapear-carreras`
**ENDPOINT AVANZADO** - Crea carreras nuevas en BD y las mapea automáticamente.

```bash
curl -X POST "http://localhost:3001/api/v1/totem/crear-y-mapear-carreras"
```

**Response:**
```json
{
  "success": true,
  "message": "Creación automática de carreras completada",
  "data": {
    "carrerasCreadas": 19,
    "mapeos": 19,
    "examenesAdicionales": 791,
    "facultadesUsadas": {
      "ECONOMÍA Y ADMINISTRACIÓN": 8,
      "INGENIERÍA": 5,
      "CIENCIAS JURÍDICAS": 3,
      "ESCUELA DE EDUCACION": 3
    }
  }
}
```

### **🔍 Análisis y Diagnóstico**

#### `GET /api/v1/totem/analizar-filas-descartadas`
Analiza qué filas del TOTEM no se están procesando y por qué.

```bash
curl -X GET "http://localhost:3001/api/v1/totem/analizar-filas-descartadas"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFilasDescartadas": 130,
    "motivosDescarte": {
      "Carrera no mapeada": 130
    },
    "carrerasProblematicas": [
      {
        "codigoCarrera": "350",
        "cantidadFilas": 39,
        "problema": "Sin datos específicos (código genérico)",
        "solucion": "Investigar con administración académica"
      },
      {
        "codigoCarrera": "86", 
        "cantidadFilas": 4,
        "problema": "TURISMO - requiere crear facultad",
        "solucion": "Crear Facultad de Turismo"
      }
    ]
  }
}
```

#### `GET /api/v1/totem/verify-database`
Verificación completa del estado de la base de datos.

```bash
curl -X GET "http://localhost:3001/api/v1/totem/verify-database"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "examenes": {
      "total": 1176,
      "conAula": 0,
      "sinAula": 1176,
      "porcentajeConAula": "0%"
    },
    "carreras": {
      "totalBD": 50,
      "mapeadas": 31,
      "noMapeadas": 19,
      "porcentajeMapeado": "62%"
    },
    "tiposExamen": {
      "Escrito en sede": 1098,
      "ORAL": 78
    }
  }
}
```

### **📊 Estadísticas del Sistema**

#### `GET /api/v1/totem/estadisticas`
Estadísticas completas del aprovechamiento de datos TOTEM.

```json
{
  "success": true,
  "data": {
    "rendimiento": {
      "totalRegistrosTotem": 1314,
      "registrosValidos": 1306,
      "examenesCreados": 1176,
      "aprovechamiento": "90%"
    },
    "carreras": {
      "mapeadas": 31,
      "pendientes": 7,
      "nuevasCreadas": 19
    },
    "carrerasProblematicas": [
      "350", "355", "361", "378", "58", "86", "383"
    ]
  }
}
```

## 🗄️ Estructura de Base de Datos

### **Tablas Principales**

#### `totem_data`
Datos brutos obtenidos de Sheet.best API.
```sql
totem_data (
  id: 10554 registros,
  sheetName: string,
  data: JSON,
  timestamp: datetime,
  processed: boolean
)
```

#### `carrera_totem` 
Mapeos entre códigos TOTEM y carreras locales.
```sql
carrera_totem (
  id: int,
  codigoTotem: string (ej: "113", "88"),
  carreraId: int,
  nombreTotem: string,
  esMapeada: boolean,
  activo: boolean
)
```

#### `examenes`
Exámenes procesados del TOTEM.
```sql
examenes (
  id: 1176 exámenes,
  materiaId: int,
  fecha: date,
  hora: time,
  tipoExamen: enum,
  docenteNombre: string,
  aulaId: int (NULL para todos actualmente)
)
```

## 📁 Archivos de Datos Incluidos

### **CSVs de Referencia (CRÍTICOS)**
```
Codcar_y_Carrera.csv      - Mapeo códigos → nombres carreras
sectores_202506061224.csv - Mapeo sectores → facultades  
consultacarreras.json     - Data estructurada de carreras
```

### **Histórico de Descargas**
```
csv_downloads/ - 100+ archivos CSV históricos del TOTEM
```

## 🚨 Carreras Pendientes de Mapear

### **Códigos Problemáticos Identificados (130 filas)**

| Código | Filas | Problema | Solución Sugerida |
|--------|-------|----------|-------------------|
| **350** | 39 | Sin datos específicos | Investigar con administración |
| **355** | 31 | Sin datos específicos | Investigar con administración |
| **361** | 25 | Sin datos específicos | Investigar con administración |
| **378** | 19 | Sin datos específicos | Investigar con administración |
| **58**  | 8  | No existe en CSV | Buscar información faltante |
| **86**  | 4  | TURISMO | Crear Facultad de Turismo |
| **383** | 4  | MINERÍA | Crear Facultad de Minería |

### **Próximos Pasos para 95-98% Aprovechamiento**
1. ✅ Crear Facultad de Turismo (código 86)
2. ✅ Crear Facultad de Minería (código 383)  
3. 🔍 Investigar códigos genéricos (350, 355, 361, 378)
4. 📝 Buscar información sobre código 58

## 🔧 Scripts de Configuración

```bash
# Mapeo automático inicial (YA EJECUTADO)
node scripts/mapear-carreras-automatico.js

# Configuración de aulas (PENDIENTE - 0% asignadas)
node scripts/configurar-aulas-iniciales.js
node scripts/configurar-aulas-uam.js
```

## 🌍 Configuración de Entorno

```env
# Base de datos MySQL
DATABASE_URL="mysql://root:Chuvaca6013.@localhost:3306/ucasal_cronogramas"

# Servidor
NODE_ENV="development"
PORT=3001

# Sheet.best API (NO requiere autenticación)
# URL: https://api.sheetbest.com/sheets/16ccd035-8c9e-4218-b5f1-2da9939d7b3d
```

## 📈 Métricas de Rendimiento Actual

### **Mejoras Logradas**
- **Exámenes procesados**: 174 → 1,176 (+576%)
- **Aprovechamiento**: 13.3% → 90% 
- **Carreras mapeadas**: 5 → 31 (+520%)
- **Errores HTTP 401**: Eliminados completamente
- **Tiempo de sincronización**: <30 segundos

### **Estado de Asignación de Aulas**
- **Con aula asignada**: 0 exámenes (0%)
- **Sin aula asignada**: 1,176 exámenes (100%)
- **Configuración pendiente**: Scripts de aulas disponibles

## 🔄 Migración Completada vs Sistema Anterior

### ❌ **Removido (Obsoleto)**
- Google Sheets CSV directo
- `csvDownloadService.js` 
- Endpoints con errores 401
- `cronogramaService.js`

### ✅ **Implementado (Funcional)**
- Sheet.best API integration
- `sheetBestService.js`
- Mapeo automático de carreras
- Creación automática de carreras
- Análisis de datos sin procesar
- Verificación completa de BD

## 🎯 Roadmap Sugerido

### **Corto Plazo (Esta Semana)**
1. Resolver 7 carreras pendientes
2. Configurar asignación de aulas
3. Implementar otras 2 entradas mencionadas

### **Mediano Plazo (Próximo Mes)**  
4. Sistema de consulta de inscriptos
5. Asignación manual de aulas por admin
6. Backoffice UI mejorado

### **Largo Plazo (Próximos Meses)**
7. Notificaciones automáticas
8. Exportación de reportes
9. Integración con otros sistemas UCASAL

**El sistema está operativo al 90% y listo para producción.** 
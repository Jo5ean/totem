# 🎯 SISTEMA TOTEM - DOCUMENTACIÓN DE RUTAS

## 📋 **Índice de Endpoints**

### **1. 🏢 GESTIÓN DE AULAS**
- `GET /api/v1/aulas` - Listar aulas
- `POST /api/v1/aulas` - Crear aula
- `GET /api/v1/aulas/[id]` - Obtener aula específica
- `PUT /api/v1/aulas/[id]` - Actualizar aula
- `DELETE /api/v1/aulas/[id]` - Eliminar aula

### **2. 📋 GESTIÓN DE ACTAS**
- `GET /api/v1/actas` - Listar actas/inscripciones
- `POST /api/v1/actas` - Crear inscripciones masivas
- `POST /api/v1/actas/importar` - Importar desde CSV/JSON

### **3. 🎯 CONSULTA TOTEM**
- `GET /api/v1/totem/consulta?dni=12345678` - Consulta principal del estudiante

### **4. 🔧 ADMINISTRACIÓN DE EXÁMENES**
- `PUT /api/v1/examenes/[id]/asignar-aula` - Asignar aula a examen
- `GET /api/v1/totem` - Listar cronogramas (ya existente)
- `POST /api/v1/totem/sync` - Sincronizar cronogramas (ya existente)

### **5. 📊 DASHBOARD Y ESTADÍSTICAS**
- `GET /api/v1/dashboard/resumen` - Estadísticas generales del sistema

---

## 🔍 **Detalles de Endpoints**

### **🏢 AULAS**

#### `GET /api/v1/aulas`
**Listar aulas con filtros y paginación**
```bash
GET /api/v1/aulas?page=1&limit=20&disponible=true&search=aula1
```

**Parámetros:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 20)
- `disponible` (opcional): Filtrar por disponibilidad (true/false)
- `search` (opcional): Buscar por nombre o ubicación

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Aula Magna",
      "capacidad": 200,
      "ubicacion": "Planta Baja",
      "disponible": true,
      "_count": { "examenes": 5 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### `POST /api/v1/aulas`
**Crear nueva aula**
```json
{
  "nombre": "Aula 101",
  "capacidad": 50,
  "ubicacion": "Primer Piso",
  "disponible": true
}
```

#### `PUT /api/v1/aulas/[id]`
**Actualizar aula existente**
```json
{
  "nombre": "Aula 101 - Renovada",
  "capacidad": 60,
  "disponible": true
}
```

---

### **📋 ACTAS**

#### `GET /api/v1/actas`
**Listar inscripciones de estudiantes**
```bash
GET /api/v1/actas?examenId=123&dni=12345678&search=juan
```

**Parámetros:**
- `examenId` (opcional): Filtrar por examen específico
- `dni` (opcional): Filtrar por DNI del estudiante
- `search` (opcional): Buscar por nombre, apellido o materia

#### `POST /api/v1/actas`
**Inscribir estudiantes a un examen**
```json
{
  "examenId": 123,
  "estudiantes": [
    {
      "dni": "12345678",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@email.com"
    },
    {
      "dni": "87654321",
      "nombre": "Ana",
      "apellido": "García"
    }
  ]
}
```

#### `POST /api/v1/actas/importar`
**Importación masiva de actas**
```json
{
  "examenId": 123,
  "tipo": "csv",
  "validarExistencia": true,
  "datos": [
    ["12345678", "Pérez", "Juan", "juan@email.com"],
    ["87654321", "García", "Ana", "ana@email.com"]
  ]
}
```

**O formato JSON:**
```json
{
  "examenId": 123,
  "tipo": "json",
  "datos": [
    {"dni": "12345678", "apellido": "Pérez", "nombre": "Juan", "email": "juan@email.com"},
    {"dni": "87654321", "apellido": "García", "nombre": "Ana"}
  ]
}
```

---

### **🎯 CONSULTA TOTEM**

#### `GET /api/v1/totem/consulta?dni=12345678`
**Consulta principal para estudiantes**

**Respuesta:**
```json
{
  "success": true,
  "estudiante": {
    "dni": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@email.com"
  },
  "resumen": {
    "totalExamenes": 3,
    "proximosExamenes": 2,
    "examenesRendidos": 1,
    "examenesConAula": 2,
    "examenesSinAula": 1
  },
  "examenes": {
    "proximos": [
      {
        "id": 123,
        "fecha": "2024-02-15",
        "hora": "14:00",
        "materia": {
          "codigo": "MAT101",
          "nombre": "Matemática I"
        },
        "carrera": {
          "codigo": "ING001",
          "nombre": "Ingeniería en Sistemas"
        },
        "facultad": {
          "nombre": "Facultad de Ingeniería"
        },
        "aula": {
          "nombre": "Aula 101",
          "ubicacion": "Primer Piso",
          "capacidad": 50
        },
        "estado": {
          "tieneAula": true,
          "presente": false,
          "nota": null
        }
      }
    ],
    "pasados": []
  }
}
```

---

### **🔧 ADMINISTRACIÓN**

#### `PUT /api/v1/examenes/[id]/asignar-aula`
**Asignar aula a un examen**
```json
{
  "aulaId": 5
}
```

**Validaciones automáticas:**
- ✅ Aula disponible
- ✅ Sin conflictos de horario
- ✅ Capacidad suficiente
- ✅ Examen existe

---

### **📊 DASHBOARD**

#### `GET /api/v1/dashboard/resumen`
**Estadísticas completas del sistema**

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "resumenGeneral": {
      "totalExamenes": 150,
      "totalEstudiantes": 1200,
      "totalAulas": 25,
      "totalInscripciones": 3500,
      "examenesConAula": 120,
      "examenesSinAula": 30,
      "porcentajeExamenesConAula": 80,
      "aulasDisponibles": 20,
      "proximosExamenes": 45,
      "estudiantesActivos": 800
    },
    "estadisticasPorFacultad": [
      {
        "id": 1,
        "nombre": "Facultad de Ingeniería",
        "totalExamenes": 75,
        "totalCarreras": 5
      }
    ],
    "proximosExamenes": [
      {
        "id": 123,
        "fecha": "2024-02-15",
        "hora": "14:00",
        "materia": "Matemática I",
        "carrera": "Ingeniería en Sistemas",
        "aula": "Aula 101",
        "estudiantesInscriptos": 35,
        "estado": "Completo"
      }
    ],
    "alertas": [
      {
        "tipo": "warning",
        "mensaje": "30 exámenes sin aula asignada",
        "cantidad": 30
      }
    ]
  }
}
```

---

## 🔄 **Flujo de Trabajo TOTEM**

### **1. Configuración Inicial**
1. Crear aulas: `POST /api/v1/aulas`
2. Sincronizar cronogramas: `POST /api/v1/totem/sync`

### **2. Gestión de Inscripciones**
1. Importar actas: `POST /api/v1/actas/importar`
2. O inscribir individualmente: `POST /api/v1/actas`

### **3. Asignación de Aulas**
1. Ver exámenes sin aula: `GET /api/v1/dashboard/resumen`
2. Asignar aula: `PUT /api/v1/examenes/[id]/asignar-aula`

### **4. Consulta de Estudiantes**
1. Estudiante consulta: `GET /api/v1/totem/consulta?dni=12345678`

---

## 📝 **Códigos de Estado HTTP**

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Error en parámetros
- `404` - No encontrado
- `405` - Método no permitido
- `409` - Conflicto (duplicado, horario ocupado, etc.)
- `500` - Error interno del servidor

---

## 🔐 **Formato de Respuesta Estándar**

```json
{
  "success": true|false,
  "data": {},
  "message": "Mensaje descriptivo",
  "pagination": {}, // Solo en listados
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚀 **Ejemplos de Uso**

### **Crear aula y asignar a examen**
```bash
# 1. Crear aula
curl -X POST http://localhost:3000/api/v1/aulas \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Aula 201","capacidad":80,"ubicacion":"Segundo Piso"}'

# 2. Asignar aula a examen
curl -X PUT http://localhost:3000/api/v1/examenes/123/asignar-aula \
  -H "Content-Type: application/json" \
  -d '{"aulaId":1}'
```

### **Inscribir estudiantes masivamente**
```bash
curl -X POST http://localhost:3000/api/v1/actas/importar \
  -H "Content-Type: application/json" \
  -d '{
    "examenId": 123,
    "tipo": "csv",
    "datos": [
      ["12345678","Pérez","Juan","juan@email.com"],
      ["87654321","García","Ana","ana@email.com"]
    ]
  }'
```

### **Consulta de estudiante**
```bash
curl "http://localhost:3000/api/v1/totem/consulta?dni=12345678"
``` 
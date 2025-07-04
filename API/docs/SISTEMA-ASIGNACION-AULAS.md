# 🎯 Sistema de Asignación Inteligente de Aulas

## 📋 **RESUMEN EJECUTIVO**

Sistema automatizado para la **asignación óptima de aulas** basado en:
- **Inscripciones reales** de estudiantes desde sistema externo UCASAL
- **Organización por facultad** (misma facultad → misma aula)
- **Optimización de capacidad** (completar aulas progresivamente)
- **Gestión por horarios** (aula libre después de cada examen)

---

## 🏫 **AULAS DISPONIBLES UAM 03**

| Aula | Capacidad | Ubicación |
|------|-----------|-----------|
| **Aula 4** | 72 personas | Edificio Principal |
| **Aula 8** | 71 personas | Edificio Principal |
| **Aula 12** | 69 personas | Edificio Principal |
| **Laboratorio Informático** | 34 personas | Laboratorio |
| **TOTAL** | **246 personas** | |

---

## 🧮 **ALGORITMO DE ASIGNACIÓN**

### **Paso 1: Agrupación por Horario**
```
Examenes agrupados por: [FECHA]-[HORA]
Ejemplo: "2024-06-15-08:00"
```

### **Paso 2: Organización por Facultad**
```
Por cada horario:
  - Agrupar exámenes por facultad
  - Priorizar mantener facultad en misma aula
```

### **Paso 3: Asignación Optimizada**
```
Aulas ordenadas por capacidad (mayor → menor):
1. Aula 4 (72)
2. Aula 8 (71) 
3. Aula 12 (69)
4. Lab. Informático (34)
```

### **Paso 4: Validación de Capacidad**
```
Para cada examen:
  - Consultar inscripciones reales (sistema externo)
  - Verificar: alumnos_inscritos ≤ capacidad_aula
  - Generar alertas si hay déficit
```

---

## 🚀 **ARQUITECTURA TÉCNICA**

### **Backend (API)**
```
📁 API/src/pages/api/v1/
├── examenes/
│   ├── index.js                    # Listar exámenes con filtros
│   └── [id]/
│       ├── asignar-aula.js        # Asignación manual
│       ├── asignar-automatico.js  # Asignación auto
│       └── inscripciones.js       # Datos del sistema externo
├── asignacion/
│   └── automatica.js              # Algoritmo principal
└── aulas/
    └── index.js                   # CRUD de aulas
```

### **Frontend (Backoffice)**
```
📁 backoffice/src/app/
└── asignacion-aulas/
    └── page.tsx                   # Dashboard principal
```

### **Scripts de Configuración**
```
📁 API/scripts/
└── configurar-aulas-uam.js       # Setup inicial de aulas
```

---

## 💻 **FUNCIONALIDADES DEL DASHBOARD**

### **🎯 Panel Principal**
- **Vista de exámenes** sin aula asignada (próximos 30 días)
- **Estadísticas en tiempo real**:
  - Total exámenes sin aula
  - Propuestas viables 
  - Casos sin solución
  - Capacidad total disponible

### **⚡ Generación de Propuestas**
1. **Botón "Generar Propuesta"**: Ejecuta algoritmo completo
2. **Vista previa** de asignaciones sugeridas
3. **Validación** de capacidad vs inscripciones reales
4. **Detección de conflictos** automática

### **✅ Confirmación de Asignaciones**
- **Asignación individual**: Confirmar examen por examen
- **Asignación masiva**: Confirmar todas las propuestas viables
- **Actualización automática** de la base de datos

### **📊 Dashboard Visual**
- **Agrupación por horarios** (fecha + hora)
- **Código de colores**:
  - 🟢 Verde: Asignación viable
  - 🔴 Rojo: Sin solución / conflicto
- **Información contextual**:
  - Materia, carrera, facultad
  - Cantidad de alumnos estimada/real
  - Propuesta de aula con justificación

---

## 🔧 **CONFIGURACIÓN E INSTALACIÓN**

### **1. Configurar Aulas**
```bash
cd API
node scripts/configurar-aulas-uam.js
```

### **2. Verificar Endpoints**
```bash
# Listar exámenes sin aula
GET /api/v1/examenes?soloSinAula=true

# Generar propuesta automática
POST /api/v1/asignacion/automatica

# Asignar aula manualmente
POST /api/v1/examenes/{id}/asignar-aula
```

### **3. Acceder al Dashboard**
```
URL: http://localhost:3001/asignacion-aulas
```

---

## 📋 **FLUJO DE TRABAJO**

### **Proceso Típico**
1. **📥 Sincronización TOTEM**: Importar cronograma de exámenes
2. **🔍 Detección automática**: Sistema identifica exámenes sin aula
3. **🎯 Acceso al dashboard**: `/asignacion-aulas`
4. **⚡ Generar propuesta**: Clic en "Generar Propuesta"
5. **📊 Revisar asignaciones**: Vista previa con validaciones
6. **✅ Confirmar**: Individual o masiva
7. **🔄 Actualización**: Base de datos actualizada automáticamente

### **Casos de Uso**
- **Asignación semanal**: Planificar exámenes de la próxima semana
- **Asignación mensual**: Vista completa del mes académico
- **Resolución de conflictos**: Reasignación cuando hay sobrecupo
- **Optimización de recursos**: Maximizar uso de aulas grandes

---

## 📈 **VENTAJAS DEL SISTEMA**

### **🎯 Automatización**
- Eliminación de asignación manual propensa a errores
- Cálculo instantáneo de propuestas optimizadas
- Validación automática de capacidades

### **📊 Optimización**
- **Eficiencia de aulas**: Completar aulas grandes primero
- **Organización académica**: Mantener facultades agrupadas
- **Gestión de horarios**: Aprovechamiento por franjas horarias

### **🔍 Transparencia**
- Justificación clara de cada asignación
- Detección proactiva de problemas
- Trazabilidad completa del proceso

### **⚡ Velocidad**
- Propuestas generadas en segundos
- Confirmación masiva en un clic
- Actualización en tiempo real

---

## 🚨 **ALERTAS Y VALIDACIONES**

### **Detección Automática**
- ❌ **Sin aula disponible**: Más alumnos que capacidad total
- ⚠️ **Capacidad insuficiente**: Aula asignada pero con déficit
- 🔍 **Sin inscripciones**: No se pudieron consultar datos externos
- 📅 **Conflicto horario**: Misma aula en mismo horario

### **Sistema de Colores**
- 🟢 **Verde**: Asignación viable y confirmada
- 🟡 **Amarillo**: Propuesta pendiente de confirmación  
- 🔴 **Rojo**: Problema detectado - requiere intervención
- ⚪ **Gris**: Sin propuesta generada

---

## 🔄 **INTEGRACIÓN CON SISTEMAS**

### **Sistema TOTEM**
- Importación automática de cronogramas
- Mapeo de facultades y carreras
- Sincronización bidireccional

### **Sistema Externo UCASAL**
- Consulta de inscripciones reales
- Validación de capacidad vs demanda
- Datos actualizados por examen

### **Base de Datos Local**
- Almacenamiento de asignaciones
- Histórico de decisiones
- Configuración de aulas

---

## 📞 **SOPORTE Y MANTENIMIENTO**

### **Logs del Sistema**
```bash
# Ver logs de asignación
tail -f logs/asignacion-aulas.log

# Verificar estado de aulas
GET /api/v1/aulas
```

### **Comandos Útiles**
```bash
# Resetear todas las asignaciones
POST /api/v1/examenes/resetear-asignaciones

# Regenerar propuestas
POST /api/v1/asignacion/automatica

# Verificar integridad
GET /api/v1/dashboard/integracion-completa
```

---

## 🎉 **RESULTADOS ESPERADOS**

### **Métricas de Éxito**
- ⚡ **Tiempo de asignación**: De horas a minutos
- 🎯 **Precisión**: 95%+ de asignaciones correctas
- 📊 **Utilización**: Optimización de capacidad instalada
- 😊 **Satisfacción**: Reducción de conflictos académicos

### **Impacto Organizacional**
- Automatización completa del proceso de asignación
- Reducción drástica de errores humanos
- Optimización del uso de infraestructura
- Mejor experiencia para estudiantes y docentes

---

*Documentación generada para el Sistema de Asignación Inteligente de Aulas UCASAL - v1.0* 
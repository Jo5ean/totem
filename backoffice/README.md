# 🎯 TOTEM Backoffice - UCASAL

Sistema de administración web para la gestión de cronogramas de exámenes de la Universidad Católica de Salta.

## 📋 Descripción

El **TOTEM Backoffice** es una interfaz web moderna desarrollada en Next.js que permite gestionar y visualizar los datos del sistema TOTEM centralizado. Proporciona herramientas para configurar mapeos, visualizar estadísticas y administrar el flujo de datos de cronogramas de exámenes.

## 🚀 Funcionalidades Principales

### 📊 Dashboard
- **Estadísticas en tiempo real** del sistema TOTEM
- **Indicadores visuales** de sectores y carreras sin mapear
- **Alertas inteligentes** para configuraciones pendientes
- **Botón de sincronización** rápida

### 🏛️ Gestión de Facultades
- **Listado completo** de facultades registradas
- **Creación de nuevas facultades** con validación
- **Estadísticas por facultad** (carreras y sincronizaciones)
- **Visualización de detalles** de cada facultad

### 🔀 Mapeos de Sectores
- **Configuración de mapeos** sector TOTEM → facultad
- **Mapeo rápido** desde sectores no configurados
- **Gestión completa** (crear, actualizar, eliminar)
- **Visualización del estado** de mapeos activos/inactivos

### 📚 Mapeos de Carreras
- **Listado de carreras TOTEM** con estado de mapeo
- **Filtros avanzados** (todas, mapeadas, sin mapear)
- **Estadísticas detalladas** de mapeos
- **Interfaz para mapeo** de carreras pendientes

### 📈 Estadísticas Avanzadas
- **Gráficos interactivos** con Recharts
- **KPIs del sistema** (eficiencia, totales, etc.)
- **Distribución por facultades** en gráficos de barras
- **Estados de mapeo** en gráficos circulares
- **Detalles de elementos** sin mapear

### 📋 Datos TOTEM
- **Visualización paginada** de datos brutos
- **Información detallada** de cada registro
- **Estados de procesamiento** de registros
- **Metadatos de sincronización**

### ⚙️ Configuración
- **Estado de la API** en tiempo real
- **Ejecución manual** de sincronizaciones
- **Información del sistema** y configuración
- **Verificación de conectividad** automática

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15.3.3 (App Router)
- **Frontend**: React 19 + TypeScript
- **Estilos**: Tailwind CSS 4
- **Iconos**: Heroicons
- **Gráficos**: Recharts
- **Notificaciones**: React Hot Toast
- **Validaciones**: Zod + React Hook Form
- **Utilidades**: clsx, date-fns

## 📁 Estructura del Proyecto

```
backoffice/
├── src/
│   ├── app/                          # App Router (Next.js 15)
│   │   ├── layout.tsx               # Layout principal
│   │   ├── page.tsx                 # Dashboard principal
│   │   ├── facultades/              # Gestión de facultades
│   │   ├── mapeos-sectores/         # Mapeos de sectores
│   │   ├── mapeos-carreras/         # Mapeos de carreras
│   │   ├── estadisticas/            # Estadísticas y gráficos
│   │   ├── datos-totem/             # Visualización de datos
│   │   ├── configuracion/           # Configuración del sistema
│   │   └── globals.css              # Estilos globales
│   ├── components/
│   │   └── Layout.tsx               # Componente de navegación
│   └── lib/
│       ├── api.ts                   # Cliente de API + tipos TypeScript
│       └── toast.ts                 # Configuración de notificaciones
├── public/                          # Archivos estáticos
├── .env.example                     # Variables de entorno de ejemplo
├── package.json                     # Dependencias y scripts
├── tailwind.config.js              # Configuración de Tailwind
├── tsconfig.json                    # Configuración de TypeScript
└── next.config.ts                   # Configuración de Next.js
```

## 🚀 Instalación y Ejecución

### Prerrequisitos
- **Node.js** 18+ 
- **npm** o **yarn**
- **API TOTEM** ejecutándose (puerto 3000 por defecto)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd backoffice
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar configuración si es necesario
# Por defecto apunta a http://localhost:3000/api/v1
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:3001
```

### Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo (con Turbopack)
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Verificación de código
```

## ⚙️ Variables de Entorno

### Configuración para Desarrollo
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
PORT=3001
```

### Configuración para Producción
```bash
# .env.production
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api/v1
PORT=3001
```

### Variables Disponibles
- `NEXT_PUBLIC_API_URL`: URL base de la API TOTEM (requerida)
- `PORT`: Puerto del backoffice (opcional, por defecto 3000 pero usará 3001 automáticamente)

## 🔌 Integración con la API

El backoffice se conecta automáticamente con la **API TOTEM** para:

- **Obtener estadísticas** del sistema
- **Gestionar facultades** y sus datos
- **Configurar mapeos** de sectores y carreras
- **Ejecutar sincronizaciones** del TOTEM
- **Visualizar datos brutos** sincronizados

### Configuración de la API

Por defecto, el backoffice se conecta a `http://localhost:3000/api/v1`. Para cambiar esto:

1. **Variables de entorno**:
```bash
NEXT_PUBLIC_API_URL=http://tu-api-url/api/v1
```

2. **Verificación automática**: El sistema verifica la conectividad cada 30 segundos

## 📊 Características de la Interfaz

### 🎨 Diseño Moderno
- **Sidebar responsive** con navegación intuitiva
- **Dashboard visual** con métricas importantes
- **Modo dark/light** preparado (Tailwind CSS)
- **Componentes reutilizables** y modulares

### 📱 Responsive
- **Diseño mobile-first** con Tailwind CSS
- **Navegación adaptativa** en dispositivos pequeños
- **Grillas responsivas** para contenido
- **Tipografía escalable** automáticamente

### ⚡ Rendimiento
- **Next.js 15** con App Router para máximo rendimiento
- **Turbopack** para builds ultrarrápidos en desarrollo
- **Componentes lazy** para carga optimizada
- **Caching inteligente** de datos de la API

### 🔔 UX/UI Optimizada
- **Notificaciones toast** para feedback inmediato
- **Estados de carga** en todas las operaciones
- **Confirmaciones** para acciones destructivas
- **Validaciones en tiempo real** en formularios

## 🔧 Desarrollo

### Estructura de Componentes

Cada página sigue el patrón:

```typescript
'use client';
// 1. Imports necesarios
import { useState, useEffect } from 'react';
import { totemApi } from '@/lib/api';
import { showSuccess, showError } from '@/lib/toast';

// 2. Componente principal
export default function MiPagina() {
  // 3. Estados locales
  const [data, setData] = useState([]);

  // 4. Efectos y handlers
  useEffect(() => {
    // Cargar datos
  }, []);

  // 5. JSX con Tailwind CSS
  return (
    <div className="p-6">
      {/* Contenido */}
    </div>
  );
}
```

## 🚀 Setup para Nueva PC

### 1. Clonar y Configurar
```bash
# Clonar repositorio
git clone [url-repo]
cd totem/backoffice

# Instalar dependencias
npm install

# Configurar entorno
cp .env.example .env.local
```

### 2. Verificar Configuración
```bash
# Verificar que la API esté corriendo en puerto 3000
curl http://localhost:3000/api/v1/totem/estadisticas

# Iniciar backoffice
npm run dev
```

### 3. Acceder al Sistema
- **Backoffice**: http://localhost:3001
- **API**: http://localhost:3000/api/v1

## 🛡️ Seguridad y Calidad

- ✅ **0 vulnerabilidades** de seguridad
- ✅ **TypeScript estricto** para type safety
- ✅ **ESLint configurado** para calidad de código
- ✅ **Variables de entorno** para configuración segura
- ✅ **Sin URLs hardcodeadas** en producción

---

*Documentación actualizada - Diciembre 2024*

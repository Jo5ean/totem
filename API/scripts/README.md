# Scripts del Sistema TOTEM

Este directorio contiene scripts de configuración y mantenimiento del sistema TOTEM.

## 🚀 **Inicialización Completa (NUEVO DESARROLLADOR)**

### Para máquinas nuevas o después de `git pull`:

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar base de datos (archivo .env)
DATABASE_URL="mysql://usuario:password@localhost:3306/ucasal_cronogramas"

# 3. Ejecutar migraciones de Prisma
npx prisma migrate dev

# 4. ¡INICIALIZAR SISTEMA COMPLETO!
node scripts/inicializar-desde-cero.js
```

Este script único hará **TODA** la configuración inicial:
- ✅ Crea 14 facultades
- ✅ Crea 90+ carreras (desde CSV o básicas)
- ✅ Crea 6 aulas iniciales
- ✅ Crea mapeos sectores ↔ facultades
- ✅ Crea mapeos carreras ↔ TOTEM

### Después de la inicialización:

```bash
# 5. Iniciar servidor API
npm run dev

# 6. Sincronizar datos desde Google Sheets
curl -X POST http://localhost:3000/api/v1/totem/sync
```

## 📋 **Scripts Disponibles**

### 🏗️ **Configuración Inicial**
- `inicializar-desde-cero.js` - **PRINCIPAL** - Setup completo para máquinas nuevas
- `configurar-aulas-iniciales.js` - Solo configuración de aulas
- `setup-totem-mapeos.js` - Solo mapeos TOTEM

### 🗺️ **Mapeos**
- `mapear-carreras-automatico.js` - Mapeo automático desde CSV

### 🧹 **Mantenimiento**
- Archivos temporales eliminados después de cada debugging

## 🎯 **Para Desarrolladores Nuevos**

Si eres un desarrollador nuevo en el proyecto:

1. **Clona el repositorio**
2. **Ejecuta SOLO estos comandos:**
   ```bash
   npm install
   npx prisma migrate dev
   node scripts/inicializar-desde-cero.js
   npm run dev
   ```
3. **¡Listo!** El sistema estará funcionando completamente

## ⚠️ **Notas Importantes**

- **NO ejecutes scripts individuales** a menos que sepas exactamente qué hacen
- **El script `inicializar-desde-cero.js` es idempotente** - puedes ejecutarlo múltiples veces sin problemas
- **Los CSVs** (`sectores_202506061224.csv`, `Codcar_y_Carrera.csv`) deben estar en la raíz de `/API/`
- **Si faltan CSVs**, el script creará datos básicos automáticamente

## 🔄 **Sincronización TOTEM**

Después de la inicialización, sincroniza con Google Sheets:

```bash
# Sincronización completa
curl -X POST http://localhost:3000/api/v1/totem/sync

# Verificar mapeos
curl http://localhost:3000/api/v1/facultades

# Ver exámenes por fecha
curl "http://localhost:3000/api/v1/examenes/por-fecha?fecha=2025-06-30"
```

## 🎉 **Resultado Esperado**

Después de ejecutar todo:
- ~1,305 exámenes (coincide con Google Sheets)
- 0 duplicados
- Inscriptos funcionando via API externa
- Mapeos correctos de sectores/carreras

## 🚀 Setup Rápido (Recomendado)

```bash
# 1. Asegúrate de que el servidor esté corriendo
npm start

# 2. Ejecuta el script maestro (en otra terminal)
node scripts/setup-completo.js
```

¡Eso es todo! El script maestro ejecutará automáticamente todos los pasos necesarios.

## 📋 Scripts Individuales

Si prefieres ejecutar los scripts uno por uno:

### 1. `configurar-aulas-iniciales.js`
```bash
node scripts/configurar-aulas-iniciales.js
```
**Qué hace:**
- Crea las 5 aulas principales del sistema
- Configura capacidades: Aula 4 (72), Aula 8 (71), Aula 12 (69), Lab Informático (34), Notebooks (26)
- Establece criterios de asignación automática

### 2. `setup-totem-mapeos.js`
```bash
node scripts/setup-totem-mapeos.js
```
**Qué hace:**
- Mapea sectores del TOTEM a facultades
- Establece relaciones: Sector 2→Economía, Sector 3→Jurídicas, Sector 4→Ingeniería, etc.

### 3. `mapear-carreras-automatico.js`
```bash
node scripts/mapear-carreras-automatico.js
```
**Qué hace:**
- Mapea automáticamente ~70 carreras usando datos del CSV oficial
- Relaciona códigos TOTEM con carreras de la base de datos
- Actualiza nombres de carreras desde el CSV de UCASAL

### 4. `setup-completo.js` (Script Maestro)
```bash
node scripts/setup-completo.js
```
**Qué hace:**
- Ejecuta todos los scripts anteriores en orden
- Sincroniza datos desde Sheet.best
- Verifica el estado final del sistema
- Muestra reporte completo con estadísticas

## 🔧 Prerrequisitos

Antes de ejecutar cualquier script:

1. **MySQL** debe estar corriendo
2. **Archivo .env** configurado:
   ```env
   DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/ucasal_cronogramas"
   NODE_ENV="development"
   PORT=3000
   ```
3. **Prisma** configurado:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. **Servidor API** corriendo:
   ```bash
   npm start
   ```

## 📊 Verificación Post-Setup

Después de ejecutar los scripts, verifica que todo esté correcto:

```bash
# Estadísticas de la base de datos
curl http://localhost:3000/api/v1/totem/verify-database

# Estado de mapeos
curl http://localhost:3000/api/v1/totem/mapeos/carreras
curl http://localhost:3000/api/v1/totem/mapeos/sectores

# Resumen del dashboard
curl http://localhost:3000/api/v1/dashboard/resumen
```

## 🎯 Estado Final Esperado

Después del setup completo deberías tener:

- ✅ **5 aulas** configuradas con sus capacidades
- ✅ **~37 carreras** mapeadas (de ~38 total)
- ✅ **Sectores** mapeados a facultades
- ✅ **~900+ exámenes** sincronizados desde Sheet.best
- ✅ **Sistema de asignación** listo para funcionar

## ⚠️ Solución de Problemas

### Error: "fetch is not defined"
El script usa `fetch()` nativo de Node.js 18+. Si usas una versión anterior:
```bash
npm install node-fetch
# Y actualiza los imports en los scripts
```

### Error: "ECONNREFUSED"
El servidor no está corriendo:
```bash
cd API
npm start
```

### Error: "PrismaClientInitializationError"
Problema con la base de datos:
```bash
npx prisma generate
npx prisma db push
```

### Error: "Sheet.best API failed"
Verifica la URL en el .env o usa curl para probar:
```bash
curl "https://sheet.best/api/sheets/TU_SHEET_ID"
```

## 🔄 Sincronización Continua

Para mantener los datos actualizados, programa la sincronización:

```bash
# Manual
curl http://localhost:3000/api/v1/totem/simple-sync

# Automática cada hora (cron)
0 * * * * curl http://localhost:3000/api/v1/totem/simple-sync
```

## 📱 Interfaces de Usuario

Una vez configurado el backend, puedes levantar las interfaces:

### Backoffice (Next.js)
```bash
cd ../backoffice
npm install
npm run dev
# http://localhost:3001
```

### Web Pública (Astro)
```bash
cd ../web
npm install
npm run dev
# http://localhost:4321
```

¡Con estos scripts tendrás el sistema TOTEM completamente funcional! 🎉 
# 🚀 Guía de Setup Completo - Proyecto TOTEM

Esta guía te permite configurar el proyecto TOTEM desde cero después de hacer un pull del repositorio.

## 📋 Pre-requisitos

1. **Node.js** instalado (versión 18 o superior)
2. **MySQL** instalado y funcionando
3. **Git** configurado
4. **.env** configurado correctamente

## 🔧 Setup Inicial

### 1. Configuración del entorno
```bash
# Clonar/actualizar repositorio
git pull origin main

# Instalar dependencias
cd API
npm install

# Configurar base de datos con Prisma
npx prisma generate
npx prisma db push

# Verificar que .env esté configurado
```

**Archivo .env requerido:**
```env
DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/ucasal_cronogramas"
NODE_ENV="development"
PORT=3000
SHEETBEST_API_URL="https://sheet.best/api/sheets/..." # Opcional para Sheet.best
```

### 2. Inicializar servidor
```bash
# Levantar el servidor de la API
npm start
# O en modo desarrollo:
npm run dev
```

## 🎯 Secuencia de Scripts para Configuración Completa

### Paso 1: Configurar Aulas
```bash
# Desde la carpeta API/
node scripts/configurar-aulas-iniciales.js
```
**¿Qué hace?**
- Crea las 5 aulas principales: Aula 4, 8, 12, Laboratorio Informático, Notebooks
- Configura capacidades y ubicaciones
- Establece criterios de asignación automática

### Paso 2: Configurar Mapeos de Sectores
```bash
node scripts/setup-totem-mapeos.js
```
**¿Qué hace?**
- Mapea sectores del TOTEM a facultades
- Establece relaciones iniciales: Sector 2→Economía, Sector 3→Jurídicas, etc.

### Paso 3: Mapeo Automático de Carreras
```bash
node scripts/mapear-carreras-automatico.js
```
**¿Qué hace?**
- Mapea automáticamente ~70 carreras usando el CSV integrado
- Relaciona códigos TOTEM con carreras de la base de datos
- Actualiza nombres de carreras desde el CSV oficial

### Paso 4: Sincronización Inicial de Datos
```bash
# Via API (servidor debe estar corriendo)
curl http://localhost:3000/api/v1/totem/simple-sync
```
**¿Qué hace?**
- Descarga datos desde Sheet.best
- Procesa y guarda exámenes en MySQL
- Aplica mapeos de carreras y sectores

### Paso 5: Verificar Configuración
```bash
curl http://localhost:3000/api/v1/totem/verify-database
```
**¿Qué hace?**
- Muestra estadísticas completas de la base de datos
- Verifica exámenes, carreras mapeadas, aulas disponibles

## 🤖 Script Maestro (Ejecutar Todo Automáticamente)

Para mayor comodidad, puedes usar el script maestro que ejecuta todo:

```bash
node scripts/setup-completo.js
```

## 📊 Endpoints Útiles de Verificación

### Estadísticas Generales
```bash
GET http://localhost:3000/api/v1/totem/verify-database
```

### Mapeos de Carreras
```bash
GET http://localhost:3000/api/v1/totem/mapeos/carreras
```

### Mapeos de Sectores
```bash
GET http://localhost:3000/api/v1/totem/mapeos/sectores
```

### Dashboard Completo
```bash
GET http://localhost:3000/api/v1/dashboard/resumen
```

## ✅ Estado Final Esperado

Después de ejecutar todos los scripts deberías tener:

- **5 aulas** configuradas con sus capacidades
- **~37 carreras** mapeadas (de ~38 total)
- **Sectores** mapeados a facultades
- **~900+ exámenes** sincronizados desde Sheet.best
- **Sistema de asignación** listo para funcionar

## 🔧 Solución de Problemas

### Error de conexión a MySQL
```bash
# Verificar que MySQL esté corriendo
mysql -u root -p

# Verificar que la base de datos exista
SHOW DATABASES;
USE ucasal_cronogramas;
```

### Error en Prisma
```bash
# Regenerar cliente Prisma
npx prisma generate

# Resetear base de datos (¡CUIDADO! Borra todos los datos)
npx prisma db push --force-reset
```

### Error en Sheet.best
- Verificar URL en .env
- Probar manualmente: https://sheet.best/api/sheets/...

## 📱 Interfaces Disponibles

### Backoffice (React/Next.js)
```bash
cd backoffice
npm install
npm run dev
# http://localhost:3001
```

### Web Pública (Astro)
```bash
cd web
npm install
npm run dev
# http://localhost:4321
```

## 🔄 Sincronización Continua

Para mantener los datos actualizados, programa el endpoint de sincronización:
```bash
# Sincronización manual
curl http://localhost:3000/api/v1/totem/simple-sync

# O usar cron job para sincronización automática cada hora
0 * * * * curl http://localhost:3000/api/v1/totem/simple-sync
```

## 🚨 Notas Importantes

1. **Orden de ejecución**: Es importante seguir el orden de los scripts
2. **Base de datos**: Debe estar corriendo antes de ejecutar cualquier script
3. **Sheet.best**: Los datos vienen de Sheet.best, no directamente de Google Sheets
4. **Mapeos**: Si agregas nuevas carreras, ejecuta el mapeo automático nuevamente

¡Con esto tendrás el sistema TOTEM completamente configurado y funcionando! 🎉 
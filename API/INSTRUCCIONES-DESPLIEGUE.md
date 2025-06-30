# 🚀 INSTRUCCIONES DE DESPLIEGUE - API TOTEM

## ⚙️ CONFIGURACIÓN OBLIGATORIA (EN ORDEN)

### 1. Clonar repositorio y configurar entorno
```bash
git clone [URL_REPO]
cd API
npm install
```

### 2. Configurar base de datos
```bash
# Copiar .env.example a .env y configurar DB
cp .env.example .env

# Editar .env con datos de MySQL:
# DATABASE_URL="mysql://user:password@localhost:3306/totem_db"
```

### 3. Inicializar Prisma (CRÍTICO - Siempre ejecutar)
```bash
npx prisma generate    # Genera cliente personalizado en src/generated/prisma
npx prisma db push     # Sincroniza esquema con BD
```

### 4. Inicializar desde cero (Solo primera vez)
```bash
node scripts/inicializar-desde-cero.js
```

### 5. Agregar carreras corregidas (Solo primera vez)
```bash
node scripts/agregar-carreras-corregidas.js
```

### 6. Levantar servidor API
```bash
npm start     # Producción (puerto 3000)
npm run dev   # Desarrollo (puerto 3000)
```

### 7. Ejecutar setup completo (Solo primera vez)
```bash
# En otra terminal (con servidor corriendo):
node scripts/setup-completo.js
```

## 🔧 SOLUCIÓN A ERRORES COMUNES

### Error: '@prisma/client did not initialize yet'
**Causa:** Cliente de Prisma no generado o inconsistencia en importaciones
**Solución:**
```bash
npx prisma generate
```

### Error: 'default export not found'
**Causa:** Inconsistencia en importaciones entre scripts
**Solución:** Todos los scripts deben usar `import prisma from '../src/lib/db.js'`

### Error: 'MySQL connection failed' 
**Causa:** Base de datos no corriendo o .env mal configurado
**Solución:**
1. Verificar MySQL corriendo: `mysql -u root -p`
2. Crear base de datos: `CREATE DATABASE totem_db;`
3. Verificar .env: `DATABASE_URL="mysql://user:password@localhost:3306/totem_db"`

## 🎯 CONFIGURACIÓN PRISMA PERSONALIZADA

Este proyecto usa una configuración personalizada de Prisma:
- **Cliente generado en:** `src/generated/prisma/`
- **NO usar:** `import { PrismaClient } from '@prisma/client'`
- **SÍ usar:** `import prisma from '../src/lib/db.js'`

## 📋 CHECKLIST DESPLIEGUE EXITOSO

- [ ] MySQL corriendo y base de datos creada
- [ ] `.env` configurado correctamente  
- [ ] `npm install` ejecutado
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma db push` ejecutado
- [ ] `node scripts/inicializar-desde-cero.js` ejecutado
- [ ] Servidor API corriendo en puerto 3000
- [ ] `node scripts/setup-completo.js` ejecutado exitosamente

## 🆘 RESETEAR TODO SI HAY PROBLEMAS

```bash
# Resetear base de datos
npx prisma migrate reset --force

# Regenerar cliente
npx prisma generate

# Reinicializar todo
node scripts/inicializar-desde-cero.js
node scripts/agregar-carreras-corregidas.js

# Levantar servidor y ejecutar setup
npm start &
node scripts/setup-completo.js
```

¡Con esto el proyecto debería funcionar en cualquier máquina! 
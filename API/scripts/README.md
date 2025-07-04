# Scripts del Sistema TOTEM

## ✨ WORKFLOW SIMPLIFICADO (NUEVO)

### 🚀 Script Maestro Unificado - UN SOLO COMANDO:

```bash
node scripts/totem-master.js
```

**Este único script reemplaza TODOS los scripts anteriores y hace:**
- ✅ Limpieza completa de base de datos
- ✅ Configuración de **4 aulas exactas** (sin aulas extras)
- ✅ Mapeo automático de sectores y carreras
- ✅ Sincronización completa desde Sheet.best
- ✅ **Corrección de duplicados falsos** (incluye hora + docente)
- ✅ Reporte final detallado con estadísticas

---

## 📊 Scripts Adicionales

### **`sincronizar-inscriptos-masivo.js`** - Sincronización opcional
Solo ejecutar después del script maestro si necesitas actualizar cantidades de inscriptos:

```bash
node scripts/sincronizar-inscriptos-masivo.js
```

### **`limpiar-scripts-obsoletos.js`** - Limpieza de archivos
Elimina todos los scripts obsoletos y mantiene solo los esenciales:

```bash
node scripts/limpiar-scripts-obsoletos.js
```

### **`limpiar-duplicados-urgente.js`** - 🆕 Solución de duplicados
Elimina exámenes duplicados existentes en la base de datos:

```bash
node scripts/limpiar-duplicados-urgente.js
```

---

## 🔧 Prerrequisitos

Antes de ejecutar el script maestro:

1. **MySQL** debe estar corriendo
2. **Archivo .env** configurado:
   ```env
   DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/ucasal_cronogramas"
   NODE_ENV="development"
   PORT=3000
   ```
3. **Servidor API** corriendo:
   ```bash
   npm start
   ```

---

## 🚀 Configuración Completa (Paso a Paso)

### Para desarrolladores nuevos o reseteo completo:

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar Prisma
npx prisma generate
npx prisma db push

# 3. Iniciar servidor API (terminal 1)
npm start

# 4. Ejecutar script maestro (terminal 2)
node scripts/totem-master.js
```

---

## 📊 Estado Final Esperado

Después del script maestro tendrás:

- ✅ **4 aulas exactas:** Aula 4 (72), Aula 8 (71), Aula 12 (69), Lab Informático (34)
- ✅ **~37 carreras** mapeadas automáticamente
- ✅ **7 sectores** mapeados a facultades  
- ✅ **~1,000+ exámenes** sincronizados (en lugar de 300 descartados)
- ✅ **0 duplicados falsos** (detección inteligente)

---

## 💡 Ventajas del Nuevo Sistema

✅ **UN SOLO COMANDO** en lugar de 10+ scripts  
✅ **DETECCIÓN INTELIGENTE** de duplicados (fecha + hora + docente)  
✅ **4 AULAS EXACTAS** sin aulas innecesarias  
✅ **REPORTE COMPLETO** con verificaciones automáticas  
✅ **CORRECCIÓN DE BUGS** anteriores (duplicados falsos)  
✅ **PORTABILIDAD** mejorada para nuevos desarrolladores  

---

## 🔗 Enlaces Útiles (Post-Setup)

Después de ejecutar el script maestro:

- 📊 **Dashboard:** http://localhost:3000/api/v1/dashboard/resumen
- 🔍 **Debug BD:** http://localhost:3000/api/v1/totem/verify-database  
- 🏫 **Aulas:** http://localhost:3000/api/v1/aulas
- 📚 **Mapeos:** http://localhost:3000/api/v1/totem/mapeos/carreras

---

## 🎯 Próximos Pasos

1. Revisar dashboard para verificar datos
2. Configurar asignación automática de aulas
3. Sincronizar cantidad de inscriptos (opcional)
4. Levantar interfaces web (backoffice/web)

---

## ⚠️ Scripts Obsoletos (YA NO USAR)

Los siguientes scripts fueron **ELIMINADOS** y reemplazados por `totem-master.js`:

~~`inicializar-desde-cero.js`~~ ❌  
~~`setup-completo.js`~~ ❌  
~~`configurar-aulas-iniciales.js`~~ ❌  
~~`mapear-carreras-automatico.js`~~ ❌  
~~`limpiar-aulas-incorrectas.js`~~ ❌  
~~Otros 7+ scripts obsoletos~~ ❌

**¡Usa solo `totem-master.js` ahora!**

---

## 🆘 Ayuda

```bash
# Ver ayuda del script maestro
node scripts/totem-master.js --help

# Limpiar scripts obsoletos
node scripts/limpiar-scripts-obsoletos.js
``` 
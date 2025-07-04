# ⚡ CONFIGURACIÓN RÁPIDA - SINCRONIZACIÓN AUTOMÁTICA

## 🎯 **Para configurar SOLO la sincronización automática**

Si el sistema ya está funcionando y solo quieres agregar la **sincronización automática diaria**, sigue estos pasos:

---

## 🔧 **OPCIÓN A: USAR EL BOTÓN DEL BACKOFFICE**

### **1. Sincronización Manual (YA FUNCIONA):**
1. Ir a **Backoffice** → `http://localhost:3001/configuracion`
2. Hacer clic en **"Ejecutar Sincronización"**
3. ✅ **Listo** - Ya tienes sincronización manual

### **2. Ventajas del botón:**
- ✅ **Control total** - cuando TÚ quieras
- ✅ **Feedback inmediato** - ves el resultado
- ✅ **No requiere configuración** adicional
- ✅ **Verificación visual** del proceso

---

## ⏰ **OPCIÓN B: AUTOMATIZACIÓN CON CRON**

### **1. Configuración de 5 minutos:**

```bash
# Ir al directorio de la API
cd /ruta/a/tu/proyecto/API

# Configurar cron
crontab -e

# Agregar SOLO esta línea para sincronización diaria a las 2 AM:
0 2 * * * cd /ruta/completa/API && node sincronizacion-inteligente.js >> logs/sync.log 2>&1
```

### **2. Para sincronización cada 6 horas:**
```bash
# Si quieres más frecuencia, usa esta línea en su lugar:
0 2,8,14,20 * * * cd /ruta/completa/API && node sincronizacion-inteligente.js >> logs/sync.log 2>&1
```

### **3. Verificar que funciona:**
```bash
# Ver si el cron está configurado:
crontab -l

# Probar manualmente:
node sincronizacion-inteligente.js --test

# Ver logs del cron:
tail -f logs/sync.log
```

---

## 🛡️ **PROTECCIÓN GARANTIZADA**

### **La sincronización es 100% SEGURA:**

✅ **NO sobrescribe** exámenes existentes  
✅ **NO modifica** aulas ya asignadas  
✅ **SOLO agrega** exámenes nuevos  
✅ **Preserva** todo el trabajo manual  

### **Ejemplo de protección:**
```
🔒 EXAMEN PROTEGIDO (CON AULA): Sector/Carrera/Materia (30/06/2025) - ID: 123 - AULA: 2
📋 Examen duplicado detectado: No se creará nuevo
✅ Aulas asignadas manualmente están PROTEGIDAS
```

---

## 🎛️ **RECOMENDACIÓN PRÁCTICA**

### **Para uso diario normal:**

**OPCIÓN RECOMENDADA:** 🔧 **Botón del Backoffice**

**¿Por qué?**
- ✅ **Control manual** cuando necesites
- ✅ **Feedback inmediato** de lo que pasa
- ✅ **Sin configuración** adicional de sistema
- ✅ **Flexibilidad total** - sincronizas cuando quieras

### **Para automatización completa:**

**OPCIÓN AVANZADA:** ⏰ **Cron diario**

**¿Cuándo usar?**
- Si quieres **sincronización nocturna** automática
- Si el TOTEM se actualiza **todos los días** a la misma hora
- Si prefieres **"set and forget"**

---

## 🚀 **CONFIGURACIÓN RECOMENDADA FINAL**

### **Mi recomendación para UCASAL:**

```bash
# 1. Usa el BOTÓN del backoffice para sincronización manual diaria
# 2. Opcionalmente, agrega UN cron nocturno como respaldo:

0 2 * * * cd /tu/proyecto/API && node sincronizacion-inteligente.js >> logs/backup-sync.log 2>&1
```

### **Esto te da:**
- 🎛️ **Control manual** durante el día
- 🌙 **Respaldo automático** nocturno  
- 🛡️ **Protección total** de datos existentes
- 📊 **Logs completos** para revisar

---

## ✅ **CONFIGURACIÓN EN 2 MINUTOS**

### **Paso a paso rápido:**

1. **Verificar que funciona:**
   ```bash
   cd API
   node sincronizacion-inteligente.js --test
   ```

2. **Agregar cron (opcional):**
   ```bash
   crontab -e
   # Agregar: 0 2 * * * cd /ruta/completa/API && node sincronizacion-inteligente.js >> logs/sync.log 2>&1
   ```

3. **Listo!** 🎉
   - Usa el botón cuando quieras
   - El cron trabajará automáticamente
   - Todo está protegido

---

## 📞 **¿Dudas?**

### **Comandos útiles:**
```bash
# Ver si el cron está funcionando:
grep CRON /var/log/syslog

# Probar la sincronización:
node sincronizacion-inteligente.js --test

# Ver logs:
tail -f logs/sincronizacion-inteligente.log

# Verificar sistema:
node verificacion-pre-despliegue.js
```

**🎯 ¡En 5 minutos tienes sincronización automática funcionando!** 
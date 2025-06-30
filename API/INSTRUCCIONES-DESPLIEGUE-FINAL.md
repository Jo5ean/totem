# 🚀 INSTRUCCIONES DE DESPLIEGUE FINAL - TOTEM UCASAL

## ✅ **VERIFICACIÓN COMPLETADA - SISTEMA LISTO**

**Fecha de verificación:** 30 Junio 2025  
**Estado:** ✅ **100% LISTO PARA DESPLIEGUE**

---

## 📊 **RESUMEN DE VERIFICACIÓN PRE-DESPLIEGUE**

### ✅ **Componentes Verificados:**
- **API (Puerto 3000):** ✅ Funcionando - 184 exámenes
- **Backoffice (Puerto 3001):** ✅ Funcionando
- **Web (Puerto 4321):** ✅ Funcionando
- **Base de Datos:** ✅ Conectada y operativa
- **Aulas Configuradas:** ✅ 4/4 aulas (Aula 4, 8, 12, Lab Informático)
- **Sincronización:** ✅ 124 exámenes con inscriptos
- **Filtro SEDE 3:** ✅ Funcionando correctamente
- **Mapeo Carreras:** ✅ 36 carreras mapeadas (0 pendientes)

### 🔧 **Correcciones Implementadas:**
- **Fecha corregida:** 30 Jun (zona horaria UTC)
- **Campo MAPA:** Reemplazó "CÁTEDRA" con funcionalidad completa
- **Modal de mapas:** Con imágenes reales (Primer Piso / Planta Baja)
- **Sincronización inteligente:** Protege exámenes con aulas asignadas

---

## 🎯 **PASOS DE DESPLIEGUE**

### 1. **Preparación del Servidor**

```bash
# Clonar repositorio en servidor
git clone <url-repositorio> /var/www/totem
cd /var/www/totem

# Crear usuario de servicio
sudo useradd -r -s /bin/false totem-user
sudo chown -R totem-user:totem-user /var/www/totem
```

### 2. **Configuración de Base de Datos**

```bash
# PostgreSQL (recomendado para producción)
sudo -u postgres createdb totem_prod
sudo -u postgres createuser totem_user --pwprompt

# Variables de entorno para producción
cp API/.env.example API/.env.production
```

**Variables críticas a configurar:**
```env
DATABASE_URL="postgresql://totem_user:password@localhost:5432/totem_prod"
NODE_ENV=production
PORT=3000
SHEET_BEST_API_KEY="tu_api_key_aqui"
```

### 3. **Instalación y Build**

```bash
# API Backend
cd API
npm ci --production
npx prisma generate
npx prisma migrate deploy

# Backoffice
cd ../backoffice
npm ci
npm run build

# Web Frontend
cd ../web
npm ci
npm run build
```

### 4. **Configuración de Servicios (systemd)**

#### **API Service:**
```ini
# /etc/systemd/system/totem-api.service
[Unit]
Description=TOTEM API Backend
After=network.target postgresql.service

[Service]
Type=simple
User=totem-user
WorkingDirectory=/var/www/totem/API
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### **Backoffice Service:**
```ini
# /etc/systemd/system/totem-backoffice.service
[Unit]
Description=TOTEM Backoffice
After=network.target

[Service]
Type=simple
User=totem-user
WorkingDirectory=/var/www/totem/backoffice
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 5. **Configuración de Nginx**

```nginx
# /etc/nginx/sites-available/totem
server {
    listen 80;
    server_name tu-dominio.com;

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backoffice Admin
    location /admin/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Web Frontend (Static Files)
    location / {
        root /var/www/totem/web/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 6. **Sincronización Automática (Cron)**

```bash
# Configurar cron para usuario totem-user
sudo -u totem-user crontab -e

# Agregar estas líneas:
# Sincronización diaria a las 2:00 AM
0 2 * * * cd /var/www/totem/API && node sincronizacion-inteligente.js >> logs/cron-sincronizacion.log 2>&1

# Sincronización de respaldo cada 6 horas
0 8,14,20 * * * cd /var/www/totem/API && node sincronizacion-inteligente.js >> logs/cron-sincronizacion.log 2>&1
```

### 7. **Iniciar Servicios**

```bash
# Habilitar y iniciar servicios
sudo systemctl enable totem-api totem-backoffice nginx postgresql
sudo systemctl start totem-api totem-backoffice nginx

# Verificar estado
sudo systemctl status totem-api
sudo systemctl status totem-backoffice
```

---

## 🔍 **VERIFICACIÓN POST-DESPLIEGUE**

### **Ejecutar verificación automática:**
```bash
cd /var/www/totem/API
node verificacion-pre-despliegue.js
```

### **URLs a probar:**
- **Web Pública:** `http://tu-dominio.com`
- **API:** `http://tu-dominio.com/api/v1/examenes`
- **Backoffice:** `http://tu-dominio.com/admin`

### **Funcionalidades críticas:**
1. ✅ **Consulta DNI** en web pública
2. ✅ **Modal de mapas** con imágenes correctas
3. ✅ **Asignación de aulas** en backoffice
4. ✅ **Sincronización automática** funcionando

---

## 🔐 **CONFIGURACIONES DE SEGURIDAD**

### **Firewall (UFW):**
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000/tcp   # API (solo interno)
sudo ufw deny 3001/tcp   # Backoffice (solo interno)
sudo ufw --force enable
```

### **SSL/HTTPS (Certbot):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### **Respaldos Automáticos:**
```bash
# Crear script de backup diario
cat > /usr/local/bin/backup-totem.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump totem_prod > /var/backups/totem_$DATE.sql
find /var/backups/totem_*.sql -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-totem.sh

# Agregar a cron
echo "0 3 * * * /usr/local/bin/backup-totem.sh" | sudo crontab -
```

---

## 📊 **MONITOREO Y LOGS**

### **Ubicaciones de logs:**
- **API:** `/var/www/totem/API/logs/`
- **Nginx:** `/var/log/nginx/`
- **Sistema:** `journalctl -u totem-api -f`
- **Cron:** `/var/www/totem/API/logs/cron-sincronizacion.log`

### **Comandos de monitoreo:**
```bash
# Ver logs en tiempo real
sudo tail -f /var/log/nginx/access.log
journalctl -u totem-api -f
tail -f /var/www/totem/API/logs/sincronizacion-inteligente.log

# Verificar servicios
sudo systemctl status totem-api totem-backoffice nginx
```

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Problemas comunes:**

#### **API no responde:**
```bash
sudo systemctl restart totem-api
journalctl -u totem-api --since "1 hour ago"
```

#### **Base de datos desconectada:**
```bash
sudo systemctl status postgresql
sudo -u postgres psql totem_prod -c "SELECT NOW();"
```

#### **Sincronización fallando:**
```bash
cd /var/www/totem/API
node sincronizacion-inteligente.js --test
tail -f logs/problemas-sincronizacion.log
```

#### **Permisos:**
```bash
sudo chown -R totem-user:totem-user /var/www/totem
sudo chmod -R 755 /var/www/totem
```

---

## 🎉 **SISTEMA COMPLETAMENTE DESPLEGADO**

### **✅ Componentes funcionando:**
- 🌐 **Web Frontend** con mapas interactivos
- 🔧 **Backoffice** con sincronización manual
- 🤖 **API Backend** con protección de datos
- ⏰ **Sincronización automática** cada 6 horas
- 🔐 **Seguridad** y respaldos configurados

### **📱 Funcionalidades listas:**
- Consulta de exámenes por DNI
- Visualización de mapas de aulas
- Asignación automática y manual de aulas
- Sincronización inteligente sin sobrescritura
- Panel administrativo completo

**🚀 ¡TOTEM UCASAL LISTO PARA PRODUCCIÓN!** 
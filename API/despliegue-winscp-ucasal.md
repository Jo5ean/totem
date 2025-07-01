# 🚀 DESPLIEGUE WINSCP - DATA CENTER UCASAL

## 📋 **PREPARATIVOS ANTES DEL DESPLIEGUE**

### 1. **Credenciales necesarias:**
- **WinSCP:** Usuario y contraseña del data center
- **MySQL:** Credenciales de mysql-desa o mysql-prod
- **URLs finales:** 
  - `https://www.ucasal.edu.ar/proyectos-innovalab/api`
  - `https://www.ucasal.edu.ar/proyectos-innovalab/backoffice`
  - `https://www.ucasal.edu.ar/proyectos-innovalab/web`

### 2. **Archivos a preparar:**
```
📁 Carpeta de despliegue/
├── 📄 despliegue-mysql-ucasal.sql  (Creación de BD)
├── 📁 api/                         (Backend compilado)
├── 📁 backoffice/                  (Admin panel compilado)
├── 📁 web/                         (Frontend compilado)
└── 📄 INSTRUCCIONES-PRODUCCION.md  (Esta guía)
```

---

## 🗄️ **PASO 1: CONFIGURAR BASE DE DATOS MySQL**

### **A. En mysql-desa (para pruebas):**
```sql
-- 1. Conectar a mysql-desa con tus credenciales
-- 2. Ejecutar archivo: despliegue-mysql-ucasal.sql
SOURCE despliegue-mysql-ucasal.sql;

-- 3. Verificar instalación
USE totem_ucasal;
SHOW TABLES;
SELECT COUNT(*) FROM facultades; -- Debe mostrar 3
SELECT COUNT(*) FROM aulas;      -- Debe mostrar 4
```

### **B. Variables de conexión MySQL:**
```env
# API/.env.production
DATABASE_URL="mysql://usuario:password@mysql-server:3306/totem_ucasal"
NODE_ENV=production
SHEET_BEST_API_KEY="tu_api_key_aqui"
```

---

## 📦 **PASO 2: PREPARAR ARCHIVOS PARA WINSCP**

### **A. Compilar API Backend:**
```bash
cd API
npm ci --production
# Archivos necesarios:
# - server.js
# - package.json
# - prisma/
# - src/
# - .env.production
```

### **B. Compilar Backoffice:**
```bash
cd backoffice
npm ci
npm run build
# Resultado: carpeta dist/ o .next/
```

### **C. Compilar Web Frontend:**
```bash
cd web  
npm ci
npm run build
# Resultado: carpeta dist/
```

---

## 🔄 **PASO 3: CONFIGURAR URLs DE PRODUCCIÓN**

### **A. API Backend (server.js):**
```javascript
// Configurar para URLs de UCASAL
const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://www.ucasal.edu.ar/proyectos-innovalab/api';
```

### **B. Backoffice (next.config.ts):**
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/proyectos-innovalab/backoffice',
  assetPrefix: '/proyectos-innovalab/backoffice',
  env: {
    NEXT_PUBLIC_API_URL: 'https://www.ucasal.edu.ar/proyectos-innovalab/api/v1'
  }
}
```

### **C. Web Frontend (astro.config.mjs):**
```javascript
export default defineConfig({
  base: '/proyectos-innovalab/web',
  server: { port: 4321 },
  build: {
    assets: '_assets'
  }
});
```

---

## 📁 **PASO 4: ESTRUCTURA EN EL SERVIDOR**

### **Directorio en el data center:**
```
/var/www/html/proyectos-innovalab/
├── api/
│   ├── server.js
│   ├── package.json
│   ├── prisma/
│   ├── src/
│   ├── .env.production
│   └── node_modules/
├── backoffice/
│   ├── dist/ (o .next/)
│   ├── package.json
│   └── node_modules/
└── web/
    ├── dist/
    ├── package.json
    └── public/
```

---

## 🖥️ **PASO 5: DESPLIEGUE CON WINSCP**

### **A. Conexión WinSCP:**
1. **Protocolo:** SFTP o FTP
2. **Servidor:** [IP del data center UCASAL]
3. **Usuario:** [tu usuario]
4. **Contraseña:** [tu contraseña]
5. **Directorio remoto:** `/var/www/html/proyectos-innovalab/`

### **B. Subir archivos:**
```
1. 📁 Crear carpeta: proyectos-innovalab/
2. 📤 Subir carpeta api/ completa
3. 📤 Subir carpeta backoffice/ completa  
4. 📤 Subir carpeta web/ completa
5. 📋 Verificar permisos (755 para carpetas, 644 para archivos)
```

### **C. Configurar permisos (si tienes acceso SSH):**
```bash
# En el servidor UCASAL
chmod -R 755 /var/www/html/proyectos-innovalab/
chown -R www-data:www-data /var/www/html/proyectos-innovalab/

# Instalar dependencias (si Node.js está disponible)
cd /var/www/html/proyectos-innovalab/api
npm ci --production
```

---

## 🌐 **PASO 6: CONFIGURACIÓN DEL SERVIDOR WEB**

### **A. Apache Virtual Host (si usas Apache):**
```apache
<VirtualHost *:80>
    ServerName www.ucasal.edu.ar
    DocumentRoot /var/www/html
    
    # API Backend (Proxy a Node.js)
    ProxyPass /proyectos-innovalab/api/ http://localhost:3000/
    ProxyPassReverse /proyectos-innovalab/api/ http://localhost:3000/
    
    # Backoffice (Archivos estáticos o proxy)
    Alias /proyectos-innovalab/backoffice /var/www/html/proyectos-innovalab/backoffice/dist
    
    # Web Frontend (Archivos estáticos)
    Alias /proyectos-innovalab/web /var/www/html/proyectos-innovalab/web/dist
    
    <Directory "/var/www/html/proyectos-innovalab">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### **B. Nginx (alternativo):**
```nginx
server {
    listen 80;
    server_name www.ucasal.edu.ar;
    
    # API Backend
    location /proyectos-innovalab/api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backoffice
    location /proyectos-innovalab/backoffice/ {
        alias /var/www/html/proyectos-innovalab/backoffice/dist/;
        try_files $uri $uri/ /index.html;
    }
    
    # Web Frontend
    location /proyectos-innovalab/web/ {
        alias /var/www/html/proyectos-innovalab/web/dist/;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## ✅ **PASO 7: VERIFICACIÓN POST-DESPLIEGUE**

### **A. URLs a probar:**
1. **API:** `https://www.ucasal.edu.ar/proyectos-innovalab/api/v1/examenes`
2. **Backoffice:** `https://www.ucasal.edu.ar/proyectos-innovalab/backoffice`
3. **Web:** `https://www.ucasal.edu.ar/proyectos-innovalab/web`

### **B. Funcionalidades críticas:**
- ✅ Consulta de exámenes por DNI
- ✅ Panel de administración
- ✅ Sincronización TOTEM
- ✅ Asignación de aulas
- ✅ Mapas interactivos

---

## 🚨 **PASO 8: MONITOREO Y LOGS**

### **A. Logs a revisar:**
```bash
# En el servidor (si tienes SSH)
tail -f /var/log/apache2/error.log
tail -f /var/www/html/proyectos-innovalab/api/logs/sync.log
```

### **B. Backup automático:**
```bash
# Cron job para backup diario de MySQL
0 3 * * * mysqldump totem_ucasal > /backup/totem_$(date +\%Y\%m\%d).sql
```

---

## 📞 **CONTACTOS DE SOPORTE**

### **En caso de problemas:**
1. **Base de datos:** Verificar credenciales mysql-desa
2. **Servidor web:** Verificar configuración Apache/Nginx
3. **Node.js:** Verificar que el proceso esté corriendo en puerto 3000
4. **Permisos:** Verificar que www-data tenga acceso a archivos

**🎯 ¡SISTEMA LISTO PARA PRODUCCIÓN EN UCASAL!** 
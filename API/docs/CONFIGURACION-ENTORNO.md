# Configuración del Entorno - TOTEM API

## Variables de Entorno Requeridas

Para que la aplicación funcione correctamente, necesitas crear un archivo `.env` en la raíz del directorio `API/` con las siguientes variables:

### Base de datos MySQL
```bash
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/totem_db"
```

### Configuración de desarrollo
```bash
NODE_ENV="development"
PORT=3000
```

### API Externa UCASAL (opcional)
```bash
UCASAL_API_BASE_URL="https://sistemasweb-desa.ucasal.edu.ar/api/v1"
```

## Pasos para configurar

1. **Crear archivo `.env`:**
   ```bash
   # En el directorio API/
   touch .env
   ```

2. **Configurar base de datos:**
   - Asegúrate de tener MySQL instalado y funcionando
   - Crea una base de datos llamada `totem_db`
   - Actualiza la `DATABASE_URL` con tus credenciales

3. **Ejecutar migraciones de Prisma:**
   ```bash
   npx prisma migrate dev
   ```

4. **Generar cliente de Prisma:**
   ```bash
   npx prisma generate
   ```

5. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

## Ejemplo completo de archivo `.env`

```bash
# Base de datos
DATABASE_URL="mysql://root:password@localhost:3306/totem_db"

# Desarrollo
NODE_ENV="development"
PORT=3000

# API Externa (opcional)
UCASAL_API_BASE_URL="https://sistemasweb-desa.ucasal.edu.ar/api/v1"
```

## Solución de problemas

### Error: "Module not found: Can't resolve '../generated/prisma/index.js'"
- Ejecuta: `npx prisma generate`
- Verifica que el archivo `API/src/generated/prisma/index.js` existe

### Error de conexión a base de datos
- Verifica que MySQL esté funcionando
- Confirma que la `DATABASE_URL` sea correcta
- Asegúrate de que la base de datos existe

### Puerto en uso
- Cambia el `PORT` en el archivo `.env`
- O mata el proceso que está usando el puerto 3000 
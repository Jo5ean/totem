#!/bin/bash
# Script para corregir rutas absolutas a relativas en el build estático
# Uso: ./fix-paths.sh (después de npm run build)

echo "🔧 Corrigiendo rutas para subdirectorio..."

# Corregir rutas /_next/ a ./_next/ en todos los archivos HTML
find out -name "*.html" -exec sed -i 's|/_next/|./_next/|g' {} \;

echo "✅ Rutas corregidas exitosamente!"
echo "📁 Carpeta lista para subir: ./out/"
echo "🌐 Destino: wwwold.ucasal.edu.ar/proyectos-innovalab/backoffice/" 
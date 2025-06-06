import prisma from '../src/lib/db.js';

// Mapeos iniciales basados en lo que observé en los datos
const MAPEOS_SECTORES_INICIALES = [
  { sector: '2', facultadNombre: 'Economía y Administración' },
  { sector: '3', facultadNombre: 'Ciencias Jurídicas' },
  { sector: '4', facultadNombre: 'Ingeniería' },
  { sector: '21', facultadNombre: 'Escuela de Educación' },
  // Agregar más según sea necesario
];

async function setupTotemMapeos() {
  console.log('Configurando mapeos iniciales del TOTEM...');

  try {
    // 1. Crear mapeos de sectores a facultades
    for (const mapeo of MAPEOS_SECTORES_INICIALES) {
      console.log(`Configurando sector ${mapeo.sector} -> ${mapeo.facultadNombre}`);
      
      // Buscar la facultad por nombre
      const facultad = await prisma.facultad.findFirst({
        where: {
          nombre: {
            contains: mapeo.facultadNombre,
            mode: 'insensitive'
          }
        }
      });

      if (facultad) {
        // Verificar si ya existe el mapeo
        const existingMapeo = await prisma.sectorFacultad.findFirst({
          where: { sector: mapeo.sector }
        });

        if (!existingMapeo) {
          await prisma.sectorFacultad.create({
            data: {
              sector: mapeo.sector,
              facultadId: facultad.id
            }
          });
          console.log(`✓ Mapeo creado: Sector ${mapeo.sector} -> ${facultad.nombre}`);
        } else {
          console.log(`- Mapeo ya existe: Sector ${mapeo.sector}`);
        }
      } else {
        console.log(`⚠ Facultad no encontrada: ${mapeo.facultadNombre}`);
      }
    }

    // 2. Mostrar estadísticas
    const totalMapeos = await prisma.sectorFacultad.count();
    const totalFacultades = await prisma.facultad.count();
    
    console.log('\n📊 Estadísticas:');
    console.log(`- Total sectores mapeados: ${totalMapeos}`);
    console.log(`- Total facultades: ${totalFacultades}`);

    // 3. Mostrar lista de facultades para referencia
    const facultades = await prisma.facultad.findMany({
      select: { id: true, nombre: true, codigo: true }
    });
    
    console.log('\n📋 Facultades disponibles:');
    facultades.forEach(f => {
      console.log(`  ${f.id}: ${f.nombre} (${f.codigo || 'Sin código'})`);
    });

    console.log('\n✅ Configuración inicial completada');
    console.log('💡 Usa los endpoints /api/v1/totem/mapeos/ para gestionar mapeos adicionales');

  } catch (error) {
    console.error('❌ Error configurando mapeos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTotemMapeos()
    .then(() => {
      console.log('Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script falló:', error);
      process.exit(1);
    });
}

export default setupTotemMapeos; 
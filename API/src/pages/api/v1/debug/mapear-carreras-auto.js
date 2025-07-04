import prisma from '../../../../lib/db.js';
import { withCors } from '../../../../lib/cors.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Usa POST.'
    });
  }

  try {
    console.log('🗺️ MAPEANDO CARRERAS AUTOMÁTICAMENTE...');

    // 1. Obtener todas las carreras TOTEM no mapeadas
    const carrerasTotem = await prisma.carreraTotem.findMany({
      where: { esMapeada: false },
      orderBy: { codigoTotem: 'asc' }
    });

    console.log(`📊 Carreras TOTEM encontradas: ${carrerasTotem.length}`);

    let carrerasCreadas = 0;
    let carrerasMapeadas = 0;

    // 2. Para cada carrera TOTEM, crear carrera real y mapear
    for (const carreraTotem of carrerasTotem) {
      try {
        console.log(`📝 Procesando carrera TOTEM: ${carreraTotem.codigoTotem} (ID: ${carreraTotem.id})`);
        
        // Usar facultad por defecto (primera disponible)
        const facultad = await prisma.facultad.findFirst({
          where: { activa: true }
        });

        if (!facultad) {
          console.log('❌ No hay facultades disponibles');
          continue;
        }
        
        console.log(`🏫 Facultad encontrada: ${facultad.nombre} (ID: ${facultad.id})`);

        // Crear carrera real basada en el código TOTEM
        const nombreCarrera = `Carrera TOTEM ${carreraTotem.codigoTotem}`;
        
        // Buscar si ya existe
        let carrera = await prisma.carrera.findFirst({
          where: { nombre: nombreCarrera }
        });

        // Si no existe, crear nueva
        if (!carrera) {
          carrera = await prisma.carrera.create({
            data: {
              nombre: nombreCarrera,
              codigo: carreraTotem.codigoTotem,
              facultadId: facultad.id
            }
          });
          carrerasCreadas++;
          console.log(`  ✅ Carrera creada: ${nombreCarrera}`);
        } else {
          console.log(`  ♻️ Carrera existente: ${nombreCarrera}`);
        }

        // Mapear la carrera TOTEM a la carrera real
        await prisma.carreraTotem.update({
          where: { id: carreraTotem.id },
          data: {
            carreraId: carrera.id,
            esMapeada: true
          }
        });

        carrerasMapeadas++;
        console.log(`  🔗 Mapeada: ${carreraTotem.codigoTotem} → ${nombreCarrera}`);

      } catch (error) {
        console.error(`Error procesando carrera TOTEM ${carreraTotem.codigoTotem}:`, error);
      }
    }

    console.log('✅ MAPEO AUTOMÁTICO COMPLETO');

    return res.status(200).json({
      success: true,
      message: 'Mapeo automático de carreras completado',
      data: {
        carrerasTotemEncontradas: carrerasTotem.length,
        carrerasCreadas,
        carrerasMapeadas,
        timestamp: new Date().toISOString(),
        siguientePaso: 'Ejecutar sincronización de TOTEM'
      }
    });

  } catch (error) {
    console.error('❌ Error en mapeo automático:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error durante el mapeo automático',
      message: error.message
    });
  }
}

export default withCors(handler); 
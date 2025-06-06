import prisma from '../../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['POST']
    });
  }

  try {
    console.log('🚀 Configurando mapeos automáticamente...');

    // Datos del CSV proporcionado por el usuario
    const sectoresData = [
      { sector: "1", nombre: "ARTES Y CIENCIAS" },
      { sector: "2", nombre: "ECONOMÍA Y ADMINISTRACIÓN" },
      { sector: "3", nombre: "CIENCIAS JURÍDICAS" },
      { sector: "4", nombre: "INGENIERÍA" },
      { sector: "5", nombre: "ARQUITECTURA Y URBANISMO" },
      { sector: "6", nombre: "ESCUELA UNIVERSITARIA DE TRABAJO SOCIAL" },
      { sector: "7", nombre: "ESCUELA UNIVERSITARIA DE EDUCACIÓN FÍSICA" },
      { sector: "8", nombre: "ESCUELA UNIVERSITARIA DE TURISMO" },
      { sector: "9", nombre: "CIENCIAS AGRARIAS Y VETERINARIAS" },
      { sector: "21", nombre: "FACULTAD DE EDUCACIÓN" }
    ];

    // 1. Obtener todas las facultades existentes
    const facultades = await prisma.facultad.findMany({
      orderBy: { nombre: 'asc' }
    });

    console.log(`📋 Facultades encontradas: ${facultades.length}`);

    // 2. Mapear sectores a facultades por similitud de nombres
    const mapeosSector = [];
    
    for (const sectorData of sectoresData) {
      // Buscar facultad por nombre similar
      const facultadEncontrada = facultades.find(f => 
        f.nombre.toUpperCase().includes(sectorData.nombre.split(' ')[0]) ||
        sectorData.nombre.toUpperCase().includes(f.nombre.split(' ')[0]) ||
        f.nombre.toUpperCase() === sectorData.nombre.toUpperCase()
      );

      if (facultadEncontrada) {
        try {
          // Crear o actualizar mapeo
          const mapeo = await prisma.sectorFacultad.upsert({
            where: { sector: sectorData.sector },
            update: { facultadId: facultadEncontrada.id },
            create: {
              sector: sectorData.sector,
              facultadId: facultadEncontrada.id
            }
          });

          mapeosSector.push({
            sector: sectorData.sector,
            nombreSector: sectorData.nombre,
            facultadId: facultadEncontrada.id,
            nombreFacultad: facultadEncontrada.nombre,
            accion: 'mapeado'
          });

          console.log(`✅ Sector ${sectorData.sector} → ${facultadEncontrada.nombre}`);
        } catch (error) {
          console.error(`❌ Error mapeando sector ${sectorData.sector}:`, error);
        }
      } else {
        mapeosSector.push({
          sector: sectorData.sector,
          nombreSector: sectorData.nombre,
          facultadId: null,
          nombreFacultad: null,
          accion: 'sin_mapear'
        });
        console.log(`⚠️ No se encontró facultad para: ${sectorData.nombre}`);
      }
    }

    // 3. Configurar mapeos básicos de carreras para testing
    console.log('🎓 Configurando mapeos de carreras de prueba...');
    
    const carrerasBasicas = [
      { codigo: "7", facultadId: 1, nombre: "Carrera 7" },
      { codigo: "8", facultadId: 1, nombre: "Carrera 8" }, 
      { codigo: "9", facultadId: 1, nombre: "Carrera 9" },
      { codigo: "10", facultadId: 2, nombre: "Carrera 10" },
      { codigo: "11", facultadId: 3, nombre: "Carrera 11" }
    ];

    const mapeosCarrera = [];

    for (const carreraData of carrerasBasicas) {
      try {
        const mapeoCarrera = await prisma.carreraTotem.upsert({
          where: { codigoTotem: carreraData.codigo },
          update: { 
            carreraId: carreraData.facultadId,
            nombreTotem: carreraData.nombre,
            esMapeada: true 
          },
          create: {
            codigoTotem: carreraData.codigo,
            carreraId: carreraData.facultadId,
            nombreTotem: carreraData.nombre,
            activo: true,
            esMapeada: true
          }
        });

        mapeosCarrera.push({
          codigo: carreraData.codigo,
          nombre: carreraData.nombre,
          facultadId: carreraData.facultadId,
          accion: 'mapeado'
        });

        console.log(`✅ Carrera ${carreraData.codigo} → Facultad ${carreraData.facultadId}`);
      } catch (error) {
        console.error(`❌ Error mapeando carrera ${carreraData.codigo}:`, error);
      }
    }

    const resumen = {
      sectoresMapeados: mapeosSector.filter(m => m.accion === 'mapeado').length,
      sectoresSinMapear: mapeosSector.filter(m => m.accion === 'sin_mapear').length,
      carrerasMapeadas: mapeosCarrera.length,
      totalFacultades: facultades.length
    };

    console.log('🎉 Configuración de mapeos completada');

    return res.status(200).json({
      success: true,
      data: {
        mapeosSector,
        mapeosCarrera,
        facultadesDisponibles: facultades.map(f => ({ id: f.id, nombre: f.nombre })),
        resumen
      },
      message: `Configuración completada: ${resumen.sectoresMapeados} sectores y ${resumen.carrerasMapeadas} carreras mapeadas`
    });

  } catch (error) {
    console.error('❌ Error configurando mapeos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error configurando mapeos',
      message: error.message
    });
  }
} 
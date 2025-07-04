import prisma from '../../../../lib/db.js';
import { withCors } from '../../../../lib/cors.js';

const FACULTADES_BASE = [
  { nombre: 'Ciencias Económicas y de Administración', codigo: 'CEA' },
  { nombre: 'Ciencias Jurídicas', codigo: 'CJ' },
  { nombre: 'Ingeniería', codigo: 'ING' },
  { nombre: 'Arquitectura', codigo: 'ARQ' },
  { nombre: 'Ciencias de la Educación y de la Comunicación Social', codigo: 'CECS' },
  { nombre: 'Ciencias de la Salud', codigo: 'CS' },
  { nombre: 'Escuela de Educación', codigo: 'EE' }
];

const AULAS_CORRECTAS = [
  { nombre: 'Aula 4', capacidad: 72, ubicacion: 'Edificio Principal' },
  { nombre: 'Aula 8', capacidad: 71, ubicacion: 'Edificio Principal' },
  { nombre: 'Aula 12', capacidad: 69, ubicacion: 'Edificio Principal' },
  { nombre: 'Laboratorio Informático', capacidad: 34, ubicacion: 'Laboratorio de Computación' }
];

const MAPEOS_SECTORES = {
  '2': 'CEA',
  '3': 'CJ', 
  '4': 'ING',
  '5': 'ARQ',
  '7': 'CECS',
  '8': 'CS',
  '21': 'EE'
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Usa POST.'
    });
  }

  try {
    console.log('🚀 CONFIGURACIÓN COMPLETA VIA API...');
    const resultado = { facultades: 0, aulas: 0, mapeosSectores: 0 };

    // 1. CREAR FACULTADES
    console.log('📚 Creando facultades...');
    for (const facultadData of FACULTADES_BASE) {
      const facultad = await prisma.facultad.upsert({
        where: { nombre: facultadData.nombre },
        update: { codigo: facultadData.codigo, activa: true },
        create: {
          nombre: facultadData.nombre,
          codigo: facultadData.codigo,
          activa: true
        }
      });
      resultado.facultades++;
      console.log(`  ✅ ${facultadData.nombre}`);
    }

    // 2. CREAR AULAS
    console.log('🏫 Creando aulas...');
    for (const aulaData of AULAS_CORRECTAS) {
      const aula = await prisma.aula.upsert({
        where: { nombre: aulaData.nombre },
        update: { 
          capacidad: aulaData.capacidad,
          ubicacion: aulaData.ubicacion,
          disponible: true 
        },
        create: {
          nombre: aulaData.nombre,
          capacidad: aulaData.capacidad,
          ubicacion: aulaData.ubicacion,
          disponible: true
        }
      });
      resultado.aulas++;
      console.log(`  ✅ ${aulaData.nombre} (${aulaData.capacidad})`);
    }

    // 3. CREAR MAPEOS DE SECTORES
    console.log('🗺️ Creando mapeos de sectores...');
    for (const [sector, codigoFacultad] of Object.entries(MAPEOS_SECTORES)) {
      const facultad = await prisma.facultad.findFirst({
        where: { codigo: codigoFacultad }
      });
      
      if (facultad) {
        await prisma.sectorFacultad.upsert({
          where: { sector: sector },
          update: { 
            facultadId: facultad.id,
            activo: true 
          },
          create: {
            sector: sector,
            facultadId: facultad.id,
            activo: true
          }
        });
        resultado.mapeosSectores++;
        console.log(`  ✅ Sector ${sector} → ${codigoFacultad}`);
      }
    }

    console.log('✅ CONFIGURACIÓN COMPLETA');

    return res.status(200).json({
      success: true,
      message: 'Configuración completa exitosa',
      data: {
        ...resultado,
        timestamp: new Date().toISOString(),
        siguientePaso: 'Ejecutar sincronización de TOTEM'
      }
    });

  } catch (error) {
    console.error('❌ Error en configuración:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error durante la configuración',
      message: error.message
    });
  }
}

export default withCors(handler); 
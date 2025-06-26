#!/usr/bin/env node

import prisma from '../src/lib/db.js';
import fs from 'fs';
import path from 'path';

console.log('🚀 INICIALIZACIÓN COMPLETA DEL SISTEMA TOTEM');
console.log('==========================================\n');

async function inicializarDesdeCero() {
  try {
    console.log('📋 Paso 1/5: Verificando base de datos...');
    await verificarConexion();
    
    console.log('🏛️  Paso 2/5: Creando facultades...');
    await crearFacultadesIniciales();
    
    console.log('🎓 Paso 3/5: Creando carreras...');
    await crearCarrerasIniciales();
    
    console.log('🏫 Paso 4/5: Creando aulas...');
    await crearAulasIniciales();
    
    console.log('🗺️  Paso 5/5: Creando mapeos...');
    await crearMapeosIniciales();
    
    console.log('\n✅ INICIALIZACIÓN COMPLETADA EXITOSAMENTE');
    await mostrarResumenFinal();
    
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function verificarConexion() {
  try {
    await prisma.$connect();
    console.log('   ✅ Conexión a base de datos establecida');
  } catch (error) {
    throw new Error(`No se pudo conectar a la base de datos: ${error.message}`);
  }
}

async function crearFacultadesIniciales() {
  const facultades = [
    { nombre: 'Ciencias Económicas y de Administración', codigo: 'CEA' },
    { nombre: 'Ciencias Jurídicas', codigo: 'CJ' },
    { nombre: 'Ingeniería', codigo: 'ING' },
    { nombre: 'Arquitectura', codigo: 'ARQ' },
    { nombre: 'Ciencias de la Educación y de la Comunicación Social', codigo: 'CECS' },
    { nombre: 'Artes y Ciencias Musicales', codigo: 'ACM' },
    { nombre: 'Ciencias de la Salud', codigo: 'CS' },
    { nombre: 'Humanidades', codigo: 'HUM' },
    { nombre: 'Psicología y Psicopedagogía', codigo: 'PP' },
    { nombre: 'Escuela de Educación', codigo: 'EE' },
    { nombre: 'Instituto de Ciencias', codigo: 'IC' },
    { nombre: 'Escuela de Posgrado', codigo: 'EP' },
    { nombre: 'Escuela de Negocios', codigo: 'EN' },
    { nombre: 'Instituto de Investigación', codigo: 'II' }
  ];
  
  let creadas = 0;
  for (const facultadData of facultades) {
    const facultad = await prisma.facultad.upsert({
      where: { nombre: facultadData.nombre },
      update: { 
        codigo: facultadData.codigo,
        activa: true 
      },
      create: {
        nombre: facultadData.nombre,
        codigo: facultadData.codigo,
        activa: true
      }
    });
    
    if (facultad) {
      creadas++;
      console.log(`   ✅ ${facultadData.nombre}`);
    }
  }
  
  console.log(`   📊 Total facultades: ${creadas}`);
}

async function crearCarrerasIniciales() {
  // Leer carreras desde CSV
  const csvPath = path.join(process.cwd(), 'Codcar_y_Carrera.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('   ⚠️  Archivo CSV de carreras no encontrado, creando carreras básicas...');
    await crearCarrerasBasicas();
    return;
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  
  let creadas = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split(',').map(s => s.trim().replace(/"/g, ''));
    if (parts.length < 3) continue;
    
    const [codigo, nombre, facultadNombre] = parts;
    
    if (codigo && nombre && facultadNombre) {
      const facultad = await prisma.facultad.findFirst({
        where: { 
          OR: [
            { nombre: { contains: facultadNombre } },
            { codigo: facultadNombre }
          ]
        }
      });
      
      if (facultad) {
        const carrera = await prisma.carrera.upsert({
          where: { 
            facultadId_codigo: {
              facultadId: facultad.id,
              codigo: codigo
            }
          },
          update: { 
            nombre: nombre,
            activa: true 
          },
          create: {
            nombre: nombre,
            codigo: codigo,
            facultadId: facultad.id,
            activa: true
          }
        });
        
        if (carrera) {
          creadas++;
          if (creadas <= 5) {
            console.log(`   ✅ ${nombre} (${codigo})`);
          }
        }
      }
    }
  }
  
  console.log(`   📊 Total carreras: ${creadas}`);
}

async function crearCarrerasBasicas() {
  const carrerasBasicas = [
    { codigo: '9', nombre: 'Tecnicatura Universitaria en Secretariado Ejecutivo', facultad: 'CEA' },
    { codigo: '10', nombre: 'Licenciatura en Economía', facultad: 'CEA' },
    { codigo: '11', nombre: 'Licenciatura en Administración de Empresas', facultad: 'CEA' },
    { codigo: '14', nombre: 'Contador Público', facultad: 'CEA' },
    { codigo: '15', nombre: 'Licenciatura en Comercialización', facultad: 'CEA' },
    { codigo: '16', nombre: 'Abogacía', facultad: 'CJ' },
    { codigo: '17', nombre: 'Licenciatura en Relaciones Internacionales', facultad: 'CJ' },
    { codigo: '18', nombre: 'Ingeniería Civil', facultad: 'ING' },
    { codigo: '19', nombre: 'Ingeniería Industrial', facultad: 'ING' },
    { codigo: '30', nombre: 'Licenciatura en Relaciones Públicas e Institucionales', facultad: 'CECS' }
  ];
  
  let creadas = 0;
  for (const carreraData of carrerasBasicas) {
    const facultad = await prisma.facultad.findFirst({
      where: { codigo: carreraData.facultad }
    });
    
    if (facultad) {
      await prisma.carrera.upsert({
        where: { 
          facultadId_codigo: {
            facultadId: facultad.id,
            codigo: carreraData.codigo
          }
        },
        update: { 
          nombre: carreraData.nombre,
          activa: true 
        },
        create: {
          nombre: carreraData.nombre,
          codigo: carreraData.codigo,
          facultadId: facultad.id,
          activa: true
        }
      });
      
      creadas++;
      console.log(`   ✅ ${carreraData.nombre}`);
    }
  }
  
  console.log(`   📊 Total carreras básicas: ${creadas}`);
}

async function crearAulasIniciales() {
  const aulas = [
    { nombre: 'Aula 4', capacidad: 72, ubicacion: 'Edificio Principal' },
    { nombre: 'Aula 8', capacidad: 71, ubicacion: 'Edificio Principal' },
    { nombre: 'Aula 12', capacidad: 69, ubicacion: 'Edificio Principal' },
    { nombre: 'Laboratorio Informático', capacidad: 34, ubicacion: 'Laboratorio de Computación' },
    { nombre: 'Notebooks', capacidad: 26, ubicacion: 'Virtual - Notebooks portátiles' },
    { nombre: 'Aula Virtual', capacidad: 100, ubicacion: 'Virtual' }
  ];
  
  let creadas = 0;
  for (const aulaData of aulas) {
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
    
    if (aula) {
      creadas++;
      console.log(`   ✅ ${aulaData.nombre} (${aulaData.capacidad} personas)`);
    }
  }
  
  console.log(`   📊 Total aulas: ${creadas}`);
}

async function crearMapeosIniciales() {
  // Mapeos de sectores basados en el CSV
  const sectoresMapping = {
    '2': { nombre: 'Ciencias Económicas y de Administración', codigo: 'CEA' },
    '3': { nombre: 'Ciencias Jurídicas', codigo: 'CJ' },
    '4': { nombre: 'Ingeniería', codigo: 'ING' },
    '5': { nombre: 'Arquitectura', codigo: 'ARQ' },
    '7': { nombre: 'Ciencias de la Educación y de la Comunicación Social', codigo: 'CECS' },
    '8': { nombre: 'Ciencias de la Salud', codigo: 'CS' },
    '21': { nombre: 'Escuela de Educación', codigo: 'EE' }
  };
  
  let sectoresCreados = 0;
  console.log('   🗺️  Creando mapeos de sectores...');
  
  for (const [sector, info] of Object.entries(sectoresMapping)) {
    const facultad = await prisma.facultad.findFirst({
      where: { codigo: info.codigo }
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
      
      sectoresCreados++;
      console.log(`   ✅ Sector ${sector} → ${info.nombre}`);
    }
  }
  
  console.log(`   📊 Mapeos de sectores: ${sectoresCreados}`);
  
  // Crear mapeos de carreras TOTEM
  console.log('   🎓 Creando mapeos de carreras TOTEM...');
  let carrerasMapeadas = 0;
  
  const carreras = await prisma.carrera.findMany({
    include: { facultad: true }
  });
  
  for (const carrera of carreras) {
    await prisma.carreraTotem.upsert({
      where: { codigoTotem: carrera.codigo },
      update: { 
        carreraId: carrera.id,
        nombreTotem: carrera.nombre,
        esMapeada: true,
        activo: true 
      },
      create: {
        codigoTotem: carrera.codigo,
        carreraId: carrera.id,
        nombreTotem: carrera.nombre,
        esMapeada: true,
        activo: true
      }
    });
    
    carrerasMapeadas++;
  }
  
  console.log(`   📊 Mapeos de carreras: ${carrerasMapeadas}`);
}

async function mostrarResumenFinal() {
  const facultades = await prisma.facultad.count();
  const carreras = await prisma.carrera.count();
  const aulas = await prisma.aula.count();
  const sectoresMapeados = await prisma.sectorFacultad.count();
  const carrerasMapeadas = await prisma.carreraTotem.count({ where: { esMapeada: true } });
  
  console.log('\n📊 RESUMEN FINAL:');
  console.log(`   🏛️  Facultades: ${facultades}`);
  console.log(`   🎓 Carreras: ${carreras}`);
  console.log(`   🏫 Aulas: ${aulas}`);
  console.log(`   🗺️  Sectores mapeados: ${sectoresMapeados}`);
  console.log(`   🔗 Carreras mapeadas: ${carrerasMapeadas}`);
  console.log('\n🎯 SIGUIENTE PASO:');
  console.log('   Ejecuta sincronización TOTEM: curl -X POST http://localhost:3000/api/v1/totem/sync');
  console.log('\n🎉 ¡Sistema listo para usar!');
}

// Ejecutar inicialización
inicializarDesdeCero(); 
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function configurarAulasCorrectas() {
  console.log('🏫 Configurando las 4 aulas EXACTAS según especificación UAM...\n');

  try {
    // 1. PRIMERO: Eliminar aulas que no deberían existir
    console.log('🗑️ Paso 1: Eliminando aulas no deseadas...');
    
    const aulasAEliminar = ['Notebooks', 'Aula Virtual'];
    
    for (const nombreAula of aulasAEliminar) {
      const aulaExistente = await prisma.aula.findUnique({
        where: { nombre: nombreAula }
      });
      
      if (aulaExistente) {
        // Verificar si tiene exámenes asignados
        const examenesAsignados = await prisma.examen.count({
          where: { aulaId: aulaExistente.id }
        });
        
        if (examenesAsignados > 0) {
          console.log(`⚠️  Aula "${nombreAula}" tiene ${examenesAsignados} exámenes asignados. Se transfieren a sin aula.`);
          
          // Desasignar exámenes antes de eliminar
          await prisma.examen.updateMany({
            where: { aulaId: aulaExistente.id },
            data: { aulaId: null }
          });
        }
        
        // Eliminar aula
        await prisma.aula.delete({
          where: { id: aulaExistente.id }
        });
        
        console.log(`❌ Eliminada: ${nombreAula}`);
      } else {
        console.log(`✅ No existe: ${nombreAula}`);
      }
    }

    // 2. SEGUNDO: Configurar las 4 aulas EXACTAS
    console.log('\n🎯 Paso 2: Configurando las 4 aulas correctas...');
    
    const aulasCorrectas = [
      {
        nombre: 'Aula 4',
        capacidad: 72,
        ubicacion: 'Edificio Principal UAM 03',
        disponible: true
      },
      {
        nombre: 'Aula 8',
        capacidad: 71,
        ubicacion: 'Edificio Principal UAM 03',
        disponible: true
      },
      {
        nombre: 'Aula 12',
        capacidad: 69,
        ubicacion: 'Edificio Principal UAM 03',
        disponible: true
      },
      {
        nombre: 'Laboratorio Informático',
        capacidad: 34,
        ubicacion: 'Laboratorio UAM 03',
        disponible: true
      }
    ];

    for (const aulaConfig of aulasCorrectas) {
      const aulaExistente = await prisma.aula.findUnique({
        where: { nombre: aulaConfig.nombre }
      });

      if (aulaExistente) {
        // Actualizar aula existente con datos correctos
        await prisma.aula.update({
          where: { id: aulaExistente.id },
          data: {
            capacidad: aulaConfig.capacidad,
            ubicacion: aulaConfig.ubicacion,
            disponible: aulaConfig.disponible
          }
        });
        console.log(`✅ Actualizada: ${aulaConfig.nombre} (Capacidad: ${aulaConfig.capacidad})`);
      } else {
        // Crear nueva aula
        await prisma.aula.create({
          data: aulaConfig
        });
        console.log(`🆕 Creada: ${aulaConfig.nombre} (Capacidad: ${aulaConfig.capacidad})`);
      }
    }

    // 3. TERCERO: Limpiar tabla de configuración avanzada
    console.log('\n🧹 Paso 3: Limpiando configuración avanzada...');
    
    // Eliminar configuraciones que no corresponden
    await prisma.aulaConfiguracion.deleteMany({
      where: {
        nombre: {
          in: ['Notebooks', 'Aula Virtual']
        }
      }
    });

    // Configurar las 4 aulas en la tabla de configuración
    const configsCorrectas = [
      {
        nombre: 'Aula 4',
        tipo: 'FISICA',
        capacidadMaxima: 72,
        recursoEspecial: null,
        cantidadRecurso: null,
        esParaInformatica: false,
        prioridadAsignacion: 1
      },
      {
        nombre: 'Aula 8',
        tipo: 'FISICA',
        capacidadMaxima: 71,
        recursoEspecial: null,
        cantidadRecurso: null,
        esParaInformatica: false,
        prioridadAsignacion: 2
      },
      {
        nombre: 'Aula 12',
        tipo: 'FISICA',
        capacidadMaxima: 69,
        recursoEspecial: null,
        cantidadRecurso: null,
        esParaInformatica: false,
        prioridadAsignacion: 3
      },
      {
        nombre: 'Laboratorio Informático',
        tipo: 'LABORATORIO',
        capacidadMaxima: 34,
        recursoEspecial: 'PCS_ESCRITORIO',
        cantidadRecurso: 34,
        esParaInformatica: true,
        prioridadAsignacion: 4
      }
    ];

    for (const config of configsCorrectas) {
      const configExistente = await prisma.aulaConfiguracion.findUnique({
        where: { nombre: config.nombre }
      });

      if (configExistente) {
        await prisma.aulaConfiguracion.update({
          where: { id: configExistente.id },
          data: config
        });
        console.log(`✅ Config actualizada: ${config.nombre}`);
      } else {
        await prisma.aulaConfiguracion.create({
          data: config
        });
        console.log(`🆕 Config creada: ${config.nombre}`);
      }
    }

    // 4. MOSTRAR RESUMEN FINAL
    console.log('\n📊 CONFIGURACIÓN FINAL:');
    
    const aulasFinales = await prisma.aula.findMany({
      orderBy: { capacidad: 'desc' }
    });

    const totalCapacidad = aulasFinales.reduce((total, aula) => total + aula.capacidad, 0);

    console.log('┌─────────────────────────┬──────────┬─────────────────────────┐');
    console.log('│ Aula                    │ Capacidad│ Ubicación               │');
    console.log('├─────────────────────────┼──────────┼─────────────────────────┤');
    
    aulasFinales.forEach(aula => {
      const nombre = aula.nombre.padEnd(23);
      const capacidad = aula.capacidad.toString().padStart(8);
      const ubicacion = (aula.ubicacion || '').substring(0, 23).padEnd(23);
      console.log(`│ ${nombre} │ ${capacidad} │ ${ubicacion} │`);
    });
    
    console.log('└─────────────────────────┴──────────┴─────────────────────────┘');
    console.log(`\n🎯 Total de aulas: ${aulasFinales.length} (debe ser 4)`);
    console.log(`📊 Capacidad total: ${totalCapacidad} estudiantes`);

    if (aulasFinales.length === 4) {
      console.log('\n✅ ¡CONFIGURACIÓN CORRECTA! Exactamente 4 aulas como se solicitó.');
    } else {
      console.log(`\n❌ ERROR: Se esperaban 4 aulas pero hay ${aulasFinales.length}`);
    }

    console.log('\n📋 CRITERIOS DE ASIGNACIÓN:');
    console.log('▶️ Laboratorio Informático (34) → Exámenes que requieren PC');
    console.log('▶️ Aula 12 (69) → Grupos medianos');
    console.log('▶️ Aula 8 (71) → Grupos grandes');
    console.log('▶️ Aula 4 (72) → Grupos muy grandes');

    console.log('\n✅ ¡Configuración de aulas UAM completada exitosamente!');

  } catch (error) {
    console.error('❌ Error configurando aulas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  configurarAulasCorrectas()
    .then(() => {
      console.log('\n🎉 Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error ejecutando script:', error);
      process.exit(1);
    });
}

export default configurarAulasCorrectas; 
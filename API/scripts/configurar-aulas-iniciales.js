import prisma from '../src/lib/db.js';

async function configurarAulasIniciales() {
  console.log('🎯 Configurando aulas iniciales del sistema TOTEM...\n');

  try {
    // Definir aulas según la imagen proporcionada
    const aulasConfiguracion = [
      {
        nombre: 'Aula 4',
        capacidad: 72,
        ubicacion: 'Edificio Principal',
        disponible: true
      },
      {
        nombre: 'Aula 8',
        capacidad: 71,
        ubicacion: 'Edificio Principal',
        disponible: true
      },
      {
        nombre: 'Aula 12',
        capacidad: 69,
        ubicacion: 'Edificio Principal',
        disponible: true
      },
      {
        nombre: 'Laboratorio Informático',
        capacidad: 34,
        ubicacion: 'Laboratorio de Computación',
        disponible: true
      },
      {
        nombre: 'Notebooks',
        capacidad: 26,
        ubicacion: 'Virtual - Notebooks portátiles',
        disponible: true
      }
    ];

    console.log('📋 Creando/actualizando aulas...');

    for (const aulaConfig of aulasConfiguracion) {
      const aulaExistente = await prisma.aula.findUnique({
        where: { nombre: aulaConfig.nombre }
      });

      if (aulaExistente) {
        // Actualizar aula existente
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

    // Configurar la tabla de configuración de aulas
    console.log('\n📊 Configurando tabla de configuración de aulas...');

    const aulasConfigAvanzada = [
      {
        nombre: 'Notebooks',
        tipo: 'VIRTUAL',
        capacidadMaxima: 26,
        recursoEspecial: 'NOTEBOOKS',
        cantidadRecurso: 26,
        esParaInformatica: true,
        prioridadAsignacion: 1
      },
      {
        nombre: 'Laboratorio Informático',
        tipo: 'LABORATORIO',
        capacidadMaxima: 34,
        recursoEspecial: 'PCS_ESCRITORIO',
        cantidadRecurso: 34,
        esParaInformatica: true,
        prioridadAsignacion: 2
      },
      {
        nombre: 'Aula 4',
        tipo: 'FISICA',
        capacidadMaxima: 72,
        recursoEspecial: null,
        cantidadRecurso: null,
        esParaInformatica: false,
        prioridadAsignacion: 3
      },
      {
        nombre: 'Aula 8',
        tipo: 'FISICA',
        capacidadMaxima: 71,
        recursoEspecial: null,
        cantidadRecurso: null,
        esParaInformatica: false,
        prioridadAsignacion: 4
      },
      {
        nombre: 'Aula 12',
        tipo: 'FISICA',
        capacidadMaxima: 69,
        recursoEspecial: null,
        cantidadRecurso: null,
        esParaInformatica: false,
        prioridadAsignacion: 5
      }
    ];

    for (const config of aulasConfigAvanzada) {
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

    // Mostrar resumen final
    console.log('\n📊 RESUMEN DE CONFIGURACIÓN:');
    
    const aulasFinales = await prisma.aula.findMany({
      orderBy: { nombre: 'asc' }
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
    console.log(`\n🎯 Total de aulas: ${aulasFinales.length}`);
    console.log(`📊 Capacidad total: ${totalCapacidad} estudiantes`);

    // Verificar criterios de asignación
    console.log('\n🧮 CRITERIOS DE ASIGNACIÓN:');
    console.log('▶️ Exámenes informáticos ≤26 estudiantes → Notebooks');
    console.log('▶️ Exámenes informáticos >26 estudiantes → Laboratorio Informático');
    console.log('▶️ Exámenes regulares → Agrupar por facultad en Aulas 4, 8, 12');
    console.log('▶️ Prioridad: aula más pequeña que cubra la necesidad');

    console.log('\n✅ ¡Configuración de aulas completada exitosamente!');

  } catch (error) {
    console.error('❌ Error configurando aulas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  configurarAulasIniciales()
    .then(() => {
      console.log('\n🎉 Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error ejecutando script:', error);
      process.exit(1);
    });
}

export default configurarAulasIniciales; 
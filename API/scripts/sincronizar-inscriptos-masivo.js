import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function sincronizarInscriptosMasivo() {
  console.log('🔄 Iniciando sincronización masiva de inscriptos...\n');

  try {
    // 1. Obtener todos los exámenes que tienen datos TOTEM
    const examenes = await prisma.examen.findMany({
      where: {
        examenTotem: {
          isNot: null
        }
      },
      include: {
        carrera: {
          include: {
            facultad: true
          }
        },
        aula: true,
        examenTotem: true
      },
      orderBy: [
        { fecha: 'asc' },
        { hora: 'asc' }
      ]
    });

    console.log(`📊 Encontrados ${examenes.length} exámenes con datos TOTEM para sincronizar`);

    // 2. Configurar fechas para consulta API externa
    const fechaDesde = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    
    const fechaHasta = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    console.log(`📅 Consultando período: ${fechaDesde} hasta ${fechaHasta}\n`);

    // 3. Procesar cada examen
    let procesados = 0;
    let exitosos = 0;
    let errores = 0;
    let totalInscriptos = 0;

    for (const examen of examenes) {
      procesados++;
      
      try {
        const totem = examen.examenTotem;
        const materiaId = totem.materiaTotem;
        const areaTema = totem.areaTemaTotem;
        const carrera = totem.carreraTotem;

        console.log(`[${procesados}/${examenes.length}] ${examen.nombreMateria}`);
        console.log(`   📋 Materia: ${materiaId} | AreaTema: ${areaTema} | Carrera: ${carrera}`);

        // Consultar API externa
        const apiUrl = `https://sistemasweb-desa.ucasal.edu.ar/api/v1/acta/materia/${materiaId}?rendida=false&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.log(`   ⚠️  API no disponible (${response.status})`);
          errores++;
          continue;
        }

        const datosCompletos = await response.json();
        
        if (!Array.isArray(datosCompletos)) {
          console.log(`   ⚠️  Respuesta inválida de API`);
          errores++;
          continue;
        }

        // Aplicar filtro por areaTema y carrera
        const inscriptosFiltrados = datosCompletos.filter(registro => {
          const cumpleAreaTema = areaTema ? registro.areaTema == areaTema : true;
          const cumpleCarrera = carrera ? registro.carrera == carrera : true;
          const tieneAlumnos = registro.alumnos && registro.alumnos.length > 0;
          
          return cumpleAreaTema && cumpleCarrera && tieneAlumnos;
        });

        // Extraer todos los alumnos
        let todosLosInscriptos = [];
        inscriptosFiltrados.forEach(registro => {
          if (registro.alumnos && Array.isArray(registro.alumnos)) {
            todosLosInscriptos = todosLosInscriptos.concat(registro.alumnos);
          }
        });

        const cantidad = todosLosInscriptos.length;

        // Actualizar en base de datos
        await prisma.examen.update({
          where: { id: examen.id },
          data: {
            cantidadInscriptos: cantidad,
            fechaUltConsulta: new Date()
          }
        });

        console.log(`   ✅ ${cantidad} inscriptos → Guardado`);
        
        exitosos++;
        totalInscriptos += cantidad;

        // Pausa entre consultas para no sobrecargar API
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errores++;
      }
    }

    // 4. Mostrar resumen final
    console.log('\n📊 RESUMEN DE SINCRONIZACIÓN:');
    console.log('┌─────────────────────────┬──────────┐');
    console.log('│ Métrica                 │ Cantidad │');
    console.log('├─────────────────────────┼──────────┤');
    console.log(`│ Exámenes procesados     │ ${procesados.toString().padStart(8)} │`);
    console.log(`│ Sincronizaciones exitosas│ ${exitosos.toString().padStart(8)} │`);
    console.log(`│ Errores                 │ ${errores.toString().padStart(8)} │`);
    console.log(`│ Total inscriptos        │ ${totalInscriptos.toString().padStart(8)} │`);
    console.log('└─────────────────────────┴──────────┘');

    // 5. Mostrar top 10 exámenes con más inscriptos
    console.log('\n🏆 TOP 10 EXÁMENES CON MÁS INSCRIPTOS:');
    
    const topExamenes = await prisma.examen.findMany({
      where: {
        cantidadInscriptos: {
          gt: 0
        }
      },
      include: {
        carrera: {
          include: {
            facultad: true
          }
        },
        aula: true
      },
      orderBy: {
        cantidadInscriptos: 'desc'
      },
      take: 10
    });

    console.log('┌─────┬─────────────────────────────────┬─────────┬─────────────────────┐');
    console.log('│ Pos │ Materia                         │ Inscr.  │ Aula                │');
    console.log('├─────┼─────────────────────────────────┼─────────┼─────────────────────┤');
    
    topExamenes.forEach((examen, index) => {
      const pos = (index + 1).toString().padStart(3);
      const materia = examen.nombreMateria.substring(0, 31).padEnd(31);
      const inscriptos = examen.cantidadInscriptos.toString().padStart(7);
      const aula = examen.aula ? examen.aula.nombre.substring(0, 19).padEnd(19) : 'Sin asignar'.padEnd(19);
      
      console.log(`│ ${pos} │ ${materia} │ ${inscriptos} │ ${aula} │`);
    });
    
    console.log('└─────┴─────────────────────────────────┴─────────┴─────────────────────┘');

    // 6. Identificar exámenes que necesitan aula
    const sinAula = await prisma.examen.count({
      where: {
        aulaId: null,
        cantidadInscriptos: {
          gt: 0
        }
      }
    });

    console.log(`\n⚠️  ${sinAula} exámenes con inscriptos necesitan asignación de aula`);

    const porcentajeExito = procesados > 0 ? ((exitosos / procesados) * 100).toFixed(1) : 0;
    console.log(`\n✅ Sincronización completada con ${porcentajeExito}% de éxito`);

  } catch (error) {
    console.error('❌ Error en sincronización masiva:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  sincronizarInscriptosMasivo()
    .then(() => {
      console.log('\n🎉 Sincronización masiva completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en sincronización:', error);
      process.exit(1);
    });
}

export default sincronizarInscriptosMasivo; 
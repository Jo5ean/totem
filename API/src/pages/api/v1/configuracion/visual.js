import db from '../../../../lib/db.js';

// Configuración por defecto
const configuracionDefecto = {
  backgroundImage: '/default-bg.jpg',
  titulo: 'Consultá donde rendís tu examen',
  subtitulo: 'UCASAL - Educación Digital',
  colorPrimario: '#dc2626',
  colorSecundario: '#991b1b'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Obtener configuración visual
      try {
        const configuracion = await db.configuracionVisual.findFirst({
          where: { activa: true }
        });

        if (configuracion) {
          return res.status(200).json({
            success: true,
            data: {
              backgroundImage: configuracion.backgroundImage || configuracionDefecto.backgroundImage,
              titulo: configuracion.titulo || configuracionDefecto.titulo,
              subtitulo: configuracion.subtitulo || configuracionDefecto.subtitulo,
              colorPrimario: configuracion.colorPrimario || configuracionDefecto.colorPrimario,
              colorSecundario: configuracion.colorSecundario || configuracionDefecto.colorSecundario
            }
          });
        }
      } catch (error) {
        console.log('Tabla de configuración no existe aún, usando valores por defecto');
      }

      // Si no existe configuración, devolver la por defecto
      return res.status(200).json({
        success: true,
        data: configuracionDefecto
      });

    } else if (req.method === 'PUT') {
      // Actualizar configuración visual
      const { backgroundImage, titulo, subtitulo, colorPrimario, colorSecundario } = req.body;

      try {
        // Intentar actualizar configuración existente
        const configuracionExistente = await db.configuracionVisual.findFirst({
          where: { activa: true }
        });

        let configuracion;

        if (configuracionExistente) {
          configuracion = await db.configuracionVisual.update({
            where: { id: configuracionExistente.id },
            data: {
              backgroundImage: backgroundImage || configuracionExistente.backgroundImage,
              titulo: titulo || configuracionExistente.titulo,
              subtitulo: subtitulo || configuracionExistente.subtitulo,
              colorPrimario: colorPrimario || configuracionExistente.colorPrimario,
              colorSecundario: colorSecundario || configuracionExistente.colorSecundario,
              updatedAt: new Date()
            }
          });
        } else {
          configuracion = await db.configuracionVisual.create({
            data: {
              backgroundImage: backgroundImage || configuracionDefecto.backgroundImage,
              titulo: titulo || configuracionDefecto.titulo,
              subtitulo: subtitulo || configuracionDefecto.subtitulo,
              colorPrimario: colorPrimario || configuracionDefecto.colorPrimario,
              colorSecundario: colorSecundario || configuracionDefecto.colorSecundario,
              activa: true
            }
          });
        }

        return res.status(200).json({
          success: true,
          data: configuracion,
          message: 'Configuración visual actualizada correctamente'
        });

      } catch (error) {
        console.error('Error al actualizar configuración visual:', error);
        return res.status(500).json({
          success: false,
          error: 'Error interno del servidor al actualizar configuración'
        });
      }

    } else {
      return res.status(405).json({
        success: false,
        error: `Método ${req.method} no permitido`
      });
    }

  } catch (error) {
    console.error('Error en endpoint de configuración visual:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
} 
import TotemService from '../../../../services/totemService.js';

const totemService = new TotemService();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['POST']
    });
  }

  try {
    console.log('Iniciando sincronización TOTEM centralizada...');
    
    const result = await totemService.syncTotemData();
    
    return res.status(200).json({
      success: true,
      message: 'Sincronización TOTEM completada exitosamente',
      data: result
    });
    
  } catch (error) {
    console.error('Error en sincronización TOTEM:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en la sincronización TOTEM',
      message: error.message
    });
  }
}

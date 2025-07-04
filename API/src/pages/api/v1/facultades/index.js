import { validateMethod } from '../../../../middleware/validation.js';
import { getAllFacultades, createFacultad } from '../../../../controllers/facultadController.js';

export default async function handler(req, res) {
  // Validar método
  const methodValidator = validateMethod(['GET', 'POST']);
  const methodError = methodValidator(req, res);
  if (methodError) return;

  try {
    if (req.method === 'GET') {
      return await getAllFacultades(req, res);
    }
    
    if (req.method === 'POST') {
      return await createFacultad(req, res);
    }
  } catch (error) {
    console.error('Error en handler facultades:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 
import { validateMethod } from '../../../../middleware/validation.js';
import { 
  getFacultadById, 
  updateFacultad, 
  deleteFacultad 
} from '../../../../controllers/facultadController.js';

export default async function handler(req, res) {
  // Validar método
  const methodValidator = validateMethod(['GET', 'PUT', 'DELETE']);
  const methodError = methodValidator(req, res);
  if (methodError) return;

  try {
    if (req.method === 'GET') {
      return await getFacultadById(req, res);
    }
    
    if (req.method === 'PUT') {
      return await updateFacultad(req, res);
    }
    
    if (req.method === 'DELETE') {
      return await deleteFacultad(req, res);
    }
  } catch (error) {
    console.error('Error en handler facultad por ID:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 
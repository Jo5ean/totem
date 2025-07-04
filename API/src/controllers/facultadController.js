import FacultadService from '../services/facultadService.js';

const facultadService = new FacultadService();

export async function getAllFacultades(req, res) {
  try {
    const facultades = await facultadService.getAllFacultades();
    
    return res.status(200).json({
      success: true,
      data: facultades,
      total: facultades.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en getAllFacultades:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

export async function getFacultadById(req, res) {
  try {
    const { id } = req.query;
    const facultad = await facultadService.getFacultadById(id);
    
    if (!facultad) {
      return res.status(404).json({
        success: false,
        error: 'Facultad no encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: facultad,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en getFacultadById:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

export async function createFacultad(req, res) {
  try {
    const { nombre, codigo, sheetId } = req.body;
    
    if (!nombre || !codigo) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y código son requeridos'
      });
    }
    
    const facultad = await facultadService.createFacultad({
      nombre,
      codigo,
      sheetId
    });
    
    return res.status(201).json({
      success: true,
      data: facultad,
      message: 'Facultad creada exitosamente'
    });
  } catch (error) {
    console.error('Error en createFacultad:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

export async function updateFacultad(req, res) {
  try {
    const { id } = req.query;
    const updateData = req.body;
    
    const facultad = await facultadService.updateFacultad(id, updateData);
    
    return res.status(200).json({
      success: true,
      data: facultad,
      message: 'Facultad actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error en updateFacultad:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

export async function deleteFacultad(req, res) {
  try {
    const { id } = req.query;
    
    await facultadService.deleteFacultad(id);
    
    return res.status(200).json({
      success: true,
      message: 'Facultad eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteFacultad:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 
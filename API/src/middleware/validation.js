export function validateMethod(allowedMethods) {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      return res.status(405).json({
        success: false,
        error: `Método ${req.method} no permitido`,
        allowedMethods
      });
    }
    next?.();
  };
}

export function validateFacultadId(req, res, next) {
  const { facultadId } = req.query;
  
  if (!facultadId || isNaN(parseInt(facultadId))) {
    return res.status(400).json({
      success: false,
      error: 'ID de facultad requerido y debe ser un número válido'
    });
  }
  
  req.facultadId = parseInt(facultadId);
  next?.();
}

export function validatePagination(req, res, next) {
  const { page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      error: 'El parámetro page debe ser un número mayor a 0'
    });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      error: 'El parámetro limit debe ser un número entre 1 y 100'
    });
  }
  
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
  
  next?.();
}

export function validateDateRange(req, res, next) {
  const { fechaDesde, fechaHasta } = req.query;
  
  if (fechaDesde && isNaN(Date.parse(fechaDesde))) {
    return res.status(400).json({
      success: false,
      error: 'fechaDesde debe tener formato de fecha válido (YYYY-MM-DD)'
    });
  }
  
  if (fechaHasta && isNaN(Date.parse(fechaHasta))) {
    return res.status(400).json({
      success: false,
      error: 'fechaHasta debe tener formato de fecha válido (YYYY-MM-DD)'
    });
  }
  
  if (fechaDesde && fechaHasta && new Date(fechaDesde) > new Date(fechaHasta)) {
    return res.status(400).json({
      success: false,
      error: 'fechaDesde no puede ser mayor que fechaHasta'
    });
  }
  
  next?.();
} 
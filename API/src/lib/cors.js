/**
 * Helper para configurar CORS en todos los endpoints
 * Resuelve problemas de preflight requests y headers
 */
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

/**
 * Middleware wrapper que aplica CORS y maneja OPTIONS
 */
export function withCors(handler) {
  return async (req, res) => {
    // Aplicar headers CORS
    setCorsHeaders(res);
    
    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Ejecutar el handler original
    return handler(req, res);
  };
} 
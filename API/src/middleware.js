// Middleware para manejar CORS en toda la API
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Configurar headers CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', 'http://localhost:3001');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Credentials', 'true');

  // Manejar preflight requests (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  // Para otras requests, continuar con headers CORS
  const response = NextResponse.next();
  
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

// Configurar matcher para que solo se aplique a rutas de API
export const config = {
  matcher: '/api/:path*',
}; 
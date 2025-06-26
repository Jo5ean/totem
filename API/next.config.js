/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración mínima para API
  serverExternalPackages: ['@prisma/client'],
  
  // Configuración CORS para permitir requests desde el backoffice
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Permitir todos los orígenes en desarrollo
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Deshabilitar optimizaciones de frontend
  images: {
    unoptimized: true,
  },
  eslint: {
    dirs: ['src'],
  },
};

export default nextConfig; 
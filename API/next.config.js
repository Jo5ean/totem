/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración mínima para API
  serverExternalPackages: ['@prisma/client'],
  
  // Deshabilitar optimizaciones de frontend
  images: {
    unoptimized: true,
  },
  eslint: {
    dirs: ['src'],
  },
  
  // Headers adicionales para desarrollo
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
        ],
      },
    ];
  },
};

export default nextConfig; 
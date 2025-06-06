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
};

export default nextConfig; 
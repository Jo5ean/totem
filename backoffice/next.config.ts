import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Configurar para subdirectorio
  basePath: '/proyectos-innovalab/backoffice',
  assetPrefix: '/proyectos-innovalab/backoffice'
};

export default nextConfig;

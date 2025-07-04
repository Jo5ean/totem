import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/proyectos-innovalab/backoffice',
  assetPrefix: '/proyectos-innovalab/backoffice',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://totem-api-production.up.railway.app'
  },
  trailingSlash: true
};

export default nextConfig;

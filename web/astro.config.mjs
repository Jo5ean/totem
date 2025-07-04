// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  base: '/proyectos-innovalab/web',
  server: { port: 4321 },
  build: {
    assets: '_assets'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
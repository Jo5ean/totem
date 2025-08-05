// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  base: '/proyectos-innovalab/web',
  output: 'static',
  server: {
    port: 3001
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
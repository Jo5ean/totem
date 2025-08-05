#!/usr/bin/env node

import { handler as ssrHandler } from './dist/server/entry.mjs';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Servir archivos estáticos desde el directorio client
app.use(express.static(join(__dirname, 'dist/client')));

// Usar el handler de Astro para todas las rutas
app.use(ssrHandler);

app.listen(port, () => {
  console.log(`🚀 Servidor iniciado en puerto ${port}`);
  console.log(`🌐 URL: http://localhost:${port}`);
});

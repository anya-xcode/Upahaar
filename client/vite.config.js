import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  server: {
    port: 5173,
    // Keeps the API same-origin in dev, so no CORS surprises and the token
    // header is the only thing the client has to manage.
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// During development, API calls to /api are forwarded to the Express server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths, so the build works at a domain root and under a sub-path (GitHub Pages).
  base: "./",
  plugins: [react()],
  server: { host: true, port: 5173 },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['framer-motion'],
          map: ['leaflet', 'h3-js'],
        },
      },
    },
  },
});

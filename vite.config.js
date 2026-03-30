import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Strip console.log and debugger in production builds
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charting libraries (heavy)
          'vendor-charts': ['chart.js', 'react-chartjs-2', 'recharts'],
          // UI/animation libraries
          'vendor-ui': ['framer-motion', 'lucide-react'],
          // Axios + JWT utilities
          'vendor-http': ['axios', 'jwt-decode'],
        },
      },
    },
  },
  publicDir: 'public',
  preview: {
    allowedHosts: ['presspilot.up.railway.app'],
  },
});

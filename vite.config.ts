import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Replacements for process.env to allow client-side code to work without a global shim
    'process.env.API_KEY': JSON.stringify("AIzaSyAmmqhyWpQPUayvwP0doxbeIpUx7aHCtv8"),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  build: {
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-worker': ['pdfjs-dist/build/pdf.worker.mjs'],
          'pdf-lib': ['pdfjs-dist/build/pdf.mjs'],
          'vendor': ['react', 'react-dom', '@google/genai', 'mammoth', 'marked'],
        },
      },
    },
  },
});

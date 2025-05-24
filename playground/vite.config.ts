import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-filter-pilot': resolve(__dirname, '../src'),
    },
  },
  server: {
    port: 3000,
  },
  define: {
    // Polyfill for process.env needed by Next.js
    'process.env': {},
    'process.browser': true,
    'process.version': '"v16.0.0"',
    'process': {
      env: {},
      browser: true,
      version: '"v16.0.0"'
    },
  },
});

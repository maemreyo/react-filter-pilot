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
});

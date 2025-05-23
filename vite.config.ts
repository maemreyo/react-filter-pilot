import { defineConfig } from 'vitest/config';

import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', 'src/setupTests.ts'],
      compilerOptions: {
        skipLibCheck: true,
        noEmit: false,
        declaration: true,
        emitDeclarationOnly: true,
      },
      tsconfigPath: './tsconfig.build.json',
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ReactFilterPilot',
      formats: ['es', 'umd'],
      fileName: (format) => `react-filter-pilot.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@tanstack/react-query',
        'react-router-dom',
        'next/navigation',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@tanstack/react-query': 'ReactQuery',
          'react-router-dom': 'ReactRouterDom',
          'next/navigation': 'NextNavigation',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/src/setupTests.ts'],
    },
  },
});

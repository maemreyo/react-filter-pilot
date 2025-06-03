import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry point
  entry: ['src/index.ts'],
  
  // Output formats
  format: ['cjs', 'esm'],
  
  // Generate type declarations
  dts: true,
  
  // Code splitting for better tree-shaking
  splitting: true,
  
  // Source maps for debugging
  sourcemap: true,
  
  // Clean output directory before build
  clean: true,
  
  // Minification
  minify: true,
  
  // Remove console logs in production
  esbuildOptions(options) {
    options.drop = ['console', 'debugger'];
    options.pure = ['console.log', 'console.info', 'console.debug'];
  },
  
  // External dependencies (peer deps)
  external: [
    'react',
    'react-dom',
    '@tanstack/react-query',
    'react-router-dom',
    'next/router',
    'next/navigation',
  ],
  
  // Exclude test files and examples
  exclude: [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.example.ts',
    '**/*.example.tsx',
    '**/__tests__/**',
    'src/test-utils/**',
  ],
  
  // Bundle configuration
  bundle: true,
  
  // Target modern environments
  target: 'es2020',
  
  // Platform
  platform: 'browser',
  
  // Tree shaking
  treeshake: true,
  
  // Output file names
  outDir: 'dist',
  
  // Keep original file structure for better debugging
  keepNames: true,
  
  // Banner for license info
  banner: {
    js: '/* @matthew.ngo/react-filter-pilot - MIT License */',
  },
  
  // Bundle analysis
  metafile: true,
});
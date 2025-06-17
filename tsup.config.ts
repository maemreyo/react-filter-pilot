import { defineConfig } from 'tsup';
import { globSync } from 'glob';

// Get all TypeScript files in src directory, excluding test files and examples
const entryPoints = globSync('src/**/*.ts', {
  ignore: [
    'src/**/*.test.ts',
    'src/**/*.test.tsx',
    'src/**/*.spec.ts',
    'src/**/*.spec.tsx',
    'src/**/*.example.ts',
    'src/**/*.example.tsx',
    'src/**/__tests__/**',
    'src/test-utils/**',
    'src/setupTests.ts',
    'src/vite-env.d.ts'
  ]
});

export default defineConfig({
  // Entry points - all TypeScript files
  entry: entryPoints,
  
  // Output formats
  format: ['cjs', 'esm'],
  
  // Generate type declarations
  dts: true,
  
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
  
  // Target modern environments
  target: 'es2020',
  
  // Platform
  platform: 'browser',
  
  // Tree shaking
  treeshake: true,
  
  // Output file names - preserve directory structure
  outDir: 'dist',
  
  // Keep original file structure for better debugging
  keepNames: true,
  
  // Preserve directory structure
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
  
  // Banner for license info
  banner: {
    js: '/* @matthew.ngo/react-filter-pilot - MIT License */',
  },
  
  // Bundle analysis
  metafile: true,
  
  // Important: Don't bundle all files together
  bundle: false,
});
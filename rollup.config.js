import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import packageJson from './package.json' assert { type: 'json' };

const input = 'src/index.ts';

export default defineConfig([
  // CommonJS and ESM builds
  {
    input,
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      // Exclude peer dependencies from bundle
      peerDepsExternal(),
      
      // Resolve node modules
      nodeResolve({
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      }),
      
      // Convert CommonJS modules to ES6
      commonjs(),
      
      // Compile TypeScript
      typescript({
        tsconfig: './tsconfig.json',
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
        declaration: false, // We'll handle this separately
      }),
      
      // Minify the output
      terser({
        format: {
          comments: false,
        },
        // compress: {
        //   drop_console: process.env.NODE_ENV === 'production',
        // },
      }),
    ],
    external: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'react-router-dom',
      'next/router',
      'next/navigation',
    ],
  },
  
  // Type definitions build
  {
    input,
    output: {
      file: packageJson.types,
      format: 'es',
    },
    plugins: [dts()],
    external: [/\.css$/],
  },
]);
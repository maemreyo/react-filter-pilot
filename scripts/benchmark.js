#!/usr/bin/env node

/**
 * Performance benchmark script for build times
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Running build performance benchmarks...\n');

const benchmarks = [];

// Benchmark tsup build
console.log('📦 Benchmarking tsup build...');
const tsupStart = Date.now();
try {
  execSync('pnpm run build', { stdio: 'pipe' });
  const tsupTime = Date.now() - tsupStart;
  benchmarks.push({
    tool: 'tsup',
    time: tsupTime,
    success: true
  });
  console.log(`✅ tsup build completed in ${tsupTime}ms`);
} catch (error) {
  benchmarks.push({
    tool: 'tsup',
    time: Date.now() - tsupStart,
    success: false,
    error: error.message
  });
  console.log(`❌ tsup build failed`);
}

// Clean for next test
execSync('pnpm run clean', { stdio: 'pipe' });

// Benchmark rollup build (if config exists)
if (fs.existsSync('rollup.config.js')) {
  console.log('\n📦 Benchmarking rollup build...');
  const rollupStart = Date.now();
  try {
    execSync('pnpm run build:rollup', { stdio: 'pipe' });
    const rollupTime = Date.now() - rollupStart;
    benchmarks.push({
      tool: 'rollup',
      time: rollupTime,
      success: true
    });
    console.log(`✅ rollup build completed in ${rollupTime}ms`);
  } catch (error) {
    benchmarks.push({
      tool: 'rollup',
      time: Date.now() - rollupStart,
      success: false,
      error: error.message
    });
    console.log(`❌ rollup build failed`);
  }
}

// Generate report
console.log('\n📊 Performance Report:');
console.log('='.repeat(50));

benchmarks.forEach(benchmark => {
  const status = benchmark.success ? '✅' : '❌';
  console.log(`${status} ${benchmark.tool}: ${benchmark.time}ms`);
  if (!benchmark.success) {
    console.log(`   Error: ${benchmark.error}`);
  }
});

// Compare if we have multiple results
if (benchmarks.length > 1) {
  const successful = benchmarks.filter(b => b.success);
  if (successful.length > 1) {
    const fastest = successful.reduce((a, b) => a.time < b.time ? a : b);
    const slowest = successful.reduce((a, b) => a.time > b.time ? a : b);
    const improvement = ((slowest.time - fastest.time) / slowest.time * 100).toFixed(1);
    
    console.log('\n🏆 Performance Comparison:');
    console.log(`Fastest: ${fastest.tool} (${fastest.time}ms)`);
    console.log(`Slowest: ${slowest.tool} (${slowest.time}ms)`);
    console.log(`Improvement: ${improvement}% faster with ${fastest.tool}`);
  }
}

// Save results
const results = {
  timestamp: new Date().toISOString(),
  benchmarks,
  nodeVersion: process.version,
  platform: process.platform
};

fs.writeFileSync('benchmark-results.json', JSON.stringify(results, null, 2));
console.log('\n💾 Results saved to benchmark-results.json');
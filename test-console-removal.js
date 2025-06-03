#!/usr/bin/env node

/**
 * Test script to verify console logs are removed from built package
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing console log removal...\n');

const distFiles = [
  'dist/index.js',
  'dist/index.cjs'
];

let hasConsole = false;

distFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for various console methods
  const consolePatterns = [
    /console\.log/g,
    /console\.info/g,
    /console\.debug/g,
    /console\.warn/g,
    /console\.error/g
  ];
  
  let fileHasConsole = false;
  
  consolePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      console.log(`❌ Found ${pattern.source} in ${file}: ${matches.length} occurrences`);
      fileHasConsole = true;
      hasConsole = true;
    }
  });
  
  if (!fileHasConsole) {
    console.log(`✅ ${file}: No console logs found`);
  }
});

console.log('\n📊 Summary:');
if (hasConsole) {
  console.log('❌ Console logs still present in build output!');
  process.exit(1);
} else {
  console.log('✅ All console logs successfully removed from build output!');
  console.log('🎉 Package is ready for production use!');
}
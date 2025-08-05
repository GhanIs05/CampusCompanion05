#!/usr/bin/env node

/**
 * Build verification script for CampusCompanion
 * Checks for common issues before deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-deployment checks...\n');

// Check 1: Verify .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Warning: .env.local file not found');
  console.log('   Create one based on .env.local.example\n');
} else {
  console.log('✅ Environment file found\n');
}

// Check 2: Verify Firebase configuration
const firebaseConfigPath = path.join(process.cwd(), 'firebase.json');
if (!fs.existsSync(firebaseConfigPath)) {
  console.log('❌ Error: firebase.json not found');
  console.log('   Run: firebase init\n');
  process.exit(1);
} else {
  console.log('✅ Firebase configuration found\n');
}

// Check 3: Verify build output directory
const outDir = path.join(process.cwd(), 'out');
if (!fs.existsSync(outDir)) {
  console.log('⚠️  Warning: Build output directory not found');
  console.log('   Run: npm run build\n');
} else {
  console.log('✅ Build output directory exists\n');
}

// Check 4: Verify critical files exist
const criticalFiles = [
  'src/app/layout.tsx',
  'src/lib/firebase.ts',
  'public/manifest.json',
  'public/sw.js'
];

let allFilesExist = true;
criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Missing critical file: ${file}`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('✅ All critical files present\n');
}

// Check 5: Package.json scripts
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredScripts = ['build', 'deploy:hosting', 'deploy:full'];
  
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  if (missingScripts.length > 0) {
    console.log(`⚠️  Warning: Missing package.json scripts: ${missingScripts.join(', ')}\n`);
  } else {
    console.log('✅ All required npm scripts present\n');
  }
}

// Summary
console.log('📋 Pre-deployment check summary:');
if (allFilesExist && fs.existsSync(firebaseConfigPath)) {
  console.log('✅ Ready for deployment!');
  console.log('\nNext steps:');
  console.log('1. npm run build');
  console.log('2. npm run deploy:hosting');
} else {
  console.log('❌ Please fix the issues above before deploying');
  process.exit(1);
}

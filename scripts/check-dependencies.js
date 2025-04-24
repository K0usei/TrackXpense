/**
 * Script to check for missing dependencies in the project
 * 
 * Usage:
 * node scripts/check-dependencies.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const backendRequirementsPath = path.join(__dirname, '..', 'backend', 'requirements.txt');
const mlRequirementsPath = path.join(__dirname, '..', 'backend', 'ml', 'requirements.txt');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const frontendDeps = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {})
]);

// Read backend requirements
const backendReqs = fs.readFileSync(backendRequirementsPath, 'utf8')
  .split('\n')
  .filter(line => !line.startsWith('#') && line.trim() !== '')
  .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim())
  .filter(Boolean);

// Read ML requirements
const mlReqs = fs.readFileSync(mlRequirementsPath, 'utf8')
  .split('\n')
  .filter(line => !line.startsWith('#') && line.trim() !== '')
  .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim())
  .filter(Boolean);

console.log('=== TrackXpense Dependency Check ===');

// Check frontend dependencies
console.log('\n=== Frontend Dependencies ===');
console.log(`Total dependencies: ${frontendDeps.size}`);

// Check backend dependencies
console.log('\n=== Backend Dependencies ===');
console.log(`Total dependencies: ${backendReqs.length}`);

// Check ML dependencies
console.log('\n=== ML Dependencies ===');
console.log(`Total dependencies: ${mlReqs.length}`);

// Check for missing dependencies in backend requirements that are in ML requirements
const missingInBackend = mlReqs.filter(dep => !backendReqs.includes(dep));
if (missingInBackend.length > 0) {
  console.log('\n⚠️ Dependencies in ML requirements but missing in backend requirements:');
  missingInBackend.forEach(dep => console.log(`  - ${dep}`));
} else {
  console.log('\n✅ All ML dependencies are included in backend requirements');
}

// Check for installed but unlisted npm packages
try {
  console.log('\n=== Checking for unlisted npm packages ===');
  const installedPackages = execSync('npm list --depth=0 --json', { encoding: 'utf8' });
  const installedDeps = Object.keys(JSON.parse(installedPackages).dependencies || {});
  
  const unlistedDeps = installedDeps.filter(dep => !frontendDeps.has(dep));
  if (unlistedDeps.length > 0) {
    console.log('⚠️ Installed npm packages not listed in package.json:');
    unlistedDeps.forEach(dep => console.log(`  - ${dep}`));
  } else {
    console.log('✅ All installed npm packages are listed in package.json');
  }
} catch (error) {
  console.error('Error checking installed npm packages:', error.message);
}

// Check for installed but unlisted Python packages
try {
  console.log('\n=== Checking for unlisted Python packages ===');
  console.log('Note: This requires the backend virtual environment to be activated');
  console.log('To check manually, run: pip freeze > installed.txt and compare with requirements.txt');
} catch (error) {
  console.error('Error checking installed Python packages:', error.message);
}

console.log('\n=== Dependency Check Complete ===');

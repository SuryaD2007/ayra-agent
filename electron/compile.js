const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const electronDir = __dirname;

console.log('🔨 Compiling TypeScript...');

try {
  // Clean old build files first
  console.log('✨ Cleaning old build files...');
  ['main.js', 'preload.js', 'main.cjs', 'preload.cjs'].forEach(file => {
    const filePath = path.join(electronDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  ✓ Removed ${file}`);
    }
  });
  
  // Compile TypeScript (run from electron directory)
  execSync('tsc -p tsconfig.json', { cwd: electronDir, stdio: 'inherit' });
  
  console.log('✨ Renaming to .cjs extensions...');
  
  // Rename .js to .cjs
  const jsFiles = [
    { from: 'main.js', to: 'main.cjs' },
    { from: 'preload.js', to: 'preload.cjs' }
  ];
  
  jsFiles.forEach(({ from, to }) => {
    const fromPath = path.join(electronDir, from);
    const toPath = path.join(electronDir, to);
    
    if (fs.existsSync(fromPath)) {
      fs.renameSync(fromPath, toPath);
      console.log(`  ✓ ${from} → ${to}`);
    } else {
      console.error(`  ✗ ${from} not found!`);
      process.exit(1);
    }
  });
  
  console.log('✅ Build complete!\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

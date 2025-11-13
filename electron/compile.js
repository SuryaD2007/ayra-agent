const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const electronDir = path.join(__dirname);

console.log('🔨 Compiling TypeScript...');

try {
  // Compile TypeScript
  execSync('tsc -p electron/tsconfig.json', { stdio: 'inherit' });
  
  console.log('✨ Renaming to .cjs extensions...');
  
  // Clean old .cjs files
  ['main.cjs', 'preload.cjs'].forEach(file => {
    const filePath = path.join(electronDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
  
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

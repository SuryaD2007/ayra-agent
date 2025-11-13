const fs = require('fs');
const path = require('path');

// Clean and rename compiled JS files to CJS to avoid ES module conflicts
const electronDir = path.join(__dirname);

try {
  // First, remove any existing .cjs files to ensure clean build
  const cjsFiles = ['main.cjs', 'preload.cjs'];
  cjsFiles.forEach(file => {
    const filePath = path.join(electronDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Removed existing ${file}`);
    }
  });

  // Now rename the compiled .js files to .cjs
  if (fs.existsSync(path.join(electronDir, 'main.js'))) {
    fs.renameSync(
      path.join(electronDir, 'main.js'),
      path.join(electronDir, 'main.cjs')
    );
    console.log('✓ Renamed main.js to main.cjs');
  } else {
    console.error('ERROR: main.js not found after TypeScript compilation');
    process.exit(1);
  }
  
  if (fs.existsSync(path.join(electronDir, 'preload.js'))) {
    fs.renameSync(
      path.join(electronDir, 'preload.js'),
      path.join(electronDir, 'preload.cjs')
    );
    console.log('✓ Renamed preload.js to preload.cjs');
  } else {
    console.error('ERROR: preload.js not found after TypeScript compilation');
    process.exit(1);
  }

  console.log('✓ Electron build files ready');
} catch (error) {
  console.error('Error processing files:', error);
  process.exit(1);
}

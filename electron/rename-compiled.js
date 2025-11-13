const fs = require('fs');
const path = require('path');

// Rename compiled JS files to CJS to avoid ES module conflicts
const electronDir = path.join(__dirname);

try {
  if (fs.existsSync(path.join(electronDir, 'main.js'))) {
    fs.renameSync(
      path.join(electronDir, 'main.js'),
      path.join(electronDir, 'main.cjs')
    );
    console.log('Renamed main.js to main.cjs');
  }
  
  if (fs.existsSync(path.join(electronDir, 'preload.js'))) {
    fs.renameSync(
      path.join(electronDir, 'preload.js'),
      path.join(electronDir, 'preload.cjs')
    );
    console.log('Renamed preload.js to preload.cjs');
  }
} catch (error) {
  console.error('Error renaming files:', error);
  process.exit(1);
}

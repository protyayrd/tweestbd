const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory containing built JS files
const buildDir = path.join(__dirname, 'build/static/js');

console.log('Starting console.log removal from build files...');

// Get all JS files in the build directory
try {
  const files = fs.readdirSync(buildDir).filter(file => file.endsWith('.js'));
  
  for (const file of files) {
    const filePath = path.join(buildDir, file);
    console.log(`Processing: ${file}`);
    
    // Use terser to minify and remove console statements
    // The --compress option with pure_funcs=['console.log', etc] removes those function calls
    const command = `npx terser "${filePath}" --compress pure_funcs=['console.log','console.warn','console.error','console.info','console.debug','console.table'] --output "${filePath}"`;
    
    try {
      execSync(command);
      console.log(`Successfully processed: ${file}`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  console.log('All files processed. Console logs have been removed.');
} catch (error) {
  console.error('Error accessing build directory:', error.message);
}

const fs = require('fs');
const path = require('path');

// Define the path to the .env file
const envFilePath = path.resolve(__dirname, './.env');

// Read the .env file as a string
fs.readFile(envFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading .env file:', err);
    process.exit(1);
  }
  // console.log('Contents of .env file:');
  // console.log(data);

  // Extract the value of VITE_SERVICE_ID
  const match = data.match(/^VITE_SERVICE_ID\s*=\s*(.*)$/m);
  if (match) {
    const serviceId = match[1];
    // console.log(`VITE_SERVICE_ID: ${serviceId}`);

    // copy public/sw.js to public/${serviceId}.js
    const sourceFile = path.resolve(__dirname, './public/sw.js');
    const targetFile = path.resolve(__dirname, './public', `wrk.${serviceId}.js`);
    fs.copyFile(sourceFile, targetFile, (err) => {
      if (err) {
        console.error(`Failed to copy sw.js to wrk.${serviceId}.js: ${err.message}`);
        process.exit(1);
      }
      // console.log(`Copied sw.js to wrk.${serviceId}.js`);
    });
  } else {
    console.error('VITE_SERVICE_ID not found in .env file');
  }
  // Create a environment variable named VITE_BUILD_TIME and edit/replace the .env file
  const buildTime = new Date().toLocaleString();
  const updatedData = data.replace(/^VITE_BUILD_TIME\s*=\s*(.*)$/m, `VITE_BUILD_TIME=${buildTime}`);
  fs.writeFile(envFilePath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('Error updating .env file:', err);
      process.exit(1);
    }
    // console.log(`Updated .env file with VITE_BUILD_TIME=${buildTime}`);
  });
});

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env from root
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.config({ path: envPath }).parsed || {};
const PORT = envConfig.PORT || 3000;

console.log(`Building extension with PORT=${PORT}`);

// Read template
const templatePath = path.resolve(__dirname, 'manifest.json.template');
let manifestContent = fs.readFileSync(templatePath, 'utf8');

// Replace placeholder
manifestContent = manifestContent.replace(/\{\{PORT\}\}/g, PORT);

// Write manifest
const outputPath = path.resolve(__dirname, './manifest.json');
fs.writeFileSync(outputPath, manifestContent);

console.log('Generated manifest.json');

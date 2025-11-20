import fs from 'fs';
import path from 'path';
import { settings } from './setting';

console.log(`Building extension with PORT=${settings.serverUrl}`);
  
// Read template
const templatePath = path.resolve(__dirname, 'manifest.json.template');
let manifestContent = fs.readFileSync(templatePath, 'utf8');

// Replace placeholder
manifestContent = manifestContent.replace(/\{\{SERVER_URL\}\}/g, settings.serverUrl);

// Write manifest
const outputPath = path.resolve(__dirname, './manifest.json');
fs.writeFileSync(outputPath, manifestContent);

console.log('Generated manifest.json');

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const settings = {
  serverUrl: process.env.SERVER_URL || 'http://localhost:3099',
};

console.log(`Building extension with PORT=${settings.serverUrl}`);

// Read template
const templatePath = path.resolve(__dirname, 'manifest.json.template');
let manifestContent = fs.readFileSync(templatePath, 'utf8');

// Replace placeholder
manifestContent = manifestContent.replace(/\{\{SERVER_URL\}\}/g, settings.serverUrl);

// Write manifest
const outputPath = path.resolve(process.cwd(), './manifest.json');
fs.writeFileSync(outputPath, manifestContent);

console.log('Generated manifest.json');

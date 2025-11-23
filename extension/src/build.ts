import { build } from 'esbuild';
import fs from 'fs';
import path from 'node:path';
import { manifest } from './manifest.json.template';
import { settings } from './settings';

// 1. Generate manifest.json
let manifestContent = JSON.stringify(manifest, null, 2);
manifestContent = manifestContent.replace(/\{\{SERVER_URL\}\}/g, settings.serverUrl);
const manifestPath = path.resolve(__dirname, '../manifest.json');
fs.writeFileSync(manifestPath, manifestContent);
console.log('Generated manifest.json');
// 2. Bundle with esbuild
build({
  entryPoints: [path.resolve(__dirname, 'content.ts')],
  outfile: path.resolve(__dirname, '../dist/content.js'),
  bundle: true,
  platform: 'browser',
  target: ['chrome100'],
})
  .then(() => {
    console.log('Bundled dist/content.js');
  })
  .catch(() => process.exit(1));

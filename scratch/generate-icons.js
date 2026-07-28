import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Minimal 1x1 blue PNG buffer
const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const files = ['icon-192x192.png', 'icon-512x512.png', 'maskable-icon-512x512.png', 'apple-touch-icon.png'];

for (const file of files) {
  const filePath = path.join(dir, file);
  fs.writeFileSync(filePath, minimalPng);
  console.log(`Created placeholder icon: ${filePath}`);
}

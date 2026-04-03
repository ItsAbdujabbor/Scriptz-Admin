#!/usr/bin/env node
/**
 * Serves the Scriptz-Admin app so the UI loads at / (no "Index of" listing).
 * Run from this folder: node run-serve.js   or   npm run serve
 */
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3001;
const dir = path.resolve(__dirname);

console.log('');
console.log('  Scriptz Admin');
console.log('  -------------');
console.log('  Serving from:', dir);
console.log('  Open in browser: http://localhost:' + PORT);
console.log('  Stop with Ctrl+C');
console.log('');

const child = spawn(
  'npx',
  ['serve', dir, '-s', '-l', String(PORT)],
  { stdio: 'inherit', shell: true }
);

child.on('error', function (err) {
  console.error('Error:', err.message);
  process.exit(1);
});

child.on('exit', function (code) {
  process.exit(code || 0);
});

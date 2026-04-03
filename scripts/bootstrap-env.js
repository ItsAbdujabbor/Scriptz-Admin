#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dst = path.join(root, '.env');
const src = path.join(root, '.env.example');

if (!fs.existsSync(src)) {
  console.error('Missing .env.example');
  process.exit(1);
}
if (fs.existsSync(dst)) {
  console.log('.env already exists — left unchanged');
  process.exit(0);
}
fs.copyFileSync(src, dst);
console.log('Created .env from .env.example (edit SCRIPTZ_API_BASE_URL if needed)');

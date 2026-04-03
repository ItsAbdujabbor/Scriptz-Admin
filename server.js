require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Production: trust proxy (Render, Heroku, etc.)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Development: disable caching to avoid stale content and 304 responses
const noCache = (req, res, next) => {
  if (!isProduction) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
};

// Security and body parsing
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
app.use(express.json({ limit: '10kb' }));

// Static files: disable etag/last-modified in dev to avoid 304
app.use(express.static(path.join(__dirname), {
  index: false,
  etag: isProduction,
  lastModified: isProduction,
}));

// Root route: return valid HTML with no-cache in dev
app.get('/', noCache, (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// SPA fallback: unknown routes serve index.html for client-side routing
app.use((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!isProduction) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  res.status(200).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Scriptz Admin running on http://localhost:${PORT} (${isProduction ? 'production' : 'development'})`);
});

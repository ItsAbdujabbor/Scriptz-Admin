require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

/** Upstream Scriptz-Api — same role as Vite `server.proxy['/api'].target` */
function apiUpstreamUrl() {
  return (process.env.SCRIPTZ_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
}

/**
 * If set, the browser calls this URL directly (like VITE_API_BASE_URL). Proxy is disabled; fix CORS on the API.
 * If unset, browser uses relative /api (empty base) — same as React dev with no VITE_API_BASE_URL.
 */
function publicApiBaseForBrowser() {
  return (process.env.SCRIPTZ_PUBLIC_API_BASE_URL || '').trim().replace(/\/$/, '');
}

const publicBase = publicApiBaseForBrowser();
const proxyExplicitOff = String(process.env.SCRIPTZ_ADMIN_API_PROXY || '').toLowerCase() === '0';
const useApiProxy = !proxyExplicitOff && !publicBase;

// Production: trust proxy (Render, Heroku, etc.)
if (isProduction) {
  app.set('trust proxy', 1);
}

const noCache = (req, res, next) => {
  if (!isProduction) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
};

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

/** Only real API routes: /api or /api/… — not static names like /api.js (Vite uses the same idea). */
function isApiProxyPath(fullPath) {
  return fullPath === '/api' || fullPath.startsWith('/api/');
}

function createApiProxy() {
  return (req, res, next) => {
    const forwardPath = req.originalUrl || req.url || '/';
    const fullPath = forwardPath.split('?')[0];
    if (!isApiProxyPath(fullPath)) return next();

    let tgt;
    try {
      tgt = new URL(apiUpstreamUrl());
    } catch (e) {
      return next(e);
    }

    const isHttps = tgt.protocol === 'https:';
    const lib = isHttps ? https : http;
    const port = tgt.port ? parseInt(tgt.port, 10) : (isHttps ? 443 : 80);

    const outHeaders = { ...req.headers };
    outHeaders.host = tgt.host;

    const opt = {
      hostname: tgt.hostname,
      port,
      path: forwardPath,
      method: req.method,
      headers: outHeaders,
    };

    const pReq = lib.request(opt, (pRes) => {
      const out = { ...pRes.headers };
      delete out['transfer-encoding'];
      res.writeHead(pRes.statusCode, out);
      pRes.pipe(res);
    });
    pReq.on('error', () => {
      if (!res.headersSent) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            error: {
              code: 'BAD_GATEWAY',
              message:
                'Scriptz Admin could not reach Scriptz-Api at ' +
                apiUpstreamUrl() +
                '. Is the API running?',
            },
          }),
        );
      }
    });
    req.pipe(pReq);
  };
}

if (useApiProxy) {
  app.use(createApiProxy());
}

app.use(express.json({ limit: '10kb' }));

// Injected config — matches Scriptz-App-React getApiBaseUrl(): dev + proxy => ''
app.get('/config.js', noCache, (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  let apiBaseForBrowser;
  if (useApiProxy) {
    apiBaseForBrowser = '';
  } else {
    apiBaseForBrowser = publicBase || apiUpstreamUrl();
  }
  res.send(
    '(function(g){g.SCRIPTZ_CONFIG={API_BASE_URL:' +
      JSON.stringify(apiBaseForBrowser) +
      ',API_MODE:' +
      JSON.stringify(useApiProxy ? 'proxy' : 'direct') +
      '};})(typeof window!==\'undefined\'?window:this);',
  );
});

app.use(express.static(path.join(__dirname), {
  index: false,
  etag: isProduction,
  lastModified: isProduction,
}));

app.get('/', noCache, (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'index.html'));
});

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
  const mode = isProduction ? 'production' : 'development';
  console.log(`Scriptz Admin → http://localhost:${PORT} (${mode})`);
  if (useApiProxy) {
    console.log(`API (React-style) → browser uses relative /api; proxy → ${apiUpstreamUrl()}`);
  } else {
    console.log(`API (direct)     → browser → ${publicBase || apiUpstreamUrl()} (set CORS on Scriptz-Api)`);
  }
});

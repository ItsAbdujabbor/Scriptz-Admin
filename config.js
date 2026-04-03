/**
 * Fallback when index.html is opened without the Express dev server (e.g. file:// or plain static host).
 *
 * With `npm start`, /config.js is served by server.js and usually sets API_BASE_URL to '' (proxy mode,
 * same as Scriptz-App-React dev with empty VITE_API_BASE_URL).
 *
 * Optional: <meta name="scriptz-api-base" content="https://api.example.com">
 * Optional before load: window.SCRIPTZ_API_BASE_URL = 'https://your-api.com';
 */
(function (global) {
  'use strict';
  var base = 'http://127.0.0.1:8000';

  if (typeof window !== 'undefined' && window.SCRIPTZ_API_BASE_URL) {
    base = String(window.SCRIPTZ_API_BASE_URL).trim().replace(/\/$/, '');
  }

  if (typeof document !== 'undefined' && document.querySelector) {
    var meta = document.querySelector('meta[name="scriptz-api-base"]');
    var fromMeta = meta && meta.getAttribute('content');
    if (fromMeta && String(fromMeta).trim()) {
      global.SCRIPTZ_CONFIG = {
        API_BASE_URL: String(fromMeta).trim().replace(/\/$/, ''),
        API_MODE: 'direct',
      };
      return;
    }
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    if (window.location.port === '8000') {
      base = window.location.origin;
    }
  }

  global.SCRIPTZ_CONFIG = {
    API_BASE_URL: base,
    API_MODE: 'direct',
  };
})(typeof window !== 'undefined' ? window : this);

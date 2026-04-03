/**
 * Scriptz Admin — API base URL. Same as main app when served from API; override for standalone.
 */
(function (global) {
  // Default to production API - change this if running locally
  var base = 'https://scriptz.app';
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    var hostname = window.location.hostname;
    // Use localhost if running locally
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      base = 'http://127.0.0.1:8000';
    }
  }
  global.SCRIPTZ_CONFIG = {
    API_BASE_URL: base,
  };
})(typeof window !== 'undefined' ? window : this);

/**
 * Scriptz Admin — API base URL. Same as main app when served from API; override for standalone.
 */
(function (global) {
  var base = 'http://127.0.0.1:8000';
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    var port = window.location.port;
    if (port === '8000') base = window.location.origin;
  }
  global.SCRIPTZ_CONFIG = {
    API_BASE_URL: base,
  };
})(typeof window !== 'undefined' ? window : this);

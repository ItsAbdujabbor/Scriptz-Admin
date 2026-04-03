/**
 * Scriptz Admin — API base URL.
 * 
 * HOW TO CONFIGURE:
 * 
 * Option 1: Set window.SCRIPTZ_API_BASE_URL before this script loads
 *   <script>window.SCRIPTZ_API_BASE_URL = 'https://your-api.com';</script>
 *   <script src="config.js"></script>
 * 
 * Option 2: Change the default below
 *   var defaultApiUrl = 'https://scriptz.app'; // <-- CHANGE THIS
 * 
 * Common setups:
 * - Local development: http://127.0.0.1:8000
 * - Production: https://scriptz.app
 * - Docker/Container: http://host.docker.internal:8000
 */
(function (global) {
  // ===== CONFIGURE YOUR API URL HERE =====
  var defaultApiUrl = 'https://scriptz.app';  // <-- Change this to your API URL
  // ========================================
  
  var base = defaultApiUrl;
  
  // Allow override before script loads
  if (typeof window !== 'undefined' && window.SCRIPTZ_API_BASE_URL) {
    base = window.SCRIPTZ_API_BASE_URL;
  }
  
  global.SCRIPTZ_CONFIG = {
    API_BASE_URL: base,
  };
  
  // Debug: show API URL in console
  if (typeof console !== 'undefined') {
    console.log('🔧 Scriptz Admin API URL:', base);
  }
})(typeof window !== 'undefined' ? window : this);
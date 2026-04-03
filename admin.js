/**
 * Scriptz Admin — init panel, fetch profile.
 */
(function (global) {
  'use strict';
  var AdminAuth = global.ScriptzAdminAuth || {};
  var panelInited = false;

  // Force dark mode only - no toggle
  function applyTheme() {
    var body = global.document && global.document.body;
    if (!body) return;
    body.setAttribute('data-theme', 'dark');
    try { if (global.localStorage) global.localStorage.setItem('scriptz-admin-theme', 'dark'); } catch (e) {}
  }

  var themeBound = false;
  function init(route) {
    var panel = global.ScriptzAdminPanel;
    if (panel && panel.init && !panelInited) {
      panel.init();
      panelInited = true;
      if (!themeBound) {
        themeBound = true;
        applyTheme();
      }
    }
    if (panel && panel.navigate) {
      panel.navigate(route || (panel.getPageFromHash && panel.getPageFromHash()));
    }
    if (!panelInited) return;
    if (AdminAuth.fetchAdminProfile) {
      AdminAuth.fetchAdminProfile().then(function () {
        var el = document.getElementById('admin-sidebar-email');
        if (el && AdminAuth.getAdminProfile && AdminAuth.getAdminProfile().email) el.textContent = AdminAuth.getAdminProfile().email;
      }).catch(function () {});
    }
  }

  global.ScriptzAdmin = {
    init: init
  };
})(typeof window !== 'undefined' ? window : this);

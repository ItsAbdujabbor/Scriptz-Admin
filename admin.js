/**
 * Scriptz Admin — init panel, fetch profile.
 */
(function (global) {
  'use strict';
  var AdminAuth = global.ScriptzAdminAuth || {};
  var panelInited = false;

  function applyTheme() {
    var body = global.document && global.document.body;
    if (!body) return;
    var t = 'dark';
    try {
      t = (global.localStorage && global.localStorage.getItem('scriptz-admin-theme')) || 'dark';
    } catch (e) {}
    if (t !== 'light' && t !== 'dark') t = 'dark';
    body.setAttribute('data-theme', t);
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

/**
 * Scriptz Admin — init panel, fetch profile.
 */
(function (global) {
  'use strict';
  var AdminAuth = global.ScriptzAdminAuth || {};
  var panelInited = false;

  function applyTheme(theme) {
    var body = global.document && global.document.body;
    if (!body) return;
    theme = theme || 'dark';
    body.setAttribute('data-theme', theme);
    try { if (global.localStorage) global.localStorage.setItem('scriptz-admin-theme', theme); } catch (e) {}
    var darkBtn = document.getElementById('admin-theme-dark');
    var lightBtn = document.getElementById('admin-theme-light');
    if (darkBtn) { darkBtn.classList.toggle('is-active', theme === 'dark'); darkBtn.setAttribute('aria-pressed', theme === 'dark'); }
    if (lightBtn) { lightBtn.classList.toggle('is-active', theme === 'light'); lightBtn.setAttribute('aria-pressed', theme === 'light'); }
  }

  var themeBound = false;
  function init(route) {
    var panel = global.ScriptzAdminPanel;
    if (panel && panel.init && !panelInited) {
      panel.init();
      panelInited = true;
      if (!themeBound) {
        themeBound = true;
        var darkBtn = document.getElementById('admin-theme-dark');
        var lightBtn = document.getElementById('admin-theme-light');
        if (darkBtn) darkBtn.addEventListener('click', function () { applyTheme('dark'); });
        if (lightBtn) lightBtn.addEventListener('click', function () { applyTheme('light'); });
        var cur = (global.document && global.document.body && global.document.body.getAttribute('data-theme')) || 'dark';
        applyTheme(cur);
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

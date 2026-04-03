/**
 * Scriptz Admin — app router. Shows login or panel based on hash and auth.
 */
(function (global) {
  'use strict';
  var Auth = global.ScriptzAuth || {};
  var API = global.ScriptzAPI || {};
  var AdminAuth = global.ScriptzAdminAuth || {};

  function getScreen() {
    var hash = (global.location.hash || '').replace(/^#/, '') || 'login';
    var base = hash.split('?')[0];
    return base || 'login';
  }

  function showLogin() {
    var login = document.getElementById('admin-login-screen');
    var panel = document.getElementById('admin-panel-screen');
    if (login) { login.classList.add('admin-screen--active'); login.classList.remove('admin-screen--hidden'); }
    if (panel) { panel.classList.add('admin-screen--hidden'); panel.classList.remove('admin-screen--active'); }
  }

  function showPanel() {
    var login = document.getElementById('admin-login-screen');
    var panel = document.getElementById('admin-panel-screen');
    if (login) { login.classList.add('admin-screen--hidden'); login.classList.remove('admin-screen--active'); }
    if (panel) { panel.classList.add('admin-screen--active'); panel.classList.remove('admin-screen--hidden'); }
  }

  function setErr(id, msg) {
    var el = document.getElementById(id);
    if (el) el.textContent = msg || '';
  }

  function initLoginForm() {
    var form = document.getElementById('admin-login-form');
    if (!form) return;
    form.onsubmit = function (e) {
      e.preventDefault();
      var email = (document.getElementById('admin-email') || {}).value.trim();
      var password = (document.getElementById('admin-password') || {}).value;
      setErr('admin-login-email-err', '');
      setErr('admin-login-password-err', '');
      var btn = document.getElementById('admin-login-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }
      var adminAuth = API.adminAuth;
      if (!adminAuth || !adminAuth.login) {
        setErr('admin-login-email-err', 'API not loaded.');
        if (btn) { btn.disabled = false; btn.textContent = 'Log in'; }
        return;
      }
      adminAuth.login(email, password).then(function (res) {
        Auth.setSession(res.access_token, res.refresh_token, res.expires_in, res.user);
        if (Auth.startProactiveRefresh) Auth.startProactiveRefresh();
        var role = (res.user && res.user.role) || 'user';
        if (role === 'admin') {
          global.location.hash = 'admin-dashboard';
          onHash();
        } else {
          setErr('admin-login-password-err', 'Admin access required.');
        }
      }).catch(function (err) {
        var msg = (err && err.message) || 'Login failed';
        if (err && err.status === 401) setErr('admin-login-password-err', 'Invalid email or password.');
        else setErr('admin-login-email-err', msg);
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Log in'; }
      });
    };
  }

  function onHash() {
    var screen = getScreen();
    var loggedIn = !!(Auth.isLoggedIn && Auth.isLoggedIn());
    var admin = !!(AdminAuth.isAdmin && AdminAuth.isAdmin());

    if (screen === 'login' || screen === 'admin-login' || screen === '') {
      showLogin();
      initLoginForm();
      return;
    }
    if (screen.indexOf('admin-') === 0) {
      if (!loggedIn || !admin) {
        global.location.hash = 'login';
        showLogin();
        initLoginForm();
        return;
      }
      showPanel();
      if (global.ScriptzAdmin && global.ScriptzAdmin.init) global.ScriptzAdmin.init(screen);
      return;
    }
    showLogin();
    initLoginForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (getScreen() === 'login' || getScreen() === '') global.location.hash = 'login';
      onHash();
    });
  } else {
    if (getScreen() === 'login' || getScreen() === '') global.location.hash = 'login';
    onHash();
  }
  global.addEventListener('hashchange', onHash);
})(typeof window !== 'undefined' ? window : this);

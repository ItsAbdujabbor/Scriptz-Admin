/**
 * Scriptz Admin Auth — profile and admin check. Uses same token storage as auth.js.
 */
(function (global) {
  'use strict';

  var Auth = global.ScriptzAuth || {};
  var API = global.ScriptzAPI || {};
  var adminProfile = null;

  function getCurrentUser() {
    return Auth && Auth.getCurrentUser ? Auth.getCurrentUser() : null;
  }

  function isAdmin() {
    var u = getCurrentUser();
    return !!(u && (u.role === 'admin'));
  }

  function getAccessToken() {
    return Auth && Auth.getAccessToken ? Auth.getAccessToken() : null;
  }

  function ensureAdminToken(fn) {
    if (!isAdmin()) return Promise.reject(new Error('Admin access required'));
    var ensure = Auth && Auth.ensureToken;
    return ensure ? ensure(typeof fn === 'function' ? fn : function () { return fn; }) : Promise.reject(new Error('Auth not loaded'));
  }

  function fetchAdminProfile() {
    var adminAuth = API.adminAuth;
    if (!adminAuth || !adminAuth.me) return Promise.reject(new Error('Admin auth API not loaded'));
    return ensureAdminToken(adminAuth.me).then(function (res) {
      adminProfile = res;
      return res;
    }).catch(function (err) {
      adminProfile = null;
      throw err;
    });
  }

  function getAdminProfile() { return adminProfile; }

  function clearAdminProfile() { adminProfile = null; }

  function logout() {
    clearAdminProfile();
    var refresh = Auth && Auth.getRefreshToken ? Auth.getRefreshToken() : null;
    if (refresh && API.adminAuth && API.adminAuth.logout) {
      API.adminAuth.logout(refresh).catch(function () {});
    }
    if (Auth && Auth.clearSession) Auth.clearSession();
  }

  global.ScriptzAdminAuth = {
    isAdmin: isAdmin,
    isLoggedIn: function () { return Auth && Auth.isLoggedIn && Auth.isLoggedIn(); },
    getAccessToken: getAccessToken,
    getCurrentUser: getCurrentUser,
    ensureAdminToken: ensureAdminToken,
    fetchAdminProfile: fetchAdminProfile,
    getAdminProfile: getAdminProfile,
    clearAdminProfile: clearAdminProfile,
    logout: logout,
  };
})(typeof window !== 'undefined' ? window : this);

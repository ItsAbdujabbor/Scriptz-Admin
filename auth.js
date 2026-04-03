/**
 * Scriptz Admin — token storage and refresh. Uses admin auth refresh endpoint.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'scriptz_auth';
  var currentUser = null;

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function save(data) {
    try {
      if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function getAccessToken() {
    var d = load();
    return (d && d.access_token) || null;
  }

  function getRefreshToken() {
    var d = load();
    return (d && d.refresh_token) || null;
  }

  function setSession(accessToken, refreshToken, expiresIn, user) {
    var now = Date.now();
    var exp = (expiresIn && typeof expiresIn === 'number') ? expiresIn : 900;
    var d = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: exp,
      expires_at: now + exp * 1000,
      user: user || (load() && load().user),
    };
    save(d);
    currentUser = d.user;
  }

  function clearSession() {
    save(null);
    currentUser = null;
    stopProactiveRefresh();
  }

  function getCurrentUser() {
    if (currentUser) return currentUser;
    var d = load();
    currentUser = (d && d.user) || null;
    return currentUser;
  }

  var refreshTimer = null;
  var REFRESH_BEFORE_MS = 2 * 60 * 1000;

  function maybeRefreshProactively() {
    var d = load();
    if (!d || !d.refresh_token) return;
    var expiresAt = d.expires_at;
    if (!expiresAt || Date.now() < expiresAt - REFRESH_BEFORE_MS) return;
    var api = global.ScriptzAPI && global.ScriptzAPI.adminAuth;
    if (!api || !api.refresh) return;
    api.refresh(d.refresh_token).then(function (res) {
      setSession(res.access_token, res.refresh_token, res.expires_in, res.user);
    }).catch(function () {
      clearSession();
      if (refreshTimer) clearInterval(refreshTimer);
      refreshTimer = null;
    });
  }

  function startProactiveRefresh() {
    if (refreshTimer) return;
    if (!getRefreshToken()) return;
    maybeRefreshProactively();
    refreshTimer = setInterval(maybeRefreshProactively, 60 * 1000);
  }

  function stopProactiveRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function ensureToken(fn) {
    var api = global.ScriptzAPI && global.ScriptzAPI.adminAuth;
    if (!api || !api.refresh) return Promise.reject(new Error('Admin auth API not loaded'));

    function doRequest() {
      return typeof fn === 'function' ? fn() : fn;
    }

    return doRequest().then(function (result) { return result; }).catch(function (err) {
      if (err && err.status !== 401) throw err;
      var refresh = getRefreshToken();
      if (!refresh) {
        clearSession();
        throw err;
      }
      return api.refresh(refresh).then(function (res) {
        setSession(res.access_token, res.refresh_token, res.expires_in, res.user);
        startProactiveRefresh();
        return doRequest();
      }).catch(function () {
        clearSession();
        throw err;
      });
    });
  }

  global.ScriptzAuth = {
    getAccessToken: getAccessToken,
    getRefreshToken: getRefreshToken,
    setSession: setSession,
    clearSession: clearSession,
    getCurrentUser: getCurrentUser,
    ensureToken: ensureToken,
    startProactiveRefresh: startProactiveRefresh,
    stopProactiveRefresh: stopProactiveRefresh,
    isLoggedIn: function () { return !!getAccessToken(); },
  };
})(typeof window !== 'undefined' ? window : this);

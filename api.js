/**
 * Scriptz Admin API client — admin auth + admin panel endpoints.
 * Requires: config.js, auth.js (getAccessToken, ensureToken with admin refresh)
 */
(function (global) {
  'use strict';

  /**
   * Same contract as Scriptz-App-React getApiBaseUrl():
   * - ''  → fetch('/api/...') same-origin; dev server proxies to FastAPI (here: Express).
   * - non-empty → absolute API origin (direct calls; CORS required).
   */
  function apiBaseUrl() {
    var cfg = global.SCRIPTZ_CONFIG;
    if (!cfg || cfg.API_BASE_URL === undefined || cfg.API_BASE_URL === null) {
      return 'http://127.0.0.1:8000';
    }
    var s = String(cfg.API_BASE_URL).trim();
    if (s === '') return '';
    return s.replace(/\/$/, '');
  }

  /** Human-readable base for settings UI */
  function apiBaseUrlDisplay() {
    var b = apiBaseUrl();
    if (b !== '') return b;
    try {
      var o = global.location && global.location.origin ? global.location.origin : '';
      return o ? o + ' (relative /api — same as Vite dev proxy)' : '(relative /api)';
    } catch (e) {
      return '(relative /api)';
    }
  }

  function networkErrorMessage(url, cause) {
    var base = apiBaseUrl();
    var origin = '';
    try {
      origin = global.location && global.location.origin ? global.location.origin : '';
    } catch (e) {}
    var pageHttps = origin.indexOf('https:') === 0;
    var effectiveApi = base === '' ? origin : base;
    var apiHttp = effectiveApi.indexOf('http:') === 0;
    var parts = [
      'Cannot reach the Scriptz API (requested: ' + url + ').',
    ];
    if (base === '') {
      parts.push(
        'You are in proxy mode (like the React app): the browser calls ' +
          origin +
          '/api/… and this admin server forwards to SCRIPTZ_API_BASE_URL. Start the API on that upstream, run `npm start` (not npx serve), and restart the admin after .env changes.',
      );
    } else {
      parts.push('Configured API base: ' + base + '.');
    }
    if (pageHttps && apiHttp) {
      parts.push(
        'HTTPS page with HTTP API is blocked (mixed content). Use an https API URL or http://localhost for local dev.',
      );
    } else if (base !== '') {
      parts.push(
        'Direct mode: ensure CORS on Scriptz-Api allows origin ' + (origin || 'unknown') + ' (or use default proxy mode: unset SCRIPTZ_PUBLIC_API_BASE_URL).',
      );
    }
    if (cause && cause.message) parts.push('Browser: ' + cause.message);
    return parts.join(' ');
  }

  function getAuthHeaders(extra) {
    var token = global.ScriptzAuth && global.ScriptzAuth.getAccessToken && global.ScriptzAuth.getAccessToken();
    var h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }

  function parseJson(res) {
    var ct = res.headers.get('Content-Type') || '';
    if (ct.indexOf('application/json') === -1) return res.text().then(function (t) { return t ? JSON.parse(t) : {}; });
    return res.json();
  }

  function checkStatus(res) {
    if (res.ok) return res;
    return parseJson(res).then(function (body) {
      var msg =
        (body && body.error && body.error.message) ||
        (body && body.detail) ||
        (body && body.message) ||
        res.statusText;
      if (typeof msg === 'object' && msg.msg) msg = msg.msg;
      var err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      err.status = res.status;
      err.body = body;
      throw err;
    }).catch(function (e) {
      if (e.status !== undefined) throw e;
      var err = new Error(res.statusText || 'Request failed');
      err.status = res.status;
      throw err;
    });
  }

  function doRequest(method, path, body, useAuth, extraHeaders) {
    var base = apiBaseUrl();
    var url = base === '' ? path : base + path;
    var headers = useAuth ? getAuthHeaders(extraHeaders) : { 'Content-Type': 'application/json' };
    if (extraHeaders) for (var k in extraHeaders) headers[k] = extraHeaders[k];
    var opts = { method: method, headers: headers };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(url, opts)
      .catch(function (err) {
        var name = err && err.name;
        var msg = err && err.message ? String(err.message) : '';
        if (name === 'TypeError' || msg.indexOf('Failed to fetch') !== -1 || msg.indexOf('NetworkError') !== -1) {
          var wrapped = new Error(networkErrorMessage(url, err));
          wrapped.status = 0;
          wrapped.cause = err;
          throw wrapped;
        }
        throw err;
      })
      .then(checkStatus)
      .then(parseJson);
  }

  var adminAuthApi = {
    login: function (email, password) {
      return doRequest('POST', '/api/admin/auth/login', { email: email, password: password }, false);
    },
    logout: function (refreshToken) {
      return doRequest('POST', '/api/admin/auth/logout', { refresh_token: refreshToken }, false);
    },
    refresh: function (refreshToken) {
      return doRequest('POST', '/api/admin/auth/refresh', { refresh_token: refreshToken }, false);
    },
    me: function () {
      var fn = function () { return doRequest('GET', '/api/admin/auth/me', undefined, true); };
      var ensure = global.ScriptzAuth && global.ScriptzAuth.ensureToken;
      return ensure ? ensure(fn) : fn();
    },
  };

  function adminRequest(method, path, body, extraHeaders) {
    var fn = function () { return doRequest(method, path, body, true, extraHeaders); };
    var ensure = global.ScriptzAuth && global.ScriptzAuth.ensureToken;
    return ensure ? ensure(fn) : fn();
  }

  var adminApi = {
    me: function () { return adminAuthApi.me(); },
    stats: function () { return adminRequest('GET', '/api/admin/stats'); },
    users: {
      list: function (params) {
        var q = new URLSearchParams();
        if (params) {
          if (params.limit != null) q.set('limit', params.limit);
          if (params.offset != null) q.set('offset', params.offset);
          if (params.search) q.set('search', params.search);
          if (params.is_active !== undefined) q.set('is_active', params.is_active);
          if (params.role) q.set('role', params.role);
        }
        var query = q.toString();
        return adminRequest('GET', '/api/admin/users' + (query ? '?' + query : ''));
      },
      get: function (userId) { return adminRequest('GET', '/api/admin/users/' + userId); },
      overview: function (userId) { return adminRequest('GET', '/api/admin/users/' + userId + '/overview'); },
      update: function (userId, body) { return adminRequest('PATCH', '/api/admin/users/' + userId, body); },
      delete: function (userId) { return adminRequest('DELETE', '/api/admin/users/' + userId); },
    },
    admins: {
      list: function (params) {
        var q = new URLSearchParams();
        if (params) {
          if (params.limit != null) q.set('limit', params.limit);
          if (params.offset != null) q.set('offset', params.offset);
          if (params.search) q.set('search', params.search);
          if (params.is_active !== undefined) q.set('is_active', params.is_active);
        }
        var query = q.toString();
        return adminRequest('GET', '/api/admin/admins' + (query ? '?' + query : ''));
      },
      get: function (adminId) { return adminRequest('GET', '/api/admin/admins/' + adminId); },
      create: function (body) { return adminRequest('POST', '/api/admin/admins', body); },
      update: function (adminId, body) { return adminRequest('PATCH', '/api/admin/admins/' + adminId, body); },
      delete: function (adminId) { return adminRequest('DELETE', '/api/admin/admins/' + adminId); },
    },
    roles: {
      list: function () { return adminRequest('GET', '/api/admin/roles'); },
      create: function (body) { return adminRequest('POST', '/api/admin/roles', body); },
      update: function (roleId, body) { return adminRequest('PATCH', '/api/admin/roles/' + roleId, body); },
    },
    auditLogs: {
      list: function (params) {
        var q = new URLSearchParams();
        if (params) {
          if (params.limit != null) q.set('limit', params.limit);
          if (params.offset != null) q.set('offset', params.offset);
          if (params.user_id != null) q.set('user_id', params.user_id);
          if (params.action) q.set('action', params.action);
          if (params.resource_type) q.set('resource_type', params.resource_type);
          if (params.resource_id) q.set('resource_id', params.resource_id);
        }
        var query = q.toString();
        return adminRequest('GET', '/api/admin/audit-logs' + (query ? '?' + query : ''));
      },
    },
    ideaFeedback: {
      list: function (params) {
        var q = new URLSearchParams();
        if (params) {
          if (params.limit != null) q.set('limit', params.limit);
          if (params.offset != null) q.set('offset', params.offset);
          if (params.interested !== undefined) q.set('interested', params.interested);
          if (params.reason) q.set('reason', params.reason);
          if (params.admin_status) q.set('admin_status', params.admin_status);
        }
        var query = q.toString();
        return adminRequest('GET', '/api/admin/idea-feedback' + (query ? '?' + query : ''));
      },
      update: function (feedbackId, body) {
        return adminRequest('PATCH', '/api/admin/idea-feedback/' + feedbackId, body);
      },
    },
    thumbnailTemplates: {
      list: function (params) {
        var q = new URLSearchParams();
        if (params) {
          if (params.limit != null) q.set('limit', params.limit);
          if (params.offset != null) q.set('offset', params.offset);
          if (params.category) q.set('category', params.category);
          if (params.q) q.set('q', params.q);
          if (params.is_active === true || params.is_active === false) q.set('is_active', params.is_active);
        }
        var query = q.toString();
        return adminRequest('GET', '/api/admin/thumbnail-templates' + (query ? '?' + query : ''));
      },
      create: function (body) {
        return adminRequest('POST', '/api/admin/thumbnail-templates', body);
      },
      update: function (id, body) {
        return adminRequest('PATCH', '/api/admin/thumbnail-templates/' + id, body);
      },
      delete: function (id) {
        return adminRequest('DELETE', '/api/admin/thumbnail-templates/' + id);
      },
      categories: function () {
        return adminRequest('GET', '/api/thumbnail-templates/categories');
      },
      toggleActive: function (id, isActive) {
        return adminRequest('PATCH', '/api/admin/thumbnail-templates/' + id, { is_active: isActive });
      },
    },
    generations: {
      list: function (params) {
        var q = new URLSearchParams();
        if (params) {
          if (params.limit != null) q.set('limit', params.limit);
          if (params.offset != null) q.set('offset', params.offset);
          if (params.user_id) q.set('user_id', params.user_id);
          if (params.feature_type) q.set('feature_type', params.feature_type);
          if (params.from_date) q.set('from_date', params.from_date);
          if (params.to_date) q.set('to_date', params.to_date);
          if (params.model) q.set('model', params.model);
        }
        var query = q.toString();
        return adminRequest('GET', '/api/admin/generations' + (query ? '?' + query : ''));
      },
      get: function (id) {
        return adminRequest('GET', '/api/admin/generations/' + id);
      },
      getStats: function () {
        return adminRequest('GET', '/api/admin/generations/stats');
      },
    },
    settings: {
      get: function () {
        return adminRequest('GET', '/api/admin/settings');
      },
      update: function (body) {
        return adminRequest('PATCH', '/api/admin/settings', body);
      },
      getFeatureFlags: function () {
        return adminRequest('GET', '/api/admin/settings/feature-flags');
      },
      updateFeatureFlag: function (key, value) {
        return adminRequest('PATCH', '/api/admin/settings/feature-flags/' + key, { enabled: value });
      },
      getModels: function () {
        return adminRequest('GET', '/api/admin/settings/models');
      },
      updateModel: function (model, enabled) {
        return adminRequest('PATCH', '/api/admin/settings/models/' + model, { enabled: enabled });
      },
    },
  };

  global.ScriptzAPI = {
    adminAuth: adminAuthApi,
    admin: adminApi,
    getBaseUrl: apiBaseUrl,
    getBaseUrlDisplay: apiBaseUrlDisplay,
  };
})(typeof window !== 'undefined' ? window : this);

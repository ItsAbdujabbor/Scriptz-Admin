/**
 * Scriptz Admin API client — admin auth + admin panel endpoints.
 * Requires: config.js, auth.js (getAccessToken, ensureToken with admin refresh)
 */
(function (global) {
  'use strict';

  var BASE = (global.SCRIPTZ_CONFIG && global.SCRIPTZ_CONFIG.API_BASE_URL) || 'http://localhost:8000';

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
      var msg = (body && (body.detail || body.message)) || res.statusText;
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
    var url = BASE + path;
    var headers = useAuth ? getAuthHeaders(extraHeaders) : { 'Content-Type': 'application/json' };
    if (extraHeaders) for (var k in extraHeaders) headers[k] = extraHeaders[k];
    var opts = { method: method, headers: headers };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(checkStatus).then(parseJson);
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
    },
  };

  global.ScriptzAPI = {
    adminAuth: adminAuthApi,
    admin: adminApi,
    getBaseUrl: function () { return BASE; },
  };
})(typeof window !== 'undefined' ? window : this);

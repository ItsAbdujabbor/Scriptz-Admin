/**
 * Scriptz Admin — panel: all pages and navigation. Rebuilt from scratch.
 */
(function (global) {
  'use strict';
  var API = global.ScriptzAPI || {};
  var AdminAuth = global.ScriptzAdminAuth || {};
  var Confirm = global.ScriptzConfirm;
  var Toast = global.ScriptzToast;
  var Dialog = global.ScriptzDialog;
  var PAGE = 20;
  var TEMPLATE_PAGE = 30;

  function byId(id) { return document.getElementById(id); }
  function esc(s) { if (s == null) return ''; var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function dateFmt(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleString(); } catch (e) { return iso; } }

  function getPageFromHash() {
    var h = (global.location.hash || '#admin-dashboard').replace(/^#/, '');
    if (h === 'admin') return 'dashboard';
    if (h.indexOf('admin-') === 0) return h.slice(6);
    return 'dashboard';
  }

  function navigate(pageOrHash) {
    var page = (pageOrHash || '').indexOf('admin-') === 0 ? pageOrHash.slice(6) : (pageOrHash || 'dashboard');
    var pages = ['dashboard', 'users', 'admins', 'audit', 'ideas', 'templates', 'billing', 'generations', 'settings'];
    if (pages.indexOf(page) === -1) page = 'dashboard';

    document.querySelectorAll('.admin-sidebar-link').forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-page') === page);
    });
    var container = byId('admin-page');
    if (!container) return;

    if (page === 'dashboard') renderDashboard(container);
    else if (page === 'users') renderUsers(container);
    else if (page === 'admins') renderAdmins(container);
    else if (page === 'audit') renderAudit(container);
    else if (page === 'ideas') renderIdeas(container);
    else if (page === 'templates') renderThumbnailTemplates(container);
    else if (page === 'billing') renderBilling(container);
    else if (page === 'generations') renderGenerations(container);
    else if (page === 'settings') renderSettings(container);
  }

  function openModal(title, bodyHtml, onSubmit) {
    var modal = byId('admin-modal');
    var titleEl = byId('admin-modal-title');
    var bodyEl = byId('admin-modal-body');
    var closeBtn = byId('admin-modal-close');
    var backdrop = byId('admin-modal-backdrop');
    if (!modal || !bodyEl) return;
    if (titleEl) titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    if (Dialog && Dialog.openModal) Dialog.openModal(modal);
    function close() { if (Dialog && Dialog.closeModal) Dialog.closeModal(modal); }
    if (closeBtn) closeBtn.onclick = close;
    if (backdrop) backdrop.onclick = close;
    modal.addEventListener('keydown', function key(e) {
      if (e.key === 'Escape') { close(); modal.removeEventListener('keydown', key); }
    });
    var submitBtn = bodyEl.querySelector('[data-submit]');
    if (submitBtn && typeof onSubmit === 'function') {
      submitBtn.onclick = function () {
        var form = bodyEl.querySelector('form');
        if (form && !form.checkValidity()) { form.reportValidity(); return; }
        onSubmit(bodyEl);
        close();
      };
    }
    var form = bodyEl.querySelector('form');
    if (form && typeof onSubmit === 'function') {
      form.onsubmit = function (e) { e.preventDefault(); if (!form.checkValidity()) return; onSubmit(bodyEl); close(); };
    }
  }

  function renderDashboard(container) {
    container.innerHTML = '<div class="admin-page-head"><h1 class="admin-page-title">Dashboard</h1><p class="admin-page-desc">Operational overview: growth, feature usage, AI consumption, and system health (no payment or revenue metrics).</p></div><div id="admin-dashboard-loading" class="admin-loading admin-loading--dashboard">Loading stats…</div><div id="admin-dashboard-content" class="admin-dashboard-content" style="display:none"></div>';
    var loading = byId('admin-dashboard-loading');
    var content = byId('admin-dashboard-content');
    var a = API.admin;
    if (!a || !a.stats) {
      if (loading) loading.textContent = 'API not available.';
      return;
    }
    a.stats().then(function (res) {
      if (loading) loading.style.display = 'none';
      if (!content) return;
      var kpis = (res && res.kpis) ? res.kpis : {};
      var trends = (res && res.trends) ? res.trends : { daily: [], weekly: [], monthly: [] };
      var recent = (res && res.recent_activity) ? res.recent_activity : [];
      var knownGrowth = ['total_users', 'active_users', 'active_users_24h', 'active_users_7d', 'active_users_30d', 'new_users_24h', 'new_users_7d', 'new_users_30d', 'dau', 'wau', 'mau', 'activation_rate_pct'];
      var knownFeature = ['total_projects', 'total_generations', 'scripts_generated', 'thumbnails_generated', 'thumbnail_jobs_done', 'thumbnail_improve_done', 'thumbnail_rate_done', 'audit_log_count', 'idea_feedback_count', 'edits_performed'];
      var knownUsage = ['tokens_used', 'prompt_tokens_total', 'completion_tokens_total', 'tokens_script_generations', 'tokens_thumbnail_rating', 'tokens_thumbnail_generations', 'avg_tokens_per_generation', 'generations_cost_estimate_usd', 'thumbnails_cost_estimate_usd', 'thumbnail_rating_cost_usd', 'total_cost_estimate_usd', 'cost_per_generation', 'cost_per_active_user'];
      var knownHealth = ['generation_success_rate_pct', 'error_rate_pct', 'failed_generations', 'avg_generation_time_ms'];
      var knownSystem = ['total_admins', 'total_roles', 'storage_usage_bytes', 'rate_limit_triggers', 'suspicious_activity_indicators'];
      var knownKeys = knownGrowth.concat(knownFeature).concat(knownUsage).concat(knownHealth).concat(knownSystem);
      var labelMap = {
        total_users: 'Total users', active_users: 'Active (not banned)', active_users_24h: 'Active (24h)', active_users_7d: 'Active (7d)', active_users_30d: 'Active (30d)',
        new_users_24h: 'New (24h)', new_users_7d: 'New (7d)', new_users_30d: 'New (30d)', dau: 'DAU', wau: 'WAU', mau: 'MAU', activation_rate_pct: 'Activation rate %',
        total_projects: 'Projects', total_generations: 'Generations', scripts_generated: 'Scripts', thumbnails_generated: 'Thumbnails', thumbnail_jobs_done: 'Thumb jobs', thumbnail_improve_done: 'Thumb improve', thumbnail_rate_done: 'Thumb rate',
        audit_log_count: 'Audit logs', idea_feedback_count: 'Ideas', edits_performed: 'Edits performed',
        tokens_used: 'Total tokens', prompt_tokens_total: 'Prompt tokens', completion_tokens_total: 'Completion tokens', tokens_script_generations: 'Tokens (scripts)', tokens_thumbnail_rating: 'Tokens (rating)', tokens_thumbnail_generations: 'Tokens (thumb gen)', avg_tokens_per_generation: 'Avg tokens/gen',
        generations_cost_estimate_usd: 'Cost (scripts)', thumbnails_cost_estimate_usd: 'Cost (thumbnails)', thumbnail_rating_cost_usd: 'Cost (rating)', total_cost_estimate_usd: 'Total cost (est.)', cost_per_generation: 'Cost per gen', cost_per_active_user: 'Cost per active user',
        generation_success_rate_pct: 'Success rate %', error_rate_pct: 'Error rate %', failed_generations: 'Failed gens', avg_generation_time_ms: 'Avg latency (ms)',
        total_admins: 'Admins', total_roles: 'Roles', storage_usage_bytes: 'Storage', rate_limit_triggers: 'Rate limit triggers', suspicious_activity_indicators: 'Suspicious indicators'
      };
      var iconMap = {
        total_users: 'users', active_users: 'users', active_users_24h: 'trend', active_users_7d: 'trend', active_users_30d: 'trend', new_users_24h: 'trend', new_users_7d: 'trend', new_users_30d: 'trend', dau: 'trend', wau: 'trend', mau: 'trend', activation_rate_pct: 'chart',
        total_projects: 'folder', total_generations: 'sparkles', scripts_generated: 'file', thumbnails_generated: 'image', thumbnail_jobs_done: 'image', thumbnail_improve_done: 'image', thumbnail_rate_done: 'image', audit_log_count: 'clipboard', idea_feedback_count: 'lightbulb', edits_performed: 'clipboard',
        tokens_used: 'zap', prompt_tokens_total: 'zap', completion_tokens_total: 'zap', tokens_script_generations: 'zap', tokens_thumbnail_rating: 'zap', tokens_thumbnail_generations: 'zap', avg_tokens_per_generation: 'zap',
        generations_cost_estimate_usd: 'dollar', thumbnails_cost_estimate_usd: 'dollar', thumbnail_rating_cost_usd: 'dollar', total_cost_estimate_usd: 'dollar', cost_per_generation: 'dollar', cost_per_active_user: 'dollar',
        generation_success_rate_pct: 'chart', error_rate_pct: 'chart', failed_generations: 'chart', avg_generation_time_ms: 'chart',
        total_admins: 'shield', total_roles: 'shield', storage_usage_bytes: 'storage', rate_limit_triggers: 'shield', suspicious_activity_indicators: 'shield'
      };
      function getMetricIcon(key) {
        var name = iconMap[key] || 'chart';
        var svgs = {
          users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
          trend: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
          folder: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
          sparkles: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>',
          file: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>',
          image: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
          clipboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
          lightbulb: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
          zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
          dollar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
          shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
          storage: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
          chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
        };
        return '<span class="admin-metric-icon admin-metric-icon--' + name + '" aria-hidden="true">' + (svgs[name] || svgs.chart) + '</span>';
      }
      function formatTokenCount(n) { var x = parseInt(n, 10); return isNaN(x) ? '0' : x.toLocaleString(); }
      function formatUsd(n) { var x = parseFloat(n); return isNaN(x) ? '$0.00' : '$' + Number(x).toFixed(2); }
      function kpiCard(key, val) {
        var v = val;
        if (key === 'storage_usage_bytes' && (v === null || v === undefined)) return '';
        if (key === 'avg_generation_time_ms' && (v === null || v === undefined)) return '';
        if (typeof v === 'number' && key === 'storage_usage_bytes' && v >= 0) {
          if (v >= 1e9) v = (v / 1e9).toFixed(2) + ' GB';
          else if (v >= 1e6) v = (v / 1e6).toFixed(2) + ' MB';
          else if (v >= 1e3) v = (v / 1e3).toFixed(2) + ' KB';
          else v = v + ' B';
        } else if (key.indexOf('_pct') !== -1 || key === 'activation_rate_pct' || key === 'generation_success_rate_pct' || key === 'error_rate_pct' || key === 'usage_pct_scripts' || key === 'usage_pct_thumbnails' || key === 'usage_pct_ideas' || key === 'usage_pct_audit') {
          v = (typeof v === 'number' ? v : parseFloat(v) || 0).toFixed(1) + '%';
        } else if (key === 'avg_generation_time_ms' && typeof v === 'number') {
          v = v.toLocaleString() + ' ms';
        } else if (key === 'tokens_used' || key === 'prompt_tokens_total' || key === 'completion_tokens_total' || key === 'tokens_script_generations' || key === 'tokens_thumbnail_rating' || key === 'tokens_thumbnail_generations' || key === 'avg_tokens_per_generation') {
          v = formatTokenCount(v);
        } else if (key.indexOf('cost') !== -1 || key.indexOf('_usd') !== -1) {
          v = formatUsd(v);
        } else if (typeof v !== 'number') v = Number(v) || 0;
        var label = labelMap[key] || key.replace(/_/g, ' ');
        return '<div class="admin-metric-card"><div class="admin-metric-card-inner">' + getMetricIcon(key) + '<div class="admin-metric-card-content"><span class="admin-metric-card-value">' + esc(String(v)) + '</span><span class="admin-metric-card-label">' + esc(label) + '</span></div></div></div>';
      }
      function renderGroup(keys) {
        var h = '';
        for (var i = 0; i < keys.length; i++) { if (kpis[keys[i]] !== undefined && kpis[keys[i]] !== null) h += kpiCard(keys[i], kpis[keys[i]]); }
        return h ? '<div class="admin-metric-grid">' + h + '</div>' : '';
      }
      var topByTokens = (res && res.top_users_by_tokens) ? res.top_users_by_tokens : [];
      var topByGens = (res && res.top_users_by_generations) ? res.top_users_by_generations : [];
      var recentAdmin = (res && res.recent_admin_actions) ? res.recent_admin_actions : [];
      var usagePct = { scripts: kpis.usage_pct_scripts, thumbnails: kpis.usage_pct_thumbnails, ideas: kpis.usage_pct_ideas, audit: kpis.usage_pct_audit };
      var html = '';
      html += '<section class="admin-dashboard-section"><h2 class="admin-dashboard-section-title">User growth</h2>' + (renderGroup(knownGrowth) || '<p class="admin-empty">No growth data.</p>') + '</section>';
      html += '<section class="admin-dashboard-section"><h2 class="admin-dashboard-section-title">Feature usage</h2>' + (renderGroup(knownFeature) || '<p class="admin-empty">No feature data.</p>');
      if (usagePct.scripts != null || usagePct.thumbnails != null || usagePct.ideas != null || usagePct.audit != null) {
        html += '<div class="admin-usage-distribution"><h3 class="admin-usage-distribution-title">Usage distribution</h3><div class="admin-usage-bars">';
        if (usagePct.scripts != null) html += '<div class="admin-usage-bar-row"><span class="admin-usage-bar-label">Scripts</span><div class="admin-usage-bar-track"><div class="admin-usage-bar-fill admin-usage-bar--scripts" style="width:' + (usagePct.scripts || 0) + '%"></div></div><span class="admin-usage-bar-pct">' + (usagePct.scripts || 0) + '%</span></div>';
        if (usagePct.thumbnails != null) html += '<div class="admin-usage-bar-row"><span class="admin-usage-bar-label">Thumbnails</span><div class="admin-usage-bar-track"><div class="admin-usage-bar-fill admin-usage-bar--thumbnails" style="width:' + (usagePct.thumbnails || 0) + '%"></div></div><span class="admin-usage-bar-pct">' + (usagePct.thumbnails || 0) + '%</span></div>';
        if (usagePct.ideas != null) html += '<div class="admin-usage-bar-row"><span class="admin-usage-bar-label">Ideas</span><div class="admin-usage-bar-track"><div class="admin-usage-bar-fill admin-usage-bar--ideas" style="width:' + (usagePct.ideas || 0) + '%"></div></div><span class="admin-usage-bar-pct">' + (usagePct.ideas || 0) + '%</span></div>';
        if (usagePct.audit != null) html += '<div class="admin-usage-bar-row"><span class="admin-usage-bar-label">Audit</span><div class="admin-usage-bar-track"><div class="admin-usage-bar-fill admin-usage-bar--audit" style="width:' + (usagePct.audit || 0) + '%"></div></div><span class="admin-usage-bar-pct">' + (usagePct.audit || 0) + '%</span></div>';
        html += '</div></div>';
      }
      html += '</section>';
      html += '<section class="admin-dashboard-section"><h2 class="admin-dashboard-section-title">AI usage &amp; cost</h2><p class="admin-page-desc admin-dashboard-section-desc">Token usage and estimated cost by feature (no payment/revenue).</p>' + (renderGroup(knownUsage) || '<p class="admin-empty">No usage data.</p>') + '</section>';
      html += '<section class="admin-dashboard-section"><h2 class="admin-dashboard-section-title">System health</h2>' + (renderGroup(knownHealth) || '<p class="admin-empty">No health data.</p>') + '</section>';
      html += '<section class="admin-dashboard-section"><h2 class="admin-dashboard-section-title">Security &amp; abuse monitoring</h2><div class="admin-dashboard-two-col">';
      html += '<div class="admin-mini-card"><h3 class="admin-mini-card-title">Top users by tokens</h3>' + (topByTokens.length ? '<ul class="admin-top-list">' + topByTokens.map(function (u) { return '<li><span class="admin-top-email">' + esc(u.email) + '</span><span class="admin-top-value">' + formatTokenCount(u.tokens) + '</span></li>'; }).join('') + '</ul>' : '<p class="admin-empty">No data.</p>') + '</div>';
      html += '<div class="admin-mini-card"><h3 class="admin-mini-card-title">Top users by generations</h3>' + (topByGens.length ? '<ul class="admin-top-list">' + topByGens.map(function (u) { return '<li><span class="admin-top-email">' + esc(u.email) + '</span><span class="admin-top-value">' + (u.generations || 0) + '</span></li>'; }).join('') + '</ul>' : '<p class="admin-empty">No data.</p>') + '</div>';
      html += '</div><div class="admin-metric-grid">' + kpiCard('rate_limit_triggers', kpis.rate_limit_triggers) + kpiCard('suspicious_activity_indicators', kpis.suspicious_activity_indicators) + '</div></section>';
      html += '<section class="admin-dashboard-section"><h2 class="admin-dashboard-section-title">Admin &amp; system</h2>' + (renderGroup(knownSystem) || '<p class="admin-empty">No system data.</p>');
      if (recentAdmin.length) {
        html += '<div class="admin-recent-admin"><h3 class="admin-mini-card-title">Recent admin actions</h3><ul class="admin-activity-list">';
        for (var r = 0; r < recentAdmin.length; r++) {
          var ra = recentAdmin[r];
          html += '<li class="admin-activity-item"><span class="admin-activity-type admin-activity-type--audit">' + esc(ra.action || '') + '</span><div class="admin-activity-body"><span class="admin-activity-label">' + esc((ra.resource_type || '') + ' ' + (ra.resource_id || '')) + '</span><div class="admin-activity-meta">' + dateFmt(ra.at) + '</div></div></li>';
        }
        html += '</ul></div>';
      }
      html += '</section>';
      var maxDaily = 1, maxDailyTokens = 1, maxDailyCost = 1;
      (trends.daily || []).forEach(function (p) {
        var t = (p.signups || 0) + (p.generations || 0) + (p.thumbnails || 0) + (p.audit_events || 0);
        if (t > maxDaily) maxDaily = t;
        if ((p.tokens || 0) > maxDailyTokens) maxDailyTokens = p.tokens || 0;
        if ((p.cost_estimate_usd || 0) > maxDailyCost) maxDailyCost = p.cost_estimate_usd || 0;
      });
      function renderChartBars(points, maxVal) {
        if (!points || !points.length) return '<div class="admin-chart-bars"><p class="admin-empty">No trend data.</p></div>';
        var m = maxVal || 1;
        var out = points.map(function (p) {
          var s = (p.signups || 0) / m * 100;
          var g = (p.generations || 0) / m * 100;
          var th = (p.thumbnails || 0) / m * 100;
          var a = (p.audit_events || 0) / m * 100;
          var total = s + g + th + a;
          if (total > 100) { s = s / total * 100; g = g / total * 100; th = th / total * 100; a = a / total * 100; }
          var dateLabel = (p.date || '').split(' ')[0] || p.date || '';
          if (dateLabel.length > 10) dateLabel = dateLabel.slice(0, 7) + '…';
          return '<div class="admin-chart-bar-wrap" title="' + esc(p.date || '') + '"><div style="display:flex;flex-direction:column-reverse;height:100%;min-height:80px;gap:1px">' + (s > 0 ? '<div class="admin-chart-bar admin-chart-bar--signups" style="height:' + Math.max(4, s) + '%"></div>' : '') + (g > 0 ? '<div class="admin-chart-bar admin-chart-bar--generations" style="height:' + Math.max(4, g) + '%"></div>' : '') + (th > 0 ? '<div class="admin-chart-bar admin-chart-bar--thumbnails" style="height:' + Math.max(4, th) + '%"></div>' : '') + (a > 0 ? '<div class="admin-chart-bar admin-chart-bar--audit" style="height:' + Math.max(4, a) + '%"></div>' : '') + '</div><span class="admin-chart-bar-label">' + esc(dateLabel) + '</span></div>';
        });
        return '<div class="admin-chart-bars">' + out.join('') + '</div>';
      }
      function renderChartLine(points, key, maxVal, format) {
        if (!points || !points.length) return '<div class="admin-chart-bars"><p class="admin-empty">No data.</p></div>';
        var m = maxVal || 1;
        var fmt = format || function (x) { return x; };
        var out = points.map(function (p) {
          var v = p[key] != null ? p[key] : 0;
          var pct = m ? (v / m * 100) : 0;
          var dateLabel = (p.date || '').split(' ')[0] || p.date || '';
          if (dateLabel.length > 10) dateLabel = dateLabel.slice(0, 7) + '…';
          return '<div class="admin-chart-bar-wrap" title="' + esc(p.date || '') + ': ' + fmt(v) + '"><div class="admin-chart-bar admin-chart-bar--single" style="height:' + Math.max(2, Math.min(100, pct)) + '%"></div><span class="admin-chart-bar-label">' + esc(dateLabel) + '</span></div>';
        });
        return '<div class="admin-chart-bars">' + out.join('') + '</div>';
      }
      var maxW = 1, maxWT = 1, maxWC = 1, maxM = 1, maxMT = 1, maxMC = 1;
      (trends.weekly || []).forEach(function (p) { var t = (p.signups || 0) + (p.generations || 0) + (p.thumbnails || 0) + (p.audit_events || 0); if (t > maxW) maxW = t; if ((p.tokens || 0) > maxWT) maxWT = p.tokens; if ((p.cost_estimate_usd || 0) > maxWC) maxWC = p.cost_estimate_usd; });
      (trends.monthly || []).forEach(function (p) { var t = (p.signups || 0) + (p.generations || 0) + (p.thumbnails || 0) + (p.audit_events || 0); if (t > maxM) maxM = t; if ((p.tokens || 0) > maxMT) maxMT = p.tokens; if ((p.cost_estimate_usd || 0) > maxMC) maxMC = p.cost_estimate_usd; });
      html += '<section class="admin-dashboard-section"><div class="admin-chart-card"><h2 class="admin-dashboard-section-title">Trend charts</h2><div class="admin-chart-wrap"><div class="admin-chart-metric-tabs"><button type="button" class="admin-chart-tab is-active" data-metric="activity">Activity</button><button type="button" class="admin-chart-tab" data-metric="tokens">Tokens</button><button type="button" class="admin-chart-tab" data-metric="cost">Cost</button></div><div class="admin-chart-tabs"><button type="button" class="admin-chart-tab is-active" data-trend="daily">Daily (30d)</button><button type="button" class="admin-chart-tab" data-trend="weekly">Weekly (12w)</button><button type="button" class="admin-chart-tab" data-trend="monthly">Monthly (12m)</button></div>';
      html += '<div id="admin-chart-activity-daily" class="admin-chart-pane">' + renderChartBars(trends.daily, maxDaily) + '</div><div id="admin-chart-activity-weekly" class="admin-chart-pane" style="display:none">' + renderChartBars(trends.weekly, maxW) + '</div><div id="admin-chart-activity-monthly" class="admin-chart-pane" style="display:none">' + renderChartBars(trends.monthly, maxM) + '</div>';
      html += '<div id="admin-chart-tokens-daily" class="admin-chart-pane" style="display:none">' + renderChartLine(trends.daily, 'tokens', maxDailyTokens, formatTokenCount) + '</div><div id="admin-chart-tokens-weekly" class="admin-chart-pane" style="display:none">' + renderChartLine(trends.weekly, 'tokens', maxWT, formatTokenCount) + '</div><div id="admin-chart-tokens-monthly" class="admin-chart-pane" style="display:none">' + renderChartLine(trends.monthly, 'tokens', maxMT, formatTokenCount) + '</div>';
      html += '<div id="admin-chart-cost-daily" class="admin-chart-pane" style="display:none">' + renderChartLine(trends.daily, 'cost_estimate_usd', maxDailyCost, formatUsd) + '</div><div id="admin-chart-cost-weekly" class="admin-chart-pane" style="display:none">' + renderChartLine(trends.weekly, 'cost_estimate_usd', maxWC, formatUsd) + '</div><div id="admin-chart-cost-monthly" class="admin-chart-pane" style="display:none">' + renderChartLine(trends.monthly, 'cost_estimate_usd', maxMC, formatUsd) + '</div>';
      html += '<p class="admin-chart-legend">Signups · Generations · Thumbnails · Audit | Tokens | Cost (est. USD)</p></div></div></section>';
      html += '<section class="admin-dashboard-section"><div class="admin-activity-card"><h2 class="admin-dashboard-section-title">Recent admin activity</h2><p class="admin-page-desc admin-dashboard-section-desc">Actions performed by admins (audit trail).</p><input type="text" id="admin-activity-search" class="admin-input admin-activity-search" placeholder="Search admin activity…"><ul class="admin-activity-list" id="admin-activity-list">';
      if (!recentAdmin.length) html += '<li class="admin-empty">No recent admin activity.</li>';
      else { for (var j = 0; j < recentAdmin.length; j++) { var it = recentAdmin[j]; var rowLabel = (it.action || '') + ' ' + (it.resource_type || '') + ' ' + (it.resource_id || ''); html += '<li class="admin-activity-item" data-search="' + esc(rowLabel.toLowerCase()) + '"><span class="admin-activity-type admin-activity-type--audit">' + esc(it.action || '') + '</span><div class="admin-activity-body"><span class="admin-activity-label">' + esc((it.resource_type || '') + (it.resource_id ? ' #' + it.resource_id : '')) + '</span><div class="admin-activity-meta">' + dateFmt(it.at) + '</div></div></li>'; } }
      html += '</ul></div></section>';
      content.innerHTML = html;
      content.style.display = 'block';
      var searchInput = byId('admin-activity-search');
      var activityList = byId('admin-activity-list');
      if (searchInput && activityList) {
        searchInput.addEventListener('input', function () {
          var q = (searchInput.value || '').toLowerCase().trim();
          activityList.querySelectorAll('.admin-activity-item').forEach(function (li) {
            var show = !q || (li.getAttribute('data-search') || '').indexOf(q) !== -1;
            li.style.display = show ? '' : 'none';
          });
        });
      }
      var metricTabs = content.querySelectorAll('.admin-chart-metric-tabs .admin-chart-tab');
      var trendTabs = content.querySelectorAll('.admin-chart-wrap .admin-chart-tabs .admin-chart-tab');
      var currentMetric = 'activity';
      var currentTrend = 'daily';
      function showChartPanes() {
        var metrics = ['activity', 'tokens', 'cost'];
        var trends = ['daily', 'weekly', 'monthly'];
        metrics.forEach(function (m) {
          trends.forEach(function (t) {
            var el = byId('admin-chart-' + m + '-' + t);
            if (el) el.style.display = (m === currentMetric && t === currentTrend) ? 'block' : 'none';
          });
        });
      }
      if (metricTabs.length) {
        metricTabs.forEach(function (btn) {
          btn.addEventListener('click', function () {
            currentMetric = btn.getAttribute('data-metric') || 'activity';
            metricTabs.forEach(function (b) { b.classList.remove('is-active'); });
            btn.classList.add('is-active');
            showChartPanes();
          });
        });
      }
      if (trendTabs.length) {
        trendTabs.forEach(function (btn) {
          btn.addEventListener('click', function () {
            currentTrend = btn.getAttribute('data-trend') || 'daily';
            trendTabs.forEach(function (b) { b.classList.remove('is-active'); });
            btn.classList.add('is-active');
            showChartPanes();
          });
        });
      }
      showChartPanes();
    }).catch(function (err) {
      if (loading) { loading.style.display = 'none'; loading.textContent = ''; }
      if (content) { content.style.display = 'block'; content.innerHTML = '<p class="admin-err">' + esc(err && err.message ? err.message : 'Failed to load stats.') + '</p>'; }
    });
  }

  var usersOff = 0;
  function renderUsers(container) {
    container.innerHTML = '<div class="admin-page-head"><h1 class="admin-page-title">Users</h1><p class="admin-page-desc">Click a user to view full profile, activity, and counts. Edit, ban, or delete from the detail panel.</p></div><div class="admin-toolbar admin-toolbar--glassy"><input type="text" id="users-search" class="admin-input" placeholder="Search by email or username…"><select id="users-role" class="admin-input"><option value="">All roles</option><option value="user">User</option><option value="admin">Admin</option></select><select id="users-active" class="admin-input"><option value="">All</option><option value="true">Active</option><option value="false">Banned</option></select><button type="button" class="admin-btn admin-btn--primary admin-btn--sm" id="users-refresh">Refresh</button></div><div id="users-list" class="admin-users-list"></div><div id="users-pag" class="admin-pagination"></div><div id="admin-user-detail-panel" class="admin-user-detail-panel" aria-hidden="true"><div class="admin-user-detail-panel-inner"><div class="admin-user-detail-head"><h2 id="admin-user-detail-title" class="admin-user-detail-title">User</h2><button type="button" class="admin-btn admin-btn--outline admin-btn--sm" id="admin-user-detail-close" aria-label="Close">&times; Close</button></div><div id="admin-user-detail-body" class="admin-user-detail-body"></div></div></div>';
    function load() {
      var list = byId('users-list');
      if (!list) return;
      list.innerHTML = '<p class="admin-loading">Loading users…</p>';
      var search = (byId('users-search') || {}).value || '';
      var role = (byId('users-role') || {}).value || '';
      var activeVal = (byId('users-active') || {}).value;
      var isActive = activeVal === '' ? undefined : activeVal === 'true';
      var api = API.admin && API.admin.users;
      if (!api) { list.innerHTML = '<p class="admin-err">API not available.</p>'; return; }
      api.list({ limit: PAGE, offset: usersOff, search: search || undefined, role: role || undefined, is_active: isActive }).then(function (r) {
        var items = r.items || [];
        if (!items.length) { list.innerHTML = '<div class="admin-empty admin-users-empty">No users match your filters.</div>'; byId('users-pag').innerHTML = ''; return; }
        var cards = items.map(function (u) {
          var roleB = u.role === 'admin' ? '<span class="admin-badge admin-badge--admin">Admin</span>' : '<span class="admin-badge admin-badge--muted">User</span>';
          var act = u.is_active ? '<span class="admin-badge admin-badge--success">Active</span>' : '<span class="admin-badge admin-badge--danger">Banned</span>';
          return '<div class="admin-user-card" role="button" tabindex="0" data-id="' + u.id + '" data-email="' + esc(u.email) + '"><div class="admin-user-card-main"><span class="admin-user-card-email">' + esc(u.email) + '</span><span class="admin-user-card-meta">' + esc(u.username || '—') + ' · ID ' + u.id + '</span><div class="admin-user-card-badges">' + roleB + act + '</div></div><div class="admin-user-card-actions" onclick="event.stopPropagation()"><button type="button" class="admin-btn admin-btn--outline admin-btn--sm u-view" data-id="' + u.id + '" title="View full profile">View</button><button type="button" class="admin-btn admin-btn--outline admin-btn--sm u-edit" data-id="' + u.id + '">Edit</button>' + (u.is_active ? '<button type="button" class="admin-btn admin-btn--outline admin-btn--sm u-ban" data-id="' + u.id + '" data-email="' + esc(u.email) + '">Ban</button>' : '<button type="button" class="admin-btn admin-btn--outline admin-btn--sm u-unban" data-id="' + u.id + '">Unban</button>') + '<button type="button" class="admin-btn admin-btn--sm admin-btn--danger u-del" data-id="' + u.id + '" data-email="' + esc(u.email) + '">Delete</button></div></div>';
        }).join('');
        list.innerHTML = cards;
        bindUserActions(list);
        list.querySelectorAll('.u-view').forEach(function (btn) {
          btn.onclick = function (e) { e.stopPropagation(); openUserDetail(parseInt(btn.getAttribute('data-id'), 10)); };
        });
        list.querySelectorAll('.admin-user-card').forEach(function (card) {
          card.addEventListener('click', function (e) { if (!e.target.closest('.admin-user-card-actions')) openUserDetail(parseInt(card.getAttribute('data-id'), 10)); });
          card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openUserDetail(parseInt(card.getAttribute('data-id'), 10)); } });
        });
        var total = r.total || 0;
        var pag = byId('users-pag');
        if (pag) {
          var prev = usersOff === 0;
          var next = usersOff + PAGE >= total;
          pag.innerHTML = '<span class="admin-pagination-total">' + total + ' user' + (total !== 1 ? 's' : '') + '</span><button type="button" class="admin-btn admin-btn--outline admin-btn--sm" id="users-prev" ' + (prev ? 'disabled' : '') + '>Previous</button><button type="button" class="admin-btn admin-btn--outline admin-btn--sm" id="users-next" ' + (next ? 'disabled' : '') + '>Next</button>';
          if (byId('users-prev')) byId('users-prev').onclick = function () { usersOff = Math.max(0, usersOff - PAGE); load(); };
          if (byId('users-next')) byId('users-next').onclick = function () { usersOff += PAGE; load(); };
        }
      }).catch(function (err) {
        list.innerHTML = '<p class="admin-err">' + esc(err.message) + '</p>';
        if (byId('users-pag')) byId('users-pag').innerHTML = '';
      });
    }
    function openUserDetail(userId) {
      var panel = byId('admin-user-detail-panel');
      var body = byId('admin-user-detail-body');
      var titleEl = byId('admin-user-detail-title');
      if (!panel || !body) return;
      panel.setAttribute('aria-hidden', 'false');
      panel.classList.add('admin-user-detail-panel--open');
      body.innerHTML = '<p class="admin-loading">Loading user data…</p>';
      titleEl.textContent = 'User #' + userId;
      var api = API.admin && API.admin.users;
      if (!api || !api.overview) {
        body.innerHTML = '<p class="admin-err">Overview API not available.</p>';
        return;
      }
      api.overview(userId).then(function (data) {
        var u = data.user || {};
        var counts = data.counts || {};
        var audit = data.audit_logs || [];
        var auditTotal = data.audit_total || 0;
        var statusBadge = u.is_active ? '<span class="admin-badge admin-badge--success">Active</span>' : '<span class="admin-badge admin-badge--danger">Banned</span>';
        var roleBadge = u.role === 'admin' ? '<span class="admin-badge admin-badge--admin">Admin</span>' : '<span class="admin-badge admin-badge--muted">User</span>';
        var profileHtml = '<div class="admin-user-detail-section"><h3 class="admin-user-detail-section-title">Profile</h3><div class="admin-user-detail-profile"><p><strong>ID</strong> ' + u.id + '</p><p><strong>Email</strong> ' + esc(u.email) + '</p><p><strong>Username</strong> ' + esc(u.username || '—') + '</p><p><strong>Role</strong> ' + roleBadge + '</p><p><strong>Status</strong> ' + statusBadge + '</p><p><strong>Created</strong> ' + dateFmt(u.created_at) + '</p><p><strong>Updated</strong> ' + dateFmt(u.updated_at) + '</p></div></div>';
        var countsHtml = '<div class="admin-user-detail-section"><h3 class="admin-user-detail-section-title">Activity counts</h3><div class="admin-user-detail-counts"><div class="admin-user-detail-count"><span class="admin-user-detail-count-num">' + (counts.generations || 0) + '</span><span class="admin-user-detail-count-label">Generations</span></div><div class="admin-user-detail-count"><span class="admin-user-detail-count-num">' + (counts.projects || 0) + '</span><span class="admin-user-detail-count-label">Projects (saved)</span></div><div class="admin-user-detail-count"><span class="admin-user-detail-count-num">' + (counts.thumbnails || 0) + '</span><span class="admin-user-detail-count-label">Thumbnails</span></div></div></div>';
        var auditRows = audit.length ? audit.map(function (e) { return '<tr><td>' + dateFmt(e.created_at) + '</td><td>' + esc(e.action) + '</td><td>' + esc(e.resource_type || '—') + '</td><td>' + esc(e.resource_id || '—') + '</td></tr>'; }).join('') : '<tr><td colspan="4">No audit entries.</td></tr>';
        var auditHtml = '<div class="admin-user-detail-section"><h3 class="admin-user-detail-section-title">Audit log (' + auditTotal + ' total)</h3><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Time</th><th>Action</th><th>Resource</th><th>ID</th></tr></thead><tbody>' + auditRows + '</tbody></table></div></div>';
        var actionsHtml = '<div class="admin-user-detail-section admin-user-detail-actions"><button type="button" class="admin-btn admin-btn--outline u-edit" data-id="' + u.id + '">Edit</button> ' + (u.is_active ? '<button type="button" class="admin-btn admin-btn--outline u-ban" data-id="' + u.id + '" data-email="' + esc(u.email) + '">Ban</button> ' : '<button type="button" class="admin-btn admin-btn--outline u-unban" data-id="' + u.id + '">Unban</button> ') + '<button type="button" class="admin-btn admin-btn--danger u-del" data-id="' + u.id + '" data-email="' + esc(u.email) + '">Delete</button></div>';
        body.innerHTML = profileHtml + countsHtml + auditHtml + actionsHtml;
        titleEl.textContent = u.email || ('User #' + u.id);
        bindUserActions(body);
      }).catch(function (err) {
        body.innerHTML = '<p class="admin-err">' + esc(err && err.message ? err.message : 'Failed to load user.') + '</p>';
      });
    }
    function closeUserDetail() {
      var panel = byId('admin-user-detail-panel');
      if (panel) { panel.setAttribute('aria-hidden', 'true'); panel.classList.remove('admin-user-detail-panel--open'); }
    }
    usersOff = 0;
    load();
    if (byId('users-refresh')) byId('users-refresh').onclick = load;
    if (byId('admin-user-detail-close')) byId('admin-user-detail-close').onclick = closeUserDetail;
    var panel = byId('admin-user-detail-panel');
    if (panel) {
      panel.addEventListener('click', function (e) { if (e.target === panel) closeUserDetail(); });
      panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeUserDetail(); });
    }
    setTimeout(function () {
      if (byId('users-search')) byId('users-search').oninput = function () { usersOff = 0; load(); };
      if (byId('users-role')) byId('users-role').onchange = function () { usersOff = 0; load(); };
      if (byId('users-active')) byId('users-active').onchange = function () { usersOff = 0; load(); };
    }, 0);
  }

  function bindUserActions(container) {
    if (!container) return;
    var api = API.admin && API.admin.users;
    container.querySelectorAll('.u-view').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-id');
        api.get(id).then(function (user) {
          return API.admin.auditLogs.list({ limit: 15, user_id: parseInt(id, 10) }).then(function (ar) {
            var rows = (ar.items || []).map(function (e) { return '<tr><td>' + dateFmt(e.created_at) + '</td><td>' + esc(e.action) + '</td><td>' + esc(e.resource_type) + '</td><td>' + esc(e.resource_id) + '</td></tr>'; }).join('');
            var body = '<div class="admin-user-detail"><p><strong>ID</strong> ' + user.id + '</p><p><strong>Email</strong> ' + esc(user.email) + '</p><p><strong>Username</strong> ' + esc(user.username || '—') + '</p><p><strong>Role</strong> ' + esc(user.role) + '</p><p><strong>Active</strong> ' + (user.is_active ? 'Yes' : 'No') + '</p><p><strong>Created</strong> ' + dateFmt(user.created_at) + '</p></div><h4 class="admin-section-title">Recent activity</h4><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Time</th><th>Action</th><th>Resource</th><th>ID</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">None</td></tr>') + '</tbody></table></div><div class="admin-modal-actions"><button type="button" class="admin-btn admin-btn--primary" id="admin-view-close">Close</button></div>';
            openModal('User: ' + user.email, body, function () {});
            setTimeout(function () {
              var closeBtn = byId('admin-view-close');
              if (closeBtn) closeBtn.onclick = function () { if (Dialog && Dialog.closeModal) Dialog.closeModal(byId('admin-modal')); };
            }, 0);
          });
        }).catch(function (err) { if (Toast) Toast.error(err.message); });
      };
    });
    container.querySelectorAll('.u-edit').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-id');
        Promise.all([api.get(id), API.admin.roles.list()]).then(function (res) {
          var user = res[0];
          var roles = (res[1] && res[1].items) || [];
          var opts = roles.map(function (r) { var sel = (user.role_ids || []).indexOf(r.id) >= 0 ? ' selected' : ''; return '<option value="' + r.id + '"' + sel + '>' + esc(r.name) + '</option>'; }).join('');
          var body = '<form><div class="admin-field"><label class="admin-label">Email</label><input type="email" class="admin-input" name="email" required value="' + esc(user.email) + '"></div><div class="admin-field"><label class="admin-label">Username</label><input type="text" class="admin-input" name="username" value="' + esc(user.username || '') + '"></div><div class="admin-field"><label class="admin-label">Active</label><input type="checkbox" name="is_active" ' + (user.is_active ? 'checked' : '') + '></div><div class="admin-field"><label class="admin-label">Role</label><select class="admin-input" name="role"><option value="user"' + (user.role === 'user' ? ' selected' : '') + '>User</option><option value="admin"' + (user.role === 'admin' ? ' selected' : '') + '>Admin</option></select></div><div class="admin-field"><label class="admin-label">Role IDs</label><select class="admin-input" name="role_ids" multiple style="min-height:70px">' + opts + '</select></div><div class="admin-modal-actions"><button type="button" class="admin-btn admin-btn--outline">Cancel</button><button type="button" class="admin-btn admin-btn--primary" data-submit>Save</button></div></form>';
          openModal('Edit user', body, function (el) {
            var email = (el.querySelector('[name="email"]') || {}).value || '';
            var username = (el.querySelector('[name="username"]') || {}).value || '';
            var isActive = (el.querySelector('[name="is_active"]') || {}).checked;
            var role = (el.querySelector('[name="role"]') || {}).value || 'user';
            var roleIdsEl = el.querySelector('[name="role_ids"]');
            var roleIds = roleIdsEl ? [].map.call(roleIdsEl.selectedOptions || [], function (o) { return parseInt(o.value, 10); }).filter(Boolean) : [];
            api.update(id, { email: email, username: username, is_active: isActive, role: role, role_ids: roleIds }).then(function () { if (Toast) Toast.success('Saved'); navigate('users'); }).catch(function (e) { if (Toast) Toast.error(e.message); });
          });
        }).catch(function (e) { if (Toast) Toast.error(e.message); });
      };
    });
    container.querySelectorAll('.u-ban').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-id');
        var email = btn.getAttribute('data-email') || 'user';
        var doBan = function () { api.update(id, { is_active: false }).then(function () { if (Toast) Toast.success('Banned'); navigate('users'); }).catch(function (e) { if (Toast) Toast.error(e.message); }); };
        if (Confirm && Confirm.show) Confirm.show({ title: 'Ban user', message: 'Ban ' + email + '?', confirmText: 'Ban', cancelText: 'Cancel', danger: true }).then(function (ok) { if (ok) doBan(); });
        else if (global.confirm('Ban ' + email + '?')) doBan();
      };
    });
    container.querySelectorAll('.u-unban').forEach(function (btn) {
      btn.onclick = function () {
        api.update(btn.getAttribute('data-id'), { is_active: true }).then(function () { if (Toast) Toast.success('Unbanned'); navigate('users'); }).catch(function (e) { if (Toast) Toast.error(e.message); });
      };
    });
    container.querySelectorAll('.u-del').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-id');
        var email = btn.getAttribute('data-email') || 'user';
        var doDel = function () { api.delete(id).then(function () { if (Toast) Toast.success('Deleted'); navigate('users'); }).catch(function (e) { if (Toast) Toast.error(e.message); }); };
        if (Confirm && Confirm.show) Confirm.show({ title: 'Delete user', message: 'Permanently delete ' + email + '?', confirmText: 'Delete', cancelText: 'Cancel', danger: true }).then(function (ok) { if (ok) doDel(); });
        else if (global.confirm('Delete ' + email + '?')) doDel();
      };
    });
  }

  function renderAdmins(container) {
    container.innerHTML = '<div class="admin-page-head"><h1 class="admin-page-title">Admins &amp; Roles</h1><p class="admin-page-desc">Manage admins and roles.</p></div><div class="admin-tabs"><a href="#" class="admin-tab is-active" data-tab="admins">Admins</a><a href="#" class="admin-tab" data-tab="roles">Roles</a></div><div id="admins-content"></div>';
    var content = byId('admins-content');
    var tabs = container.querySelectorAll('.admin-tab');
    tabs.forEach(function (t) {
      t.onclick = function (e) { e.preventDefault(); tabs.forEach(function (x) { x.classList.remove('is-active'); }); t.classList.add('is-active'); if (t.getAttribute('data-tab') === 'roles') renderRolesList(content); else renderAdminsList(content); };
    });
    renderAdminsList(content);
  }

  function renderAdminsList(container) {
    if (!container) return;
    container.innerHTML = '<p class="admin-loading">Loading…</p>';
    var api = API.admin && API.admin.admins;
    if (!api) { container.innerHTML = '<p class="admin-err">API not available.</p>'; return; }
    api.list({ limit: PAGE }).then(function (r) {
      var items = r.items || [];
      if (!items.length) {
        container.innerHTML = '<div class="admin-empty">No admins.</div><div class="admin-toolbar"><button type="button" class="admin-btn admin-btn--primary admin-btn--sm" id="add-admin">Add admin</button></div>';
        bindAddAdmin(container);
        return;
      }
      var tr = items.map(function (a) {
        var st = a.is_active ? '<span class="admin-badge admin-badge--success">Active</span>' : '<span class="admin-badge admin-badge--danger">Inactive</span>';
        return '<tr><td>' + esc(a.email) + '</td><td>' + esc(a.username || '—') + '</td><td>' + st + '</td><td>' + dateFmt(a.created_at) + '</td><td class="admin-table-actions"><button type="button" class="admin-btn admin-btn--outline admin-btn--sm a-edit" data-id="' + a.id + '">Edit</button><button type="button" class="admin-btn admin-btn--outline admin-btn--sm a-demote" data-id="' + a.id + '" data-email="' + esc(a.email) + '">Demote</button></td></tr>';
      }).join('');
      container.innerHTML = '<div class="admin-toolbar"><button type="button" class="admin-btn admin-btn--primary admin-btn--sm" id="add-admin">Add admin</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Email</th><th>Username</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>' + tr + '</tbody></table></div>';
      container.querySelectorAll('.a-demote').forEach(function (btn) {
        btn.onclick = function () {
          var id = btn.getAttribute('data-id');
          var email = btn.getAttribute('data-email') || '';
          var doIt = function () { api.delete(id).then(function () { if (Toast) Toast.success('Demoted'); renderAdminsList(container); }).catch(function (e) { if (Toast) Toast.error(e.message); }); };
          if (Confirm && Confirm.show) Confirm.show({ title: 'Demote', message: 'Demote ' + email + ' to user?', confirmText: 'Demote', cancelText: 'Cancel', danger: true }).then(function (ok) { if (ok) doIt(); });
          else if (global.confirm('Demote ' + email + '?')) doIt();
        };
      });
      container.querySelectorAll('.a-edit').forEach(function (btn) {
        btn.onclick = function () {
          api.get(btn.getAttribute('data-id')).then(function (a) {
            var body = '<form><div class="admin-field"><label class="admin-label">Email</label><input type="email" class="admin-input" name="email" required value="' + esc(a.email) + '"></div><div class="admin-field"><label class="admin-label">Username</label><input type="text" class="admin-input" name="username" value="' + esc(a.username || '') + '"></div><div class="admin-field"><label class="admin-label">Active</label><select class="admin-input" name="is_active"><option value="true"' + (a.is_active ? ' selected' : '') + '>Yes</option><option value="false"' + (!a.is_active ? ' selected' : '') + '>No</option></select></div><div class="admin-modal-actions"><button type="button" class="admin-btn admin-btn--outline">Cancel</button><button type="button" class="admin-btn admin-btn--primary" data-submit>Save</button></div></form>';
            openModal('Edit admin', body, function (el) {
              api.update(a.id, { email: el.querySelector('[name="email"]').value, username: el.querySelector('[name="username"]').value, is_active: el.querySelector('[name="is_active"]').value === 'true' }).then(function () { if (Toast) Toast.success('Saved'); renderAdminsList(container); }).catch(function (e) { if (Toast) Toast.error(e.message); });
            });
          }).catch(function (e) { if (Toast) Toast.error(e.message); });
        };
      });
      bindAddAdmin(container);
    }).catch(function (err) { container.innerHTML = '<p class="admin-err">' + esc(err.message) + '</p>'; });
  }

  function bindAddAdmin(container) {
    var btn = byId('add-admin');
    if (!btn) return;
    btn.onclick = function () {
      var body = '<form><div class="admin-field"><label class="admin-label">Email</label><input type="email" class="admin-input" name="email" required placeholder="admin@example.com"></div><div class="admin-field"><label class="admin-label">Password</label><input type="password" class="admin-input" name="password" required minlength="8" placeholder="Min 8 chars"></div><div class="admin-field"><label class="admin-label">Username</label><input type="text" class="admin-input" name="username" placeholder="admin"></div><div class="admin-modal-actions"><button type="button" class="admin-btn admin-btn--outline">Cancel</button><button type="button" class="admin-btn admin-btn--primary" data-submit>Create</button></div></form>';
      openModal('Add admin', body, function (el) {
        var email = el.querySelector('[name="email"]').value;
        var password = el.querySelector('[name="password"]').value;
        var username = el.querySelector('[name="username"]').value;
        API.admin.admins.create({ email: email, password: password, username: username || undefined }).then(function () { if (Toast) Toast.success('Created'); renderAdminsList(container); }).catch(function (e) { if (Toast) Toast.error(e.message); });
      });
    };
  }

  function renderRolesList(container) {
    if (!container) return;
    container.innerHTML = '<p class="admin-loading">Loading…</p>';
    var api = API.admin && API.admin.roles;
    if (!api) { container.innerHTML = '<p class="admin-err">API not available.</p>'; return; }
    api.list().then(function (r) {
      var items = (r && r.items) || [];
      if (!items.length) {
        container.innerHTML = '<div class="admin-empty">No roles.</div><div class="admin-toolbar"><button type="button" class="admin-btn admin-btn--primary admin-btn--sm" id="add-role">Create role</button></div>';
        bindAddRole(container);
        return;
      }
      var tr = items.map(function (r) {
        return '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.slug) + '</td><td>' + (r.permissions || []).length + ' perms</td><td>' + dateFmt(r.created_at) + '</td><td class="admin-table-actions"><button type="button" class="admin-btn admin-btn--outline admin-btn--sm r-edit" data-id="' + r.id + '">Edit</button></td></tr>';
      }).join('');
      container.innerHTML = '<div class="admin-toolbar"><button type="button" class="admin-btn admin-btn--primary admin-btn--sm" id="add-role">Create role</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Name</th><th>Slug</th><th>Permissions</th><th>Created</th><th>Actions</th></tr></thead><tbody>' + tr + '</tbody></table></div>';
      container.querySelectorAll('.r-edit').forEach(function (btn) {
        btn.onclick = function () {
          var id = btn.getAttribute('data-id');
          api.list().then(function (list) {
            var role = (list.items || []).filter(function (x) { return String(x.id) === String(id); })[0];
            if (!role) return;
            var perms = (role.permissions || []).join(', ');
            var body = '<form><div class="admin-field"><label class="admin-label">Name</label><input type="text" class="admin-input" name="name" required value="' + esc(role.name) + '"></div><div class="admin-field"><label class="admin-label">Slug</label><input type="text" class="admin-input" name="slug" required value="' + esc(role.slug) + '"></div><div class="admin-field"><label class="admin-label">Description</label><input type="text" class="admin-input" name="desc" value="' + esc(role.description || '') + '"></div><div class="admin-field"><label class="admin-label">Permissions (comma)</label><input type="text" class="admin-input" name="perms" value="' + esc(perms) + '"></div><div class="admin-modal-actions"><button type="button" class="admin-btn admin-btn--outline">Cancel</button><button type="button" class="admin-btn admin-btn--primary" data-submit>Save</button></div></form>';
            openModal('Edit role', body, function (el) {
              var permsArr = (el.querySelector('[name="perms"]').value || '').split(',').map(function (p) { return p.trim(); }).filter(Boolean);
              api.update(id, { name: el.querySelector('[name="name"]').value, slug: el.querySelector('[name="slug"]').value, description: el.querySelector('[name="desc"]').value || undefined, permissions: permsArr }).then(function () { if (Toast) Toast.success('Saved'); renderRolesList(container); }).catch(function (e) { if (Toast) Toast.error(e.message); });
            });
          });
        };
      });
      bindAddRole(container);
    }).catch(function (err) { container.innerHTML = '<p class="admin-err">' + esc(err.message) + '</p>'; });
  }

  function bindAddRole(container) {
    var btn = byId('add-role');
    if (!btn) return;
    btn.onclick = function () {
      var body = '<form><div class="admin-field"><label class="admin-label">Name</label><input type="text" class="admin-input" name="name" required placeholder="Editor"></div><div class="admin-field"><label class="admin-label">Slug</label><input type="text" class="admin-input" name="slug" required placeholder="editor"></div><div class="admin-field"><label class="admin-label">Description</label><input type="text" class="admin-input" name="desc" placeholder="Optional"></div><div class="admin-field"><label class="admin-label">Permissions (comma)</label><input type="text" class="admin-input" name="perms" placeholder="read, write"></div><div class="admin-modal-actions"><button type="button" class="admin-btn admin-btn--outline">Cancel</button><button type="button" class="admin-btn admin-btn--primary" data-submit>Create</button></div></form>';
      openModal('Create role', body, function (el) {
        var perms = (el.querySelector('[name="perms"]').value || '').split(',').map(function (p) { return p.trim(); }).filter(Boolean);
        API.admin.roles.create({ name: el.querySelector('[name="name"]').value, slug: el.querySelector('[name="slug"]').value, description: el.querySelector('[name="desc"]').value || undefined, permissions: perms }).then(function () { if (Toast) Toast.success('Created'); renderRolesList(container); }).catch(function (e) { if (Toast) Toast.error(e.message); });
      });
    };
  }

  var auditOff = 0;
  function renderAudit(container) {
    container.innerHTML = '<div class="admin-page-head"><h1 class="admin-page-title">Audit Logs</h1><p class="admin-page-desc">System activity.</p></div><div class="admin-toolbar"><input type="text" id="audit-action" class="admin-input" placeholder="Action…"><input type="text" id="audit-resource" class="admin-input" placeholder="Resource…"><button type="button" class="admin-btn admin-btn--outline admin-btn--sm" id="audit-refresh">Refresh</button></div><div id="audit-list"></div><div id="audit-pag" class="admin-pagination"></div>';
    function load() {
      var list = byId('audit-list');
      if (!list) return;
      list.innerHTML = '<p class="admin-loading">Loading…</p>';
      var action = (byId('audit-action') || {}).value || '';
      var resource = (byId('audit-resource') || {}).value || '';
      API.admin.auditLogs.list({ limit: PAGE, offset: auditOff, action: action || undefined, resource_type: resource || undefined }).then(function (r) {
        var items = r.items || [];
        if (!items.length) { list.innerHTML = '<div class="admin-empty">No entries.</div>'; byId('audit-pag').innerHTML = ''; return; }
        var tr = items.map(function (e) { return '<tr><td>' + dateFmt(e.created_at) + '</td><td>' + esc(e.user_id != null ? e.user_id : '—') + '</td><td>' + esc(e.action) + '</td><td>' + esc(e.resource_type || '—') + '</td><td>' + esc(e.resource_id || '—') + '</td><td>' + esc((e.details || '').slice(0, 60)) + '</td></tr>'; }).join('');
        list.innerHTML = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>ID</th><th>Details</th></tr></thead><tbody>' + tr + '</tbody></table></div>';
        var total = r.total || 0;
        var pag = byId('audit-pag');
        if (pag) {
          pag.innerHTML = '<span>Total ' + total + '</span><button type="button" class="admin-btn admin-btn--outline admin-btn--sm" id="audit-prev" ' + (auditOff === 0 ? 'disabled' : '') + '>Prev</button><button type="button" class="admin-btn admin-btn--outline admin-btn--sm" id="audit-next" ' + (auditOff + PAGE >= total ? 'disabled' : '') + '>Next</button>';
          if (byId('audit-prev')) byId('audit-prev').onclick = function () { auditOff = Math.max(0, auditOff - PAGE); load(); };
          if (byId('audit-next')) byId('audit-next').onclick = function () { auditOff += PAGE; load(); };
        }
      }).catch(function (err) { list.innerHTML = '<p class="admin-err">' + esc(err.message) + '</p>'; byId('audit-pag').innerHTML = ''; });
    }
    auditOff = 0;
    load();
    if (byId('audit-refresh')) byId('audit-refresh').onclick = function () { auditOff = 0; load(); };
  }

  function renderIdeas(container) {
    container.innerHTML = '<div class="admin-page-head"><h1 class="admin-page-title">Idea Feedback</h1><p class="admin-page-desc">Script idea feedback.</p></div><div class="admin-toolbar"><select id="ideas-status"><option value="">All</option><option value="pending">Pending</option><option value="reviewed">Reviewed</option><option value="hidden">Hidden</option></select><button type="button" class="admin-btn admin-btn--outline admin-btn--sm" id="ideas-refresh">Refresh</button></div><div id="ideas-list"></div>';
    function load() {
      var list = byId('ideas-list');
      if (!list) return;
      list.innerHTML = '<p class="admin-loading">Loading…</p>';
      var status = (byId('ideas-status') || {}).value || '';
      API.admin.ideaFeedback.list({ limit: PAGE, admin_status: status || undefined }).then(function (r) {
        var items = r.items || [];
        if (!items.length) { list.innerHTML = '<div class="admin-empty">No feedback.</div>'; return; }
        var tr = items.map(function (f) {
          var st = f.admin_status || 'pending';
          return '<tr><td>' + f.id + '</td><td>' + esc((f.idea_title || '').slice(0, 40)) + '</td><td>' + (f.interested ? 'Yes' : 'No') + '</td><td><span class="admin-badge admin-badge--muted">' + st + '</span></td><td>' + dateFmt(f.created_at) + '</td><td class="admin-table-actions"><button type="button" class="admin-btn admin-btn--outline admin-btn--sm i-update" data-id="' + f.id + '" data-status="' + esc(st) + '" data-notes="' + esc(f.admin_notes || '') + '">Update</button></td></tr>';
        }).join('');
        list.innerHTML = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Idea</th><th>Interested</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>' + tr + '</tbody></table></div>';
        list.querySelectorAll('.i-update').forEach(function (btn) {
          btn.onclick = function () {
            var id = btn.getAttribute('data-id');
            var curSt = btn.getAttribute('data-status') || 'pending';
            var curNotes = btn.getAttribute('data-notes') || '';
            var body = '<form><div class="admin-field"><label class="admin-label">Status</label><select class="admin-input" name="admin_status"><option value="pending"' + (curSt === 'pending' ? ' selected' : '') + '>Pending</option><option value="reviewed"' + (curSt === 'reviewed' ? ' selected' : '') + '>Reviewed</option><option value="hidden"' + (curSt === 'hidden' ? ' selected' : '') + '>Hidden</option></select></div><div class="admin-field"><label class="admin-label">Notes</label><textarea class="admin-input" name="admin_notes" rows="3">' + esc(curNotes) + '</textarea></div><div class="admin-modal-actions"><button type="button" class="admin-btn admin-btn--outline">Cancel</button><button type="button" class="admin-btn admin-btn--primary" data-submit>Save</button></div></form>';
            openModal('Update feedback', body, function (el) {
              API.admin.ideaFeedback.update(id, { admin_status: el.querySelector('[name="admin_status"]').value, admin_notes: el.querySelector('[name="admin_notes"]').value }).then(function () { if (Toast) Toast.success('Saved'); load(); }).catch(function (e) { if (Toast) Toast.error(e.message); });
            });
          };
        });
      }).catch(function (err) { list.innerHTML = '<p class="admin-err">' + esc(err.message) + '</p>'; });
    }
    load();
    if (byId('ideas-refresh')) byId('ideas-refresh').onclick = load;
    if (byId('ideas-status')) byId('ideas-status').onchange = load;
  }

  var templatesOff = 0;
  var lastTplItems = [];

  function tplFormHtml(t) {
    t = t || {};
    var name = esc(t.name || '');
    var category = esc(t.category || 'General');
    var imageUrl = esc(t.image_url || '');
    var desc = esc(t.description || '');
    var sort = t.sort_order != null ? t.sort_order : 0;
    var active = t.is_active !== false;
    return (
      '<form id="tpl-form" class="admin-tpl-form">' +
      '<div class="admin-field"><label class="admin-label" for="tpl-name">Name</label><input id="tpl-name" class="admin-input" name="name" required maxlength="200" value="' + name + '"></div>' +
      '<div class="admin-field"><label class="admin-label" for="tpl-category">Category</label><input id="tpl-category" class="admin-input" name="category" required maxlength="120" placeholder="e.g. Gaming, Tech" value="' + category + '"></div>' +
      '<div class="admin-field"><label class="admin-label" for="tpl-image_url">Image URL</label><input id="tpl-image_url" class="admin-input" name="image_url" type="url" required placeholder="https://…" value="' + imageUrl + '"></div>' +
      '<div class="admin-field"><label class="admin-label" for="tpl-description">Description (searchable in app)</label><textarea id="tpl-description" class="admin-input" name="description" rows="3" maxlength="4000">' + desc + '</textarea></div>' +
      '<div class="admin-field admin-field--inline"><label class="admin-label" for="tpl-sort">Sort order</label><input id="tpl-sort" class="admin-input admin-input--narrow" name="sort_order" type="number" value="' + sort + '"></div>' +
      '<div class="admin-field admin-field--checkbox"><label><input type="checkbox" name="is_active" ' + (active ? 'checked' : '') + '> Active (visible in Scriptz app Templates)</label></div>' +
      '<div class="admin-modal-actions"><button type="button" class="admin-btn admin-btn--outline" id="tpl-cancel">Cancel</button><button type="submit" class="admin-btn admin-btn--primary">' + (t.id ? 'Save' : 'Create') + '</button></div></form>'
    );
  }

  function renderThumbnailTemplates(container) {
    container.innerHTML =
      '<div class="admin-page-head"><h1 class="admin-page-title">Thumbnail templates</h1><p class="admin-page-desc">Curated references shown in the Scriptz app under <strong>Templates</strong>. Users browse and search only; all create/edit/delete happens here.</p></div>' +
      '<div class="admin-toolbar admin-toolbar--glassy">' +
      '<input type="text" id="tpl-search" class="admin-input" placeholder="Search name, category, description…">' +
      '<input type="text" id="tpl-category-filter" class="admin-input" placeholder="Category slug (optional)">' +
      '<select id="tpl-active" class="admin-input"><option value="">All</option><option value="true">Active only</option><option value="false">Inactive only</option></select>' +
      '<button type="button" class="admin-btn admin-btn--primary admin-btn--sm" id="tpl-add">Add template</button>' +
      '<button type="button" class="admin-btn admin-btn--outline admin-btn--sm" id="tpl-refresh">Refresh</button></div>' +
      '<div id="tpl-list" class="admin-tpl-list"></div><div id="tpl-pag" class="admin-pagination"></div>';

    var api = API.admin && API.admin.thumbnailTemplates;
    function load() {
      var list = byId('tpl-list');
      if (!list) return;
      if (!api || !api.list) {
        list.innerHTML = '<p class="admin-err">API not available.</p>';
        return;
      }
      list.innerHTML = '<p class="admin-loading">Loading templates…</p>';
      var q = (byId('tpl-search') || {}).value || '';
      var cat = (byId('tpl-category-filter') || {}).value || '';
      var actVal = (byId('tpl-active') || {}).value;
      var isActive = actVal === '' ? undefined : actVal === 'true';
      api
        .list({
          limit: TEMPLATE_PAGE,
          offset: templatesOff,
          q: q.trim() || undefined,
          category: cat.trim() || undefined,
          is_active: isActive,
        })
        .then(function (r) {
          lastTplItems = r.items || [];
          if (!lastTplItems.length) {
            list.innerHTML = '<div class="admin-empty">No templates match. Add one with <strong>Add template</strong>.</div>';
            byId('tpl-pag').innerHTML = '';
            return;
          }
          var rows = lastTplItems
            .map(function (t) {
              var thumb =
                '<img class="admin-tpl-thumb" src="' +
                esc(t.image_url) +
                '" alt="" width="72" height="41" loading="lazy" onerror="this.style.visibility=\'hidden\'">';
              var st = t.is_active ? '<span class="admin-badge admin-badge--success">Active</span>' : '<span class="admin-badge admin-badge--muted">Off</span>';
              return (
                '<tr><td class="admin-tpl-preview">' +
                thumb +
                '</td><td>' +
                t.id +
                '</td><td><strong>' +
                esc(t.name) +
                '</strong></td><td>' +
                esc(t.category) +
                '<br><span class="admin-muted admin-tpl-slug">' +
                esc(t.category_slug) +
                '</span></td><td>' +
                (t.sort_order != null ? t.sort_order : 0) +
                '</td><td>' +
                st +
                '</td><td class="admin-table-actions">' +
                '<button type="button" class="admin-btn admin-btn--outline admin-btn--sm tpl-edit" data-id="' +
                t.id +
                '">Edit</button> ' +
                '<button type="button" class="admin-btn admin-btn--sm admin-btn--danger tpl-del" data-id="' +
                t.id +
                '" data-name="' +
                esc(t.name) +
                '">Delete</button></td></tr>'
              );
            })
            .join('');
          list.innerHTML =
            '<div class="admin-table-wrap"><table class="admin-table admin-table--templates"><thead><tr><th>Preview</th><th>ID</th><th>Name</th><th>Category</th><th>Sort</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
            rows +
            '</tbody></table></div>';

          list.querySelectorAll('.tpl-edit').forEach(function (btn) {
            btn.onclick = function () {
              var id = parseInt(btn.getAttribute('data-id'), 10);
              var row = lastTplItems.filter(function (x) {
                return x.id === id;
              })[0];
              if (!row) return;
              var modal = byId('admin-modal');
              var bodyEl = byId('admin-modal-body');
              var titleEl = byId('admin-modal-title');
              if (!modal || !bodyEl) return;
              if (titleEl) titleEl.textContent = 'Edit template';
              bodyEl.innerHTML = tplFormHtml(row);
              if (Dialog && Dialog.openModal) Dialog.openModal(modal);
              var closeBtn = byId('admin-modal-close');
              var backdrop = byId('admin-modal-backdrop');
              function closeTplModal() {
                if (Dialog && Dialog.closeModal) Dialog.closeModal(modal);
              }
              if (closeBtn) closeBtn.onclick = closeTplModal;
              if (backdrop) backdrop.onclick = closeTplModal;
              var cancel = byId('tpl-cancel');
              if (cancel) cancel.onclick = closeTplModal;
              var form = byId('tpl-form');
              if (form) {
                form.onsubmit = function (e) {
                  e.preventDefault();
                  var payload = {
                    name: form.name.value.trim(),
                    category: form.category.value.trim() || 'General',
                    image_url: form.image_url.value.trim(),
                    description: form.description.value.trim() || null,
                    sort_order: parseInt(form.sort_order.value, 10) || 0,
                    is_active: form.is_active.checked,
                  };
                  api
                    .update(id, payload)
                    .then(function () {
                      if (Toast) Toast.success('Template updated');
                      closeTplModal();
                      load();
                    })
                    .catch(function (err) {
                      if (Toast) Toast.error(err.message || 'Update failed');
                    });
                };
              }
            };
          });

          list.querySelectorAll('.tpl-del').forEach(function (btn) {
            btn.onclick = function () {
              var id = parseInt(btn.getAttribute('data-id'), 10);
              var nm = btn.getAttribute('data-name') || 'this template';
              function doDel() {
                api
                  .delete(id)
                  .then(function () {
                    if (Toast) Toast.success('Deleted');
                    load();
                  })
                  .catch(function (err) {
                    if (Toast) Toast.error(err.message || 'Delete failed');
                  });
              }
              if (Confirm && Confirm.show) {
                Confirm.show({
                  title: 'Delete template',
                  message: 'Permanently delete “' + nm + '”?',
                  confirmText: 'Delete',
                  cancelText: 'Cancel',
                  danger: true,
                }).then(function (ok) {
                  if (ok) doDel();
                });
              } else if (global.confirm('Delete “' + nm + '”?')) doDel();
            };
          });

          var total = r.total || 0;
          var pag = byId('tpl-pag');
          if (pag) {
            var prev = templatesOff === 0;
            var next = templatesOff + TEMPLATE_PAGE >= total;
            pag.innerHTML =
              '<span class="admin-pagination-total">' +
              total +
              ' template' +
              (total !== 1 ? 's' : '') +
              ' · ' +
              TEMPLATE_PAGE +
              ' per page</span><button type="button" class="admin-btn admin-btn--outline admin-btn--sm" id="tpl-prev" ' +
              (prev ? 'disabled' : '') +
              '>Previous</button><button type="button" class="admin-btn admin-btn--outline admin-btn--sm" id="tpl-next" ' +
              (next ? 'disabled' : '') +
              '>Next</button>';
            if (byId('tpl-prev'))
              byId('tpl-prev').onclick = function () {
                templatesOff = Math.max(0, templatesOff - TEMPLATE_PAGE);
                load();
              };
            if (byId('tpl-next'))
              byId('tpl-next').onclick = function () {
                templatesOff += TEMPLATE_PAGE;
                load();
              };
          }
        })
        .catch(function (err) {
          list.innerHTML = '<p class="admin-err">' + esc(err.message) + '</p>';
          if (byId('tpl-pag')) byId('tpl-pag').innerHTML = '';
        });
    }

    function openCreate() {
      var modal = byId('admin-modal');
      var bodyEl = byId('admin-modal-body');
      var titleEl = byId('admin-modal-title');
      if (!modal || !bodyEl) return;
      if (titleEl) titleEl.textContent = 'Add thumbnail template';
      bodyEl.innerHTML = tplFormHtml(null);
      if (Dialog && Dialog.openModal) Dialog.openModal(modal);
      var closeBtn = byId('admin-modal-close');
      var backdrop = byId('admin-modal-backdrop');
      function closeTplModal() {
        if (Dialog && Dialog.closeModal) Dialog.closeModal(modal);
      }
      if (closeBtn) closeBtn.onclick = closeTplModal;
      if (backdrop) backdrop.onclick = closeTplModal;
      var cancel = byId('tpl-cancel');
      if (cancel) cancel.onclick = closeTplModal;
      var form = byId('tpl-form');
      if (form) {
        form.onsubmit = function (e) {
          e.preventDefault();
          var payload = {
            name: form.name.value.trim(),
            category: form.category.value.trim() || 'General',
            image_url: form.image_url.value.trim(),
            description: form.description.value.trim() || null,
            sort_order: parseInt(form.sort_order.value, 10) || 0,
            is_active: form.is_active.checked,
          };
          api
            .create(payload)
            .then(function () {
              if (Toast) Toast.success('Template created');
              closeTplModal();
              templatesOff = 0;
              load();
            })
            .catch(function (err) {
              if (Toast) Toast.error(err.message || 'Create failed');
            });
        };
      }
    }

    templatesOff = 0;
    load();
    if (byId('tpl-refresh')) byId('tpl-refresh').onclick = function () {
      templatesOff = 0;
      load();
    };
    if (byId('tpl-add')) byId('tpl-add').onclick = openCreate;
    setTimeout(function () {
      if (byId('tpl-search'))
        byId('tpl-search').oninput = function () {
          templatesOff = 0;
          load();
        };
      if (byId('tpl-category-filter'))
        byId('tpl-category-filter').oninput = function () {
          templatesOff = 0;
          load();
        };
      if (byId('tpl-active'))
        byId('tpl-active').onchange = function () {
          templatesOff = 0;
          load();
        };
    }, 0);
  }

  function renderBilling(container) {
    container.innerHTML = '<div class="admin-page-head"><h1 class="admin-page-title">Billing</h1><p class="admin-page-desc">Subscriptions and revenue.</p></div><div class="admin-coming"><h3>Billing</h3><p>Subscription and revenue metrics will appear here when the backend is ready.</p></div>';
  }

  function renderGenerations(container) {
    container.innerHTML = '<div class="admin-page-head"><h1 class="admin-page-title">Generations</h1><p class="admin-page-desc">AI generations and logs.</p></div><div class="admin-coming"><h3>Generations</h3><p>Filter by user, type, and date when the API is available.</p></div>';
  }

  function renderSettings(container) {
    container.innerHTML = '<div class="admin-page-head"><h1 class="admin-page-title">Settings</h1><p class="admin-page-desc">App configuration.</p></div>';
  }

  function init() {
    var emailEl = byId('admin-sidebar-email');
    if (emailEl) {
      var p = AdminAuth.getAdminProfile && AdminAuth.getAdminProfile();
      if (p && p.email) emailEl.textContent = p.email;
      else if (AdminAuth.fetchAdminProfile) AdminAuth.fetchAdminProfile().then(function (p) { if (p && p.email && emailEl) emailEl.textContent = p.email; }).catch(function () {});
    }
    var logout = byId('admin-sidebar-logout');
    if (logout) logout.onclick = function () { AdminAuth.logout(); global.location.hash = 'login'; global.location.reload(); };
    document.querySelectorAll('.admin-sidebar-link').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var page = a.getAttribute('data-page');
        if (page) global.location.hash = 'admin-' + page;
      });
    });
  }

  global.ScriptzAdminPanel = {
    getPageFromHash: getPageFromHash,
    navigate: navigate,
    init: init
  };
})(typeof window !== 'undefined' ? window : this);

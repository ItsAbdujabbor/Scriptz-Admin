/**
 * Confirm dialog (Promise-based) and Toast. Requires: dialog.js (ScriptzDialog)
 */
(function (global) {
  'use strict';
  var Dialog = global.ScriptzDialog;
  function el(id) { return document.getElementById(id); }
  var resolveConfirm = null;
  function openConfirm(opts) {
    opts = opts || {};
    var dialog = el('app-confirm-dialog');
    var titleEl = el('app-confirm-title');
    var messageEl = el('app-confirm-message');
    var okBtn = el('app-confirm-ok');
    var cancelBtn = el('app-confirm-cancel');
    var closeBtn = el('app-confirm-close');
    if (!dialog || !messageEl) return Promise.resolve(false);
    if (titleEl) titleEl.textContent = opts.title || 'Confirm';
    messageEl.textContent = opts.message || 'Are you sure?';
    if (okBtn) okBtn.textContent = opts.confirmText || 'Confirm';
    if (cancelBtn) cancelBtn.textContent = opts.cancelText || 'Cancel';
    if (opts.danger) { if (okBtn) okBtn.classList.add('btn-danger'); } else if (okBtn) okBtn.classList.remove('btn-danger');
    return new Promise(function (resolve) {
      resolveConfirm = resolve;
      function done(ok) {
        if (resolveConfirm) { resolveConfirm(!!ok); resolveConfirm = null; }
        if (Dialog && Dialog.closeModal) Dialog.closeModal(dialog);
      }
      if (okBtn) okBtn.onclick = function () { done(true); };
      if (cancelBtn) cancelBtn.onclick = function () { done(false); };
      if (closeBtn) closeBtn.onclick = function () { done(false); };
      dialog.addEventListener('keydown', function onKey(e) {
        if (e.key === 'Escape') { done(false); dialog.removeEventListener('keydown', onKey); }
      });
      if (Dialog && Dialog.openModal) Dialog.openModal(dialog);
    });
  }
  var toastContainer = null;
  function getToastContainer() {
    if (toastContainer) return toastContainer;
    toastContainer = el('app-toast-container');
    return toastContainer;
  }
  function showToast(message, type) {
    type = type || 'info';
    var container = getToastContainer();
    if (!container) return;
    var el = document.createElement('div');
    el.className = 'app-toast ' + type;
    el.setAttribute('role', 'status');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4000);
  }
  global.ScriptzConfirm = { show: openConfirm };
  global.ScriptzToast = { show: showToast, success: function (m) { showToast(m, 'success'); }, error: function (m) { showToast(m, 'error'); }, info: function (m) { showToast(m, 'info'); } };
})(typeof window !== 'undefined' ? window : this);

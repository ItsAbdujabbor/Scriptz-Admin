/**
 * Reusable dialog — open/close modal. Required by ui-components.js (Confirm/Toast).
 */
(function (global) {
  'use strict';
  function openModal(dialogEl) {
    if (!dialogEl) return;
    dialogEl.classList.add('visible');
    dialogEl.setAttribute('aria-hidden', 'false');
  }
  function closeModal(dialogEl) {
    if (!dialogEl) return;
    dialogEl.classList.remove('visible');
    dialogEl.setAttribute('aria-hidden', 'true');
  }
  function isModalVisible(dialogEl) {
    return dialogEl && dialogEl.classList.contains('visible');
  }
  global.ScriptzDialog = {
    openModal: openModal,
    closeModal: closeModal,
    isModalVisible: isModalVisible
  };
})(typeof window !== 'undefined' ? window : this);

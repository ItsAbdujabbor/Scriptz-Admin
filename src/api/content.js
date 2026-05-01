import { apiFetch, apiUpload } from "./client";

const crud = (base) => ({
  list: (params) => apiFetch(`/api/admin/content/${base}`, { params }),
  create: (body) =>
    apiFetch(`/api/admin/content/${base}`, { method: "POST", body }),
  update: (id, body) =>
    apiFetch(`/api/admin/content/${base}/${id}`, { method: "PATCH", body }),
  remove: (id) =>
    apiFetch(`/api/admin/content/${base}/${id}`, { method: "DELETE" }),
});

export const contentApi = {
  // Personas are user-private and not administered from the admin app.
  // The only admin-side persona operation is the one-shot purge:
  //   DELETE /api/admin/content/personas/purge-stock
  // which wipes legacy rows where user_id IS NULL.
  personasPurgeStock: () =>
    apiFetch(`/api/admin/content/personas/purge-stock`, { method: "DELETE" }),
  styles: {
    ...crud("styles"),
    // Multipart upload — same contract as the user-side
    // `/api/styles/upload`, but the row is stored with
    // `visibility="admin"` (handled server-side) so it surfaces as
    // a stock style in every user's dialog.
    createFromUpload: (formData) =>
      apiUpload(`/api/admin/content/styles/upload`, {
        method: "POST",
        form: formData,
      }),
  },
  // Demo characters — admin-curated personas that show up at the top
  // of every user's character library with a "Demo" badge. Created
  // via the same 3-image multi-view face composite the user app uses.
  personas: {
    list: (params) => apiFetch(`/api/admin/content/personas`, { params }),
    update: (id, body) =>
      apiFetch(`/api/admin/content/personas/${id}`, { method: "PATCH", body }),
    remove: (id) =>
      apiFetch(`/api/admin/content/personas/${id}`, { method: "DELETE" }),
    createFromUpload: (formData) =>
      apiUpload(`/api/admin/content/personas/upload`, {
        method: "POST",
        form: formData,
      }),
  },
  feedback: {
    list: (params) => apiFetch("/api/admin/content/feedback", { params }),
    update: (id, body) =>
      apiFetch(`/api/admin/content/feedback/${id}`, { method: "PATCH", body }),
  },
};

import { apiFetch } from "./client";

const crud = (base) => ({
  list: (params) => apiFetch(`/api/admin/content/${base}`, { params }),
  create: (body) => apiFetch(`/api/admin/content/${base}`, { method: "POST", body }),
  update: (id, body) => apiFetch(`/api/admin/content/${base}/${id}`, { method: "PATCH", body }),
  remove: (id) => apiFetch(`/api/admin/content/${base}/${id}`, { method: "DELETE" }),
});

export const contentApi = {
  // Personas are user-private and not administered from the admin app.
  // The only admin-side persona operation is the one-shot purge:
  //   DELETE /api/admin/content/personas/purge-stock
  // which wipes legacy rows where user_id IS NULL.
  personasPurgeStock: () =>
    apiFetch(`/api/admin/content/personas/purge-stock`, { method: "DELETE" }),
  styles: crud("styles"),
  templates: crud("thumbnail-templates"),
  feedback: {
    list: (params) => apiFetch("/api/admin/content/feedback", { params }),
    update: (id, body) =>
      apiFetch(`/api/admin/content/feedback/${id}`, { method: "PATCH", body }),
  },
};

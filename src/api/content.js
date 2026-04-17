import { apiFetch } from "./client";

const crud = (base) => ({
  list: (params) => apiFetch(`/api/admin/content/${base}`, { params }),
  create: (body) => apiFetch(`/api/admin/content/${base}`, { method: "POST", body }),
  update: (id, body) => apiFetch(`/api/admin/content/${base}/${id}`, { method: "PATCH", body }),
  remove: (id) => apiFetch(`/api/admin/content/${base}/${id}`, { method: "DELETE" }),
});

export const contentApi = {
  personas: crud("personas"),
  styles: crud("styles"),
  templates: crud("thumbnail-templates"),
  feedback: {
    list: (params) => apiFetch("/api/admin/content/feedback", { params }),
    update: (id, body) =>
      apiFetch(`/api/admin/content/feedback/${id}`, { method: "PATCH", body }),
  },
};

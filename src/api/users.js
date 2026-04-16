import { apiFetch } from "./client";

export const usersApi = {
  list: (params) => apiFetch("/api/admin/users", { params }),
  get: (id) => apiFetch(`/api/admin/users/${id}`),
  update: (id, body) => apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body }),
  remove: (id) => apiFetch(`/api/admin/users/${id}`, { method: "DELETE" }),
  activity: (id, params) => apiFetch(`/api/admin/users/${id}/activity`, { params }),
  adjustCredits: (id, body) => apiFetch(`/api/admin/users/${id}/credits`, { method: "POST", body }),
  impersonate: (id) => apiFetch(`/api/admin/users/${id}/impersonate`, { method: "POST" }),
  resetPassword: (id) => apiFetch(`/api/admin/users/${id}/reset-password`, { method: "POST" }),
};

import { apiFetch } from "./client";

export const logsApi = {
  audit: (params) => apiFetch("/api/admin/logs/audit", { params }),
  events: (params) => apiFetch("/api/admin/logs/events", { params }),
  errors: (params) => apiFetch("/api/admin/logs/errors", { params }),
};

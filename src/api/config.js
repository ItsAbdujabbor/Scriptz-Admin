import { apiFetch } from "./client";

export const configApi = {
  flags: () => apiFetch("/api/admin/config/feature-flags"),
  updateFlag: (key, body) =>
    apiFetch(`/api/admin/config/feature-flags/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body,
    }),
  billing: () => apiFetch("/api/admin/config/billing"),
  env: () => apiFetch("/api/admin/config/env"),
};

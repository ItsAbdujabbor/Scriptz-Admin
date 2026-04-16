import { apiFetch } from "./client";

export const channelsApi = {
  list: (params) => apiFetch("/api/admin/channels", { params }),
  summary: (params) => apiFetch("/api/admin/channels/summary", { params }),
};

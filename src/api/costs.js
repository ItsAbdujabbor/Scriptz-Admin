import { apiFetch } from "./client";

export const costsApi = {
  cloud: (days = 30) => apiFetch("/api/admin/costs/cloud", { params: { days } }),
  aws: (days = 30) => apiFetch("/api/admin/costs/aws", { params: { days } }),
  gcp: (days = 30) => apiFetch("/api/admin/costs/gcp", { params: { days } }),
};

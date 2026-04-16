import { apiFetch } from "./client";

export const analyticsApi = {
  overview: () => apiFetch("/api/admin/analytics/overview"),
  growth: (range = "7d") => apiFetch("/api/admin/analytics/growth", { params: { range } }),
  usage: (range = "7d", feature) =>
    apiFetch("/api/admin/analytics/usage", { params: { range, feature } }),
  revenue: (range = "30d") =>
    apiFetch("/api/admin/analytics/revenue", { params: { range } }),
  revenueBreakdown: (range = "30d") =>
    apiFetch("/api/admin/analytics/revenue-breakdown", { params: { range } }),
  finance: (days = 30) =>
    apiFetch("/api/admin/analytics/finance", { params: { days } }),
};

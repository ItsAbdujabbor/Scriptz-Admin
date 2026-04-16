import { apiFetch } from "./client";

export const authApi = {
  login: (email, password) =>
    apiFetch("/api/admin/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  me: () => apiFetch("/api/admin/auth/me"),
  logout: (refresh_token) =>
    apiFetch("/api/admin/auth/logout", {
      method: "POST",
      body: { refresh_token },
    }),
};

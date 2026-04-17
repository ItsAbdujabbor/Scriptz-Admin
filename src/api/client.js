import { useAuthStore } from "../stores/authStore";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function buildUrl(path, params) {
  const base = API_BASE || "";
  const url = new URL(`${base}${path.startsWith("/") ? "" : "/"}${path}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      if (Array.isArray(v)) {
        v.forEach((item) => url.searchParams.append(k, item));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.pathname + url.search;
}

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let refreshPromise = null;

async function attemptRefresh() {
  if (refreshPromise) return refreshPromise;
  const refresh = useAuthStore.getState().getRefreshToken();
  if (!refresh) return null;
  refreshPromise = fetch(buildUrl("/api/admin/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      useAuthStore.getState().setSession(data);
      return data.access_token;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

async function parseResponse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch(path, { method = "GET", params, body, headers, signal } = {}) {
  const token = useAuthStore.getState().getAccessToken();
  const url = buildUrl(path, params);
  const doRequest = (accessToken) =>
    fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(headers || {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

  let res = await doRequest(token);
  if (res.status === 401 && token) {
    const newToken = await attemptRefresh();
    if (newToken) {
      res = await doRequest(newToken);
    } else {
      useAuthStore.getState().clear();
      if (!window.location.hash.startsWith("#/login")) {
        window.location.hash = "/login";
      }
    }
  }

  const data = await parseResponse(res);
  if (!res.ok) {
    const message =
      (data && (data.error?.message || data.message || data.detail)) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }
  return data;
}

/**
 * Multipart upload helper — for endpoints that accept FormData instead of
 * JSON. Same auth + refresh behavior as `apiFetch`; we just hand the
 * FormData straight to fetch and let the browser set Content-Type
 * (including the boundary).
 */
export async function apiUpload(path, { method = "POST", form, headers, signal } = {}) {
  if (!(form instanceof FormData)) {
    throw new TypeError("apiUpload requires a FormData 'form' argument");
  }
  const url = buildUrl(path);
  const token = useAuthStore.getState().getAccessToken();
  const doRequest = (accessToken) =>
    fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(headers || {}),
      },
      body: form,
      signal,
    });

  let res = await doRequest(token);
  if (res.status === 401 && token) {
    const newToken = await attemptRefresh();
    if (newToken) {
      res = await doRequest(newToken);
    } else {
      useAuthStore.getState().clear();
      if (!window.location.hash.startsWith("#/login")) {
        window.location.hash = "/login";
      }
    }
  }

  const data = await parseResponse(res);
  if (!res.ok) {
    const message =
      (data && (data.error?.message || data.message || data.detail)) ||
      `Upload failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }
  return data;
}

export { ApiError };

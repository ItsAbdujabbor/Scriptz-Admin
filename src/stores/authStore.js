import { create } from "zustand";

const STORAGE_KEY = "scriptz_admin_auth";

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const expiresAt =
    session.expires_at ||
    (session.expires_in
      ? Date.now() + Number(session.expires_in) * 1000
      : Date.now() + 15 * 60 * 1000);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...session, expires_at: expiresAt })
  );
}

export const useAuthStore = create((set, get) => ({
  session: readSession(),
  hydrated: true,

  setSession: (session) => {
    writeSession(session);
    set({ session: readSession() });
  },

  clear: () => {
    writeSession(null);
    set({ session: null });
  },

  getAccessToken: () => get().session?.access_token || null,
  getRefreshToken: () => get().session?.refresh_token || null,
  getUser: () => get().session?.user || null,
  isAuthenticated: () => !!get().session?.access_token,
}));

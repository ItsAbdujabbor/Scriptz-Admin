import { apiFetch, apiUpload } from "./client";

const BASE = "/api/admin/thumbnail-references";

/**
 * Admin API for the curated thumbnail-reference library.
 *
 *   listTopicClasses()   -> { items: [{ key, label, description }] }
 *   list({ topic_class, include_inactive }) -> { items: Reference[], total }
 *   upload({ file, topic_class, name }) -> Reference
 *   update(id, patch)    -> Reference
 *   remove(id)           -> { ok: true }
 */
export const thumbnailRefsApi = {
  listTopicClasses: () => apiFetch(`${BASE}/topic-classes`),

  list: ({ topic_class, include_inactive } = {}) =>
    apiFetch(BASE + "/", {
      params: { topic_class, include_inactive },
    }),

  upload: ({ file, topic_class, name }) => {
    const form = new FormData();
    form.append("image", file);
    form.append("topic_class", topic_class);
    if (name) form.append("name", name);
    return apiUpload(`${BASE}/upload`, { form });
  },

  /**
   * Ingest a YouTube video's thumbnail. Server extracts the video ID,
   * downloads maxresdefault (falling back to hqdefault), uploads to the
   * Supabase bucket, and creates the DB row.
   */
  importFromYouTube: ({ youtube_url, topic_class, name }) =>
    apiFetch(`${BASE}/import-youtube`, {
      method: "POST",
      body: {
        youtube_url,
        topic_class,
        ...(name ? { name } : {}),
      },
    }),

  update: (id, patch) =>
    apiFetch(`${BASE}/${id}`, { method: "PATCH", body: patch }),

  remove: (id) => apiFetch(`${BASE}/${id}`, { method: "DELETE" }),
};

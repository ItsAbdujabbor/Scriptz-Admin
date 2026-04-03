# Admin Panel — Backend Gaps (optional)

The admin dashboard works end-to-end with the current Scriptz-Api. The following are **optional** additions if you need finer-grained analytics.

---

## Already implemented (no gap)

- **GET /api/admin/stats** — Returns KPIs (users, admins, projects, generations, scripts, thumbnails, tokens, cost by feature), daily/weekly/monthly trends (including `tokens` and `cost_estimate_usd` per period), and recent activity.
- **Token/cost storage**: `GenerationRun` stores `prompt_tokens`, `completion_tokens`, `total_tokens`, `cost_estimate_usd`, `model_used`, `created_at`, `user_id`. `Thumbnail` stores `total_cost_estimate_usd`. `ThumbnailRating` stores `analysis_tokens_used`, `analysis_cost_usd`.
- Aggregates: total tokens (and by script vs thumbnail rating), cost by feature (scripts, thumbnails, thumbnail rating), and trend points include tokens + cost per period.

---

## Optional endpoints (only if needed)

### 1. Tokens per user (top N or full list)

**Method + route:** `GET /api/admin/stats/token-usage?limit=50&offset=0`

**Response shape:**
```json
{
  "items": [
    { "user_id": "uuid", "email": "user@example.com", "total_tokens": 12000, "cost_estimate_usd": 0.45 }
  ],
  "total": 100
}
```

**Why:** Dashboard “tokens per user” or “top users by usage” table. Not required for current dashboard.

---

### 2. Generations list with filters (for Generations / Logs page)

**Method + route:** `GET /api/admin/generations?user_id=&feature_type=script|thumbnail&from_date=&to_date=&limit=20&offset=0`

**Response shape:**
```json
{
  "items": [
    {
      "id": 1,
      "user_id": "uuid",
      "feature_type": "script",
      "model_used": "gemini-2.5-flash",
      "input_tokens": 500,
      "output_tokens": 1200,
      "total_tokens": 1700,
      "cost_estimate_usd": 0.02,
      "created_at": "2025-02-28T12:00:00Z",
      "meta": {}
    }
  ],
  "total": 100
}
```

**Why:** Dedicated “Generations / Logs” admin page with filters and detail view. Currently there is no admin endpoint that lists `GenerationRun` rows; the dashboard only shows aggregates.

---

### 3. Model pricing table (optional)

**Method + route:** `GET /api/admin/config/pricing` (or read from app config)

**Response shape:**
```json
{
  "models": [
    { "model": "gemini-2.5-flash", "provider": "google", "prompt_per_1k": 0.001, "completion_per_1k": 0.002 }
  ]
}
```

**Why:** To recompute cost from tokens in the UI or to show “estimated cost at current pricing”. Not required if you only display stored `cost_estimate_usd` per generation.

---

## Summary

- **No blocking gaps:** The admin dashboard is fully functional with existing `GET /api/admin/stats` and existing models.
- **Optional:** Token-per-user endpoint, admin generations list endpoint, and optional pricing config for future “Generations / Logs” and “usage by user” views.

# Scriptz Admin

Dark-themed admin panel for the Scriptz platform. Built with **React 19 + Vite**, talks to `Scriptz-Api` (`/api/admin/**`).

All admin auth, routing, and UI live here — the main `Scriptz-app` has no admin code.

## Features

- Dashboard with KPIs and usage charts
- Users: search, filter, ban/unban, role changes, per-user activity and credits
- Analytics: growth, per-feature usage, revenue (credits purchased/consumed)
- Content oversight: personas, styles, thumbnail templates, user idea-feedback
- Logs: audit trail, usage events, unhandled errors
- Config: feature flag toggles, billing snapshot (read-only), env snapshot

## Quick start

```bash
npm install
cp .env.example .env    # (optional) override VITE_API_BASE_URL for prod
npm run dev             # http://localhost:3001
```

In dev, Vite proxies `/api` to `http://127.0.0.1:8000` so no CORS setup is needed.

Sign in with any `Scriptz-Api` user that has `role = "admin"`. The `BOOTSTRAP_ADMIN_*` envs in Scriptz-Api seed one on first startup.

## Architecture

```
src/
  api/           # fetch wrapper + one module per domain (auth, users, analytics, …)
  queries/       # React Query client + hook/key registry
  stores/        # Zustand auth store (localStorage-backed)
  components/
    Layout/      # AdminShell, Sidebar, TopBar
    ui/          # Button, Card, DataTable, Modal, Drawer, Toast, Input, Tabs, …
    charts/      # tiny SVG line chart
    shared/      # StatCard
  pages/         # one folder per section — Login, Dashboard, users/, analytics/, content/, logs/, config/
  theme.css      # design tokens (ported from Scriptz-app ios-theme.css)
  global.css     # base layout + scrollbars
```

All requests flow through `src/api/client.js`, which injects `Authorization: Bearer …` and auto-refreshes on 401.

## Build

```bash
npm run build
npm run preview
```

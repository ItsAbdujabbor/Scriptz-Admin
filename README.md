# Scriptz Admin

Standalone admin panel for Scriptz. It talks to **Scriptz-Api** over HTTPS/fetch. Log in with an API user that has **`role=admin`** (email + password, same as `/api/admin/auth/login`).

---

## Quick start (local)

### 1. Run Scriptz-Api

From the API project (with venv if you use one):

```bash
alembic upgrade head
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Ensure `SECRET_KEY` and `FERNET_KEY` are set in `.env` for anything beyond quick dev (see API `.env.example`).

### 2. Create admin credentials (pick one)

**Option A — Bootstrap on API startup (good for first-time local setup)**  
In **Scriptz-Api** `.env` add (then restart the API):

```env
BOOTSTRAP_ADMIN=1
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=ChangeMe_Admin123
```

Use a normal domain for the email (not `.local` / not `admin@localhost`) or the API may reject it at login.

- Creates that user as **admin** if they do not exist, or **promotes** them if the email already exists (password is **not** changed for existing users).
- **Production:** ignored unless you also set `BOOTSTRAP_ADMIN_ALLOW_PRODUCTION=1` (avoid on public servers).

**Option B — Script** (from Scriptz-Api root):

```bash
python scripts/create_first_admin.py admin@example.com YourPasswordHere
```

### 3. CORS (only if you use direct API mode)

With **`npm start`** and default `.env`, the browser only calls **`/api` on the admin origin** (e.g. `http://localhost:3001/api/...`). The admin server proxies to Scriptz-Api — **no CORS** needed, same idea as **Vite’s `server.proxy['/api']`** in **Scriptz-App-React**.

CORS matters only if you set **`SCRIPTZ_PUBLIC_API_BASE_URL`** (browser talks straight to the API, like **`VITE_API_BASE_URL`**).

### 4. Run Scriptz-Admin

```bash
cd /path/to/Scriptz-Admin
npm install
npm run setup   # creates .env from .env.example if missing
npm start
```

Default `.env` already points the proxy at **`http://127.0.0.1:8000`**; change **`SCRIPTZ_API_BASE_URL`** if your API runs elsewhere.

Open **http://localhost:3001** (or your `PORT`). Sign in with **email** and **password** from step 2.

With **`npm start`**, the injected **`API_BASE_URL` is empty** and **`fetch('/api/...')`** is same-origin — **same pattern** as **Scriptz-App-React** when **`VITE_API_BASE_URL`** is unset in dev (Vite proxies `/api` to `http://127.0.0.1:8000`). Here, **Express** proxies using **`SCRIPTZ_API_BASE_URL`**.

| React app (Vite) | Scriptz Admin (`npm start`) |
|------------------|-----------------------------|
| `server.proxy['/api']` → `127.0.0.1:8000` | Express proxy `/api` → `SCRIPTZ_API_BASE_URL` |
| `getApiBaseUrl()` → `''` in dev (relative `/api`) | `API_BASE_URL` → `''` (relative `/api`) |
| Optional `VITE_API_BASE_URL` → direct API + CORS | Optional `SCRIPTZ_PUBLIC_API_BASE_URL` → direct API + CORS |

Do **not** use `npm run serve` / `npx serve` for local dev if you want proxy mode — there is no `/api` proxy. Use **`npm start`**.

### “Failed to fetch” on every screen

- **Use `npm start`**, not plain static hosting, unless you configure a full API URL + CORS.
- **API not running** on the upstream (`SCRIPTZ_API_BASE_URL`, default `http://127.0.0.1:8000`).
- **Mixed content** — HTTPS admin page cannot use HTTP API; use HTTPS for both or local HTTP.
- **Direct mode** (`SCRIPTZ_PUBLIC_API_BASE_URL` set): add your admin origin to **Scriptz-Api** `CORS_ORIGINS` or use `CORS_ALLOW_LOCALHOST_REGEX=1` locally.

---

## How to run (alternative static hosting)

If you cannot use `npm start`, serve this folder as a static site and set **`config.js`** `API_BASE_URL` to your API. You must still satisfy CORS on the API for that origin.

---

## After login

Sidebar: Dashboard, Users, Admins & Roles, Audit Logs, Idea Feedback, Thumbnail templates, Billing, Generations, Settings.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Login + panel shell |
| `config.js` | Default API URL (overridden by server `/config.js` when using `npm start`) |
| `api.js` | Admin auth + admin HTTP client |
| `auth.js` | Token storage and refresh |
| `admin-auth.js` | Admin checks |
| `admin.js` | Panel init |
| `admin-panel.js` | Pages |
| `app.js` | Hash router (login vs panel) |
| `server.js` | Express: SPA + dynamic `config.js` from `.env` |
| `.env.example` | `PORT`, `SCRIPTZ_API_BASE_URL`, optional `SCRIPTZ_PUBLIC_API_BASE_URL`, `SCRIPTZ_ADMIN_API_PROXY` |

---

## Link from the main app

Point users with the admin role to wherever Scriptz-Admin is hosted (for example `http://localhost:3001` in development).

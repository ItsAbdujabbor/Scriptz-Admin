# Scriptz Admin

Standalone admin panel for Scriptz. Use the same API base URL as the main app (Scriptz-app).

---

## How to run (pick one)

### Option A — From Cursor (recommended)

1. In Cursor, open the **Scriptz-Admin** folder as the project (File → Open Folder → choose `Scriptz-Admin`).
2. Open the integrated terminal (Terminal → New Terminal).
3. Run:
   ```bash
   npm run serve
   ```
4. In the terminal you’ll see something like: **Open in browser: http://localhost:3001**
5. Open that URL in your browser. You should see the **Scriptz Admin** login screen (not “Index of”).

If you get a permission error, use Option B or C below.

---

### Option B — Copy to home with Finder, then serve

macOS may block Terminal from reading your Desktop. Use Finder to copy the app to your home folder, then serve that copy.

1. **Copy the folder**
   - Open **Finder**.
   - Go to **Desktop**.
   - **Copy** the `Scriptz-Admin` folder (⌘C).
   - Go to your **home** folder (your name in the sidebar, or ⌘⇧H).
   - **Paste** (⌘V). You should see a folder named `Scriptz-Admin` in your home directory.

2. **Check the copy**
   - Open the copied `Scriptz-Admin` folder in Finder.
   - Confirm it contains **index.html** and files like **config.js**, **admin.css**, **app.js**, etc. (not an empty folder).

3. **Start the server**
   - Open **Terminal** (or Cursor’s terminal).
   - Run:
     ```bash
     cd ~
     npx serve Scriptz-Admin -s -l 3001
     ```

4. **Open the app**
   - In the terminal you’ll see a line like: **Local: http://localhost:3001**
   - Open **http://localhost:3001** in your browser (use the root URL only; do **not** add `/Scriptz-Admin/`).
   - You should see the **Scriptz Admin** login screen.

To get future code changes from Desktop, copy the `Scriptz-Admin` folder from Desktop to your home folder again (replace the existing one), or edit files in `~/Scriptz-Admin`.

---

### Option C — Grant Full Disk Access (then run from Desktop)

If you prefer to run from Desktop without copying:

1. Open **System Settings** → **Privacy & Security** → **Full Disk Access**.
2. Click **+** and add **Terminal** (and **Cursor** if you use its terminal).
3. Quit and reopen Terminal (or Cursor).
4. Run:
   ```bash
   cd /Users/suxrobsattorov/Desktop
   npx serve Scriptz-Admin -s -l 3001
   ```
5. Open **http://localhost:3001** in your browser. You should see the Scriptz Admin login screen.

---

## After the app is running

- **Login:** Use an account that has `role=admin` (same credentials as the main Scriptz app). Only admin accounts can access the panel.
- **No admin yet?** Create or promote an admin from the **Scriptz-Api** project root:
  ```bash
  cd /path/to/Scriptz-Api
  # Promote an existing user (they must have signed up in the app first):
  python scripts/create_first_admin.py your@email.com
  # Or create a new admin user:
  python scripts/create_first_admin.py admin@example.com YourPassword123
  ```
- **Routes:** After login, use the sidebar: Dashboard, Users, Admins & Roles, Audit Logs, Idea Feedback, Billing, Generations, Settings.
- **API:** Ensure the Scriptz API is running (e.g. `http://127.0.0.1:8000`) and that `config.js` has the correct API base URL. The API must allow CORS for the origin you use (e.g. `http://localhost:3001`).

---

## Files in this project

| File | Purpose |
|------|---------|
| `index.html` | Login screen and panel shell |
| `config.js` | API base URL |
| `api.js` | Admin auth and admin API client |
| `auth.js` | Token storage and refresh |
| `admin-auth.js` | Admin profile and guards |
| `admin.js` | Init and panel setup |
| `admin-panel.js` | Panel pages (dashboard, users, audit, etc.) |
| `app.js` | Router (login vs panel, guard by admin role) |
| `dialog.js`, `ui-components.js` | Confirm and toast |
| `admin.css` | Full theme (login, panel, tables, modals, toasts) |
| `run-serve.js` | Serves this folder at `/` so the UI loads (no directory listing) |
| `server.js` | Express server (alternative to `npx serve`) |

---

## Link from the main app

To open the admin panel from the main Scriptz app, link to the URL where Scriptz-Admin is served (e.g. `http://localhost:3001` or `https://your-domain.com/admin/`).
# Scriptz-Admin
# Scriptz-Admin

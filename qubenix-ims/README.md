# Qubenix AI · Intern Management System

Admins manage interns, assign tasks and review submissions. Interns log in to see their tasks and submit work.

**Stack:** React 18 (Vite) · Tailwind CSS · Node.js + Express · Supabase (PostgreSQL) · REST API · JWT auth

## Features

| Task | What was built |
|---|---|
| 1. Admin authentication | JWT login, bcrypt-hashed passwords, rate-limited login, protected routes on client and API |
| 2. Intern management | Add, view profile, edit, delete interns (name, email, phone, department, joining date, status). Search and filter. Random one-time password if the admin does not set one |
| 3. Task management | Create/edit/delete tasks, assign to an intern, deadline, priority, status (Pending / In Progress / Completed), filters, overdue flag |
| 4. Task submission | Interns submit a description + GitHub URL + document link. Admin approves or requests changes with feedback, or opens a full-screen **Present** view for meetings |
| 5. Dashboard | Total and active interns, total / completed / pending tasks, progress bar, latest submissions |

---

## Deploy: Supabase + GitHub + Vercel

One Vercel project serves both the React app and the API (`/api/*` runs as a serverless function), so there is no CORS setup.

### 1. Supabase
1. Create a project at supabase.com.
2. **SQL Editor** → paste `supabase/schema.sql` → Run.
3. **Settings > API**: copy the **Project URL** and the **service_role** key. Keep that key secret (server only).

### 2. Create your admin account (run once, from your laptop)
```bash
cd server
npm install
cp .env.example .env
# fill SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD (10+ chars)
npm run create-admin
```
Then delete `ADMIN_PASSWORD` from `.env`.

Optional local test first: `npm run dev` in `server/` and `npm run dev` in `client/` (opens on http://localhost:5173).
`npm run seed:demo` loads fake interns and tasks, but it **wipes all data**, so use it only on a throwaway Supabase project.

### 3. Push to GitHub
```bash
cd qubenix-ims
git init
git add .
git commit -m "Intern Management System"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
`.gitignore` already excludes `.env` and `node_modules`. Check `git status` shows no `.env` before you commit.

### 4. Vercel
1. vercel.com → **Add New > Project** → import the GitHub repo.
2. Leave **Root Directory** as the repo root. Framework preset: **Other**. `vercel.json` sets the build.
3. Add **Environment Variables**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` (32+ random characters; generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
4. Deploy, then open `https://<your-app>.vercel.app/api/health` (should return `{"ok":true}`) and log in with the admin you created.

If you change environment variables later, redeploy for them to apply.

## Before real use: checklist
- Use a strong `JWT_SECRET` and a strong admin password. Never commit `.env`.
- The `service_role` key bypasses database security. It must only live in Vercel env vars and your local `server/.env`.
- Tables have Row Level Security enabled with no policies, so the public Supabase anon key cannot read them.
- Interns get a random password shown once. There is no self-service "forgot password" or password change yet. Admins can set a new password from the intern edit form.
- Login is limited to 10 attempts per 15 minutes per IP. Tokens last 1 day and are stored in the browser's localStorage.
- Supabase free projects pause after a week of inactivity; upgrade or ping them if this matters.

## REST API

All routes except `/auth/login` need `Authorization: Bearer <token>`.

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | public | `{email, password, role}` → token |
| GET | `/api/auth/me` | any | current user |
| GET/POST | `/api/interns` | admin | list (`?search=&status=`) / create |
| GET/PUT/DELETE | `/api/interns/:id` | admin | profile + tasks / update / delete (cascades to their tasks) |
| GET/POST | `/api/tasks` | admin | list (`?status=&priority=&assignedTo=&hasSubmission=true`) / create |
| PUT/DELETE | `/api/tasks/:id` | admin | update / delete |
| PATCH | `/api/tasks/:id/review` | admin | `{reviewStatus, feedback}`; Approved marks the task Completed |
| GET | `/api/tasks/my` | intern | own tasks |
| PATCH | `/api/tasks/:id/status` | intern | Pending / In Progress |
| POST | `/api/tasks/:id/submit` | intern | `{description, githubUrl, documentUrl}` |
| GET | `/api/dashboard/stats` | admin | dashboard counts |

## Design decisions
- **Roles in one JWT** carrying `{id, role}`; `protect` verifies it and `requireRole` guards routes. Interns can only touch tasks where `assigned_to` is their own id.
- **Submission is a `jsonb` column on `tasks`.** One task has one current submission, so no extra table.
- **Status flow:** intern submits → `In Progress` + review `Submitted`. Admin approves → `Completed`. Admin requests changes → stays `In Progress` with feedback and the intern can resubmit. Interns cannot complete their own tasks.
- **Same-origin deploy:** `vercel.json` rewrites `/api/*` to the Express app (`api/index.js`) and everything else to the React app.

## Structure
```
api/index.js          Vercel serverless entry (wraps the Express app)
server/src            app.js · index.js (local) · config/db.js · utils · middleware · routes · create-admin.js · seed.js
client/src            api.js · auth.jsx · components · pages
supabase/schema.sql   table definitions
vercel.json           build + routing
package.json (root)   dependencies for the API function on Vercel
```

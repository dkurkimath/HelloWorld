# The Sophia Way — Member Portal

A real, deployable version of the board/staff document portal: Next.js app,
Postgres database (shared — not browser storage), Google sign-in restricted
to `@sophiaway.org`, and real email alerts for announcements.

This replaces the earlier single-file prototype (`portal-v1-mirror.html`).
Same data (the 13-person roster, 16 documents, 8 categories) is pre-loaded
via `db/seed.sql`.

## What's built

- **Documents** — browse by category, star, open the real Drive link, admin access control (everyone / specific members, view or edit).
- **Announcements** — admin composes and sends; each recipient gets a real email (via Resend) and sees it in their Inbox until they open it, then it moves to Archive — tracked per-person in the database, not per-browser.
- **Member directory** — real board/staff roster: role, employer, city, phone, LinkedIn, committee seats; commitment-form status is admin-only.
- **Admin members** — add/remove members, change role, grant/revoke admin.
- **Activity log** — uploads, access changes, role changes, announcements.
- **Login** — "Sign in with Google," restricted to people already in the `members` table (being on the sophiaway.org domain alone isn't enough — an admin has to have added you first).

## What's intentionally not built yet

- Uploading actual files into Google Drive from the app (documents are Drive *links*, same as the prototype — someone still uploads the real file in Drive and pastes the link, or we wire up the Drive API next).
- Comments on documents (schema has a `comments` table ready; no UI yet).
- "Recently worked on" panels (schema has `recent_views`; wiring into the UI is a quick follow-up).

Both are straightforward additions once the base app is live — ask and I'll build them in.

---

## Setup checklist (things that need your action, outside this chat)

Do these in order. None of them need engineering skill — they're mostly clicking through setup wizards — but several need **admin access to the sophiaway.org Google Workspace** (to create OAuth credentials) and, for real email, **access to sophiaway.org's DNS** (at your domain registrar or wherever DNS is managed).

### 1. Create a Postgres database
Pick one (both have free tiers big enough for this):
- [Neon](https://neon.tech) — easiest, serverless Postgres.
- [Supabase](https://supabase.com) — also gives you a nice admin UI for the tables.

After creating a project, copy the **connection string** (it looks like `postgres://user:pass@host/dbname?sslmode=require`). That's your `DATABASE_URL`.

### 2. Create the Google OAuth credentials
1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project (e.g. "Sophia Way Portal"). Use the Google account that's an admin on sophiaway.org's Workspace, or any Google account if you're fine with a generic "External" OAuth app — either works for a small internal tool.
2. **APIs & Services → OAuth consent screen**: choose "Internal" if you're inside a Google Workspace org for sophiaway.org (restricts sign-in to your domain automatically), or "External" otherwise. Fill in the app name and your email.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → type "Web application."
   - **Authorized JavaScript origins**: your real site URL (e.g. `https://portal.sophiaway.org` or the `*.vercel.app` URL from step 3 below).
   - **Authorized redirect URIs**: the same URL + `/api/auth/callback/google` (e.g. `https://portal.sophiaway.org/api/auth/callback/google`).
4. Copy the **Client ID** and **Client Secret** — these are `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### 3. Deploy the app
Easiest path: [Vercel](https://vercel.com) (free tier is plenty for this).
1. Push this project to a GitHub repo (or I can do that for you if you want this on GitHub).
2. On vercel.com, "Add New Project" → import that repo.
3. Add the environment variables (from the `.env.example` file in this project): `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET` (generate one with `openssl rand -base64 32`, or any random 32+ character string), `NEXTAUTH_URL` (the exact URL Vercel gives your project).
4. Deploy. Then go back to step 2 and make sure the OAuth origins/redirect URIs match the real Vercel URL exactly.

### 4. Load the database
From your own computer (with Node installed) or from this chat if you give me the connection string:
```
DATABASE_URL="<your connection string>" npm run db:migrate
DATABASE_URL="<your connection string>" npm run db:seed
```
This creates the tables and loads the real roster/documents/categories.

### 5. Make yourself an admin and add everyone else
The seed data already marks Jola Paliswiat and Danielle Porter as admins (matching the prototype). If you want to be an admin too, either run one SQL command:
```sql
UPDATE members SET is_admin = true WHERE email = 'your-email@sophiaway.org';
```
or ask me to do it once the database is live and I have the connection string.

### 6. Real email alerts (optional — works without this, just skips sending)
1. Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month, plenty).
2. Add and verify the sophiaway.org sending domain (Resend gives you DNS records to add — this needs access to sophiaway.org's DNS).
3. Copy the API key into `RESEND_API_KEY` in your Vercel environment variables.
4. Until this is set up, announcements still work in the app (inbox/archive, read tracking) — the email just doesn't go out, and the app logs that instead of failing.

---

## Running locally (for me, or a future developer)

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL at minimum
npm run db:migrate
npm run db:seed
npm run dev
```

## Project layout

```
app/                    Next.js pages (one per route)
  documents/             browse, star, admin access control
  announcements/         inbox/archive + admin compose
  members/               member directory
  admin/members/         add/remove/role management
  activity/              activity log
  login/                 Google sign-in
lib/
  db.ts                  Postgres connection pool
  data.ts                all database queries
  auth.ts                NextAuth config (Google, sophiaway.org-only)
  mail.ts                Resend email sending
db/
  schema.sql             table definitions
  seed.sql                real roster/documents/categories
scripts/
  migrate.mjs, seed.mjs   run the two SQL files against DATABASE_URL
```

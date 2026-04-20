# maduby-pres — brutalist slide deck + live audience

A **Next.js (App Router)** presentation you can open-source for teaching: one **audience** URL (`/`) and one **presenter** URL (`/present`), optional **Supabase** for live slide sync, a **waiting lobby** until you press start, **live polls** over Realtime broadcast, emoji **reactions**, and an optional **Passwort-Modus** so guests can preview slides before go-live.

This README doubles as a **tutorial** so you (or your students) can **rebuild the same idea** in a fresh repo or adapt it.

---

## What you get

| Piece | What it does |
|--------|----------------|
| **Audience deck** (`/`) | Swiper slides, URL `?s=` index, waiting room until presentation starts (when Supabase is on). |
| **Presenter deck** (`/present`) | Same slides; middleware + cookie gate with `PRESENTER_SECRET`; exclusive **lease** so one tab controls slides. |
| **Lobby** | `presentation_started_at` is `null` → audience sees instructions + optional duck mini-game; navigation locked until start or visitor password. |
| **Live follow** | Audience can follow presenter slide via Realtime + polling fallback. |
| **Live polls** | Broadcast channel per session; presenter goes “live” on a poll slide; audience votes once per poll round. |
| **Visitor preview** | `VISITOR_PASSWORD` + HttpOnly JWT cookie → browse slides early; polls disabled until real go-live. |
| **Content** | Slides defined in TypeScript (`src/content/slides.de-ch.ts`) with a **Zod** schema (`src/lib/deck/schema.ts`). |

---

## Stack

- **Next.js 16** (React 19), **TypeScript**, **Tailwind CSS 4**
- **Supabase** (Postgres + Realtime) — optional; deck still works offline with query params only
- **Swiper** for slide carousel, **Framer Motion** for poll bars, **jose** for JWT cookies
- **Zod** for slide validation

---

## Repository layout (the parts that matter)

```
src/app/
  page.tsx              → audience: <DeckShell variant="audience" />
  present/page.tsx      → presenter shell
  present/login/        → presenter password → cookie
  api/present/*         → slide updates, start/stop/pause, lease claim/release
  api/visitor-unlock/*  → audience preview password → cookie
src/components/deck/    → DeckShell, swiper, polls, waiting room, reactions
src/content/            → slides + UI strings (German `de-CH` in this fork)
src/lib/                → schema, presenter/visitor JWT helpers
supabase/migrations/    → `deck_sessions`, RLS, RPCs, Realtime
```

---

## Prerequisites

- **Node.js 20+** (or 18+; project uses current Next)
- **npm** (or pnpm/yarn if you adapt lockfile)
- A **Supabase** project if you want live features (free tier is enough for class demos)
- A **Vercel** (or other) host if you deploy; env vars live in the dashboard, not in git

---

## Environment variables (from `.env.example`)

Copy **`.env.example`** → **`.env.local`** and fill values. **Never commit `.env.local`** (it is gitignored).

### Required for “full live” mode (lobby, sync, presenter APIs, polls)

If any of the **Supabase trio** below is missing, the app still runs: slides work locally with `?s=`, but there is **no** waiting room, Realtime, or `/api/present` database writes.

| Variable | Exposed to browser? | Purpose |
|----------|---------------------|---------|
| **`NEXT_PUBLIC_SUPABASE_URL`** | Yes | Supabase project URL (`https://xxxxx.supabase.co`). |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | Yes | **anon** key — used by the browser for Realtime (read `deck_sessions`, broadcast polls/reactions). Safe to ship; protect data with **RLS** (migrations do this). |
| **`NEXT_PUBLIC_DECK_SESSION_ID`** | Yes | UUID of **one** row in `public.deck_sessions` for this environment (local vs preview vs production must differ). |
| **`SUPABASE_SERVICE_ROLE_KEY`** | **No — server only** | **service_role** key — Next.js **route handlers** use it to update slides, start/stop/pause, and call `security definer` RPCs. Treat like a root password; only in Vercel “Production/Preview” env or `.env.local`. |
| **`PRESENTER_SECRET`** | No | Password for **`/present`** (middleware + `POST /api/present/gate`). Also optional **Bearer** on present APIs. Use a long random string. |

### Strongly recommended for deployed sites

| Variable | Exposed? | Purpose |
|----------|----------|---------|
| **`NEXT_PUBLIC_SITE_URL`** | Yes | Canonical site URL (Open Graph, metadata). No trailing slash. |
| **`NEXT_PUBLIC_AUDIENCE_URL`** | Yes | Shown in the waiting room (“Jetzt mitmachen”) link; defaults in `.env.example` if you override. |

### Optional

| Variable | Purpose |
|----------|---------|
| **`VISITOR_PASSWORD`** | Audience **Passwort-Modus**: unlock slide navigation before go-live. If unset, preview unlock returns HTTP 503. Requires `NEXT_PUBLIC_DECK_SESSION_ID` on the server too. |

**Vercel tip:** use different **`NEXT_PUBLIC_DECK_SESSION_ID`** values per **Production** vs **Preview** (different rows in the same or different Supabase projects) so class staging never flips the public deck.

---

## Supabase: create a project and wire it up

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, **New project**.
2. Choose organization, **name**, **database password** (save it somewhere safe), **region** (closest to your audience).
3. Wait until the project finishes provisioning.

### 2. Get API credentials

1. In the Dashboard: **Project Settings** (gear) → **API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **`anon` `public`** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **`service_role` `secret`** key → `SUPABASE_SERVICE_ROLE_KEY` (never expose to the client or commit)

### 3. Run database migrations (schema + RLS + RPCs + Realtime)

Migrations live in **`supabase/migrations/`**. They must run **in filename order** (timestamp prefix).

| Order | File | What it does |
|-------|------|----------------|
| 1 | `20260419000000_deck_sessions.sql` | Creates **`deck_sessions`** (`id`, `slide_index`, …), enables **RLS**, policy so **anon can SELECT** only; no direct anon writes. |
| 2 | `20260419000001_realtime_deck_sessions.sql` | Adds **`deck_sessions`** to **`supabase_realtime`** publication so **`postgres_changes`** works for live slide follow. |
| 3 | `20260420120000_presenter_lease.sql` | Presenter **lease** columns + **`presenter_push_slide`** / heartbeat RPCs (service role only). |
| 4 | `20260421120000_presentation_started_at.sql` | **Lobby**: `presentation_started_at` + **`presenter_start_presentation`** RPC. |
| 5 | `20260422100000_presenter_start_session_not_found.sql` | Improves **`presenter_start_presentation`** when the session UUID row is missing (clearer errors). |
| 6 | `20260423000000_deck_sessions_environment_label.sql` | **`environment_label`** column (e.g. `local`, `staging`, `production`) for your own bookkeeping. |
| 7 | `20260424000000_presentation_pause_stop.sql` | **`presentation_paused`**, pause/stop RPCs used by presenter controls. |

**Option A — Supabase Dashboard (simplest for students)**

1. Open **SQL Editor** → **New query**.
2. Open each file locally in order, **paste** the full file, click **Run**.
3. If step 2 errors with “already member of publication”, the table was already added to Realtime — you can skip re-adding or ignore that specific statement once.

**Option B — Supabase CLI**

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli), run `supabase login`, then `supabase link` to this project.
2. From the repo root: `supabase db push` (applies pending migrations to the linked remote database).  
   Use the same ordering the CLI infers from filenames.

### 4. Confirm Realtime is enabled for `deck_sessions`

1. Dashboard → **Database** → **Publications** (or **Realtime** settings, depending on UI version).
2. Ensure **`supabase_realtime`** includes **`public.deck_sessions`**.  
   Migration `20260419000001` runs `alter publication supabase_realtime add table public.deck_sessions;` — if that succeeded, you’re set.

### 5. Insert a `deck_sessions` row and set `NEXT_PUBLIC_DECK_SESSION_ID`

Run in **SQL Editor**:

```sql
insert into public.deck_sessions (environment_label)
values ('local')
returning id;
```

Copy the returned **`id`** into **`NEXT_PUBLIC_DECK_SESSION_ID`** in `.env.local`.

Repeat for **`staging`** / **`production`** labels when you create Preview/Production envs; each environment gets its **own UUID**.

### 6. Quick verification

- **Table:** **Table Editor** → `deck_sessions` → one row, `slide_index` 0, `presentation_started_at` null until you start.
- **RLS:** anon key in the browser should **read** the row; it should **not** be able to arbitrary **update** (writes go through your Next API + service role).

### Common problems

| Symptom | Likely cause |
|---------|----------------|
| Audience never leaves lobby / start fails with migration hint | Migrations not fully applied; RPC **`presenter_start_presentation`** missing or old. Re-run migration files from `20260421120000` onward. |
| Live follow dead, no errors | **Realtime** not subscribed — check publication; check **`NEXT_PUBLIC_*`** keys and session id. |
| `session_not_found` on start | **`NEXT_PUBLIC_DECK_SESSION_ID`** doesn’t match any row UUID in **this** Supabase project. |
| `lease_denied` | Another presenter tab holds the lease; wait ~90s or use presenter “takeover” in UI. |

---

## Tutorial: run it locally

### 1. Clone and install

```bash
git clone <your-fork-url> maduby-pres
cd maduby-pres
npm install
```

### 2. Environment file

```bash
cp .env.example .env.local
```

Fill **`.env.local`** using the tables in **Environment variables** and complete **Supabase: create a project** above (migrations + insert row + paste keys).

### 3. Dev server

```bash
npm run dev
```

- Audience: [http://localhost:3000](http://localhost:3000)
- Presenter: [http://localhost:3000/present](http://localhost:3000/present) (will ask for `PRESENTER_SECRET`)

---

## Tutorial: how the pieces fit together

### Slide content (fork this first for your own talk)

1. Open **`src/lib/deck/schema.ts`** — this is the **contract** for each slide `kind` (text, image, iframe, timeline, `livePoll`, …).
2. Copy **`src/content/slides.de-ch.ts`** to something like `slides.my-workshop.ts` and point **`src/app/page.tsx`** and **`src/app/present/page.tsx`** at it.
3. Run **`npm run build`** — Zod will catch invalid slides at build time.

Optional: run **`npm run optimize:storyline-images`** if you add large images under `docs/storyline/assets` (prebuild runs a similar script).

### Waiting room vs “presentation open”

- Column **`presentation_started_at`** on `deck_sessions`: `null` → lobby; non-null → audience can navigate (unless you add visitor preview-only rules in code).
- Presenter calls **`POST /api/present/start`**, which uses a **security definer** RPC (`presenter_start_presentation`) so only the service role can set the timestamp reliably.

### Presenter auth

- **`src/middleware.ts`** protects `/present` (not `/`).
- **`POST /api/present/gate`** checks `PRESENTER_SECRET` with a **timing-safe** compare, then sets an **HttpOnly** cookie signed with **jose** (`src/lib/presenter-session.ts`).
- **Lease**: a random `holder` id in `localStorage` + `deck_sessions.presenter_holder_id` / heartbeat so two tabs don’t fight.

### Visitor “Passwort-Modus”

- **`POST /api/visitor-unlock`**: compares body password to **`VISITOR_PASSWORD`**, sets JWT cookie bound to **`NEXT_PUBLIC_DECK_SESSION_ID`** (`src/lib/visitor-preview-session.ts`).
- **`DeckShell`** treats “deck navigation unlocked” as: no Supabase, **or** presentation started, **or** valid visitor cookie.
- Polls: **`LivePollProvider`** gets `audiencePollDisabled` while in preview-only mode so students can’t skew polls before the real session.

### Live polls

- Not stored in Postgres — **Realtime broadcast** on a channel named with the session id.
- Presenter **`beginLivePoll` / `endLivePoll`**; audience **`submitVote`** sends a deduped event; tallies update live.

---

## Deploy (e.g. Vercel)

1. Push the repo to GitHub and import the project in Vercel.
2. Set **the same env vars** as `.env.example`, using a **production** `deck_sessions` UUID for `NEXT_PUBLIC_DECK_SESSION_ID`.
3. **Do not** expose `SUPABASE_SERVICE_ROLE_KEY` or `PRESENTER_SECRET` to the browser — they are server-only.
4. Optional: `node scripts/sync-vercel-production-env.mjs` reads **`.env.local`** and runs `vercel env` (requires Vercel CLI logged in); the script is optional and contains no secrets itself.

---

## Re-doing this from scratch (student checklist)

If someone wants to **rebuild the idea** without forking:

1. **Next.js App Router** + TypeScript + Tailwind.
2. **Single source of truth** for slides: typed array + Zod parse at build.
3. **URL state** for slide index: `useSearchParams` + `router.replace` so links are shareable (`?s=3`).
4. **Optional Supabase**: one row per “room” (`deck_sessions`) with `slide_index`, `presentation_started_at`, presenter lease columns; RLS so anon can read but not write; writes only via **route handlers + service role**.
5. **Realtime**: `postgres_changes` on `deck_sessions` for slide + pause; **broadcast** for polls and reactions.
6. **Presenter protection**: middleware on `/present` + HttpOnly JWT from server-only secret.
7. **Visitor preview** (optional): second cookie + password env; narrow JWT claims to `session_id`.

This repo implements all of the above so you can **read the code** alongside the checklist.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev |
| `npm run build` | Production build (runs image optimize prebuild) |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |
| `npm run optimize:storyline-images` | Convert storyline JPG/PNG to WebP in `docs/storyline/assets` |

---

## Open source notes for teachers

- Add a **`LICENSE`** file (e.g. MIT) if you want a clear reuse policy.
- **Rotate secrets** if you ever accidentally committed `.env` — then invalidate old Supabase keys in the dashboard.
- **Personal content**: slide copy and images in `docs/` / `src/content/` are what your students will see — scrub emails or private photos if needed before making the repo public.

---

## Credits

Project scaffold: **create-next-app**. Brutalist UI and deck behavior evolved for live teaching and audience participation.

Questions for class: trace one path end-to-end — **presenter presses next** → which API runs → which column updates → how does the audience’s `DeckShell` learn the new index?

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

## Tutorial: run it locally

### 1. Clone and install

```bash
git clone <your-fork-url> maduby-pres
cd maduby-pres
npm install
```

### 2. Environment file

Only **`.env.example`** is committed. Copy it and fill real values:

```bash
cp .env.example .env.local
```

Never commit `.env.local` — it is gitignored.

### 3. Supabase: create the deck session row

1. In Supabase SQL Editor, run **all** files in `supabase/migrations/` **in order** (or use `supabase db push` if you use the Supabase CLI linked to this project).
2. Enable **Realtime** for `public.deck_sessions` if your migration didn’t already (Dashboard → Database → Publications, or your migration for `supabase_realtime`).
3. Insert **one row** per environment (local / preview / production):

   ```sql
   insert into public.deck_sessions (environment_label)
   values ('local')
   returning id;
   ```

4. Copy the returned **`id`** (UUID) into **`NEXT_PUBLIC_DECK_SESSION_ID`** in `.env.local`.

### 4. Fill `.env.local` (minimal live setup)

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `NEXT_PUBLIC_DECK_SESSION_ID` | UUID of your `deck_sessions` row |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — used by `/api/present/*` to update slides and call RPCs |
| `PRESENTER_SECRET` | Long random string; presenter login + Bearer for APIs |
| `VISITOR_PASSWORD` | Optional; audience “Passwort-Modus” preview |
| `NEXT_PUBLIC_AUDIENCE_URL` / `NEXT_PUBLIC_SITE_URL` | Your public site for links and OG metadata |

See comments in **`.env.example`** for Preview vs Production session IDs on Vercel.

### 5. Dev server

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

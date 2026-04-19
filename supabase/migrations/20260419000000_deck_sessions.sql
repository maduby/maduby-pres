-- Deck session row for live slide sync (optional). Create one row and set NEXT_PUBLIC_DECK_SESSION_ID to its id.
-- Enable Realtime in Supabase Dashboard for this table if postgres_changes does not stream.

create table if not exists public.deck_sessions (
  id uuid primary key default gen_random_uuid(),
  slide_index integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.deck_sessions enable row level security;

-- Public read for audience (anon + authenticated). Adjust if you need stricter isolation.
create policy "deck_sessions_select_public"
  on public.deck_sessions
  for select
  to anon, authenticated
  using (true);

-- Writes go through service role (API route) only; anon has no insert/update/delete policies.

comment on table public.deck_sessions is 'FHGR deck: presenter updates slide_index; audience reads via anon + Realtime.';

-- Realtime: run in SQL editor if your project does not auto-include new tables:
-- alter publication supabase_realtime add table public.deck_sessions;

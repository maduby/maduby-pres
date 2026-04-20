-- Optional label so Table Editor shows which deployment owns each row (local / staging / production).

alter table public.deck_sessions
  add column if not exists environment_label text;

comment on column public.deck_sessions.environment_label is
  'Optional human label: e.g. local, staging, production. Pair each row with NEXT_PUBLIC_DECK_SESSION_ID in that environment.';

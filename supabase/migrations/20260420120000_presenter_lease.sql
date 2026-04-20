-- Exclusive presenter lease: one active holder updates slide_index; stale after ~90s without heartbeat.

alter table public.deck_sessions
  add column if not exists presenter_holder_id text,
  add column if not exists presenter_heartbeat timestamptz;

comment on column public.deck_sessions.presenter_holder_id is 'Client lease id for exclusive presenter control.';
comment on column public.deck_sessions.presenter_heartbeat is 'Last successful presenter push or lease renewal.';

create or replace function public.presenter_push_slide(
  p_session uuid,
  p_holder text,
  p_slide int,
  p_stale_seconds int default 90
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update public.deck_sessions
  set
    slide_index = p_slide,
    updated_at = now(),
    presenter_holder_id = p_holder,
    presenter_heartbeat = now()
  where id = p_session
    and (
      presenter_holder_id is null
      or presenter_holder_id = p_holder
      or presenter_heartbeat < now() - make_interval(secs => p_stale_seconds)
    );
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

-- Heartbeat / initial claim without changing slide_index (same lease rules as presenter_push_slide).
create or replace function public.presenter_claim_or_refresh(
  p_session uuid,
  p_holder text,
  p_stale_seconds int default 90
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update public.deck_sessions
  set
    presenter_holder_id = p_holder,
    presenter_heartbeat = now()
  where id = p_session
    and (
      presenter_holder_id is null
      or presenter_holder_id = p_holder
      or presenter_heartbeat < now() - make_interval(secs => p_stale_seconds)
    );
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.presenter_push_slide(uuid, text, int, int) from public;
revoke all on function public.presenter_claim_or_refresh(uuid, text, int) from public;

grant execute on function public.presenter_push_slide(uuid, text, int, int) to service_role;
grant execute on function public.presenter_claim_or_refresh(uuid, text, int) to service_role;

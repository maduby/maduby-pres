-- Pause: audience stops following remote slide updates; presenter stops pushing until resumed.
-- Stop: end presentation (lobby), reset slide to 0, clear pause.

alter table public.deck_sessions
  add column if not exists presentation_paused boolean not null default false;

comment on column public.deck_sessions.presentation_paused is
  'When true and presentation_started_at is set, live slide sync is frozen for the audience.';

create or replace function public.presenter_set_paused(
  p_session uuid,
  p_holder text,
  p_paused boolean,
  p_stale_seconds int default 90
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if not exists (select 1 from public.deck_sessions where id = p_session) then
    return jsonb_build_object('ok', false, 'error', 'session_not_found');
  end if;

  if not exists (
    select 1 from public.deck_sessions
    where id = p_session and presentation_started_at is not null
  ) then
    return jsonb_build_object('ok', false, 'error', 'not_started');
  end if;

  update public.deck_sessions
  set
    presentation_paused = p_paused,
    presenter_heartbeat = now()
  where id = p_session
    and presentation_started_at is not null
    and (
      presenter_holder_id is null
      or presenter_holder_id = p_holder
      or presenter_heartbeat < now() - make_interval(secs => p_stale_seconds)
    );
  get diagnostics n = row_count;
  if n = 0 then
    return jsonb_build_object('ok', false, 'error', 'lease_denied');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.presenter_stop_presentation(
  p_session uuid,
  p_holder text,
  p_stale_seconds int default 90
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if not exists (select 1 from public.deck_sessions where id = p_session) then
    return jsonb_build_object('ok', false, 'error', 'session_not_found');
  end if;

  if not exists (
    select 1 from public.deck_sessions
    where id = p_session and presentation_started_at is not null
  ) then
    return jsonb_build_object('ok', true);
  end if;

  update public.deck_sessions
  set
    presentation_started_at = null,
    presentation_paused = false,
    slide_index = 0,
    updated_at = now(),
    presenter_holder_id = p_holder,
    presenter_heartbeat = now()
  where id = p_session
    and presentation_started_at is not null
    and (
      presenter_holder_id is null
      or presenter_holder_id = p_holder
      or presenter_heartbeat < now() - make_interval(secs => p_stale_seconds)
    );
  get diagnostics n = row_count;
  if n = 0 then
    return jsonb_build_object('ok', false, 'error', 'lease_denied');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.presenter_set_paused(uuid, text, boolean, int) from public;
revoke all on function public.presenter_stop_presentation(uuid, text, int) from public;

grant execute on function public.presenter_set_paused(uuid, text, boolean, int) to service_role;
grant execute on function public.presenter_stop_presentation(uuid, text, int) to service_role;

-- Starting a talk always clears pause.
create or replace function public.presenter_start_presentation(
  p_session uuid,
  p_holder text,
  p_stale_seconds int default 90
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
  started timestamptz;
begin
  if not exists (select 1 from public.deck_sessions where id = p_session) then
    return jsonb_build_object('ok', false, 'error', 'session_not_found');
  end if;

  update public.deck_sessions
  set
    presentation_started_at = coalesce(presentation_started_at, now()),
    presentation_paused = false,
    presenter_holder_id = p_holder,
    presenter_heartbeat = now()
  where id = p_session
    and (
      presenter_holder_id is null
      or presenter_holder_id = p_holder
      or presenter_heartbeat < now() - make_interval(secs => p_stale_seconds)
    );
  get diagnostics n = row_count;
  if n = 0 then
    return jsonb_build_object('ok', false, 'error', 'lease_denied');
  end if;
  select presentation_started_at into started from public.deck_sessions where id = p_session;
  return jsonb_build_object('ok', true, 'started_at', started);
end;
$$;

revoke all on function public.presenter_start_presentation(uuid, text, int) from public;
grant execute on function public.presenter_start_presentation(uuid, text, int) to service_role;

-- No slide pushes while paused (or before start).
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
    and presentation_started_at is not null
    and coalesce(presentation_paused, false) = false
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
grant execute on function public.presenter_push_slide(uuid, text, int, int) to service_role;

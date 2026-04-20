-- When null, audience stays in lobby (reactions only); presenter must start the talk.

alter table public.deck_sessions
  add column if not exists presentation_started_at timestamptz;

comment on column public.deck_sessions.presentation_started_at is
  'UTC timestamp when the presenter started; null = waiting lobby.';

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
  update public.deck_sessions
  set
    presentation_started_at = coalesce(presentation_started_at, now()),
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

-- Distinguish missing deck row from lease conflict; clearer API errors for misconfigured NEXT_PUBLIC_DECK_SESSION_ID.

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

-- Stage 3 Phase 2 (v2): update consume_agent_proposal to gate on agent.proposal
-- events instead of agent.proposal_confirmed.
--
-- In v2, /api/clay/action runs the consume + execute in a single request when the
-- operator clicks Confirm — there's no multi-turn dance where the agent itself
-- calls the real tool in a later turn. So the thing we need to atomically consume
-- is the ORIGINAL proposal emitted by the propose_* tool, not a separate
-- confirmation event.
--
-- Same function signature, same semantics (atomic lock + consume, returns bool),
-- just pointed at a different event_type. CREATE OR REPLACE is idempotent.
-- Safe to run even if 20260421_agent_proposal_consume.sql was already applied.

create or replace function public.consume_agent_proposal(
  p_proposal_id uuid,
  p_payload_hash text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id uuid;
begin
  -- Find the ORIGINAL proposal row (not a confirmation). The propose_* tool
  -- emitted exactly one of these with consumed=false. We atomically flip it
  -- to consumed=true; any racing second click finds no candidate and returns false.
  select id into row_id
  from public.platform_events
  where event_type = 'agent.proposal'
    and payload->>'proposal_id' = p_proposal_id::text
    and payload->>'payload_hash' = p_payload_hash
    and coalesce(payload->>'consumed', 'false') = 'false'
    and created_at > now() - interval '10 minutes'
  order by created_at desc
  limit 1
  for update;

  if row_id is null then
    return false;
  end if;

  update public.platform_events
  set payload = jsonb_set(payload, '{consumed}', 'true'::jsonb, true)
  where id = row_id;

  return true;
end;
$$;

grant execute on function public.consume_agent_proposal(uuid, text) to service_role, authenticated;

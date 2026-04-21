-- Stage 3 Phase 2: atomic hard DB gate for agent writes.
--
-- Every real write tool (`*`) calls this RPC before touching any domain table.
-- The function finds a matching `agent.proposal_confirmed` row in platform_events,
-- verifies freshness (< 10 min old), verifies it hasn't already been consumed,
-- and — in the SAME transaction with a FOR UPDATE lock — marks it consumed.
-- Returns true if authorized, false otherwise.
--
-- DB-row-as-source-of-truth (per /plan-eng-review hardening): the LLM cannot
-- tamper with the payload between propose and execute — any change produces
-- a different payload_hash, which fails the match. The operator-clickable
-- /api/clay/action endpoint is the only thing that writes the confirmed event.
--
-- ADDITIVE ONLY. No schema changes. Uses existing platform_events columns.
-- If RPC is re-run, CREATE OR REPLACE handles idempotency.

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
  -- Find a fresh, unconsumed, matching confirmation row. Lock it so a racing
  -- call cannot also consume it.
  select id into row_id
  from public.platform_events
  where event_type = 'agent.proposal_confirmed'
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

  -- Atomic UPDATE in the same transaction. Lock is released when the function
  -- returns. Any concurrent call blocked on this row will see consumed=true
  -- when it re-reads and will not find a candidate.
  update public.platform_events
  set payload = jsonb_set(payload, '{consumed}', 'true'::jsonb, true)
  where id = row_id;

  return true;
end;
$$;

-- Grant execute to the roles the app uses. service_role is the default for
-- server-to-DB via SUPABASE_SERVICE_KEY; authenticated covers any RLS-scoped
-- direct call if we choose to widen later.
grant execute on function public.consume_agent_proposal(uuid, text) to service_role, authenticated;

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export type EventActorType = 'user' | 'agent' | 'system' | 'cron';

export async function emitEvent(params: {
  eventType: string;
  payload?: Record<string, any>;
  actorId?: string;
  actorType?: EventActorType;
  agencyId?: string;
  correlationId?: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  try {
    const { error } = await supabase.from('platform_events').insert({
      event_type: params.eventType,
      payload: params.payload ?? {},
      actor_id: params.actorId ?? null,
      actor_type: params.actorType ?? null,
      agency_id: params.agencyId ?? null,
      correlation_id: params.correlationId ?? null,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
    });

    if (error) {
      console.error(`[emitEvent] Failed to emit '${params.eventType}':`, error.message);
    }
  } catch (err: any) {
    console.error(`[emitEvent] Exception emitting '${params.eventType}':`, err.message);
  }
}

// Strict variant for load-bearing events (agent.proposal, agent.proposal_confirmed,
// agent.scheduled_run_config_drift). Throws on failure so the caller can surface
// the error rather than silently dropping an event the agent loop depends on.
// Per 2026-04-18 eng review finding #4 in the Stage 3 plan.
export async function emitEventStrict(params: {
  eventType: string;
  payload?: Record<string, any>;
  actorId?: string;
  actorType?: EventActorType;
  agencyId?: string;
  correlationId?: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  const { error } = await supabase.from('platform_events').insert({
    event_type: params.eventType,
    payload: params.payload ?? {},
    actor_id: params.actorId ?? null,
    actor_type: params.actorType ?? null,
    agency_id: params.agencyId ?? null,
    correlation_id: params.correlationId ?? null,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
  });

  if (error) {
    throw new Error(`[emitEventStrict] Failed to emit '${params.eventType}': ${error.message}`);
  }
}

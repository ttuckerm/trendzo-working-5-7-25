import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function emitEvent(params: {
  eventType: string;
  payload?: Record<string, any>;
  actorId?: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  try {
    const { error } = await supabase.from('platform_events').insert({
      event_type: params.eventType,
      payload: params.payload ?? {},
      actor_id: params.actorId ?? null,
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

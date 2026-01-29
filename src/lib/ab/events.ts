import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureP1AccuracyTables } from '@/lib/db/ensure'

export type AbEventType = 'variant_created' | 'variant_switched' | 'variant_promoted'

export async function recordAbEvent(params: { templateId: string; variantId: string; eventType: AbEventType; payload?: any }): Promise<void> {
  const db = (SUPABASE_URL && SUPABASE_SERVICE_KEY) ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null as any
  if (!db) return
  await ensureP1AccuracyTables()
  try { await db.from('ab_events').insert({ template_id: params.templateId, variant_id: params.variantId, event_type: params.eventType, payload: params.payload || null } as any) } catch {}
}




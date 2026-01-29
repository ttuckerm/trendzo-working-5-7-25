import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null as any

export async function emitScoreServed(payload: Record<string, any>): Promise<void> {
  // Fire-and-forget best-effort insert; no-throw for local/dev
  try { if (db) await db.from('rec_events').insert({ event: 'EVT.Rec.ScoreServed', payload } as any) } catch {}
}

export async function emitRegretCapped(payload: Record<string, any>): Promise<void> {
  try { if (db) await db.from('rec_events').insert({ event: 'EVT.Rec.RegretCapped', payload } as any) } catch {}
}

export async function emitItemPromoted(payload: Record<string, any>): Promise<void> {
  try { if (db) await db.from('rec_events').insert({ event: 'EVT.Rec.ItemPromoted', payload } as any) } catch {}
}

export async function emitItemDemoted(payload: Record<string, any>): Promise<void> {
  try { if (db) await db.from('rec_events').insert({ event: 'EVT.Rec.ItemDemoted', payload } as any) } catch {}
}



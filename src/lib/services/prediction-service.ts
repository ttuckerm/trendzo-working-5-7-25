import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null as any

export async function writePredictionReceipt(input: { video_draft_id?: string; inputs?: any }): Promise<{ receipt_id: string; eta_validation_hours: number }>{
  const receipt_id = `rcpt_${Math.random().toString(36).slice(2, 10)}`
  if (db) {
    try {
      await (db as any).from('predictions').insert({ receipt_id, platform: 'tiktok', video_draft_id: input.video_draft_id || null, inputs: input.inputs || {}, validation_eta_hours: 48 })
    } catch {}
  }
  return { receipt_id, eta_validation_hours: 48 }
}



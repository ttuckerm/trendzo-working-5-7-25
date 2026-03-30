import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export type TranscriptRecord = {
  video_id: string
  lang: string | null
  text: string | null
  source: string
}

export async function ensureVideoTranscriptsTable(): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try {
    await (db as any).rpc?.('exec_sql', { query: `
      create table if not exists video_transcripts (
        id bigserial primary key,
        video_id text not null,
        lang text,
        text text,
        source text not null,
        created_at timestamptz not null default now()
      );
      create index if not exists idx_video_transcripts_video_id on video_transcripts(video_id);
      create index if not exists idx_video_transcripts_created_at on video_transcripts(created_at);
    ` })
  } catch {}
}

export async function upsertTranscript(rec: TranscriptRecord): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureVideoTranscriptsTable()
  try {
    await db.from('video_transcripts').insert({
      video_id: rec.video_id,
      lang: rec.lang || null,
      text: rec.text || null,
      source: rec.source
    } as any)
  } catch {}
}



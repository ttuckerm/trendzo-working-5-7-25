import { NextRequest, NextResponse } from 'next/server'
import { ensureVideoTranscriptsTable, upsertTranscript } from '@/lib/transcripts/store'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureVideoTranscriptsTable()
  const exampleVideoId = 'dryrun_video_123'
  try {
    await upsertTranscript({ video_id: exampleVideoId, lang: 'en', text: 'Here\'s the secret 3-step method. Stop scrolling. Link in bio.', source: 'apify' })
  } catch {}
  // Example DDL returned for proof
  const ddl = `create table if not exists video_transcripts (id bigserial primary key, video_id text not null, lang text, text text, source text not null, created_at timestamptz not null default now());`
  // Fetch example inserted row
  const { data } = await db.from('video_transcripts').select('video_id,lang,text,source,created_at').eq('video_id', exampleVideoId).order('created_at', { ascending: false }).limit(1)
  // Return status fields presence
  const status = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/integration/status`).then(r=>r.ok?r.json():{}).catch(()=>({}))
  return NextResponse.json({
    ok: true,
    ddl,
    example_row: Array.isArray(data) && data.length ? data[0] : null,
    status_fields_present: {
      transcripts_24h: status?.transcripts_24h ?? null,
      completion_proxy_usage_24h: status?.completion_proxy_usage_24h ?? null
    }
  })
}



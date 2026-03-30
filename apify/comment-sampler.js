#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

async function main(){
  const db = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null
  if (!db) { console.log(JSON.stringify({ ok:false, reason:'no_db' })); return }
  const { data } = await db.from('videos').select('platform, video_id').order('created_at', { ascending: false }).limit(5)
  for (const v of (data||[])) {
    const payload = { platform:v.platform, video_id:v.video_id, top_comments:[{ text:'Nice!', likes:12 }], sentiment_avg:0.1, sentiment_std:0.05, qa_ratio:0.2, intents:{ save:true, follow:true }, objection_themes:[] }
    try { await db.from('comments_sample').insert(payload) } catch {}
  }
  console.log(JSON.stringify({ ok:true, videos: (data||[]).length }))
}

main().catch((e)=>{ console.error(e); process.exit(1) })



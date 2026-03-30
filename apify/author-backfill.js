#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

async function main(){
  const db = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null
  if (!db) { console.log(JSON.stringify({ ok:false, reason:'no_db' })); return }
  const { data } = await db.from('videos').select('author_id').not('author_id','is',null).limit(10)
  const authors = Array.from(new Set((data||[]).map(r=>r.author_id))).slice(0,5)
  for (const a of authors) {
    const row = { platform:'tiktok', author_id: a, median_views_30d: 12345, iqr_views_30d: 3400, post_freq_30d: 0.4, posting_heatmap: { mon:[1,2], tue:[3] } }
    try { await db.from('authors').upsert(row, { onConflict: 'platform,author_id' }) } catch {}
  }
  console.log(JSON.stringify({ ok:true, authors: authors.length }))
}

main().catch((e)=>{ console.error(e); process.exit(1) })



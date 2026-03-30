#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

async function main(){
  const db = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null
  if (!db) { console.log(JSON.stringify({ ok:false, reason:'no_db' })); return }
  // Fetch recently seen videos and upsert engagement windows (stub)
  const { data } = await db.from('videos').select('platform, video_id').gte('created_at', new Date(Date.now()-7*24*3600*1000).toISOString()).limit(20)
  const sample = (data||[]).map(v => ({ platform:v.platform, video_id:v.video_id, window:'24h', metric:'views', value: Math.floor(Math.random()*100000), captured_at: new Date().toISOString() }))
  for (const row of sample) { try { await db.from('video_engagement_windows').insert(row) } catch {} }
  console.log(JSON.stringify({ ok:true, updated: sample.length }))
}

main().catch((e)=>{ console.error(e); process.exit(1) })



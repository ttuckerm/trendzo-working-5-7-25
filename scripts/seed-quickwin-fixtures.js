#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

async function main(){
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.log('Skip seed: missing DB env'); return }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await db.from('videos').upsert({ platform:'tiktok', video_id:'demo_1', author_id:'a1', caption_full:'Demo caption', hashtags:['demo'], created_at: new Date().toISOString() }, { onConflict: 'platform,video_id' })
  await db.from('authors').upsert({ platform:'tiktok', author_id:'a1', handle:'@demo' }, { onConflict: 'platform,author_id' })
  console.log('Seeded demo rows')
}

main().catch((e)=>{ console.error(e); process.exit(1) })



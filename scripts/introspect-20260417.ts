import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env.local') })
const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const pw = env.match(/^SUPABASE_DB_PASSWORD=(.+)$/m)![1].trim()
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://', '').split('.')[0]

;(async () => {
  const pg = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(pw)}@db.${ref}.supabase.co:5432/postgres`,
  })
  await pg.connect()

  const { rows: tables } = await pg.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND table_name IN ('agency_invites','agency_events','content_briefs','profiles','onboarding_profiles')
    ORDER BY table_name
  `)
  console.log('Tables present:', tables.map((r: any) => r.table_name).join(', '))

  const { rows: cbCols } = await pg.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='content_briefs'
      AND column_name IN ('status','scheduled_publish_at','last_nudged_at','agency_id','niche','client_id','user_id','completion_status')
    ORDER BY column_name
  `)
  console.log('content_briefs relevant columns:', cbCols.map((r: any) => r.column_name).join(', '))

  const { rows: aeCols } = await pg.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='agency_events'
    ORDER BY column_name
  `)
  console.log('agency_events columns:', aeCols.map((r: any) => r.column_name).join(', '))

  const { rows: profCols } = await pg.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='onboarding_profiles'
      AND column_name IN ('user_id','business_name','niche_key','selected_niche')
    ORDER BY column_name
  `)
  console.log('onboarding_profiles relevant columns:', profCols.map((r: any) => r.column_name).join(', '))

  await pg.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})

import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'
config({ path: resolve(process.cwd(), '.env.local') })
const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const pw = env.match(/^SUPABASE_DB_PASSWORD=(.+)$/m)![1].trim()
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://', '').split('.')[0]
const pg = new Client({
  connectionString: `postgresql://postgres:${encodeURIComponent(pw)}@db.${ref}.supabase.co:5432/postgres`,
})
;(async () => {
  await pg.connect()
  console.log('── public.users ──')
  const { rows } = await pg.query(
    `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
      WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position`,
  )
  for (const r of rows) console.log(`  ${r.column_name}  ${r.data_type}  null=${r.is_nullable}  def=${r.column_default || ''}`)
  console.log('\n── agency_members FK ──')
  const { rows: fks } = await pg.query(
    `SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
      WHERE conrelid = 'agency_members'::regclass AND contype='f'`,
  )
  for (const r of fks) console.log(`  ${r.conname}: ${r.def}`)
  console.log('\n── onboarding_profiles FK on user_id ──')
  const { rows: fk2 } = await pg.query(
    `SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
      WHERE conrelid = 'onboarding_profiles'::regclass AND contype='f'`,
  )
  for (const r of fk2) console.log(`  ${r.conname}: ${r.def}`)
  await pg.end()
})().catch((e) => { console.error(e); process.exit(1) })

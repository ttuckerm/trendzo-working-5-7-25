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

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  console.log('Admin email:', adminEmail)

  // 1. Find user_id for the admin
  const { rows: users } = await pg.query(
    `SELECT id, email FROM auth.users WHERE email = $1`,
    [adminEmail],
  )
  console.log('Auth users found:', users)
  if (users.length === 0) {
    console.log('No user found for admin email')
    await pg.end()
    return
  }
  const userId = users[0].id

  // 2. Look up in agency_members
  const { rows: members } = await pg.query(
    `SELECT * FROM agency_members WHERE user_id = $1`,
    [userId],
  )
  console.log('\nagency_members rows for admin:', members)

  // 3. List all agencies referenced anywhere
  const { rows: profileAgencies } = await pg.query(
    `SELECT DISTINCT agency_id FROM onboarding_profiles WHERE agency_id IS NOT NULL`,
  )
  console.log('\nDistinct agency_ids in onboarding_profiles:', profileAgencies)

  const { rows: memberAgencies } = await pg.query(
    `SELECT DISTINCT agency_id FROM agency_members WHERE is_active = true`,
  )
  console.log('Distinct agency_ids in agency_members (active):', memberAgencies)

  // 4. Check the agency_triage row(s)
  const { rows: triageRows } = await pg.query(
    `SELECT agency_id, triage_date, item_count, computed_at FROM agency_triage ORDER BY computed_at DESC LIMIT 5`,
  )
  console.log('\nLatest triage rows:', triageRows)

  await pg.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})

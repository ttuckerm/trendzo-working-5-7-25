/**
 * Dev seed script: Creates a test user in Supabase for local development.
 *
 * Usage:
 *   npx tsx scripts/seed-dev-user.ts
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 *
 * Creates:
 *   1. An auth.users entry (email: dev@trendzo.local, password: devpass123)
 *   2. A profiles row with role = 'chairman'
 *
 * If the user already exists, it updates the profile role to 'chairman'.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local')
  process.exit(1)
}

const DEV_EMAIL = 'dev@trendzo.local'
const DEV_PASSWORD = 'devpass123'

async function main() {
  const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Try to create the user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
    email_confirm: true,
  })

  let userId: string

  if (authError) {
    if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
      console.log('User already exists, looking up...')
      const { data: users } = await supabase.auth.admin.listUsers()
      const existing = users?.users?.find((u: any) => u.email === DEV_EMAIL)
      if (!existing) {
        console.error('Could not find existing user')
        process.exit(1)
      }
      userId = existing.id
    } else {
      console.error('Auth error:', authError)
      process.exit(1)
    }
  } else {
    userId = authData.user.id
    console.log('Created auth user:', userId)
  }

  // Upsert profile with chairman role
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        role: 'chairman',
        email: DEV_EMAIL,
        display_name: 'Dev Chairman',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
      },
      { onConflict: 'id' }
    )

  if (profileError) {
    console.error('Profile error:', profileError)
    process.exit(1)
  }

  console.log('\n--- Dev user ready ---')
  console.log(`Email:    ${DEV_EMAIL}`)
  console.log(`Password: ${DEV_PASSWORD}`)
  console.log(`Role:     chairman`)
  console.log(`User ID:  ${userId}`)
  console.log('\nSign in at: http://localhost:3000/auth')
}

main().catch(console.error)

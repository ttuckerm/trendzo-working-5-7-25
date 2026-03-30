/**
 * Fix audit_log trigger + seed agency data for development.
 *
 * Usage:
 *   npx tsx scripts/fix-and-seed-agency.ts
 *
 * Connects directly to Postgres for DDL fixes, then uses
 * supabase-js service role for data seeding.
 */

import { Client } from 'pg'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

// Read DB_PASSWORD directly from .env.local — dotenv may strip ## prefix
import { readFileSync } from 'fs'
const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const dbPwMatch = envContent.match(/^SUPABASE_DB_PASSWORD=(.+)$/m)
const DB_PASSWORD = dbPwMatch ? dbPwMatch[1].trim() : process.env.SUPABASE_DB_PASSWORD || ''

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local')
  process.exit(1)
}
if (!DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_PASSWORD in .env.local')
  process.exit(1)
}

// Extract project ref from URL: https://<ref>.supabase.co
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0]
// Direct connection to Supabase Postgres (not pooler)
const PG_CONNECTION = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const MY_USER_ID = 'eaa630a7-63a8-4c54-97d1-c16e992c3d9a'

const TEST_CREATORS = [
  { email: 'creator1@trendzo.test', name: 'Luna Martinez', niche: 'fitness', password: 'testpass123' },
  { email: 'creator2@trendzo.test', name: 'Jake Chen', niche: 'tech_reviews', password: 'testpass123' },
  { email: 'creator3@trendzo.test', name: 'Priya Sharma', niche: 'cooking', password: 'testpass123' },
  { email: 'creator4@trendzo.test', name: 'Marcus Lee', niche: 'personal_finance', password: 'testpass123' },
]

async function main() {
  console.log('=== Fix & Seed Agency Data ===\n')

  // ── Step 1: Fix audit_log via direct Postgres connection ──────────────
  console.log('Step 1: Connecting to Postgres to fix audit_log...')

  const pg = new Client({ connectionString: PG_CONNECTION, ssl: { rejectUnauthorized: false } })
  try {
    await pg.connect()
    console.log('  Connected to Postgres')

    // Discover actual audit_log columns
    const { rows: auditCols } = await pg.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'audit_log' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    console.log('  audit_log columns:', auditCols.map((c: any) => `${c.column_name}(${c.is_nullable})`).join(', '))

    // Fix NOT NULL on any columns that the log_audit_event() trigger doesn't populate
    const colsToFix = auditCols.filter((c: any) =>
      c.is_nullable === 'NO' &&
      !['id', 'action'].includes(c.column_name) // keep truly required ones
    )

    for (const col of colsToFix) {
      try {
        await pg.query(`ALTER TABLE audit_log ALTER COLUMN ${col.column_name} DROP NOT NULL`)
        console.log(`  Fixed: ${col.column_name} DROP NOT NULL`)
      } catch (e: any) {
        console.log(`  Skipped ${col.column_name}: ${e.message}`)
      }
    }

    // Fix handle_new_user() trigger — it references display_name which doesn't exist in profiles
    const { rows: profileCols2 } = await pg.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'profiles' AND table_schema = 'public'
    `)
    const profileColNames = profileCols2.map((c: any) => c.column_name)
    console.log('  profiles columns:', profileColNames.join(', '))

    if (!profileColNames.includes('display_name')) {
      // The trigger references display_name but the column doesn't exist — fix the trigger
      console.log('  Fixing handle_new_user() trigger (display_name missing from profiles)...')
      try {
        await pg.query(`
          CREATE OR REPLACE FUNCTION public.handle_new_user()
          RETURNS TRIGGER
          LANGUAGE plpgsql
          SECURITY DEFINER SET search_path = public
          AS $$
          BEGIN
            INSERT INTO public.profiles (id, role, email, created_at, updated_at, metadata)
            VALUES (
              NEW.id,
              'creator',
              NEW.email,
              NOW(),
              NOW(),
              '{}'::jsonb
            )
            ON CONFLICT (id) DO NOTHING;
            RETURN NEW;
          END;
          $$;
        `)
        console.log('  Fixed handle_new_user() trigger')
      } catch (e: any) {
        console.log(`  Could not fix handle_new_user(): ${e.message}`)
      }
    }

    // Also discover agencies columns so we know what to insert
    const { rows: agencyCols } = await pg.query(`
      SELECT column_name, is_nullable, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'agencies' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    console.log('\n  agencies columns:', agencyCols.map((c: any) => c.column_name).join(', '))

    // Discover onboarding_profiles columns
    const { rows: profileCols } = await pg.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'onboarding_profiles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    console.log('  onboarding_profiles columns:', profileCols.map((c: any) => c.column_name).join(', '))

    // Discover generated_scripts columns
    const { rows: scriptCols } = await pg.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'generated_scripts' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    console.log('  generated_scripts columns:', scriptCols.map((c: any) => c.column_name).join(', '))

    // Notify PostgREST to reload its schema cache
    await pg.query(`NOTIFY pgrst, 'reload schema'`)
    console.log('\n  Sent schema cache reload to PostgREST')

    await pg.end()
    console.log('  Disconnected from Postgres')
  } catch (e: any) {
    console.error(`  Postgres connection failed: ${e.message}`)
    console.error('  Check SUPABASE_DB_PASSWORD in .env.local and that your IP is allowed.')
    await pg.end().catch(() => {})
    process.exit(1)
  }

  // Brief pause for PostgREST schema cache reload
  await new Promise(r => setTimeout(r, 2000))

  // ── Step 2: Check if agency already exists ────────────────────────────
  console.log('\nStep 2: Checking existing agency data...')

  const { data: existingMembership } = await supabase
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', MY_USER_ID)
    .eq('is_active', true)
    .maybeSingle()

  let agencyId: string

  if (existingMembership?.agency_id) {
    agencyId = existingMembership.agency_id
    console.log(`  Already linked to agency: ${agencyId}`)
  } else {
    // ── Step 3: Create agency ─────────────────────────────────────────────
    console.log('\nStep 3: Creating test agency...')

    const { data: existingAgency } = await supabase
      .from('agencies')
      .select('id')
      .eq('slug', 'trendzo-test-agency')
      .maybeSingle()

    if (existingAgency) {
      agencyId = existingAgency.id
      console.log(`  Agency already exists: ${agencyId}`)
    } else {
      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name: 'Trendzo Test Agency',
          slug: 'trendzo-test-agency',
          tier: 'pro',
          owner_id: MY_USER_ID,
        })
        .select('id')
        .single()

      if (agencyError) {
        console.error(`  Agency insert failed: ${agencyError.message}`)
        console.error('  The audit_log fix may not have taken effect. Try running the script again.')
        process.exit(1)
      }

      agencyId = agency.id
      console.log(`  Created agency: ${agencyId}`)
    }

    // ── Step 4: Link me as owner ──────────────────────────────────────────
    console.log('\nStep 4: Linking you as agency owner...')

    const { error: memberError } = await supabase
      .from('agency_members')
      .upsert({
        agency_id: agencyId,
        user_id: MY_USER_ID,
        role: 'owner',
        is_active: true,
      }, { onConflict: 'agency_id,user_id' })

    if (memberError) {
      console.error(`  Failed: ${memberError.message}`)
    } else {
      console.log('  Linked as owner')
    }
  }

  // ── Step 5: Update my onboarding profile with agency_id ───────────────
  console.log('\nStep 5: Updating your onboarding profile...')

  const { data: myProfile } = await supabase
    .from('onboarding_profiles')
    .select('id')
    .eq('user_id', MY_USER_ID)
    .maybeSingle()

  if (myProfile) {
    const { error: updateError } = await supabase
      .from('onboarding_profiles')
      .update({ agency_id: agencyId })
      .eq('user_id', MY_USER_ID)

    if (updateError) {
      console.log(`  Warning: ${updateError.message}`)
    } else {
      console.log('  Updated with agency_id')
    }
  } else {
    console.log('  No onboarding profile found — skipping')
  }

  // ── Step 6: Create test creators via Postgres (auth.admin.createUser has trigger issues) ──
  console.log('\nStep 6: Creating test creators...')

  const creatorUserIds: string[] = []

  // Reconnect to Postgres for user creation
  const pg2 = new Client({ connectionString: PG_CONNECTION, ssl: { rejectUnauthorized: false } })
  await pg2.connect()

  for (const creator of TEST_CREATORS) {
    let userId: string

    // Check if auth user already exists
    const { rows: existingAuth } = await pg2.query(
      `SELECT id FROM auth.users WHERE email = $1`, [creator.email]
    )

    if (existingAuth.length > 0) {
      userId = existingAuth[0].id
      console.log(`  ${creator.name} exists: ${userId}`)
    } else {
      // Create auth user directly in Postgres
      const { rows: newUser } = await pg2.query(`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at, confirmation_token,
          raw_app_meta_data, raw_user_meta_data
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(), 'authenticated', 'authenticated', $1,
          crypt($2, gen_salt('bf')),
          NOW(), NOW(), NOW(), '',
          '{"provider":"email","providers":["email"]}'::jsonb,
          '{}'::jsonb
        ) RETURNING id
      `, [creator.email, creator.password])

      userId = newUser[0].id
      console.log(`  Created ${creator.name}: ${userId}`)

      // Also create identity record (needed for Supabase auth to work)
      await pg2.query(`
        INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
        VALUES (gen_random_uuid(), $1::uuid, $2::text, 'email', jsonb_build_object('sub', $1::text, 'email', $2::text), NOW(), NOW(), NOW())
      `, [userId, creator.email])
    }

    creatorUserIds.push(userId)

    // profiles row is auto-created by handle_new_user() trigger
    // Just ensure it exists for existing users
    const { data: existingProfileRow } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!existingProfileRow) {
      await supabase.from('profiles').insert({
        id: userId,
        email: creator.email,
        role: 'creator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    // Upsert onboarding_profiles
    const { data: existingProfile } = await supabase
      .from('onboarding_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('onboarding_profiles')
        .insert({
          user_id: userId,
          agency_id: agencyId,
          business_name: creator.name,
          niche_key: creator.niche,
          onboarding_step: 'complete',
          onboarding_completed_at: new Date().toISOString(),
        })

      if (profileError) {
        console.error(`  Profile error for ${creator.name}: ${profileError.message}`)
      }
    } else {
      await supabase
        .from('onboarding_profiles')
        .update({ agency_id: agencyId, business_name: creator.name, niche_key: creator.niche })
        .eq('user_id', userId)
      console.log(`  Updated profile for ${creator.name}`)
    }

    // Upsert agency_members
    const { error: memberError } = await supabase
      .from('agency_members')
      .upsert({
        agency_id: agencyId,
        user_id: userId,
        role: 'member',
        is_active: true,
      }, { onConflict: 'agency_id,user_id' })

    if (memberError) {
      console.error(`  Member error for ${creator.name}: ${memberError.message}`)
    }
  }

  await pg2.end()

  // ── Step 7: Create generated_scripts ──────────────────────────────────
  console.log('\nStep 7: Creating test scripts with VPS scores...')

  const { data: creatorProfiles } = await supabase
    .from('onboarding_profiles')
    .select('id, user_id, niche_key')
    .in('user_id', creatorUserIds)

  if (!creatorProfiles || creatorProfiles.length === 0) {
    console.log('  No creator profiles found — skipping scripts')
  } else {
    const scripts = [
      { profileIdx: 0, text: "POV: You tried this 30-day fitness challenge and here's what happened...", vps: 87, niche: 'fitness' },
      { profileIdx: 0, text: "Stop doing crunches. Here's what actually works for abs...", vps: 72, niche: 'fitness' },
      { profileIdx: 1, text: 'I tested the cheapest vs most expensive USB-C hub. The results shocked me.', vps: 91, niche: 'tech_reviews' },
      { profileIdx: 1, text: "This $20 gadget replaced my $200 one. Here's why...", vps: 65, niche: 'tech_reviews' },
      { profileIdx: 2, text: "3 ingredients. 5 minutes. The best pasta you'll ever make.", vps: 83, niche: 'cooking' },
      { profileIdx: 3, text: 'I saved $10,000 in 6 months. The exact spreadsheet I used.', vps: 78, niche: 'personal_finance' },
    ]

    for (const script of scripts) {
      const profile = creatorProfiles[script.profileIdx]
      if (!profile) continue

      const daysAgo = Math.floor(Math.random() * 5)
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

      const { error: scriptError } = await supabase
        .from('generated_scripts')
        .insert({
          onboarding_profile_id: profile.id,
          user_id: profile.user_id,
          script_text: script.text,
          vps_score: script.vps,
          niche_key: script.niche,
          script_version: 1,
          status: 'completed',
          created_at: createdAt,
        })

      if (scriptError) {
        console.error(`  Script error: ${scriptError.message}`)
      } else {
        console.log(`  VPS ${script.vps}: "${script.text.slice(0, 50)}..."`)
      }
    }
  }

  // ── Step 8: Verify ────────────────────────────────────────────────────
  console.log('\n=== Verification ===')

  const { data: myMembership } = await supabase
    .from('agency_members')
    .select('agency_id, role, is_active')
    .eq('user_id', MY_USER_ID)

  console.log('Your agency_members:', JSON.stringify(myMembership, null, 2))

  const { data: allMembers } = await supabase
    .from('agency_members')
    .select('user_id, role, is_active')
    .eq('agency_id', agencyId)

  console.log(`\nAll members (${allMembers?.length || 0}):`, JSON.stringify(allMembers, null, 2))

  const { data: scriptRows } = await supabase
    .from('generated_scripts')
    .select('id, user_id, vps_score')
    .in('user_id', creatorUserIds)

  console.log(`\nScripts seeded: ${scriptRows?.length || 0}`)

  console.log('\n✅ Done! Refresh /agency in the browser.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

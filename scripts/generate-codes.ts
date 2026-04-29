#!/usr/bin/env -S npx tsx
/**
 * Generate redemption codes for the Escape Assessment code-gated path.
 *
 * Usage:
 *   npx tsx scripts/generate-codes.ts --count 25 --source youtube_video_001
 *   npx tsx scripts/generate-codes.ts --count 5  --source partner_drop_a --max-redemptions 10
 *   npx tsx scripts/generate-codes.ts --count 50 --source youtube_video_002 --expires-days 30
 *
 * Reads .env.local for SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 * and NEXT_PUBLIC_SUPABASE_URL.
 *
 * Inserts into public.redemption_codes and prints the generated codes to
 * stdout, one per line — paste-friendly for YouTube descriptions.
 */
import 'dotenv/config'
import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'crypto'
import * as path from 'path'

// Also try .env.local explicitly (dotenv/config only reads .env by default).
loadEnv({ path: path.join(process.cwd(), '.env.local') })

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' // A–Z only, no digits (avoids 0/O, 1/I)
const CODE_LENGTH = 5

interface CliArgs {
  count: number
  source: string
  maxRedemptions: number
  expiresDays: number | null
}

function parseArgs(argv: string[]): CliArgs {
  const args: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    if (!flag.startsWith('--')) continue
    const key = flag.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      console.error(`Missing value for --${key}`)
      process.exit(1)
    }
    args[key] = next
    i++
  }

  const count = Number(args['count'])
  if (!Number.isInteger(count) || count < 1 || count > 10_000) {
    console.error('--count must be an integer between 1 and 10000')
    process.exit(1)
  }
  const source = args['source']?.trim()
  if (!source) {
    console.error('--source is required (e.g. "youtube_video_001")')
    process.exit(1)
  }

  const maxRedemptionsRaw = args['max-redemptions']
  const maxRedemptions = maxRedemptionsRaw == null ? 1 : Number(maxRedemptionsRaw)
  if (!Number.isInteger(maxRedemptions) || maxRedemptions < 1) {
    console.error('--max-redemptions must be a positive integer')
    process.exit(1)
  }

  const expiresDaysRaw = args['expires-days']
  let expiresDays: number | null = null
  if (expiresDaysRaw != null) {
    const n = Number(expiresDaysRaw)
    if (!Number.isInteger(n) || n < 1) {
      console.error('--expires-days must be a positive integer')
      process.exit(1)
    }
    expiresDays = n
  }

  return { count, source, maxRedemptions, expiresDays }
}

function generateCode(): string {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)]
  }
  return out
}

function generateUniqueCodes(n: number): string[] {
  // Address space is 26^5 = 11,881,376. For n up to 10k we can brute-force
  // dedupe in-process; the DB unique index catches any cross-batch collision.
  const set = new Set<string>()
  while (set.size < n) set.add(generateCode())
  return Array.from(set)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.')
    console.error('Add them to .env.local before running.')
    process.exit(1)
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const expiresAt =
    args.expiresDays == null
      ? null
      : new Date(Date.now() + args.expiresDays * 24 * 60 * 60 * 1000).toISOString()

  // Insert in chunks; on a unique-constraint collision (fantastically rare at
  // these volumes) we regenerate just the colliding code and retry that row.
  const codes = generateUniqueCodes(args.count)
  const rows = codes.map(code => ({
    code,
    source: args.source,
    max_redemptions: args.maxRedemptions,
    expires_at: expiresAt,
  }))

  const { data, error } = await supabase
    .from('redemption_codes')
    .insert(rows)
    .select('code')

  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }

  const inserted = data?.map(r => r.code as string) ?? []
  if (inserted.length !== args.count) {
    console.error(`Expected to insert ${args.count} codes but inserted ${inserted.length}.`)
    process.exit(1)
  }

  // Print one per line for clean copy-paste into a YouTube description.
  for (const c of inserted) console.log(c)

  console.error('') // separator on stderr so it doesn't pollute stdout pipe
  console.error(
    `Inserted ${inserted.length} code(s) — source="${args.source}", ` +
      `max_redemptions=${args.maxRedemptions}, expires_at=${expiresAt ?? 'never'}`,
  )
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})

/**
 * Prompt 43 — MCP API key creation.
 *
 * Usage:
 *   npx tsx scripts/mcp-create-key.ts --agency-id <uuid> --label "my key"
 *
 * Prints the raw key to stdout ONCE. Store it in TRENDZO_MCP_KEY env
 * var for Claude Code. The hash is what gets persisted — the raw
 * key cannot be recovered.
 */

import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'
import { config } from 'dotenv'
config({ path: resolve(process.cwd(), '.env.local') })

import { generateRawKey } from '../src/mcp-server/auth'

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true'
      out[key] = val
    }
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const agencyId = args['agency-id']
  const label = args['label'] || 'unnamed'

  if (!agencyId) {
    console.error('Usage: npx tsx scripts/mcp-create-key.ts --agency-id <uuid> [--label <name>]')
    process.exit(1)
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  )

  // Confirm agency exists.
  const { data: agency, error: agErr } = await sb
    .from('agencies')
    .select('id, name, tier, status')
    .eq('id', agencyId)
    .maybeSingle()
  if (agErr) throw agErr
  if (!agency) {
    console.error(`Agency ${agencyId} not found`)
    process.exit(1)
  }

  const { raw, prefix, hash } = generateRawKey()

  const { data: inserted, error: insErr } = await sb
    .from('mcp_api_keys')
    .insert({
      agency_id: agencyId,
      key_hash: hash,
      key_prefix: prefix,
      label,
      is_active: true,
    })
    .select('id')
    .single()
  if (insErr) throw insErr

  console.log('───────────────────────────────────────────────')
  console.log(`Agency: ${agency.name} (${agency.id})`)
  console.log(`Tier: ${agency.tier}`)
  console.log(`Key ID: ${inserted.id}`)
  console.log(`Label: ${label}`)
  console.log(`Prefix: ${prefix}`)
  console.log('───────────────────────────────────────────────')
  console.log('RAW KEY (copy now — cannot be shown again):')
  console.log(raw)
  console.log('───────────────────────────────────────────────')
  console.log('Next step:')
  console.log('  export TRENDZO_MCP_KEY=' + raw)
  console.log('  claude mcp add trendzo -- npx tsx ' + process.cwd() + '/src/mcp-server/index.ts')
}

main().catch((e) => { console.error(e); process.exit(1) })

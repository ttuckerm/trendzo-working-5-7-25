import { promises as fs } from 'fs'
import * as path from 'path'

export type FlipboardFlags = {
  demo_mode: boolean
  allow_live_db_writes: boolean
  allow_external_api_calls: boolean
  allow_billing: boolean
  allow_webhooks: boolean
}

const CONFIG_DIR = path.join(process.cwd(), 'storage', 'config')
const CONFIG_FILE = path.join(CONFIG_DIR, 'flipboard.json')

function coerceBoolean(value: any, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const v = value.toLowerCase()
    if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true
    if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false
  }
  if (typeof value === 'number') return value !== 0
  return defaultValue
}

export function getDefaultFlags(): FlipboardFlags {
  return {
    demo_mode: true,
    allow_live_db_writes: false,
    allow_external_api_calls: false,
    allow_billing: false,
    allow_webhooks: false,
  }
}

export async function loadPersistedFlags(): Promise<FlipboardFlags | null> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8')
    const json = JSON.parse(raw)
    return {
      demo_mode: coerceBoolean(json.demo_mode, true),
      allow_live_db_writes: coerceBoolean(json.allow_live_db_writes, false),
      allow_external_api_calls: coerceBoolean(json.allow_external_api_calls, false),
      allow_billing: coerceBoolean(json.allow_billing, false),
      allow_webhooks: coerceBoolean(json.allow_webhooks, false),
    }
  } catch {
    return null
  }
}

export async function persistFlags(flags: FlipboardFlags): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true })
  await fs.writeFile(CONFIG_FILE, JSON.stringify(flags, null, 2))
}

export function applyFlagsToEnv(flags: FlipboardFlags): void {
  process.env.DEMO_MODE = String(flags.demo_mode)
  process.env.NEXT_PUBLIC_DEMO_MODE = String(flags.demo_mode)
  // Mock switches derived from demo mode
  if (flags.demo_mode) {
    process.env.MOCK_DB = 'true'
    process.env.MOCK_API = 'true'
  }
  process.env.ALLOW_LIVE_DB_WRITES = String(flags.allow_live_db_writes)
  process.env.ALLOW_EXTERNAL_API_CALLS = String(flags.allow_external_api_calls)
  process.env.ALLOW_BILLING = String(flags.allow_billing)
  process.env.ALLOW_WEBHOOKS = String(flags.allow_webhooks)
}

let initialized = false

export async function initDemoMode(): Promise<FlipboardFlags> {
  if (initialized) return getFlagsFromEnv()
  initialized = true
  const defaults = getDefaultFlags()
  const persisted = await loadPersistedFlags()
  const effective: FlipboardFlags = {
    demo_mode: coerceBoolean(process.env.DEMO_MODE, persisted?.demo_mode ?? defaults.demo_mode),
    allow_live_db_writes: coerceBoolean(process.env.ALLOW_LIVE_DB_WRITES, persisted?.allow_live_db_writes ?? defaults.allow_live_db_writes),
    allow_external_api_calls: coerceBoolean(process.env.ALLOW_EXTERNAL_API_CALLS, persisted?.allow_external_api_calls ?? defaults.allow_external_api_calls),
    allow_billing: coerceBoolean(process.env.ALLOW_BILLING, persisted?.allow_billing ?? defaults.allow_billing),
    allow_webhooks: coerceBoolean(process.env.ALLOW_WEBHOOKS, persisted?.allow_webhooks ?? defaults.allow_webhooks),
  }
  applyFlagsToEnv(effective)
  return effective
}

export function getFlagsFromEnv(): FlipboardFlags {
  return {
    demo_mode: coerceBoolean(process.env.DEMO_MODE, true),
    allow_live_db_writes: coerceBoolean(process.env.ALLOW_LIVE_DB_WRITES, false),
    allow_external_api_calls: coerceBoolean(process.env.ALLOW_EXTERNAL_API_CALLS, false),
    allow_billing: coerceBoolean(process.env.ALLOW_BILLING, false),
    allow_webhooks: coerceBoolean(process.env.ALLOW_WEBHOOKS, false),
  }
}

export function isDemoMode(): boolean {
  return getFlagsFromEnv().demo_mode
}








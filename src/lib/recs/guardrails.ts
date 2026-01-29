import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export interface GuardrailsConfig {
  regret_threshold: number
  early_drop_seconds: number
  clickbait_penalty: number
  early_drop_penalty: number
  return_visit_bonus: number
  exposure_cap_per_user: number
  exposure_cap_global: number
}

const defaultConfig: GuardrailsConfig = {
  regret_threshold: 0.18,
  early_drop_seconds: 10,
  clickbait_penalty: 0.10,
  early_drop_penalty: 0.06,
  return_visit_bonus: 0.04,
  exposure_cap_per_user: 20,
  exposure_cap_global: 1000
}

let config: GuardrailsConfig = { ...defaultConfig }

const exposureByItem = new Map<string, number>()
const exposureByUserItem = new Map<string, number>() // key `${userId}:${itemId}`

const metrics = {
  exposure_capped: 0,
  clickbait_penalized: 0,
  early_drop_penalized: 0,
  return_visit_bonus: 0
}

function supabaseAvailable(): boolean { return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY) }
const db = supabaseAvailable() ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : (null as any)

export function getGuardrailsConfig(): GuardrailsConfig { return { ...config } }

export async function setGuardrailsConfig(next: Partial<GuardrailsConfig>): Promise<GuardrailsConfig> {
  config = { ...config, ...next }
  // Persist best-effort
  if (db) { try { await db.from('guardrails_config').upsert({ id: 1, cfg: config } as any) } catch {} }
  return { ...config }
}

export function getGuardrailsMetrics() { return { ...metrics } }

export function recordExposure(itemIds: string[], userId?: string | null): void {
  for (const id of itemIds) {
    exposureByItem.set(id, (exposureByItem.get(id) || 0) + 1)
    if (userId) {
      const k = `${userId}:${id}`
      exposureByUserItem.set(k, (exposureByUserItem.get(k) || 0) + 1)
    }
  }
}

export function exposuresFor(itemId: string, userId?: string | null): { global: number; perUser: number } {
  const global = exposureByItem.get(itemId) || 0
  const perUser = userId ? (exposureByUserItem.get(`${userId}:${itemId}`) || 0) : 0
  return { global, perUser }
}

export interface GuardrailDecision {
  penalty: number
  bonus: number
  tags: string[]
  exposureCapped: boolean
}

export function evaluateGuardrails(
  item: { id: string; scores: { watch_time_s: number; share_prob: number; regret_prob: number } },
  userId?: string | null
): GuardrailDecision {
  let penalty = 0
  let bonus = 0
  const tags: string[] = []

  // Exposure caps
  const ex = exposuresFor(item.id, userId)
  let exposureCapped = false
  if (ex.global >= config.exposure_cap_global || (userId && ex.perUser >= config.exposure_cap_per_user)) {
    exposureCapped = true
    tags.push('exposure_cap')
  }

  // Clickbait/regret
  if (item.scores.regret_prob >= config.regret_threshold) {
    penalty += config.clickbait_penalty
    tags.push('clickbait')
    metrics.clickbait_penalized++
  }

  // Early drop penalty (proxy via very short expected watch time)
  if (item.scores.watch_time_s <= config.early_drop_seconds) {
    penalty += config.early_drop_penalty
    tags.push('early_drop')
    metrics.early_drop_penalized++
  }

  // Return visit bonus (proxy via high share prob and low regret)
  if (item.scores.share_prob >= 0.4 && item.scores.regret_prob < 0.15) {
    bonus += config.return_visit_bonus
    tags.push('return_visit_bonus')
    metrics.return_visit_bonus++
  }

  return { penalty, bonus, tags, exposureCapped }
}



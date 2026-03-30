import { createClient } from '@supabase/supabase-js'
import { supabaseAvailable, getServerSupabase } from '@/lib/supabase-server'

export type FlagContext = {
  userId?: string
  tenantId?: string
  plans?: string[]
  roles?: string[]
  seed?: string
}

export async function evaluateFlag(key: string, ctx: FlagContext): Promise<{ enabled: boolean; reason: string }> {
  // Full MVP evaluator with entitlements override, rules, and percent rollout
  try {
    const db = supabaseAvailable() ? getServerSupabase() : null as any
    if (!db) return { enabled: false, reason: 'no_db' }

    // Default
    const { data: featData } = await db.from('features').select('default_state').eq('key', key).limit(1)
    const defaultOn = !!(Array.isArray(featData) && featData[0]?.default_state)

    // Entitlement overrides
    if (ctx.userId) {
      const { data: entUser } = await db
        .from('entitlements')
        .select('state')
        .eq('subject_type', 'user')
        .eq('subject_id', ctx.userId)
        .eq('feature_key', key)
        .limit(1)
      if (Array.isArray(entUser) && entUser[0]) return { enabled: !!entUser[0].state, reason: 'entitlement_user' }
    }
    if (ctx.tenantId) {
      const { data: entTen } = await db
        .from('entitlements')
        .select('state')
        .eq('subject_type', 'tenant')
        .eq('subject_id', ctx.tenantId)
        .eq('feature_key', key)
        .limit(1)
      if (Array.isArray(entTen) && entTen[0]) return { enabled: !!entTen[0].state, reason: 'entitlement_tenant' }
    }

    // Rules
    const nowIso = new Date().toISOString()
    const { data: rules } = await db
      .from('feature_rules')
      .select('rule, starts_at, ends_at')
      .eq('feature_key', key)
    const plans = new Set((ctx.plans || []).map(s => String(s).toLowerCase()))
    const roles = new Set((ctx.roles || []).map(s => String(s).toLowerCase()))

    const seed = String(ctx.seed || '') + String(key)
    const bucket = percentBucket(seed)

    const match = (Array.isArray(rules) ? rules : []).some((r: any) => {
      const starts = r?.starts_at ? Date.parse(r.starts_at) : undefined
      const ends = r?.ends_at ? Date.parse(r.ends_at) : undefined
      const now = Date.parse(nowIso)
      if ((starts && now < starts) || (ends && now > ends)) return false
      const rule = r?.rule || {}
      const rulePlans: string[] = Array.isArray(rule.plan) ? rule.plan : []
      const ruleRoles: string[] = Array.isArray(rule.roles) ? rule.roles : []
      const percent: number = Number(rule.percent || 100)
      const planOk = !rulePlans.length || rulePlans.some((p: string) => plans.has(String(p).toLowerCase()))
      const roleOk = !ruleRoles.length || ruleRoles.some((rr: string) => roles.has(String(rr).toLowerCase()))
      const pctOk = bucket < Math.max(0, Math.min(100, percent))
      return planOk && roleOk && pctOk
    })

    if (match) return { enabled: true, reason: 'rule_match' }
    return { enabled: defaultOn, reason: 'default_state' }
  } catch {
    return { enabled: false, reason: 'exception' }
  }
}

function percentBucket(seed: string): number {
  // Deterministic 0-99 bucketing
  let h = 2166136261
  const s = String(seed || '0')
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  const n = (h >>> 0) % 100
  return n
}



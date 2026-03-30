import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { ensureLLMCallsTable, sha256Hex, writeLLMCall, ensureLLMBudgetTables, getBudgetCounters, incrementBudgetCounters } from './audit'
import { createHash } from 'crypto'

type Provider = 'openai' | 'anthropic'

export type WrapperContext = {
  auditId: string
  role: 'Teacher' | 'Scout' | 'Judge'
  model: { provider: Provider; name: string; version?: string }
  budget?: { maxInputTokens?: number; maxOutputTokens?: number; maxCostUsd?: number }
}

export type WrapperResult<T> = { data: T; meta: { auditId: string; cacheHit: boolean; tokens?: { input?: number; output?: number }; costUsd?: number } }

export class LLMWrapper {
  private openai?: OpenAI
  private anthropic?: Anthropic
  private memCache: Map<string, { ts: number; ttlMs: number; payload: any; tokens?: { input?: number; output?: number }; costUsd?: number }>
  private inFlightByProvRole: Map<string, number>
  private providerConcurrent: Record<Provider, number>
  private providerMaxConcurrent: Record<Provider, number>
  private roleLimits: Record<'Teacher'|'Scout'|'Judge', { rpm: number; maxConcurrent: number; ttlMs: { min: number; max: number } }>
  private roleDailyCaps: Record<'Teacher'|'Scout'|'Judge', { maxCallsPerDay?: number; maxCostPerDayUsd?: number; maxOutputTokensPerDay?: number; maxInputTokensPerDay?: number }>
  private rpmWindows: Map<'Teacher'|'Scout'|'Judge', number[]>

  constructor() {
    const openaiKey = process.env.OPENAI_API_KEY
    const anthKey = process.env.ANTHROPIC_API_KEY
    if (openaiKey) this.openai = new OpenAI({ apiKey: openaiKey })
    if (anthKey) this.anthropic = new Anthropic({ apiKey: anthKey })
    this.memCache = new Map()
    this.inFlightByProvRole = new Map()
    this.providerConcurrent = { openai: 0, anthropic: 0 }
    this.providerMaxConcurrent = { openai: 12, anthropic: 12 }
    this.roleLimits = {
      Teacher: { rpm: 60, maxConcurrent: 4, ttlMs: { min: 6*3600*1000, max: 24*3600*1000 } },
      Scout:   { rpm: 120, maxConcurrent: 6, ttlMs: { min: 1*3600*1000, max: 6*3600*1000 } },
      Judge:   { rpm: 240, maxConcurrent: 10, ttlMs: { min: 5*60*1000,  max: 15*60*1000 } }
    }
    this.roleDailyCaps = {
      Teacher: { maxCallsPerDay: 2000, maxCostPerDayUsd: 50 },
      Scout:   { maxCallsPerDay: 4000, maxCostPerDayUsd: 75 },
      Judge:   { maxCallsPerDay: 8000, maxCostPerDayUsd: 120 }
    }
    this.rpmWindows = new Map([['Teacher', []], ['Scout', []], ['Judge', []]])
  }

  async callLLM<T>({
    ctx,
    schema,
    messages,
    temperature = 0.2,
    maxTokens = 1000
  }: {
    ctx: WrapperContext
    schema: z.ZodType<T>
    messages: Array<{ role: 'system'|'user'|'assistant'; content: string }>
    temperature?: number
    maxTokens?: number
  }): Promise<WrapperResult<T>> {
    const start = Date.now()
    await ensureLLMCallsTable()
    await ensureLLMBudgetTables()

    // Budget guard (per-call)
    if (ctx.budget?.maxOutputTokens && maxTokens > ctx.budget.maxOutputTokens) {
      await writeLLMCall({
        id: ctx.auditId,
        role: ctx.role,
        provider: ctx.model.provider,
        model: ctx.model.name,
        input_digest: sha256Hex(JSON.stringify(messages)),
        status: 'budget_exceeded',
        cache_hit: false,
        latency_ms: Date.now() - start
      })
      throw Object.assign(new Error('Budget exceeded: maxOutputTokens'), { code: 'BUDGET_MAX_OUTPUT_TOKENS' })
    }

    const normalized = JSON.stringify({ role: ctx.role, model: ctx.model, messages })
    const inputDigest = sha256Hex(normalized)

    // Cache lookup (in-memory for PR#2)
    const cacheKey = this.cacheKey(ctx, messages)
    const cached = this.getFromCache<T>(ctx.role, cacheKey)
    if (cached) {
      await writeLLMCall({
        id: ctx.auditId,
        role: ctx.role,
        provider: ctx.model.provider,
        model: ctx.model.name,
        input_digest: inputDigest,
        output_digest: sha256Hex(JSON.stringify(cached.payload)),
        input_tokens: cached.tokens?.input ?? null,
        output_tokens: cached.tokens?.output ?? null,
        cost_usd: cached.costUsd ?? 0,
        cache_hit: true,
        status: 'ok',
        latency_ms: Date.now() - start
      })
      return { data: cached.payload as T, meta: { auditId: ctx.auditId, cacheHit: true, tokens: cached.tokens, costUsd: cached.costUsd } }
    }

    // Daily budget check
    const todayISO = new Date().toISOString().slice(0,10)
    const caps = this.roleDailyCaps[ctx.role]
    if (caps) {
      const counters = await getBudgetCounters(todayISO, ctx.role)
      if (counters) {
        if (caps.maxCallsPerDay && counters.calls >= caps.maxCallsPerDay) {
          await writeLLMCall({ id: ctx.auditId, role: ctx.role, provider: ctx.model.provider, model: ctx.model.name, input_digest: inputDigest, status: 'budget_exceeded', cache_hit: false, latency_ms: Date.now()-start })
          throw Object.assign(new Error('Daily call budget exceeded'), { code: 'DAILY_CALLS_EXCEEDED' })
        }
        if (caps.maxCostPerDayUsd && counters.cost_usd >= caps.maxCostPerDayUsd) {
          await writeLLMCall({ id: ctx.auditId, role: ctx.role, provider: ctx.model.provider, model: ctx.model.name, input_digest: inputDigest, status: 'budget_exceeded', cache_hit: false, latency_ms: Date.now()-start })
          throw Object.assign(new Error('Daily cost budget exceeded'), { code: 'DAILY_COST_EXCEEDED' })
        }
      }
    }

    // Rate / Concurrency gate
    await this.rateGate(ctx)

    try {
      let rawText = ''
      let provider: Provider = ctx.model.provider
      let inputTokens: number | undefined
      let outputTokens: number | undefined
      let costUsd: number | undefined
      
      // Prepare guarded messages (Anthropic: prepend strict system instruction)
      const strictSystem = { role: 'system' as const, content: 'Return ONLY valid JSON matching the required schema. No prose, no markdown.' }
      const baseMessages = provider === 'anthropic' ? [strictSystem, ...messages] : messages

      // Attempt up to 3 tries (initial + 2 repair retries)
      let lastError: any = null
      const maxAttempts = 3
      let attempt = 0
      while (attempt < maxAttempts) {
        let useMessages = baseMessages
        if (attempt > 0 && lastError) {
          const errText = typeof lastError?.message === 'string' ? lastError.message : 'schema_validation_failed'
          const repairUser = { role: 'user' as const, content: `Your previous response failed JSON validation (${errText}). Repair and return ONLY valid JSON matching the schema provided earlier.` }
          useMessages = [...baseMessages, repairUser]
        }

        if (provider === 'openai') {
          const explicit = process.env.LLM_PROVIDER
          const forceReal = explicit === 'openai'
          const useMock = !forceReal && (process.env.LLM_PROVIDER === 'mock' || process.env.NODE_ENV === 'test' || !this.openai)
          if (useMock) {
            const last = [...useMessages].reverse().find(m => (m as any).role === 'user') as any
            const content = (last?.content ?? '').toString()
            rawText = content?.trim?.().startsWith('{') || content?.trim?.().startsWith('[')
              ? content
              : JSON.stringify({ ok: true })
            inputTokens = 5
            outputTokens = 5
            costUsd = 0
          } else {
            if (!this.openai) throw new Error('OpenAI not configured')
            const resp = await this.openai.chat.completions.create({
              model: ctx.model.name,
              messages: useMessages,
              temperature,
              max_tokens: maxTokens,
              response_format: { type: 'json_object' }
            } as any)
            rawText = resp.choices?.[0]?.message?.content || ''
            inputTokens = (resp.usage as any)?.prompt_tokens
            outputTokens = (resp.usage as any)?.completion_tokens
            costUsd = undefined
          }
        } else if (provider === 'anthropic') {
          const explicit = process.env.LLM_PROVIDER
          const forceReal = explicit === 'anthropic'
          const useMock = !forceReal && (process.env.LLM_PROVIDER === 'mock' || process.env.NODE_ENV === 'test' || !this.anthropic)
          if (useMock) {
            const last = [...useMessages].reverse().find(m => (m as any).role === 'user') as any
            const content = (last?.content ?? '').toString()
            rawText = content?.trim?.().startsWith('{') || content?.trim?.().startsWith('[')
              ? content
              : JSON.stringify({ ok: true })
            inputTokens = 5
            outputTokens = 5
            costUsd = 0
          } else {
            if (!this.anthropic) throw new Error('Anthropic not configured')
            const resp = await this.anthropic.messages.create({
              model: ctx.model.name,
              max_tokens: maxTokens,
              temperature,
              messages: useMessages
            } as any)
            const item: any = (resp as any).content?.[0]
            rawText = item?.text || ''
            inputTokens = (resp as any)?.usage?.input_tokens
            outputTokens = (resp as any)?.usage?.output_tokens
            costUsd = undefined
          }
        } else {
          throw new Error(`Unsupported provider: ${provider}`)
        }

        // Validate JSON structure
        let parsed: unknown
        try {
          parsed = JSON.parse(rawText)
        } catch (e: any) {
          lastError = Object.assign(new Error('LLM did not return valid JSON'), { code: 'SCHEMA_VALIDATION_FAILED' })
          attempt++
          if (attempt >= maxAttempts) throw lastError
          continue
        }

        const validated = schema.safeParse(parsed)
        if (!validated.success) {
          const err = validated.error
          lastError = Object.assign(new Error('LLM output failed schema validation'), { code: 'SCHEMA_VALIDATION_FAILED', issues: err.issues })
          attempt++
          if (attempt >= maxAttempts) throw lastError
          continue
        }

        // Success
        const outputDigest = sha256Hex(JSON.stringify(validated.data))
        this.putToCache(ctx.role, cacheKey, validated.data, { input: inputTokens, output: outputTokens }, costUsd)
        await writeLLMCall({
          id: ctx.auditId,
          role: ctx.role,
          provider: ctx.model.provider,
          model: ctx.model.name,
          input_digest: inputDigest,
          output_digest: outputDigest,
          input_tokens: inputTokens ?? null,
          output_tokens: outputTokens ?? null,
          cost_usd: costUsd ?? null,
          cache_hit: false,
          status: 'ok',
          latency_ms: Date.now() - start
        })

        await incrementBudgetCounters(todayISO, ctx.role, { calls: 1, input_tokens: inputTokens || 0, output_tokens: outputTokens || 0, cost_usd: costUsd || 0 })
        return { data: validated.data, meta: { auditId: ctx.auditId, cacheHit: false, tokens: { input: inputTokens, output: outputTokens }, costUsd } }
      }

      // Should not reach here
      throw lastError || new Error('Unknown schema failure')
    } catch (e: any) {
      await writeLLMCall({
        id: ctx.auditId,
        role: ctx.role,
        provider: ctx.model.provider,
        model: ctx.model.name,
        input_digest: inputDigest,
        status: (e?.code === 'SCHEMA_VALIDATION_FAILED') ? 'schema_error' : (e?.code === 'BUDGET_MAX_OUTPUT_TOKENS' ? 'budget_exceeded' : (e?.code?.startsWith?.('DAILY_') ? 'budget_exceeded' : (e?.code === 'RATE_LIMITED_RPM' ? 'error' : 'error'))),
        cache_hit: false,
        latency_ms: Date.now() - start
      })
      throw e
    } finally {
      this.releaseSlot(ctx.model.provider, ctx.role)
    }
  }

  // ==== Caching helpers ====
  private cacheKey(ctx: WrapperContext, messages: Array<{ role: 'system'|'user'|'assistant'; content: string }>): string {
    const seed = JSON.stringify({ r: ctx.role, m: ctx.model, msgs: messages })
    return createHash('sha256').update(seed).digest('hex')
  }

  private ttlForRole(role: 'Teacher'|'Scout'|'Judge'): number {
    const l = this.roleLimits[role]
    return l ? l.ttlMs.min : 5*60*1000
  }

  private getFromCache<T>(role: string, key: string): { payload: T; tokens?: { input?: number; output?: number }; costUsd?: number } | null {
    const hit = this.memCache.get(key)
    if (!hit) return null
    if ((Date.now() - hit.ts) <= hit.ttlMs) return { payload: hit.payload as T, tokens: hit.tokens, costUsd: hit.costUsd }
    this.memCache.delete(key)
    return null
  }

  private putToCache(role: string, key: string, payload: any, tokens?: { input?: number; output?: number }, costUsd?: number) {
    const ttlMs = this.ttlForRole(role as any)
    this.memCache.set(key, { ts: Date.now(), ttlMs, payload, tokens, costUsd })
  }

  // ==== Rate / Concurrency ====
  private async rateGate(ctx: WrapperContext): Promise<void> {
    // RPM window check
    const limits = this.roleLimits[ctx.role]
    const now = Date.now()
    const window = this.rpmWindows.get(ctx.role) || []
    // prune older than 60s
    const pruned = window.filter(ts => now - ts < 60_000)
    if (pruned.length >= limits.rpm) {
      // backoff/jitter a bit and re-check once
      const delay = 250 + Math.floor(Math.random()*100)
      await new Promise(r=> setTimeout(r, delay))
      const again = pruned.filter(ts => (Date.now() - ts) < 60_000)
      if (again.length >= limits.rpm) {
        throw Object.assign(new Error('Rate limit (RPM) exceeded'), { code: 'RATE_LIMITED_RPM' })
      }
    }
    pruned.push(now)
    this.rpmWindows.set(ctx.role, pruned)

    // Concurrency per provider and role
    const prov = ctx.model.provider
    const token = `${prov}:${ctx.role}`
    const maxProv = this.providerMaxConcurrent[prov]
    const maxRole = limits.maxConcurrent
    let attempts = 0
    while (!this.canEnter(prov, token, maxProv, maxRole)) {
      attempts++
      const backoff = Math.min(1000, 50 * Math.pow(2, Math.min(5, attempts)))
      const jitter = Math.floor(Math.random() * 25)
      await new Promise(r => setTimeout(r, backoff + jitter))
    }
    // reserve
    this.providerConcurrent[prov] = (this.providerConcurrent[prov] || 0) + 1
    this.inFlightByProvRole.set(token, (this.inFlightByProvRole.get(token) || 0) + 1)
  }

  private canEnter(prov: Provider, token: string, maxProv: number, maxRole: number): boolean {
    const curProv = this.providerConcurrent[prov] || 0
    const curRole = this.inFlightByProvRole.get(token) || 0
    return curProv < maxProv && curRole < maxRole
  }

  private releaseSlot(prov: Provider, role: 'Teacher'|'Scout'|'Judge') {
    this.providerConcurrent[prov] = Math.max(0, (this.providerConcurrent[prov] || 1) - 1)
    const token = `${prov}:${role}`
    const cur = (this.inFlightByProvRole.get(token) || 1) - 1
    if (cur <= 0) this.inFlightByProvRole.delete(token)
    else this.inFlightByProvRole.set(token, cur)
  }
}

export const llmWrapper = new LLMWrapper()



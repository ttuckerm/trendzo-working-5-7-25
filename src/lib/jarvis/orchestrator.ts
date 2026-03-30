import 'server-only'
import { hmacSignHex, sha256Hex, ensureAuditTables, writeEvidenceZip } from '@/lib/audit/audit_utils'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { getSkillsRegistry, JarvisSkill, resolveSkillFromPhrase } from '@/lib/jarvis/skills'
import { enforcePermissionsAndConfirm, JarvisActor, JarvisSecurityDecision } from '@/lib/jarvis/security'
import { getSystemSnapshot } from '@/lib/jarvis/read_model'

type Json = any

export interface JarvisIntent {
  utterance: string
  mode?: 'voice' | 'text' | 'api'
  actor?: JarvisActor
  idempotencyKey?: string
}

export interface JarvisActionResult {
  skillId?: string
  text: string
  actions?: Array<{ id: string; status: 'queued' | 'executed' | 'denied' | 'cancelled'; details?: Json }>
}

interface PendingConfirmation {
  confirmationId: string
  skillId: string
  params: Record<string, any>
  requestedBy: JarvisActor
  expiresAt: number
}

class SimpleEventBus {
  private listeners: Map<string, Set<(payload: any) => void>> = new Map()
  on(event: string, handler: (payload: any) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(handler)
  }
  off(event: string, handler: (payload: any) => void) {
    this.listeners.get(event)?.delete(handler)
  }
  emit(event: string, payload: any) {
    this.listeners.get(event)?.forEach(h => {
      try { h(payload) } catch (e) { /* no-op */ }
    })
  }
}

class CircuitBreaker {
  private failures: Map<string, { count: number; openedAt?: number }> = new Map()
  private threshold = 5
  private coolDownMs = 60_000
  isOpen(key: string): boolean {
    const f = this.failures.get(key)
    if (!f) return false
    if (f.count < this.threshold) return false
    if (!f.openedAt) f.openedAt = Date.now()
    return Date.now() - f.openedAt < this.coolDownMs
  }
  recordSuccess(key: string) {
    this.failures.delete(key)
  }
  recordFailure(key: string) {
    const f = this.failures.get(key) || { count: 0 as number }
    f.count += 1
    if (f.count >= this.threshold && !f.openedAt) f.openedAt = Date.now()
    this.failures.set(key, f as any)
  }
}

export class JarvisOrchestrator {
  private static instance: JarvisOrchestrator
  private bus = new SimpleEventBus()
  private skills: Map<string, JarvisSkill> = new Map()
  private idempotency: Set<string> = new Set()
  private circuit = new CircuitBreaker()
  private pendingConfirmations: Map<string, PendingConfirmation> = new Map()
  private lastAction: { id?: string; at?: string; text?: string } = {}
  private db = (SUPABASE_URL && SUPABASE_SERVICE_KEY) ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null as any

  private constructor() {
    // Load skills from registry
    console.info('[Jarvis Orchestrator] Loading skills from registry...')
    const skillsFromRegistry = getSkillsRegistry()
    skillsFromRegistry.forEach(s => {
      this.skills.set(s.id, s)
      console.info(`[Jarvis Orchestrator] Loaded skill: ${s.id}`)
    })
    console.info(`[Jarvis Orchestrator] ✓ Loaded ${this.skills.size} skills total`)
  }

  static get(): JarvisOrchestrator {
    if (!JarvisOrchestrator.instance) JarvisOrchestrator.instance = new JarvisOrchestrator()
    return JarvisOrchestrator.instance
  }

  on(event: string, handler: (payload: any) => void) { this.bus.on(event, handler) }
  off(event: string, handler: (payload: any) => void) { this.bus.off(event, handler) }
  emit(event: string, payload: any) { this.bus.emit(event, payload) }

  getStatus() {
    return {
      overlay_enabled: true,
      last_action: this.lastAction,
      pending_confirms: Array.from(this.pendingConfirmations.values()).map(p => ({
        confirmationId: p.confirmationId,
        skillId: p.skillId,
        requestedBy: p.requestedBy,
        expiresAt: p.expiresAt
      })),
      skills_registered: this.skills.size,
      ws_mode: 'event_bus'
    }
  }

  async dispatchIntent(intent: JarvisIntent): Promise<JarvisActionResult> {
    console.info('[Jarvis Orchestrator] Dispatching intent:', intent.utterance)
    
    // Try explicit skill via phrase → skill mapping
    const resolved = resolveSkillFromPhrase(intent.utterance, Array.from(this.skills.values()))
    if (!resolved) {
      console.info('[Jarvis Orchestrator] ✗ No skill resolved for phrase')
      return { text: "I didn't find a matching capability for that.", actions: [] }
    }
    
    const { skill, params } = resolved
    console.info(`[Jarvis Orchestrator] ✓ Resolved to skill: ${skill.id}`)
    console.info('[Jarvis Orchestrator] Skill params:', params)
    
    const actor: JarvisActor = intent.actor || { id: 'anonymous', role: 'basic', channel: intent.mode || 'api' }
    
    console.info(`[Jarvis Orchestrator] Executing skill: ${skill.id}`)
    const exec = await this.confirmAndExecute(skill.id, params, actor, { idempotencyKey: intent.idempotencyKey })
    console.info(`[Jarvis Orchestrator] ✓ Skill execution completed: ${exec.status}`)
    
    return {
      skillId: skill.id,
      text: exec.text,
      actions: [{ id: skill.id, status: exec.status as any, details: exec.details }]
    }
  }

  async confirmAndExecute(
    skillId: string,
    params: Record<string, any>,
    actor: JarvisActor,
    opts: { skipConfirmation?: boolean; idempotencyKey?: string } = {}
  ): Promise<{ status: 'executed' | 'denied' | 'cancelled'; text: string; details?: any }> {
    const skill = this.skills.get(skillId)
    if (!skill) return { status: 'denied', text: `Unknown skill: ${skillId}` }

    // Circuit breaker
    if (this.circuit.isOpen(skillId)) {
      return { status: 'denied', text: `Temporarily disabled due to repeated failures: ${skillId}` }
    }

    // Idempotency
    const idem = opts.idempotencyKey
    if (idem && this.idempotency.has(idem)) {
      return { status: 'executed', text: `Already executed (idempotent).` }
    }

    // Security & confirmation
    const sec: JarvisSecurityDecision = await enforcePermissionsAndConfirm({
      skill,
      actor,
      requiresConfirmation: skill.requiresConfirmation && !opts.skipConfirmation,
      requestConfirmation: async (twoPerson) => {
        const confirmationId = `${skillId}_${Date.now()}`
        const pending: PendingConfirmation = {
          confirmationId,
          skillId,
          params,
          requestedBy: actor,
          expiresAt: Date.now() + 20_000
        }
        this.pendingConfirmations.set(confirmationId, pending)
        this.emit('security_alert', { severity: 'info', message: `Confirmation required for ${skillId}`, id: confirmationId, timestamp: new Date().toISOString() })
        // Wait for response via event bus
        const decision = await new Promise<'confirm' | 'cancel' | 'timeout'>(resolve => {
          const timer = setTimeout(() => resolve('timeout'), 20_000)
          const handler = (payload: any) => {
            if (payload?.confirmationId === confirmationId) {
              clearTimeout(timer)
              this.off('confirmation_response', handler)
              resolve(payload.response)
            }
          }
          this.on('confirmation_response', handler)
        })
        this.pendingConfirmations.delete(confirmationId)
        return decision
      }
    })

    if (sec.decision !== 'allow') {
      await this.audit('jarvis_denied', { skillId, params, actor, reason: sec.reason })
      return { status: sec.decision === 'cancel' ? 'cancelled' : 'denied', text: sec.message || 'Denied' }
    }

    // Execute with retry/backoff
    try {
      const start = Date.now()
      const result = await this.executeWithRetry(skill, params)
      if (idem) this.idempotency.add(idem)
      const durationMs = Date.now() - start
      this.lastAction = { id: skillId, at: new Date().toISOString(), text: result?.message || 'OK' }
      await this.audit('jarvis_executed', { skillId, params, actor, durationMs, result })
      return { status: 'executed', text: result?.message || `${skill.description} executed.`, details: result }
    } catch (e: any) {
      this.circuit.recordFailure(skillId)
      await this.audit('jarvis_error', { skillId, params, actor, error: String(e?.message || e) })
      return { status: 'denied', text: `Execution failed: ${e?.message || e}` }
    }
  }

  private async executeWithRetry(skill: JarvisSkill, params: Record<string, any>) {
    let attempt = 0
    let lastErr: any
    const max = 3
    while (attempt < max) {
      try {
        const out = await skill.handler(params)
        this.circuit.recordSuccess(skill.id)
        return out
      } catch (e) {
        lastErr = e
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 200))
        attempt++
      }
    }
    throw lastErr
  }

  private async audit(event: string, payload: any) {
    await ensureAuditTables()
    try { if (this.db) await this.db.from('prediction_events').insert({ prediction_id: 'jarvis', event, payload } as any) } catch {}
    try {
      const inputs = sha256Hex(JSON.stringify(payload))
      const outputs = sha256Hex(JSON.stringify({ event }))
      const key = process.env.AUDIT_HMAC_KEY || process.env.NEXTAUTH_SECRET || 'local-dev'
      const signature = hmacSignHex(`${inputs}|${outputs}`, key)
      const evidencePath = await writeEvidenceZip(`jarvis_${Date.now()}`, {
        'event.json': JSON.stringify({ event, payload }, null, 2),
        'signature.txt': signature
      })
      this.emit('admin_command_result', { success: true, command: event, evidencePath: evidencePath })
    } catch {}
  }
}

export const orchestrator = JarvisOrchestrator.get()



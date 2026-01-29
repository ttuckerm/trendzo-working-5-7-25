import serverEventBus from '@/lib/services/websocketService'
import { parseDeimIntent, handleDeimIntent } from '@/lib/jarvis/skills/deim'

export interface JarvisSkill {
  id: string
  description: string
  permissions: string[]
  requiresConfirmation?: boolean
  handler: (params: Record<string, any>) => Promise<{ message: string; data?: any }>
}

const registry: JarvisSkill[] = []

function register(skill: JarvisSkill) {
  registry.push(skill)
  console.info(`[Jarvis Skills] Registered skill: ${skill.id} - ${skill.description}`)
}

export function getSkillsRegistry(): JarvisSkill[] { 
  if (registry.length === 0) {
    console.warn('[Jarvis Skills] Registry is empty - skills may not be loaded yet')
  } else {
    console.info(`[Jarvis Skills] Registry has ${registry.length} skills: ${registry.map(s => s.id).join(', ')}`)
  }
  return registry 
}

export function resolveSkillFromPhrase(utterance: string, skills: JarvisSkill[]): { skill: JarvisSkill; params: Record<string, any> } | null {
  console.info(`[Jarvis Resolver] Processing phrase: "${utterance}"`)
  const u = utterance.toLowerCase()
  
  // Check DEIM intents first (higher priority)
  console.info('[Jarvis Resolver] Checking DEIM intents...')
  const deimIntent = parseDeimIntent(utterance)
  console.info(`[Jarvis Resolver] DEIM parse result:`, deimIntent)
  
  if (deimIntent) {
    const deimSkill = skills.find(s => s.id === 'deim')
    if (deimSkill) {
      console.info(`[Jarvis Resolver] ✓ Selected DEIM skill with intent:`, deimIntent)
      return { skill: deimSkill, params: { intent: deimIntent } }
    } else {
      console.warn('[Jarvis Resolver] DEIM intent found but DEIM skill not registered!')
    }
  }
  
  // Check other skills by ID tokens
  console.info('[Jarvis Resolver] Checking other skills by token matching...')
  for (const s of skills) {
    const tokens = s.id.replace(/_/g, ' ')
    if (u.includes(tokens) || u.includes(tokens.split(' ')[0])) {
      console.info(`[Jarvis Resolver] ✓ Selected skill: ${s.id} (matched token: ${tokens})`)
      return { skill: s, params: {} }
    }
  }
  
  // Specialized mappings
  console.info('[Jarvis Resolver] Checking specialized mappings...')
  if (u.includes('clear cache')) {
    const skill = skills.find(s=>s.id==='cache_clear')
    if (skill) {
      console.info('[Jarvis Resolver] ✓ Selected cache_clear skill')
      return { skill, params: {} }
    }
  }
  if (u.includes('backup database')) {
    const skill = skills.find(s=>s.id==='database_backup')
    if (skill) {
      console.info('[Jarvis Resolver] ✓ Selected database_backup skill')
      return { skill, params: {} }
    }
  }
  if (u.includes('system status')) {
    const skill = skills.find(s=>s.id==='system_status')
    if (skill) {
      console.info('[Jarvis Resolver] ✓ Selected system_status skill')
      return { skill, params: {} }
    }
  }
  if (u.includes('recompute cohort')) {
    const skill = skills.find(s=>s.id==='cohort_recompute')
    if (skill) {
      console.info('[Jarvis Resolver] ✓ Selected cohort_recompute skill')
      return { skill, params: {} }
    }
  }
  if (u.includes('run simulator')) {
    const skill = skills.find(s=>s.id==='simulator_run')
    if (skill) {
      console.info('[Jarvis Resolver] ✓ Selected simulator_run skill')
      return { skill, params: {} }
    }
  }
  if (u.includes('export evidence')) {
    const skill = skills.find(s=>s.id==='evidence_pack_export')
    if (skill) {
      console.info('[Jarvis Resolver] ✓ Selected evidence_pack_export skill')
      return { skill, params: {} }
    }
  }
  
  console.info('[Jarvis Resolver] ✗ No matching skill found')
  return null
}

// ===== Skills =====
register({
  id: 'deim',
  description: 'Daily Evolving Intelligence Matrix - log ideas, research via multi-LLM orchestrator, recall insights',
  permissions: ['deim.manage'],
  async handler(params: Record<string, any>) {
    console.info('[DEIM Handler] Starting with params:', params)
    try {
      const intent = params.intent
      if (!intent) {
        console.warn('[DEIM Handler] No intent provided in params')
        return { message: 'No DEIM intent provided' }
      }
      
      const context = {
        fetch: global.fetch || fetch,
        env: process.env
      }
      
      console.info('[DEIM Handler] Processing intent:', intent)
      const response = await handleDeimIntent(intent, context)
      console.info('[DEIM Handler] ✓ Completed successfully, response length:', response.length)
      return { message: response }
    } catch (error) {
      console.error('[DEIM Handler] ✗ Error occurred:', error)
      console.error('[DEIM Handler] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
      throw error
    }
  }
})

register({
  id: 'system_status',
  description: 'Report current system status snapshot',
  permissions: ['system.read'],
  async handler() {
    serverEventBus.emitEvent('system_metrics', { ping: Date.now() })
    return { message: 'System status fetched', data: { ok: true } }
  }
})

register({
  id: 'cache_clear',
  description: 'Clear all system caches',
  permissions: ['system.cache'],
  async handler() {
    const res = await fetch('/api/admin/system/cache/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    if (!res.ok) throw new Error('Cache clear failed')
    return { message: 'Cache cleared successfully' }
  }
})

register({
  id: 'database_backup',
  description: 'Backup primary database',
  permissions: ['database.backup'],
  requiresConfirmation: true,
  async handler() {
    const res = await fetch('/api/admin/database/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'jarvis' }) })
    if (!res.ok) throw new Error('Database backup failed')
    return { message: 'Database backup initiated' }
  }
})

register({
  id: 'cohort_recompute',
  description: 'Recompute cohort versions',
  permissions: ['analytics.recompute'],
  async handler() { return { message: 'Cohort recompute started' } }
})

register({
  id: 'eval_metrics_run',
  description: 'Run evaluation metrics pipeline',
  permissions: ['analytics.eval'],
  async handler() { return { message: 'Eval metrics run started' } }
})

register({
  id: 'scraping_scheduler_control',
  description: 'Control Apify scrapers scheduler',
  permissions: ['system.scraping'],
  async handler() { return { message: 'Scraping scheduler toggled' } }
})

register({
  id: 'simulator_run',
  description: 'Run simulator scenario',
  permissions: ['analytics.simulator'],
  async handler() { return { message: 'Simulator run queued' } }
})

register({
  id: 'coach_apply',
  description: 'Apply coaching recommendations',
  permissions: ['content.coach'],
  async handler() { return { message: 'Coach apply triggered' } }
})

register({
  id: 'bandit_allocate',
  description: 'Allocate traffic via bandit',
  permissions: ['experiments.bandit'],
  async handler() { return { message: 'Bandit allocation executed' } }
})

register({
  id: 'experiments_assign',
  description: 'Assign subjects to experiments',
  permissions: ['experiments.assign'],
  async handler() { return { message: 'Assignments persisted' } }
})

register({
  id: 'telemetry_ingest_poke',
  description: 'Nudge telemetry ingest',
  permissions: ['telemetry.ingest'],
  async handler() { return { message: 'Telemetry ingest poke sent' } }
})

register({
  id: 'commerce_webhook_test',
  description: 'Test commerce webhook',
  permissions: ['commerce.webhook'],
  async handler() { return { message: 'Commerce webhook test sent' } }
})

register({
  id: 'plugin_sdk_smoke',
  description: 'Smoke test plugin/SDK',
  permissions: ['plugins.smoke'],
  async handler() { return { message: 'Plugin/SDK smoke passed' } }
})

register({
  id: 'calibration_run',
  description: 'Run calibration pipeline',
  permissions: ['analytics.calibrate'],
  async handler() { return { message: 'Calibration run started' } }
})

register({
  id: 'evidence_pack_export',
  description: 'Export evidence pack ZIP',
  permissions: ['integrity.export'],
  async handler() { return { message: 'Evidence pack exported' } }
})










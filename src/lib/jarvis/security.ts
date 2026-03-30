export type JarvisRole = 'basic' | 'elevated' | 'admin' | 'super_admin'

export interface JarvisActor {
  id: string
  role: JarvisRole
  channel?: 'voice' | 'text' | 'api'
}

interface EnforcementInput {
  skill: { id: string; permissions: string[]; requiresConfirmation?: boolean }
  actor: JarvisActor
  requiresConfirmation: boolean
  requestConfirmation: (twoPerson: boolean) => Promise<'confirm' | 'cancel' | 'timeout'>
}

export interface JarvisSecurityDecision {
  decision: 'allow' | 'deny' | 'cancel'
  reason?: string
  message?: string
}

const rolePermissions: Record<JarvisRole, string[]> = {
  basic: ['system.read'],
  elevated: ['system.read', 'telemetry.ingest'],
  admin: ['system.read', 'system.cache', 'analytics.eval', 'analytics.simulator', 'analytics.calibrate', 'experiments.assign', 'plugins.smoke', 'commerce.webhook'],
  super_admin: ['*']
}

function hasPermission(role: JarvisRole, required: string[]): boolean {
  const perms = rolePermissions[role] || []
  if (perms.includes('*')) return true
  return required.every(r => perms.includes(r))
}

function requiresTwoPerson(skillId: string): boolean {
  return ['database_backup', 'system_restart', 'trend_override'].includes(skillId)
}

export async function enforcePermissionsAndConfirm(input: EnforcementInput): Promise<JarvisSecurityDecision> {
  const { skill, actor, requiresConfirmation, requestConfirmation } = input
  if (!hasPermission(actor.role, skill.permissions)) {
    return { decision: 'deny', reason: 'rbac', message: 'Insufficient permissions' }
  }
  const twoPerson = requiresTwoPerson(skill.id)
  if (requiresConfirmation || twoPerson) {
    const resp = await requestConfirmation(twoPerson)
    if (resp === 'confirm') return { decision: 'allow' }
    if (resp === 'cancel') return { decision: 'cancel', message: 'Cancelled by user' }
    return { decision: 'deny', reason: 'timeout', message: 'Confirmation timeout' }
  }
  return { decision: 'allow' }
}










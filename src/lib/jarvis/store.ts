import { runIntelligence } from '@/lib/intelligence/run'
import { JarvisTaskInput, Task, TaskState, KillSwitchState } from './types'

// In-memory store
export const tasks = new Map<string, Task>()
export const now = () => new Date().toISOString()
export const uid = () => Math.random().toString(36).slice(2)

// Kill-switch state (used by a separate API route)
let killSwitch: KillSwitchState = { active: false, updatedAt: Date.now(), updatedBy: 'system' }

export function getKillSwitch(): KillSwitchState {
  return { ...killSwitch }
}

export function setKillSwitch(active: boolean, updatedBy?: string): KillSwitchState {
  killSwitch = { active, updatedAt: Date.now(), updatedBy }
  return { ...killSwitch }
}

export function listTasks(): Task[] {
  return Array.from(tasks.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function getTask(id: string): Task | undefined {
  return tasks.get(id)
}

export function createTask(input: JarvisTaskInput, opts?: { requiresApproval?: boolean; createdBy?: string }): Task {
  const requiresApproval = !!opts?.requiresApproval
  const createdBy = opts?.createdBy || 'dev@local'
  if (!input || typeof input.goal !== 'string' || !input.goal.trim()) throw new Error('BAD_INPUT_GOAL')
  const t: Task = {
    id: uid(),
    input: { goal: input.goal, context: input.context ?? {}, data: input.data ?? {}, maxTokens: input.maxTokens },
    state: requiresApproval ? 'awaiting_approval' as TaskState : 'pending',
    createdAt: now(),
    updatedAt: now(),
    requiresApproval,
    createdBy
  }
  tasks.set(t.id, t)
  return t
}

export function approveTask(id: string, approver: string): Task {
  const t = tasks.get(id); if (!t) throw new Error('NOT_FOUND')
  if (!t.requiresApproval) throw new Error('NOT_AWAITING_APPROVAL')
  if (t.createdBy === approver) throw new Error('APPROVER_MUST_DIFFER')
  t.approvedBy = approver
  t.state = 'pending'
  t.updatedAt = now()
  tasks.set(t.id, t)
  return t
}

export function startTask(id: string): Task {
  const t = tasks.get(id); if (!t) throw new Error('NOT_FOUND')
  // kill-switch check lives in API; store enforces approval and state
  if (t.requiresApproval && !t.approvedBy) throw new Error('APPROVAL_REQUIRED')
  if (!(t.state === 'pending')) throw new Error('BAD_STATE')
  t.state = 'running'
  t.updatedAt = now()
  tasks.set(t.id, t)
  return t
}

export function pauseTask(id: string): Task {
  const t = tasks.get(id); if (!t) throw new Error('NOT_FOUND')
  if (t.state !== 'running') throw new Error('BAD_STATE')
  t.state = 'paused'
  t.updatedAt = now()
  tasks.set(t.id, t)
  return t
}

export function resumeTask(id: string): Task {
  const t = tasks.get(id); if (!t) throw new Error('NOT_FOUND')
  if (t.state !== 'paused') throw new Error('BAD_STATE')
  t.state = 'running'
  t.updatedAt = now()
  tasks.set(t.id, t)
  return t
}

export function cancelTask(id: string): Task {
  const t = tasks.get(id); if (!t) throw new Error('NOT_FOUND')
  if (!['pending', 'awaiting_approval', 'running', 'paused'].includes(t.state)) throw new Error('BAD_STATE')
  t.state = 'cancelled'
  t.updatedAt = now()
  tasks.set(t.id, t)
  return t
}

// Runner (one-shot; caller already called startTask)
export async function runOnce(id: string): Promise<Task> {
  const t = tasks.get(id); if (!t) throw new Error('NOT_FOUND')
  if (t.state !== 'running') throw new Error('BAD_STATE')
  try {
    const { result } = await runIntelligence({ goal: t.input.goal, context: t.input.context, data: t.input.data, maxTokens: t.input.maxTokens ?? 256 })
    t.result = result
    t.state = 'succeeded'
    t.updatedAt = now()
    tasks.set(t.id, t)
    return t
  } catch (e: any) {
    t.error = String(e?.message || e)
    t.state = 'failed'
    t.updatedAt = now()
    tasks.set(t.id, t)
    return t
  }
}

export function resetJarvisStore(): void {
  tasks.clear()
  killSwitch = { active: false, updatedAt: Date.now(), updatedBy: 'system' }
}


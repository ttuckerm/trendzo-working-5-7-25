import { z } from 'zod'

const BASE = process.env.CORTEZA_BASE_URL || ''
const TOKEN = process.env.CORTEZA_API_TOKEN || ''

async function api(path: string, init: RequestInit = {}) {
  if (!BASE || !TOKEN) return { set: [] as any[] }
  
  // Add timeout to prevent hanging requests
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
  
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    })
    clearTimeout(timeoutId)
    
    if (!res.ok) throw new Error(`Corteza ${path} ${res.status}`)
    return res.json()
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const schema = z.object({ set: z.array(z.object({ name: z.string().optional() })).optional() })
    const json = await api(`/system/users/${userId}/roles`)
    const parsed = schema.safeParse(json)
    const set = parsed.success ? parsed.data.set || [] : []
    return set.map(r => (r.name || '').toLowerCase().replace(/\s+/g, '_')).filter(Boolean)
  } catch {
    return []
  }
}



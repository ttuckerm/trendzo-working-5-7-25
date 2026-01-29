// Lightweight client-side network log store for Debug Drawer
// Stores the last ~200 entries of API calls with status and timing

export type NetworkLogEntry = {
  id: string
  method: string
  url: string
  path: string
  status: number
  ok: boolean
  durationMs: number
  atISO: string
  auditId?: string | null
  errorText?: string | null
}

type Subscriber = (entry: NetworkLogEntry) => void

declare global {
  interface Window {
    __NETWORK_LOGS__?: NetworkLogEntry[]
    __NETWORK_SUBS__?: Set<Subscriber>
  }
}

export function getLogs(): NetworkLogEntry[] {
  if (typeof window === 'undefined') return []
  window.__NETWORK_LOGS__ = window.__NETWORK_LOGS__ || []
  return window.__NETWORK_LOGS__
}

export function subscribe(sub: Subscriber): () => void {
  if (typeof window === 'undefined') return () => {}
  if (!window.__NETWORK_SUBS__) window.__NETWORK_SUBS__ = new Set()
  window.__NETWORK_SUBS__.add(sub)
  return () => { window.__NETWORK_SUBS__ && window.__NETWORK_SUBS__.delete(sub) }
}

export function addLog(entry: NetworkLogEntry): void {
  if (typeof window === 'undefined') return
  const list = getLogs()
  list.push(entry)
  // cap size
  if (list.length > 200) list.splice(0, list.length - 200)
  // notify
  if (window.__NETWORK_SUBS__) {
    for (const fn of window.__NETWORK_SUBS__) {
      try { fn(entry) } catch {}
    }
  }
}















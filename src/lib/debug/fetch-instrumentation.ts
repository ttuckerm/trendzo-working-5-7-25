// Wrap global fetch to log requests to Debug Drawer and surface banners
'use client'

import { addLog } from './networkLog'

console.log('instrumentation loaded')

let installed = false

export function installFetchInstrumentation() {
  if (installed || typeof window === 'undefined' || typeof fetch !== 'function') return
  installed = true
  const origFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const start = performance.now()
    const method = (init?.method || 'GET').toUpperCase()
    const urlStr = typeof input === 'string' ? input : (input as URL).toString()
    let path = urlStr
    try { const u = new URL(urlStr, window.location.origin); path = `${u.pathname}${u.search}` } catch {}
    
    // <<< CHANGE START
    console.log(`[FETCH START] ${method} ${urlStr}`);
    // CHANGE END >>>

    try {
      const res = await origFetch(input as any, init)
      const dur = performance.now() - start
      
      // <<< CHANGE START
      console.log(`[FETCH END] ${method} ${urlStr} -> ${res.status} (${dur.toFixed(1)}ms)`);
      // CHANGE END >>>
      
      let auditId: string | null = null
      try {
        // clone and parse JSON best-effort
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const clone = res.clone()
          const body = await clone.json().catch(()=> null as any)
          auditId = (body && (body.audit_id || body.auditId)) || null
        }
      } catch {}
      addLog({ id: Math.random().toString(36).slice(2,10), method, url: urlStr, path, status: res.status, ok: res.ok, durationMs: dur, atISO: new Date().toISOString(), auditId })
      return res
    } catch (e: any) {
      const dur = performance.now() - start
      
      // <<< CHANGE START
      console.error(`[FETCH ERROR] ${method} ${urlStr} -> ${e.message} (${dur.toFixed(1)}ms)`);
      // CHANGE END >>>

      addLog({ id: Math.random().toString(36).slice(2,10), method, url: urlStr, path, status: 0, ok: false, durationMs: dur, atISO: new Date().toISOString(), auditId: null, errorText: String(e?.message || e) })
      throw e
    }
  }
}















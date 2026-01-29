'use client'

import { useState } from 'react'
import { showBanner } from '@/lib/ui/bannerBus'

async function act(action: string, body?: any) {
  const res = await fetch(`/api/admin/pipeline/actions/${action}`, { method: 'POST', headers: { 'content-type':'application/json', 'x-user-id':'local-admin' }, body: JSON.stringify(body||{}) })
  let audit: string | undefined
  try { const j = await res.clone().json(); audit = j?.audit_id } catch {}
  if (res.ok) {
    showBanner({ title: `✅ ${titleFor(action)} completed.`, description: audit ? `Audit #${audit}` : undefined, variant: 'success' })
  } else {
    showBanner({ title: `❌ ${titleFor(action)} failed`, description: undefined, variant: 'error' })
  }
  return res.ok
}

function titleFor(action: string): string {
  if (action === 'recompute-discovery') return 'Recompute'
  if (action === 'warm-examples') return 'Warm Examples'
  if (action === 'qa-seed') return 'QA Seed'
  return action
}

export function ControlsBar() {
  const [busy, setBusy] = useState<string | null>(null)
  const run = async (a: string, b?: any) => { setBusy(a); try { await act(a, b) } finally { setBusy(null) } }
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/50">
      <div className="mx-auto max-w-[1400px] px-4 py-2 flex gap-2 justify-end">
        <button onClick={()=> run('pause')} className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" data-testid="controls-pause" disabled={!!busy} aria-busy={busy==='pause'}>{busy==='pause'?<span className="inline-flex items-center gap-1"><span className="i-lucide-loader-2 animate-spin"/>Pause</span>:'Pause'}</button>
        <button onClick={()=> run('resume')} className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={!!busy} aria-busy={busy==='resume'}>{busy==='resume'?<span className="inline-flex items-center gap-1"><span className="i-lucide-loader-2 animate-spin"/>Resume</span>:'Resume'}</button>
        <button onClick={()=> run('restart', { failing_only: true })} className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={!!busy} aria-busy={busy==='restart'}>Restart failing</button>
        <button onClick={()=> run('hotfix')} className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={!!busy} aria-busy={busy==='hotfix'}>Apply hotfix</button>
        <button onClick={()=> run('rollback')} className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={!!busy} aria-busy={busy==='rollback'}>Rollback</button>
        <button onClick={()=> run('recompute-discovery')} className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={!!busy} aria-busy={busy==='recompute-discovery'} data-testid="ops-btn-recompute">{busy==='recompute-discovery'?<span className="inline-flex items-center gap-1"><span className="i-lucide-loader-2 animate-spin"/>Recompute</span>:'Recompute Discovery'}</button>
        <button onClick={()=> run('warm-examples')} className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={!!busy} aria-busy={busy==='warm-examples'} data-testid="ops-btn-warm-examples">{busy==='warm-examples'?<span className="inline-flex items-center gap-1"><span className="i-lucide-loader-2 animate-spin"/>Warm</span>:'Warm Examples'}</button>
        <button onClick={()=> run('qa-seed')} className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={!!busy} aria-busy={busy==='qa-seed'} data-testid="ops-btn-qa-seed">{busy==='qa-seed'?<span className="inline-flex items-center gap-1"><span className="i-lucide-loader-2 animate-spin"/>QA Seed</span>:'Run QA seed'}</button>
      </div>
    </div>
  )
}




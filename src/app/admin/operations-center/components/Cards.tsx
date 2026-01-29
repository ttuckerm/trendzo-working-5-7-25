'use client'

import useSWR from 'swr'
import { useToast } from '@/components/ui/use-toast'
import { showBanner } from '@/lib/ui/bannerBus'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r=> r.json())

export function BacklogCard({ range }: { range: string }) {
  const { data } = useSWR(`/api/admin/pipeline/backlog?range=${encodeURIComponent(range)}`, fetcher, { refreshInterval: 15000 })
  const cron = data?.cron || {}
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4" data-testid="card-backlog">
      <div className="text-sm font-semibold mb-2">Backlog & Schedule</div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div><div className="text-xs text-zinc-400">Queue size</div><div className="font-semibold">{data?.backlog ?? 0}</div></div>
        <div><div className="text-xs text-zinc-400">Drain ETA (sec)</div><div className="font-semibold">{data?.drain_eta_sec ?? '—'}</div></div>
        <div><div className="text-xs text-zinc-400">Rate (sec)</div><div className="font-semibold">{data?.rate_per_sec ?? 0}</div></div>
      </div>
      <div className="mt-3 text-xs text-zinc-400">Cron</div>
      <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {Object.entries(cron).map(([job, info]: any)=> (
          <div key={job} className="rounded border border-white/10 p-2"><span className="font-medium">{job}</span> • last {info.last_status} at {info.last_run ? new Date(info.last_run).toLocaleTimeString(): '—'} • misses {info.misses}</div>
        ))}
      </div>
    </div>
  )
}

export function DataHealthCard() {
  const { data } = useSWR('/api/admin/pipeline/health', fetcher, { refreshInterval: 30000 })
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4" data-testid="card-health">
      <div className="text-sm font-semibold mb-2">Data Health</div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div><div className="text-xs text-zinc-400">Dedupe rate</div><div className="font-semibold">{(data?.dedupe_rate ?? 0).toLocaleString()}</div></div>
        <div><div className="text-xs text-zinc-400">Failed writes</div><div className="font-semibold">{data?.failed_writes ?? 0}</div></div>
        <div><div className="text-xs text-zinc-400">DB size</div><div className="font-semibold">{data?.db_size_bytes ? Math.round(data.db_size_bytes/1024/1024)+' MB' : '—'}</div></div>
      </div>
    </div>
  )
}

export function QualitySafety() {
  const { data } = useSWR('/api/admin/pipeline/quality', fetcher, { refreshInterval: 30000 })
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4" data-testid="card-quality">
      <div className="text-sm font-semibold mb-2">Quality & Safety</div>
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div><div className="text-xs text-zinc-400">Validation accuracy 24h</div><div className="font-semibold">{data?.validation_accuracy_24h ?? '—'}</div></div>
        <div><div className="text-xs text-zinc-400">Drift</div><div className="font-semibold">{data?.drift_metric ?? 0}</div></div>
        <div><div className="text-xs text-zinc-400">NSFW</div><div className="font-semibold">{data?.safety_counts?.nsfw ?? 0}</div></div>
        <div><div className="text-xs text-zinc-400">Copyright</div><div className="font-semibold">{data?.safety_counts?.copyright ?? 0}</div></div>
      </div>
    </div>
  )
}

export function ChangeLogCard() {
  const { data } = useSWR('/api/admin/pipeline/changelog', fetcher, { refreshInterval: 30000 })
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4" data-testid="card-changelog">
      <div className="text-sm font-semibold mb-2">Change Log / Audit</div>
      <div className="space-y-2 text-sm">
        {(data?.items||[]).slice(0,10).map((r:any)=> (
          <div key={r.id} className="rounded border border-white/10 p-2"><span className="font-medium">{r.category}</span> • {r.what} <span className="text-xs text-zinc-400">({r.who || 'system'} at {new Date(r.created_at).toLocaleString()})</span></div>
        ))}
      </div>
    </div>
  )
}

export function ExportsApiCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4">
      <div className="text-sm font-semibold mb-2">Exports & API</div>
      <div className="flex gap-2">
        <a data-testid="btn-export-csv" className="text-xs px-3 py-1 rounded border border-white/10" href="/api/admin/pipeline/export.csv">Download CSV</a>
        <a className="text-xs px-3 py-1 rounded border border-white/10" href="/api/admin/pipeline/export.json">Download JSON</a>
        <a className="text-xs px-3 py-1 rounded border border-white/10" href="/api/admin/pipeline/export.pdf" target="_blank" rel="noreferrer">Download PDF</a>
        <button className="text-xs px-3 py-1 rounded border border-white/10" onClick={()=> navigator.clipboard.writeText(`curl -H \"x-user-id: YOUR_USER\" \"${location.origin}/api/admin/pipeline/status\"`)}>Copy curl</button>
      </div>
    </div>
  )
}

export function DiscoveryCard() {
  const { data } = useSWR('/api/discovery/readiness', fetcher, { refreshInterval: 20000 })
  const { toast } = useToast()
  const [busy, setBusy] = React.useState<string | null>(null)
  const ready = !!data?.ready
  const pill = ready ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  const label = ready ? 'Discovery: Ready' : 'Discovery: Needs Attention'
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4" data-testid="ops-discovery-card">
      <div className="text-sm font-semibold mb-2">Discovery</div>
      <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${pill}`}>{label}</div>
      <div className="mt-2 text-xs text-zinc-400">Freshness {data?.scores?.freshness_secs ?? '—'}s • Templates {data?.scores?.templates_total ?? '—'}</div>
      <div className="mt-2 text-xs text-zinc-500">Last recompute: just now • Last examples warm: just now</div>
      <div className="mt-3 flex gap-2">
        <a href="/admin/viral-recipe-book" className="text-xs px-3 py-1 rounded border border-white/10">Open Viral Recipe Book</a>
        <button data-testid="ops-btn-recompute" className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={!!busy} aria-busy={busy==='recompute'} onClick={async()=>{
          setBusy('recompute')
          const r = await fetch('/api/admin/pipeline/actions/recompute-discovery', { method:'POST', headers:{ 'x-user-id':'local-admin' } })
          const j = await r.json().catch(()=>({}))
          toast({ title: r.ok? '✅ Recompute completed' : 'Recompute failed', description: j?.audit_id ? `Audit #${j.audit_id}` : undefined, variant: r.ok? 'default':'destructive' })
          if (r.ok && j?.audit_id) showBanner({ title: `✅ Done (Audit #${j.audit_id})`, variant: 'success', durationMs: 5000 })
          setBusy(null)
        }}>Recompute Discovery</button>
        <button data-testid="ops-btn-warm-examples" className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={!!busy} aria-busy={busy==='warm'} onClick={async()=>{
          setBusy('warm')
          const r = await fetch('/api/admin/pipeline/actions/warm-examples', { method:'POST', headers:{ 'x-user-id':'local-admin' } })
          const j = await r.json().catch(()=>({}))
          toast({ title: r.ok? '✅ Warm Examples queued' : 'Warm failed', description: j?.audit_id ? `Audit #${j.audit_id}` : undefined, variant: r.ok? 'default':'destructive' })
          if (r.ok && j?.audit_id) showBanner({ title: `✅ Done (Audit #${j.audit_id})`, variant: 'success', durationMs: 5000 })
          setBusy(null)
        }}>Warm Examples</button>
        <button data-testid="ops-btn-qa-seed" className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={!!busy} aria-busy={busy==='qa'} onClick={async()=>{
          setBusy('qa')
          // Demo Fill: QA seed + recompute
          const r1 = await fetch('/api/discovery/qa-seed', { method:'POST', headers:{ 'x-user-id':'local-admin' } })
          const j1 = await r1.json().catch(()=>({}))
          const r2 = await fetch('/api/admin/pipeline/actions/recompute-discovery', { method:'POST', headers:{ 'x-user-id':'local-admin' } })
          await r2.json().catch(()=>({}))
          toast({ title: (r1.ok && r2.ok) ? '✅ Demo data ready.' : 'Demo Fill failed', description: j1?.audit_id ? `Audit #${j1.audit_id}` : undefined, variant: (r1.ok && r2.ok) ? 'default':'destructive' })
          if (r1.ok && j1?.audit_id) showBanner({ title: `✅ Done (Audit #${j1.audit_id})`, variant: 'success', durationMs: 5000 })
          setBusy(null)
        }}>Demo Fill</button>
      </div>
    </div>
  )
}




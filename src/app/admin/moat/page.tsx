"use client"
import React from 'react'

function useFetch<T = any>(url: string, deps: any[] = []) {
	const [data, setData] = React.useState<T | null>(null)
	const [err, setErr] = React.useState<string | null>(null)
	React.useEffect(() => { (async () => {
		try { const r = await fetch(url, { cache: 'no-store' }); if (r.ok) setData(await r.json() as T); else setErr(String(r.status)) } catch (e:any) { setErr(e?.message||'err') }
	})() }, deps)
	return { data, err }
}

export default function MoatAdminPage() {
	const { data: insights } = useFetch<{ items: any[] }>("/api/public/v1/insights/unique?n=50", [])
	const { data: bench } = useFetch<any>("/api/benchmark/report", [])
	const { data: keys, err: keysErr } = useFetch<any>("/api/admin/keys/list", [])
	const [adminToken, setAdminToken] = React.useState<string>("")
	const [plan, setPlan] = React.useState<'free'|'pro'|'enterprise'>('free')
	const [flags, setFlags] = React.useState<{ publicApi: boolean; insights: boolean } | null>(null)

	async function refreshFlags() {
		try { const r = await fetch('/fixtures/flags.json', { cache: 'no-store' }); if (r.ok) setFlags(await r.json()) } catch {}
	}
	React.useEffect(()=>{ refreshFlags() },[])

	async function onIssue() {
		await fetch('/api/admin/keys/issue', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ plan }) })
		location.reload()
	}
	async function onRotate(keyId: string) {
		await fetch('/api/admin/keys/rotate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ keyId }) })
		location.reload()
	}
	async function onRevoke(keyId: string) {
		await fetch('/api/admin/keys/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ keyId }) })
		location.reload()
	}
	async function onFlag(name: 'publicApi'|'insights', value: boolean) {
		await fetch('/api/admin/flags/set', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ name, value }) })
		await refreshFlags()
	}

	return (
		<div className="p-6 space-y-6">
			<h2 className="text-xl font-semibold">Moat Dashboard</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="border rounded p-4">
					<h3 className="font-semibold mb-2">Unique Insights</h3>
					<div className="max-h-80 overflow-auto">
						<table className="w-full text-sm">
							<thead><tr><th>Template</th><th>Niche</th><th>Dur</th><th>Signal</th><th>SR%</th><th>Δ</th><th>PMI</th><th>Support</th></tr></thead>
							<tbody>
								{(insights?.items||[]).map((it:any, i:number)=> (
									<tr key={i}><td>{it.templateId}</td><td>{it.niche||'-'}</td><td>{it.durationBucket}</td><td>{it.captionSignal}</td><td>{Math.round(it.successRate*100)}%</td><td>{Math.round(it.deltaVsBaseline*100)}%</td><td>{it.PMI.toFixed(2)}</td><td>{it.support}</td></tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
				<div className="border rounded p-4 space-y-2">
					<h3 className="font-semibold">Public API & Keys</h3>
					<input className="border p-1 w-full" placeholder="Admin token" value={adminToken} onChange={e=>setAdminToken(e.target.value)} />
					<div className="flex items-center gap-2">
						<select className="border p-1" value={plan} onChange={(e)=>setPlan(e.target.value as any)}>
							<option value="free">free</option>
							<option value="pro">pro</option>
							<option value="enterprise">enterprise</option>
						</select>
						<button className="border px-3 py-1" onClick={onIssue}>Issue</button>
					</div>
					<div className="max-h-56 overflow-auto">
						<table className="w-full text-sm">
							<thead><tr><th>Key</th><th>Plan</th><th>RPM/RPD</th><th>Usage m/d/t</th><th>Actions</th></tr></thead>
							<tbody>
								{(keys?.keys||[]).map((k:any)=> (
									<tr key={k.keyId}><td>{k.keyId}</td><td>{k.plan}</td><td>{k.limits.rpm}/{k.limits.rpd}</td><td>{k.usage.minute}/{k.usage.day}/{k.usage.total}</td><td className="space-x-2"><button className="border px-2" onClick={()=>onRotate(k.keyId)}>Rotate</button><button className="border px-2" onClick={()=>onRevoke(k.keyId)}>Revoke</button></td></tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
				<div className="border rounded p-4 space-y-2">
					<h3 className="font-semibold">Flags</h3>
					<div className="flex items-center gap-4">
						<label className="flex items-center gap-2"><input type="checkbox" checked={!!flags?.publicApi} onChange={e=>onFlag('publicApi', e.target.checked)} /> Public API</label>
						<label className="flex items-center gap-2"><input type="checkbox" checked={!!flags?.insights} onChange={e=>onFlag('insights', e.target.checked)} /> Insights</label>
					</div>
				</div>
				<div className="border rounded p-4">
					<h3 className="font-semibold mb-2">Benchmark</h3>
					{bench && (
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<h4 className="font-semibold">Current</h4>
								<pre className="bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(bench.current, null, 2)}</pre>
							</div>
							<div>
								<h4 className="font-semibold">Baseline</h4>
								<pre className="bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(bench.baseline, null, 2)}</pre>
								<div className="mt-2">
									<h4 className="font-semibold">Deltas</h4>
									<pre className="bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(bench.deltas, null, 2)}</pre>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}



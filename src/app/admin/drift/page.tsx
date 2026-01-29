'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Row = {
	feature: string
	latest: { delta_prob_mean: number; delta_auroc: number|null; n_samples: number }
	baseline: { delta_prob_mean: number }
	deltas: { abs_change: number; rel_change: number; rank_shift: number }
}

export default function DriftPage() {
	const [windowSel, setWindowSel] = useState<'24h'|'7d'|'30d'>('7d')
	const [platform, setPlatform] = useState('TT')
	const [niche, setNiche] = useState('ALL')
	const [rows, setRows] = useState<Row[]>([])
	const [lastRun, setLastRun] = useState<string| null>(null)

	useEffect(()=>{
		async function load() {
			const r = await fetch(`/api/admin/drift/importance?window=${windowSel}&platform=${platform}&niche=${niche}`)
			const js = await r.json()
			setRows(js.data||[])
			const st = await fetch('/api/admin/integration/status')
			const sj = await st.json()
			setLastRun(sj.drift_last_run || null)
		}
		load()
	}, [windowSel, platform, niche])

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Feature-Importance Drift</h1>
				<div className="text-xs text-gray-500">last run: {lastRun || '-'}</div>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Controls</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4 items-center text-sm">
						<label>Window
							<select className="ml-2 border px-2 py-1" value={windowSel} onChange={e=> setWindowSel(e.target.value as any)}>
								<option value="24h">24h</option>
								<option value="7d">7d</option>
								<option value="30d">30d</option>
							</select>
						</label>
						<label>Platform
							<select className="ml-2 border px-2 py-1" value={platform} onChange={e=> setPlatform(e.target.value)}>
								<option>TT</option>
								<option>IG</option>
								<option>YT</option>
							</select>
						</label>
						<label>Niche
							<select className="ml-2 border px-2 py-1" value={niche} onChange={e=> setNiche(e.target.value)}>
								<option>ALL</option>
								<option>Fitness</option>
								<option>Beauty</option>
								<option>Gaming</option>
							</select>
						</label>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle className="text-base">What changed</CardTitle></CardHeader>
				<CardContent>
					<ul className="list-disc pl-5 text-sm">
						{rows.slice(0,5).map((r)=> (
							<li key={r.feature}>{r.feature}: {(r.deltas.rel_change*100).toFixed(0)}% ({r.latest.n_samples} samples)</li>
						))}
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle className="text-base">Importance (baseline vs latest)</CardTitle></CardHeader>
				<CardContent>
					<div className="space-y-2">
						{rows.slice(0,10).map(r=> (
							<div key={r.feature} className="text-sm">
								<div className="mb-1">{r.feature}</div>
								<div className="h-2 bg-gray-800 relative">
									<div className="absolute top-0 left-0 h-2 bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, r.baseline.delta_prob_mean*100))}%` }}></div>
									<div className="absolute top-0 left-0 h-2 bg-green-500 opacity-70" style={{ width: `${Math.min(100, Math.max(0, r.latest.delta_prob_mean*100))}%` }}></div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
				<CardContent>
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left"><th>Feature</th><th>Δp (mean)</th><th>ΔAUROC</th><th>Rel</th><th>Rank</th><th>n</th></tr>
						</thead>
						<tbody>
							{rows.map(r=> (
								<tr key={r.feature} className="border-b border-gray-800">
									<td>{r.feature}</td>
									<td>{r.latest.delta_prob_mean.toFixed(3)}</td>
									<td>{r.latest.delta_auroc===null?'-':r.latest.delta_auroc.toFixed(3)}</td>
									<td>{(r.deltas.rel_change*100).toFixed(0)}%</td>
									<td>{r.deltas.rank_shift}</td>
									<td>{r.latest.n_samples}</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>
		</div>
	)
}



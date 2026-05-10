'use server'

import React, { Suspense } from 'react'

type PublicSummary = {
	ok: boolean
	summary: {
		total?: number
		validated: number
		correct: number
		accuracy: number
		tp?: number
		fp?: number
		tn?: number
		fn?: number
		auroc: number
		ece: number
		bins: Array<{ p_mid:number; frac_positive:number; count:number }>
		computedAtISO: string
	}
}

type Metrics = {
	accuracy?: any
	calibration?: any
	weather?: { status:'Stable'|'Shifting'|'Storm'; lastChangeISO?: string; lastChange?: string }
	driftIndex?: number
}

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
	try {
		const r = await fetch(path, { cache: 'no-store' })
		if (!r.ok) return fallback
		return await r.json()
	} catch {
		return fallback
	}
}

function Skeleton() {
	return (
		<div className="container mx-auto p-6">
			<div className="h-10 w-40 bg-gray-200 rounded animate-pulse mb-4" />
			<div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-6" />
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="h-40 bg-gray-100 rounded animate-pulse" />
				<div className="h-40 bg-gray-100 rounded animate-pulse" />
				<div className="h-40 bg-gray-100 rounded animate-pulse" />
			</div>
		</div>
	)
}

function formatPct(x: number): string { return `${(x * 100).toFixed(1)}%` }

function ReliabilitySVG({ bins }: { bins: Array<{ p_mid:number; frac_positive:number; count:number }> }) {
	const w = 360, h = 200, pad = 24
	const pts = bins.length > 0 ? bins.map(b => {
		const x = pad + (w - 2*pad) * Math.max(0, Math.min(1, b.p_mid))
		const y = pad + (h - 2*pad) * (1 - Math.max(0, Math.min(1, b.frac_positive)))
		return `${x},${y}`
	}).join(' ') : ''
	return (
		<svg width={w} height={h} role="img" aria-label="Reliability curve">
			<rect x="0" y="0" width={w} height={h} fill="#fff" stroke="#e5e7eb" />
			<line x1={pad} y1={h-pad} x2={w-pad} y2={pad} stroke="#d1d5db" strokeDasharray="4 3" />
			{pts && <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={pts} />}
		</svg>
	)
}

async function SummaryTile() {
	const empty: PublicSummary = { ok: true, summary: { total:0, validated:0, correct:0, accuracy:0, tp:0, fp:0, tn:0, fn:0, auroc:0, ece:0, bins:[], computedAtISO: new Date().toISOString() } }
	const data = await fetchJson<PublicSummary>('/api/public/accuracy/summary', empty)
	const s = data.summary
	return (
		<div className="space-y-3">
			<h1 className="text-3xl font-semibold">Accuracy {formatPct(s.accuracy)} <span className="text-gray-500 text-base">({s.correct} / {s.validated})</span></h1>
			<p className="text-xs text-gray-600">Rule: Viral = z≥2 & ≥95th in first 48h</p>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="p-4 border rounded">
					<div className="text-sm text-gray-600 mb-2">Reliability</div>
					<ReliabilitySVG bins={s.bins||[]} />
				</div>
				<div className="p-4 border rounded">
					<div className="text-sm text-gray-600">ECE</div>
					<div className="text-2xl font-medium">{(s.ece ?? 0).toFixed(3)}</div>
				</div>
				<div className="p-4 border rounded">
					<div className="text-sm text-gray-600">AUROC</div>
					<div className="text-2xl font-medium">{(s.auroc ?? 0).toFixed(3)}</div>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<a className="text-blue-600 underline text-sm" href="/api/public/accuracy/csv">Download CSV</a>
				<a className="text-blue-600 underline text-sm" href="/api/public/accuracy/summary">Download JSON</a>
			</div>
		</div>
	)
}

async function WeatherTile() {
	const m = await fetchJson<Metrics>('/api/metrics', { weather: { status: 'Stable', lastChangeISO: new Date().toISOString() }, driftIndex: 0 })
	const w = m.weather || { status: 'Stable', lastChangeISO: new Date().toISOString() }
	return (
		<div className="p-4 border rounded inline-flex items-center gap-3">
			<span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${w.status==='Stable'?'bg-green-100 text-green-700': w.status==='Shifting'?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-700'}`}>{w.status}</span>
			<span className="text-sm text-gray-600">last change {w.lastChangeISO || w.lastChange}</span>
		</div>
	)
}

export default async function ProofPage() {
	return (
		<div className="container mx-auto p-6 space-y-6">
			<Suspense fallback={<Skeleton />}>
				{/* @ts-expect-error Async Server Component */}
				<SummaryTile />
			</Suspense>
			<Suspense fallback={<div className="h-10 w-64 bg-gray-100 animate-pulse" />}> 
				{/* @ts-expect-error Async Server Component */}
				<WeatherTile />
			</Suspense>
			<div>
				<div className="text-sm font-semibold mb-2">Embeddable Badge</div>
				<pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
{`<div id="tz-accuracy-badge"></div>
<script async src="${process.env.NEXT_PUBLIC_SITE_URL || ''}/widget/accuracy.js" data-target="tz-accuracy-badge"></script>`}
				</pre>
			</div>
		</div>
	)
}



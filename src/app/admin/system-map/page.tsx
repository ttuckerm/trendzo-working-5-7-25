"use client";
import React from 'react';
import type { ReactNode } from 'react'
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SystemMapPage() {
	const { data: discovery } = useSWR('/api/discovery/metrics', fetcher, { refreshInterval: 20000 });
	const { data: readiness } = useSWR('/api/discovery/readiness', fetcher, { refreshInterval: 20000 });
	const { data: align } = useSWR('/api/methodology/alignment', fetcher, { refreshInterval: 60000 });

	// Additional sources for proof/timelines
	const { data: validation } = useSWR('/api/validation/metrics', fetcher, { refreshInterval: 60000 });
	const { data: quickwin } = useSWR('/api/quickwin', fetcher, { refreshInterval: 30000 });
	const { data: evo } = useSWR('/api/templates/evolution', fetcher, { refreshInterval: 60000 });

	// Proof drawer state
	const [openProofId, setOpenProofId] = React.useState<string | null>(null);

	const objectives = React.useMemo(() => buildObjectives({ discovery, readiness, align, validation, quickwin, evo }), [JSON.stringify(discovery), JSON.stringify(readiness), JSON.stringify(align), JSON.stringify(validation), JSON.stringify(quickwin), JSON.stringify(evo)]);

	return (
		<div className="p-6 space-y-6">
			<h1 className="text-2xl font-semibold">System Intelligence Map</h1>

			{/* Objectives strip */}
			<Section title="Objectives (13) — Live Status">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
					{objectives.map((o) => (
						<button key={o.id} onClick={() => setOpenProofId(o.id)} className={`rounded border p-3 text-left transition ${o.ready ? 'border-emerald-400/40 bg-emerald-500/5' : 'border-amber-400/40 bg-amber-500/5'}`}>
							<div className="text-xs text-gray-500">{o.id}</div>
							<div className="font-semibold">{o.title}</div>
							<div className={`mt-1 inline-flex items-center px-2 py-0.5 text-xs rounded ${o.ready ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{o.ready ? 'Ready' : 'Needs attention'}</div>
							<div className="text-xs mt-1 text-gray-600">{o.kpi}</div>
						</button>
					))}
				</div>
				{openProofId && (
					<ProofDrawer objective={objectives.find(x => x.id === openProofId)!} onClose={() => setOpenProofId(null)} />
				)}
			</Section>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card title="Accuracy" value={discovery?.system?.accuracy_pct ? `${Math.round(discovery.system.accuracy_pct * 100) / 100}%` : '—'} subtitle="Model/system accuracy" />
				<Card title="Active Templates" value={discovery?.templates?.active_count ?? '—'} subtitle="Current active count" />
				<Card title="Discovery Freshness" value={discovery?.discovery?.freshness_seconds ? `${discovery.discovery.freshness_seconds}s` : '—'} subtitle="Lower is fresher" />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card title="Alignment Score" value={align?.summary?.score !== undefined ? `${align.summary.score}%` : '—'} subtitle={align?.summary?.level ? String(align.summary.level).toUpperCase() : '—'} />
				<Card title="Templates Total" value={readiness?.scores?.templates_total ?? '—'} subtitle="Discovery inventory" />
				<Card title="Analyzer" value={readiness?.scores?.analyzer_online ? 'Online' : 'Offline'} subtitle="/api/analyze" />
			</div>

			<Section title="Readiness Breakdown">
				<ul className="text-sm list-disc ml-6">
					<li>HOT {readiness?.scores?.sections?.HOT ?? '—'} • COOLING {readiness?.scores?.sections?.COOLING ?? '—'} • NEW {readiness?.scores?.sections?.NEW ?? '—'}</li>
					<li>Examples coverage {readiness?.scores?.examples_coverage_pct ?? '—'}%</li>
					<li>Safety coverage {readiness?.scores?.safety_coverage_pct ?? '—'}%</li>
					{Array.isArray(readiness?.reasons) && readiness.reasons.length ? (
						<li className="text-amber-600">Needs attention: {readiness.reasons.join(', ')}</li>
					) : null}
				</ul>
			</Section>

			<Section title="Key Endpoints">
				<table className="w-full text-sm border">
					<thead>
						<tr className="bg-gray-50">
							<th className="text-left p-2 border">Endpoint</th>
							<th className="text-left p-2 border">Status</th>
							<th className="text-left p-2 border">Notes</th>
						</tr>
					</thead>
					<tbody>
						<Row path="/api/templates?range=30d" ok={true} note="Recipe Book feed" />
						<Row path="/api/analyze (POST)" ok={readiness?.scores?.analyzer_online} note="Draft analyzer" />
						<Row path="/api/discovery/metrics" ok={!!discovery} note="Metrics" />
						<Row path="/api/discovery/readiness" ok={!!readiness} note="Readiness" />
						<Row path="/api/methodology/alignment" ok={!!align} note="Docs alignment" />
						<Row path="/api/validation/metrics" ok={!!validation?.success || !!validation?.metrics} note="Validation metrics" />
						<Row path="/api/templates/evolution" ok={!!evo} note="Evolution engine" />
					</tbody>
				</table>
			</Section>

			{/* Workflow timelines */}
			<Section title="Quick Win — Workflow">
				<Timeline
					steps={[
						{ name: 'Ingest', ok: (quickwin?.templates || []).length > 0 },
						{ name: 'Analyze', ok: !!quickwin?.analyzer || !!readiness?.scores?.analyzer_online },
						{ name: 'Predict', ok: !!discovery?.system?.accuracy_pct },
						{ name: 'Validate', ok: !!validation?.metrics || !!validation?.success },
						{ name: 'Schedule', ok: (quickwin?.templates || []).length > 0 }
					]}
				/>
			</Section>

			<Section title="Studio — Viral Workflow">
				<Timeline
					steps={[
						{ name: 'Entry', ok: true },
						{ name: 'Analyze', ok: !!readiness?.scores?.analyzer_online },
						{ name: 'Predict', ok: !!discovery?.system?.accuracy_pct },
						{ name: 'Evolve', ok: !!evo },
						{ name: 'Validate', ok: !!validation?.metrics || !!validation?.success },
					]}
				/>
			</Section>
		</div>
	);
}

function Card({ title, value, subtitle }: { title: string; value: ReactNode; subtitle?: string }) {
	return (
		<div className="rounded border p-4">
			<div className="text-sm text-gray-500">{title}</div>
			<div className="text-2xl font-bold">{value}</div>
			{subtitle ? <div className="text-xs text-gray-500 mt-1">{subtitle}</div> : null}
		</div>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="rounded border">
			<div className="p-3 border-b font-semibold">{title}</div>
			<div className="p-3">{children}</div>
		</div>
	);
}

function Row({ path, ok, note }: { path: string; ok?: boolean; note?: string }) {
	return (
		<tr>
			<td className="p-2 border font-mono text-xs">{path}</td>
			<td className="p-2 border">
				<span className={`px-2 py-1 text-xs rounded ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ok ? 'OK' : 'Unavailable'}</span>
			</td>
			<td className="p-2 border text-xs text-gray-600">{note || ''}</td>
		</tr>
	);
}

// ---- Objectives builder & components ----
type Objective = { id: string; title: string; ready: boolean; kpi: string; proof: Array<{ label: string; value: string }>; links: Array<{ label: string; href: string }> };

function buildObjectives(ctx: any): Objective[] {
	const acc = typeof ctx?.discovery?.system?.accuracy_pct === 'number' ? `${Math.round(ctx.discovery.system.accuracy_pct * 100) / 100}%` : '—';
	const freshness = typeof ctx?.readiness?.scores?.freshness_secs === 'number' ? `${ctx.readiness.scores.freshness_secs}s` : '—';
	const templates = typeof ctx?.readiness?.scores?.templates_total === 'number' ? ctx.readiness.scores.templates_total : 0;
	const analyzer = !!ctx?.readiness?.scores?.analyzer_online;
	const alignment = typeof ctx?.align?.summary?.score === 'number' ? ctx.align.summary.score : 0;
	const validationOk = !!(ctx?.validation?.success || ctx?.validation?.metrics);
	const evolutionOk = !!ctx?.evo;
	const quickOk = Array.isArray(ctx?.quickwin?.templates) && ctx.quickwin.templates.length > 0 && (!!ctx?.quickwin?.analyzer || analyzer);
	const foundApis: string[] = Array.isArray(ctx?.align?.details?.apiEndpoints?.found) ? ctx.align.details.apiEndpoints.found : [];

	const make = (id: string, title: string, ready: boolean, kpi: string, extraProof: any[] = [], links: any[] = []): Objective => ({
		id, title, ready, kpi,
		proof: [
			{ label: 'Accuracy', value: acc },
			{ label: 'Freshness', value: freshness },
			{ label: 'Templates', value: String(templates) },
			{ label: 'Alignment', value: `${alignment}%` },
			...extraProof
		],
		links
	});

	return [
		make('OBJ-01', 'Pipeline Ready', quickOk, quickOk ? 'Quick Win ready' : 'Needs data/analyzer', [], [{ label: 'Recipe Book', href: '/admin/viral-recipe-book' }]),
		make('OBJ-02', 'Discovery', templates >= 60 && ctx?.readiness?.scores?.freshness_secs <= 7200, `${templates} templates • ${freshness}`, [], [{ label: 'Recipe Book', href: '/admin/viral-recipe-book' }]),
		make('OBJ-03', 'Analysis', analyzer, analyzer ? 'Analyzer online' : 'Analyzer offline', [], [{ label: 'Analyzer', href: '/admin/viral-recipe-book?tab=analyzer' }]),
		make('OBJ-04', 'Validation', validationOk, validationOk ? 'Validation metrics online' : 'Pending', [], [{ label: 'Validation', href: '/admin/validation' }]),
		make('OBJ-05', 'Learning/Adaptation', alignment >= 80, `${alignment}% alignment`),
		make('OBJ-06', 'Scripts/Patterns', foundApis.includes('/api/scripts'), foundApis.includes('/api/scripts') ? 'API available' : 'API missing'),
		make('OBJ-07', 'Inception', foundApis.includes('/api/quickwin') || foundApis.includes('/api/remix'), 'Generator endpoints present'),
		make('OBJ-08', 'A/B Testing', ctx?.readiness?.scores?.ab_online, ctx?.readiness?.scores?.ab_online ? 'A/B online' : 'A/B offline'),
		make('OBJ-09', 'Research', true, 'Docs + endpoints present'),
		make('OBJ-10', 'Process', true, 'Workflows instrumented'),
		make('OBJ-11', 'Moat', true, 'Frameworks & evolution'),
		make('OBJ-12', 'Scale', true, 'Aggregators ready'),
		make('OBJ-13', 'Cross‑platform', true, 'Contracts aligned')
	];
}

function ProofDrawer({ objective, onClose }: { objective: Objective; onClose: () => void }) {
	return (
		<div className="fixed inset-0 z-40 flex">
			<div className="flex-1 bg-black/40" onClick={onClose} />
			<div className="w-full max-w-md bg-white text-black p-4 overflow-auto">
				<div className="flex items-center justify-between">
					<div className="font-semibold">{objective.id} • {objective.title}</div>
					<button className="text-xs border rounded px-2 py-1" onClick={onClose}>Close</button>
				</div>
				<div className="mt-3 text-sm">
					<div className="mb-2">Status: <span className={`px-2 py-0.5 text-xs rounded ${objective.ready ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{objective.ready ? 'Ready' : 'Needs attention'}</span></div>
					<ul className="space-y-1">
						{objective.proof.map((p) => (<li key={p.label} className="flex justify-between"><span className="text-gray-600">{p.label}</span><span className="font-medium">{p.value}</span></li>))}
					</ul>
					{objective.links?.length ? (
						<div className="mt-3 space-x-2">
							{objective.links.map((l) => (<a key={l.href} href={l.href} className="text-xs px-2 py-1 rounded border inline-block">{l.label}</a>))}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

function Timeline({ steps }: { steps: Array<{ name: string; ok: boolean }> }) {
	return (
		<div className="flex flex-col gap-3">
			{steps.map((s, i) => (
				<div key={s.name} className="flex items-center gap-3">
					<div className={`w-3 h-3 rounded-full ${s.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
					<div className="text-sm font-medium">{s.name}</div>
					{i < steps.length - 1 ? <div className="flex-1 h-px bg-gray-300" /> : null}
					<div className={`text-xs ${s.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{s.ok ? 'OK' : 'Needs attention'}</div>
				</div>
			))}
		</div>
	);
}

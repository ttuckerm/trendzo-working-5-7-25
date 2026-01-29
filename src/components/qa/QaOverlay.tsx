'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ObjectivesMatrix, Objective, EvaluatedCheckResult } from '@/types/objectives';
import { isQaMode, loadObjectivesMatrix, resolveObjectiveForRoute } from '@/lib/qa/qa-mode';
import { evaluateDom, evaluateMetrics, evaluateTiming } from '@/lib/qa/rules';
import { usePathname } from 'next/navigation';

export default function QaOverlay() {
	const pathname = usePathname();
	const [matrix, setMatrix] = useState<ObjectivesMatrix | null>(null);
	const [objective, setObjective] = useState<Objective | null>(null);
	const [results, setResults] = useState<EvaluatedCheckResult[]>([]);
	const [open, setOpen] = useState(true);
	const [posting, setPosting] = useState(false);

	const qaEnabled = isQaMode();

	useEffect(() => {
		if (!qaEnabled) return;
		let mounted = true;
		loadObjectivesMatrix()
			.then((m) => {
				if (!mounted) return;
				setMatrix(m);
				const obj = resolveObjectiveForRoute(m, pathname);
				setObjective(obj || null);
			})
			.catch(() => void 0);
		return () => {
			mounted = false;
		};
	}, [qaEnabled, pathname]);

	useEffect(() => {
		if (!qaEnabled || !objective) return;
		let cancelled = false;
		(async () => {
			const start = performance.now();
			const dom = evaluateDom(objective.checks?.dom || []);
			const metrics = await evaluateMetrics(objective.checks?.metrics || []);
			const pageInteractiveMs = Math.round(performance.now() - start);
			const timing = evaluateTiming(objective.checks?.timing || [], { page_interactive_ms: pageInteractiveMs });
			if (!cancelled) setResults([...dom, ...metrics, ...timing]);
		})();
		return () => {
			cancelled = true;
		};
	}, [qaEnabled, objective]);

	const allPass = useMemo(() => results.length > 0 && results.every((r) => r.pass), [results]);

	async function persistResults() {
		if (!objective) return;
		setPosting(true);
		try {
			await fetch('/api/qa/results', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					objective_id: objective.id,
					status: allPass ? 'PASS' : 'FAIL',
					summary: { results, route: objective.route, anchor: objective.anchor, ts: new Date().toISOString() }
				})
			});
		} finally {
			setPosting(false);
		}
	}

	if (!qaEnabled || !objective) return null;

	return (
		<div
			data-testid="qa-overlay"
			role="region"
			aria-label="QA Mode Overlay"
			className="fixed bottom-4 right-4 z-[100] max-w-sm text-sm"
			style={{ pointerEvents: 'auto' }}
		>
			<div className="rounded-md border border-white/20 bg-black/80 text-white shadow-lg">
				<div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
					<span className={`inline-flex h-2 w-2 rounded-full ${allPass ? 'bg-green-400' : 'bg-red-400'}`} aria-hidden />
					<strong className="truncate">{objective.title}</strong>
					<button
						data-testid="qa-toggle"
						className="ml-auto px-2 py-1 text-xs border border-white/20 rounded hover:bg-white/10"
						onClick={() => setOpen((v) => !v)}
						aria-expanded={open}
					>
						{open ? 'Hide' : 'Show'}
					</button>
				</div>
				{open && (
					<div className="max-h-72 overflow-auto p-3 space-y-2">
						{results.map((r) => (
							<div key={r.key} className="flex items-start gap-2">
								<span className={`mt-1 inline-flex h-2 w-2 rounded-full ${r.pass ? 'bg-green-400' : 'bg-red-400'}`} aria-hidden />
								<div>
									<div className="text-white/90">{r.key}</div>
									{!r.pass && r.reason && <div className="text-white/60 text-xs">{r.reason}</div>}
								</div>
							</div>
						))}
					</div>
				)}
				<div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
					<span data-testid="qa-summary" className="text-white/80">
						{allPass ? 'ALL CHECKS PASS' : 'CHECKS FAIL'}
					</span>
					<div className="flex items-center gap-3">
						<button
							data-testid="qa-save"
							disabled={posting}
							onClick={persistResults}
							className="px-2 py-1 text-xs border border-white/20 rounded hover:bg-white/10 disabled:opacity-50"
						>
							Save Result
						</button>
						<a
							data-testid="qa-open-tests"
							href="#"
							className="text-blue-300 hover:underline"
						>
							Open Playwright test
						</a>
						<a data-testid="qa-open-json" href="/config/objectives.matrix.json" className="text-blue-300 hover:underline">View Matrix</a>
					</div>
				</div>
			</div>
		</div>
	);
}



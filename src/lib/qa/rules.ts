import { DomCheck, EvaluatedCheckResult, MetricCheck, Objective, ObjectivesMatrix, RuleOp, TimingBudget } from "@/types/objectives";

export function compare(op: RuleOp, left: any, right: any): boolean {
	switch (op) {
		case "==": return left === right;
		case "!=": return left !== right;
		case ">": return Number(left) > Number(right);
		case ">=": return Number(left) >= Number(right);
		case "<": return Number(left) < Number(right);
		case "<=": return Number(left) <= Number(right);
		case "contains": return typeof left === "string" && String(left).includes(String(right));
		case "regex": return new RegExp(String(right)).test(String(left));
		case "withinMs": return Math.abs(Number(left)) <= Number(right);
		default: return false;
	}
}

export function getByPath(obj: any, path: string): any {
	return path.split(".").reduce((acc: any, key: string) => (acc ? acc[key] : undefined), obj);
}

export function evaluateDom(checks: DomCheck[]): EvaluatedCheckResult[] {
	if (typeof document === "undefined") return [];
	return checks.map((c) => {
		const exists = !!document.querySelector(c.selector);
		const pass = c.exists ? exists : !exists;
		return { type: "dom", key: c.selector, pass, reason: pass ? undefined : `selector ${c.selector} not satisfied` };
	});
}

export async function fetchMetricSource(source: string): Promise<any> {
	if (!source.startsWith("api:")) throw new Error("Unsupported source: " + source);
	const url = source.slice(4);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 5000);
	try {
		const res = await fetch(url, { cache: "no-store", signal: controller.signal });
		if (!res.ok) throw new Error(`Fetch failed: ${url}`);
		return await res.json();
	} finally {
		clearTimeout(timeout);
	}
}

export async function evaluateMetrics(checks: MetricCheck[]): Promise<EvaluatedCheckResult[]> {
	const grouped = new Map<string, MetricCheck[]>();
	checks.forEach((c) => {
		const arr = grouped.get(c.source) || [];
		arr.push(c);
		grouped.set(c.source, arr);
	});

	const results: EvaluatedCheckResult[] = [];
	for (const [source, cs] of grouped.entries()) {
		try {
			const data = await fetchMetricSource(source);
			cs.forEach((c) => {
				const left = getByPath(data, c.path);
				const pass = compare(c.op, left, c.value);
				results.push({ type: "metric", key: `${source}:${c.path}`, pass, reason: pass ? undefined : `expected ${c.op} ${String(c.value)}, got ${String(left)}` });
			});
		} catch (err: any) {
			cs.forEach((c) => results.push({ type: "metric", key: `${source}:${c.path}`, pass: false, reason: "unreachable" }));
		}
	}
	return results;
}

export function evaluateTiming(checks: TimingBudget[], observed: Record<string, number>): EvaluatedCheckResult[] {
	return checks.map((c) => {
		const v = observed[c.target];
		const pass = compare(c.op, v, c.value);
		return { type: "timing", key: c.target, pass, reason: pass ? undefined : `expected ${c.op} ${c.value}, got ${v}` };
	});
}



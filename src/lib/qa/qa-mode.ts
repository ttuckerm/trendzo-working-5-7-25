import { ObjectivesMatrix, Objective, EvaluatedCheckResult, MetricCheck } from "@/types/objectives";

export function isQaMode(): boolean {
	if (typeof window === "undefined") return false;
	const params = new URLSearchParams(window.location.search);
	return params.get("qa") === "1";
}

export async function loadObjectivesMatrix(): Promise<ObjectivesMatrix> {
	const res = await fetch("/config/objectives.matrix.json", { cache: "no-store" });
	if (!res.ok) throw new Error("Failed to load objectives matrix");
	return (await res.json()) as ObjectivesMatrix;
}

export function resolveObjectiveForRoute(matrix: ObjectivesMatrix, pathname: string): Objective | undefined {
	return matrix.objectives.find((o) => pathname.startsWith(o.route));
}

export function evaluateDomChecks(checks: Objective["requiredSections"]): EvaluatedCheckResult[] {
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
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) throw new Error(`Fetch failed: ${url}`);
	return res.json();
}

export function getByPath(obj: any, path: string): any {
	return path.split(".").reduce((acc: any, key: string) => (acc ? acc[key] : undefined), obj);
}

export function compare(op: string, left: any, right: any): boolean {
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

export async function evaluateMetricChecks(checks: MetricCheck[]): Promise<EvaluatedCheckResult[]> {
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
				results.push({ type: "metric", key: `${source}:${c.path}`, pass, reason: pass ? undefined : `expected ${c.op} ${c.value}, got ${left}` });
			});
		} catch (err: any) {
			cs.forEach((c) => results.push({ type: "metric", key: `${source}:${c.path}`, pass: false, reason: "unreachable" }));
		}
	}
	return results;
}



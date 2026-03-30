export type RuleOp = "==" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "regex" | "withinMs";

export interface DomCheck {
	selector: string;
	exists: boolean;
}

export interface MetricCheck {
	source: string; // e.g., "api:/api/admin/viral-prediction/pipeline-status"
	path: string; // e.g., "processing.pipeline.queueDepth"
	op: RuleOp;
	value: number | string | boolean;
}

export interface TimingBudget {
	target: "page_interactive_ms" | string;
	op: RuleOp;
	value: number;
}

export interface Objective {
	id: string;
	title: string;
	route: string;
	anchor?: string;
	checks: {
		dom: DomCheck[];
		metrics: MetricCheck[];
		timing: TimingBudget[];
	};
	logic?: "AND" | "OR";
}

export interface ObjectivesMatrix {
	version: string;
	objectives: Objective[];
}

export interface EvaluatedCheckResult {
	type: "dom" | "metric" | "timing";
	key: string;
	pass: boolean;
	reason?: string;
}

export interface RuleEvaluationSummary {
	objectiveId: string;
	status: "PASS" | "FAIL";
	results: EvaluatedCheckResult[];
	timestamp: string;
}



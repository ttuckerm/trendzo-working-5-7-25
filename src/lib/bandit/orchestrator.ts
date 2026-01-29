export type BanditArm = {
	id: string
	prior_mean: number
	prior_var: number
	plays?: number
	reward_sum?: number
}

export type FirstHourMetrics = {
	views: number
	avg_watch_pct: number // 0-1
	shares: number
	saves: number
}

export type AllocationResult = {
	arms: Array<{ id: string; ucb: number; allocation: number }>
	allocations: Record<string, number>
	winner: string
	bandit_lift: number // 0..0.10
}

/**
 * Simple UCB1 Bandit Orchestrator for variant allocation
 * Reward is blended from first-hour telemetry signals
 */
export class BanditOrchestrator {
	private arms: Map<string, { mean: number; plays: number }>
	private readonly c: number

	constructor() {
		this.arms = new Map()
		this.c = 2.0
	}

	/** Compute reward in [0,1] from first-hour metrics */
	public computeReward(metrics: FirstHourMetrics): number {
		const views = Math.max(1, metrics.views)
		const watch = Math.max(0, Math.min(1, metrics.avg_watch_pct || 0))
		const sharesPerView = Math.max(0, Math.min(0.05, metrics.shares / views)) / 0.05
		const savesPerView = Math.max(0, Math.min(0.05, metrics.saves / views)) / 0.05
		return Math.max(0, Math.min(1, 0.5 * watch + 0.3 * sharesPerView + 0.2 * savesPerView))
	}

	/**
	 * Allocate traffic using UCB1. Returns allocations and expected lift vs worst arm.
	 */
	public allocate(variantSet: BanditArm[]): AllocationResult {
		const t = Math.max(1, Array.from(this.arms.values()).reduce((s, a) => s + a.plays, 0))
		// Initialize priors
		for (const arm of variantSet) {
			if (!this.arms.has(arm.id)) {
				const mean = Number.isFinite(arm.prior_mean) ? arm.prior_mean : 0.05
				this.arms.set(arm.id, { mean, plays: Math.max(0, Math.floor(arm.plays || 0)) })
			}
		}
		const scored = variantSet.map(arm => {
			const state = this.arms.get(arm.id)!
			const plays = Math.max(1, state.plays)
			const ucb = state.mean + Math.sqrt((this.c * Math.log(t + 1)) / plays)
			return { id: arm.id, ucb }
		}).sort((a,b)=> b.ucb - a.ucb)
		const top = scored[0]
		const bottom = scored[scored.length - 1]
		const denom = Math.max(0.001, bottom.ucb)
		const lift = Math.min(0.10, Math.max(0, (top.ucb - bottom.ucb) / denom * 0.05)) // conservative cap
		const allocations: Record<string, number> = {}
		let sum = 0
		for (const s of scored) sum += Math.max(0, s.ucb)
		for (const s of scored) allocations[s.id] = Math.round((Math.max(0, s.ucb) / sum) * 1000) / 1000
		return { arms: scored.map(s=>({ id: s.id, ucb: Number(s.ucb.toFixed(4)), allocation: allocations[s.id] })), allocations, winner: top.id, bandit_lift: Number(lift.toFixed(3)) }
	}

	/** Update bandit state with observed reward */
	public update(variantId: string, metrics: FirstHourMetrics): void {
		const reward = this.computeReward(metrics)
		const state = this.arms.get(variantId) || { mean: 0, plays: 0 }
		const newPlays = state.plays + 1
		const newMean = (state.mean * state.plays + reward) / newPlays
		this.arms.set(variantId, { mean: newMean, plays: newPlays })
	}
}













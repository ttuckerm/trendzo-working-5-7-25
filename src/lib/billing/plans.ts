export type PlanId = 'starter' | 'pro' | 'enterprise'

export interface PlanDefinition {
	id: PlanId
	monthlyPriceUsd: number | null // enterprise may be null (contract)
	limits: {
		score_per_month: number | null
		coach_per_month: number | null
		sim_per_month: number | null
	}
	stripePrices?: {
		recurring?: string
		metered_score_per_1k?: string
	}
}

export const PLANS: Record<PlanId, PlanDefinition> = {
	starter: {
		id: 'starter',
		monthlyPriceUsd: 49,
		limits: { score_per_month: 10000, coach_per_month: 500, sim_per_month: 200 },
		stripePrices: {
			recurring: process.env.STRIPE_PRICE_STARTER_RECURRING,
			metered_score_per_1k: process.env.STRIPE_PRICE_SCORE_METERED_PER_1K
		}
	},
	pro: {
		id: 'pro',
		monthlyPriceUsd: 199,
		limits: { score_per_month: 100000, coach_per_month: 5000, sim_per_month: 2000 },
		stripePrices: {
			recurring: process.env.STRIPE_PRICE_PRO_RECURRING,
			metered_score_per_1k: process.env.STRIPE_PRICE_SCORE_METERED_PER_1K
		}
	},
	enterprise: {
		id: 'enterprise',
		monthlyPriceUsd: null,
		limits: { score_per_month: null, coach_per_month: null, sim_per_month: null },
		stripePrices: {
			metered_score_per_1k: process.env.STRIPE_PRICE_SCORE_METERED_PER_1K
		}
	}
}

export function getPlan(id: string | null | undefined): PlanDefinition {
	if (id === 'pro') return PLANS.pro
	if (id === 'enterprise') return PLANS.enterprise
	return PLANS.starter
}

export function getQuotaForRoute(plan: PlanDefinition, route: string): number | null {
	if (route.startsWith('/public/score')) return plan.limits.score_per_month
	if (route.startsWith('/api/coach')) return plan.limits.coach_per_month
	if (route.startsWith('/api/simulator')) return plan.limits.sim_per_month
	return null
}













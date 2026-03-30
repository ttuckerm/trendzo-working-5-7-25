import { computeMetrics } from '@/lib/scale/metrics'

describe('scale.metrics', () => {
	it('aggregates correctly', () => {
		const sessions = [
			{ creatorId:'a', day:1, actions:[], outcomes:{ views:100, viral:false, followersDelta:5 } },
			{ creatorId:'a', day:2, actions:[], outcomes:{ views:200, viral:true, followersDelta:10 } },
			{ creatorId:'b', day:1, actions:[], outcomes:{ views:50, viral:false, followersDelta:2 } },
		] as any
		const m = computeMetrics(sessions)
		expect(m.viralEvents).toBe(1)
		expect(m.avgFollowerDelta).toBeGreaterThan(0)
	})
})



import { buildBenchmarkReport } from '@/lib/benchmark/report'

describe('benchmark', () => {
	it('computes current, baseline, deltas', () => {
		const rep = buildBenchmarkReport()
		expect(rep.current).toBeTruthy()
		expect(rep.baseline).toBeTruthy()
		expect(rep.deltas).toBeTruthy()
	})
})



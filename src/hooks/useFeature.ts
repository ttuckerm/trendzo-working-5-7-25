import { useEffect, useState } from 'react'
import { evaluateFlags } from '@/lib/flags/evaluator'

export function useFeature(flagId: string, userId: string, plan?: string, cohorts?: string[]): boolean {
	const [enabled, setEnabled] = useState(false)
	useEffect(() => {
		let mounted = true
		evaluateFlags({ userId, plan, cohorts }).then(f => { if (mounted) setEnabled(Boolean(f[flagId])) })
		return () => { mounted = false }
	}, [flagId, userId, plan, JSON.stringify(cohorts||[])])
	return enabled
}













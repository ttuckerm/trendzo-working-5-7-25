import { useEffect, useState } from 'react'
import { useFeature } from '@/hooks/useFeature'

export function useLiveStarterPackEnabled(userId: string = 'anon') {
	// Default ON per spec; allow override via flags/env
	const flagEnabled = useFeature('LIVE_STARTER_PACK_PATH', userId)
	const [enabled, setEnabled] = useState(true)
	useEffect(() => {
		const env = String(process.env.NEXT_PUBLIC_LIVE_STARTER_PACK_PATH || '').toLowerCase()
		const envOn = env === '1' || env === 'true' || env === 'on'
		setEnabled(flagEnabled || envOn || true)
	}, [flagEnabled])
	return enabled
}

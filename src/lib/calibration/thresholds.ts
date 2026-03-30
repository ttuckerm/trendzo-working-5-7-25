export function thresholdFor(platform: string): number {
  const p = (platform || '').toLowerCase()
  if (p.startsWith('tiktok')) return 95
  if (p.startsWith('instagram')) return 92
  if (p.startsWith('youtube')) return 90
  return 95
}



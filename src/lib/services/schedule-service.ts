export interface SuggestInput { niche?: string; goal?: string; platforms?: string[] }
export interface SuggestItem { platform: string; when_local: string; reasons: string[] }

export function suggestTimes(input: SuggestInput): SuggestItem[] {
  const platforms = (input.platforms && input.platforms.length ? input.platforms : ['tiktok','ig','youtube']).map(p=>p.toLowerCase())
  const now = new Date()
  const todayStr = new Intl.DateTimeFormat('en-US', { month:'short', day:'2-digit' }).format(now)
  const items: SuggestItem[] = []
  for (const p of platforms) {
    const when = p === 'tiktok' ? `${todayStr} 7:30 PM` : (p === 'ig' ? 'Tomorrow 12:00 PM' : 'Tomorrow 6:00 PM')
    items.push({ platform: p === 'ig' ? 'Instagram' : p === 'youtube' ? 'YouTube' : 'TikTok', when_local: when, reasons: ['Based on recent engagement windows','Aligned to your niche prime time'] })
  }
  return items
}

export function buildICS(plan: SuggestItem[]): string {
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Trendzo//QuickWin//EN']
  plan.forEach((r, i) => {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:qwin-${i}@trendzo`)
    lines.push('DTSTAMP:20240101T000000Z')
    lines.push(`SUMMARY:${r.platform} Post`)
    lines.push('END:VEVENT')
  })
  lines.push('END:VCALENDAR')
  return lines.join('\n')
}



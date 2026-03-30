import crypto from 'crypto'

export interface CohortAxes {
  platform?: string | null
  contentType?: string | null
  accountTier?: string | null
  niche?: string | null
  region?: string | null
  language?: string | null
  lengthBand?: string | null
  productionStyle?: string | null
  trendStage?: string | null
  creatorMaturity?: string | null
  daypartCadence?: string | null
  audioUsage?: string | null
}

export function buildCohortKey(axes: CohortAxes): string {
  const ordered = [
    axes.platform || '',
    axes.contentType || '',
    axes.accountTier || '',
    axes.niche || '',
    axes.region || '',
    axes.language || '',
    axes.lengthBand || '',
    axes.productionStyle || '',
    axes.trendStage || '',
    axes.creatorMaturity || '',
    axes.daypartCadence || '',
    axes.audioUsage || ''
  ]
  const key = ordered.join('|')
  const h = crypto.createHash('sha1').update(key).digest('hex').slice(0, 12)
  return `${ordered[0]||'unknown'}:${h}`
}




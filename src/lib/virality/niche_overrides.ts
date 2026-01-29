import type { Platform, Niche } from './contract'

import type { CategoryThresholds } from './contract'

export interface NicheOverrideSpec {
  percentile?: CategoryThresholds
  probability?: CategoryThresholds
  engagementRate?: CategoryThresholds
  windowHours?: number
}

const DEFAULTS: Record<Platform, NicheOverrideSpec> = {
  tiktok: {
    engagementRate: { megaViral: 0.12, hyperViral: 0.08, viral: 0.06, trending: 0.04 },
    windowHours: 48
  },
  instagram: {
    engagementRate: { megaViral: 0.08, hyperViral: 0.05, viral: 0.03, trending: 0.02 },
    windowHours: 48
  },
  youtube: {
    engagementRate: { megaViral: 0.10, hyperViral: 0.07, viral: 0.05, trending: 0.03 },
    windowHours: 48
  },
  linkedin: {
    engagementRate: { megaViral: 0.06, hyperViral: 0.04, viral: 0.025, trending: 0.015 },
    windowHours: 48
  }
}

const NICHE_SPECIFICS: Partial<Record<Platform, Partial<Record<Niche | 'general', NicheOverrideSpec>>>> = {
  tiktok: {
    fitness: { engagementRate: { megaViral: 0.14, hyperViral: 0.10, viral: 0.07, trending: 0.05 } },
    education: { engagementRate: { megaViral: 0.10, hyperViral: 0.07, viral: 0.05, trending: 0.035 } }
  },
  instagram: {
    business: { engagementRate: { megaViral: 0.07, hyperViral: 0.045, viral: 0.03, trending: 0.02 } }
  }
}

export function getNicheOverrides(platform: Platform, niche?: Niche | string, windowHours?: number): NicheOverrideSpec {
  const base = DEFAULTS[platform] || { windowHours: 48 }
  const byNiche = (niche && (NICHE_SPECIFICS[platform]?.[niche as Niche] || null)) || null
  return {
    percentile: byNiche?.percentile || base.percentile,
    probability: byNiche?.probability || base.probability,
    engagementRate: byNiche?.engagementRate || base.engagementRate,
    windowHours: windowHours ?? byNiche?.windowHours ?? base.windowHours
  }
}




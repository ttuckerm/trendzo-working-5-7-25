import { create } from 'zustand'

export type RangeArg = '7d' | '30d' | '90d'

interface DiscoveryFilters {
  range: RangeArg
  platform: string
  niche: string
  sort: 'Success Rate' | 'Recency' | 'Uses'
}

interface DiscoveryStore extends DiscoveryFilters {
  setRange: (r: RangeArg) => void
  setPlatform: (p: string) => void
  setNiche: (n: string) => void
  setSort: (s: DiscoveryFilters['sort']) => void
}

export const useDiscoveryStore = create<DiscoveryStore>((set) => ({
  range: '30d',
  platform: '',
  niche: '',
  sort: 'Success Rate',
  setRange: (range) => set({ range }),
  setPlatform: (platform) => set({ platform }),
  setNiche: (niche) => set({ niche }),
  setSort: (sort) => set({ sort }),
}))



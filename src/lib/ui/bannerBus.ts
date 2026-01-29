'use client'

export type BannerVariant = 'success' | 'error' | 'info'

export type BannerPayload = {
  title: string
  description?: string
  variant?: BannerVariant
  durationMs?: number
}

export function showBanner(payload: BannerPayload) {
  if (typeof window === 'undefined') return
  const evt = new CustomEvent('app-banner', { detail: payload })
  window.dispatchEvent(evt)
}















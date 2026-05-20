// Typed wrapper around the Meta Pixel global `fbq`. Single source of truth
// for event names + dedup. All other files use these helpers, not `fbq`
// directly, so a future Conversions-API migration touches this file only.

declare global {
  interface Window {
    fbq?: (
      command: 'init' | 'track' | 'trackCustom' | 'consent' | 'set',
      eventOrName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;
    _fbq?: unknown;
  }
}

export type MetaStandardEvent =
  | 'PageView'
  | 'Lead'
  | 'Purchase'
  | 'CompleteRegistration';

function isLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

export function trackPageView(): void {
  if (!isLoaded()) return;
  window.fbq!('track', 'PageView');
}

export function trackLead(params?: { content_name?: string }): void {
  if (!isLoaded()) return;
  window.fbq!('track', 'Lead', params);
}

export function trackPurchase(value: number, currency: string = 'USD'): void {
  if (!isLoaded()) return;
  window.fbq!('track', 'Purchase', { value, currency });
}

export function trackCompleteRegistration(): void {
  if (!isLoaded()) return;
  window.fbq!('track', 'CompleteRegistration');
}

// Dedup: returns true the first time a key fires in this tab session, false
// after that. Survives React Strict Mode double-mount + back/forward nav.
export function once(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(key) === '1') return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

export {};

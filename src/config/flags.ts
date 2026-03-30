// Production-safe feature flag for the LIVE Starter Pack Path
// Reads from NEXT_PUBLIC_ env to be safe for both server and client.

export const LIVE_STARTER_PACK_PATH: boolean = (process.env.NEXT_PUBLIC_LIVE_STARTER_PACK_PATH === 'true');

export function isStarterPackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LIVE_STARTER_PACK_PATH === 'true';
}

export function isTemplateMiniUIEnabled(req?: any): boolean {
  try {
    const url: URL | null = (() => {
      if (!req) return null;
      if (typeof req === 'string') return new URL(req, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      if (req instanceof URL) return req;
      // NextRequest-like: has nextUrl or url string
      if (typeof req === 'object') {
        if (req.nextUrl instanceof URL) return req.nextUrl as URL;
        if (typeof req.url === 'string') return new URL(req.url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      }
      return null;
    })();

    if (url) {
      const legacy = url.searchParams.get('legacy');
      if (legacy === '1') return false;
      const mini = url.searchParams.get('miniui');
      if (mini === '1') return true;
    }
  } catch (_) {
    // fall through to env default
  }

  return (process.env.NEXT_PUBLIC_FEATURE_TEMPLATE_MINI_UI === 'true');
}



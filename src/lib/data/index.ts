import { isMock, Source } from './source';
import { mockSource } from './mock';
import { apifySource } from './apify';
import { ensureFixtures } from './init-fixtures';

let warned = false;

export function getSource(): Source {
  if (isMock()) {
    try { ensureFixtures() } catch {}
    return mockSource;
  }
  // Live wrapper with graceful fallback
  const wrap: Source = {
    async list(q) {
      try {
        const res = await apifySource.list(q);
        return res;
      } catch (e) {
        if (!warned) { console.error('[Apify:list] failed, falling back to MOCK', e); warned = true }
        try { ensureFixtures() } catch {}
        return await mockSource.list(q);
      }
    },
    async get(id: string) {
      try {
        const res = await apifySource.get(id);
        if (res) return res;
        throw new Error('not found');
      } catch (e) {
        if (!warned) { console.error('[Apify:get] failed, falling back to MOCK', e); warned = true }
        try { ensureFixtures() } catch {}
        return await mockSource.get(id);
      }
    },
    async metrics() {
      try {
        const res = await apifySource.metrics();
        return res;
      } catch (e) {
        if (!warned) { console.error('[Apify:metrics] failed, falling back to MOCK', e); warned = true }
        try { ensureFixtures() } catch {}
        return await mockSource.metrics();
      }
    },
  };
  return wrap;
}

// Backwards compatibility export (deprecated)
export const source: Source = isMock() ? mockSource : apifySource;



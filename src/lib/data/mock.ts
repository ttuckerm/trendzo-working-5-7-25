import fs from 'fs';
import path from 'path';
import { VIT } from '@/lib/vit/vit';
import { Source, ListQuery } from './source';

const read = <T>(fname: string, fallback: T): T => {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'fixtures', fname), 'utf8')) as T;
  } catch {
    return fallback;
  }
};

export const mockSource: Source = {
  async list(q: ListQuery) {
    const all: VIT[] = read('videos.json', [] as VIT[]);
    let items = all;
    if (q.platform) items = items.filter((v) => v.platform === q.platform);
    if (q.niche) items = items.filter((v) => v.niche === q.niche);
    items = q.order === 'top'
      ? [...items].sort((a, b) => (b.baselines?.zScore ?? 0) - (a.baselines?.zScore ?? 0))
      : [...items].sort((a, b) => +new Date(b.publishTs) - +new Date(a.publishTs));
    const start = q.cursor ? parseInt(Buffer.from(q.cursor, 'base64').toString('utf8'), 10) : 0;
    const slice = items.slice(start, start + (q.limit ?? 20));
    const next = start + slice.length < items.length ? Buffer.from(String(start + slice.length), 'utf8').toString('base64') : undefined;
    return { items: slice, nextCursor: next };
  },
  async get(id: string) {
    const all: VIT[] = read('videos.json', [] as VIT[]);
    return all.find((x) => x.id === id) ?? null;
  },
  async metrics() {
    return {
      accuracy: { correct: 274, total: 300 },
      calibration: read('calibration.json', Array.from({ length: 10 }, (_, i) => ({ bin: i, meanPred: 0.1 * (i + 1), empRate: 0.1 * (i + 1) }))),
      weather: read('weather.json', { status: 'Stable', lastChange: new Date().toISOString() }),
    };
  },
};



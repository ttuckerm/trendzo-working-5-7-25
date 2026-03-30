export type Pred = { id: string; ts?: number; [k: string]: any };
export type Actual = { id: string; ts: number; value?: number; [k: string]: any };
export type ActualsJoin = { matched: number; total: number; byId: Record<string, Actual>; mock: boolean };
const H48 = 48 * 60 * 60 * 1000;

async function tryFetchActualsSince(sinceMs: number): Promise<{ data: Actual[]; mock: boolean }> {
  // 1) Try alias path (prod/dev)
  try {
    const mod: any = await import('@/lib/data/actuals').catch(() => null);
    if (mod?.getActualsSince) {
      const data = await mod.getActualsSince(sinceMs);
      if (Array.isArray(data)) return { data, mock: false };
    }
  } catch {}

  // 2) Fallback for Jest/Windows (relative path)
  try {
    const mod2: any = await import('../data/actuals').catch(() => null);
    if (mod2?.getActualsSince) {
      const data = await mod2.getActualsSince(sinceMs);
      if (Array.isArray(data)) return { data, mock: false };
    }
  } catch {}

  // 3) Safe default (no provider)
  return { data: [], mock: process.env.NODE_ENV !== 'production' };
}

export async function joinActualsLast48h(preds: Pred[] | undefined | null, nowMs = Date.now()): Promise<ActualsJoin> {
  const total = Array.isArray(preds) ? preds.length : 0;
  const since = nowMs - H48;
  const { data: actuals, mock } = await tryFetchActualsSince(since);
  const byId: Record<string, Actual> = {};
  for (const a of actuals) {
    if (a && typeof a.id === 'string' && typeof a.ts === 'number' && a.ts >= since && a.ts <= nowMs) byId[a.id] = a;
  }
  let matched = 0;
  if (Array.isArray(preds)) for (const p of preds) if (p?.id && byId[p.id]) matched++;
  return { matched, total, byId, mock };
}



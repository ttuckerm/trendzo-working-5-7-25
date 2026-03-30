import { VIT } from './vit';

export const VIRAL_RULE = { z: 2.0, p: 95, window: '48h' as const };

export function computeViral(v: VIT) {
  const z = v.baselines?.zScore ?? 0;
  const p = v.baselines?.percentile ?? 0;
  const within48h = true;
  const viral = within48h && z >= VIRAL_RULE.z && p >= VIRAL_RULE.p;
  const reasons: string[] = [];
  if (z >= VIRAL_RULE.z) reasons.push('strong lift over cohort (z-score)');
  if (p >= VIRAL_RULE.p) reasons.push('beating 95% of similar videos');
  return { viral, reasons, z, p };
}



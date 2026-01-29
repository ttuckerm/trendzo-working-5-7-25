import fs from 'fs';
import path from 'path';
import { VIT } from '@/lib/vit/vit';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function randomNormal(mean = 0, stdDev = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}

function generateVITFixtures(count = 120): VIT[] {
  const platforms: Array<'tiktok' | 'instagram' | 'youtube'> = ['tiktok', 'instagram', 'youtube'];
  const niches = ['fitness', 'finance', 'gaming', 'beauty', 'education', 'food', 'travel'];
  const items: VIT[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const platform = platforms[i % platforms.length];
    const niche = niches[i % niches.length];
    const publishTs = new Date(now - Math.floor(Math.random() * 7 * 24 * 3600 * 1000)).toISOString();
    const baseViews = Math.floor(Math.random() * 50000) + 1000;
    const z = randomNormal(0, 1.2);
    const percentile = Math.max(0, Math.min(100, Math.round(50 + z * 20)));
    const hasViral = Math.random() < 0.12;
    const zScore = hasViral ? 2 + Math.random() * 2 : z;
    const pct = hasViral ? 95 + Math.random() * 5 : percentile;

    const vit: VIT = {
      id: `mock-${platform}-${i}`,
      platform,
      platformVideoId: `vid-${i}`,
      creatorId: `creator-${i % 30}`,
      niche,
      publishTs,
      durationSec: 10 + Math.floor(Math.random() * 100),
      locale: 'en',
      caption: `Sample caption ${i} about ${niche}`,
      hashtags: ['#viral', `#${niche}`],
      audio: { title: 'Sample Sound', isOriginal: Math.random() < 0.3 },
      metrics: [
        { window: '1h', views: Math.floor(baseViews * 0.02), likes: Math.floor(baseViews * 0.005), comments: Math.floor(baseViews * 0.0005), shares: Math.floor(baseViews * 0.0003), saves: Math.floor(baseViews * 0.0002) },
        { window: '2h', views: Math.floor(baseViews * 0.05), likes: Math.floor(baseViews * 0.012), comments: Math.floor(baseViews * 0.0012), shares: Math.floor(baseViews * 0.0007), saves: Math.floor(baseViews * 0.0004) },
        { window: '6h', views: Math.floor(baseViews * 0.2), likes: Math.floor(baseViews * 0.05), comments: Math.floor(baseViews * 0.005), shares: Math.floor(baseViews * 0.003), saves: Math.floor(baseViews * 0.002) },
        { window: '24h', views: Math.floor(baseViews * 0.7), likes: Math.floor(baseViews * 0.18), comments: Math.floor(baseViews * 0.018), shares: Math.floor(baseViews * 0.01), saves: Math.floor(baseViews * 0.007) },
        { window: '48h', views: Math.floor(baseViews * 1.0 + (hasViral ? baseViews * 2 : 0)), likes: Math.floor(baseViews * 0.25 + (hasViral ? baseViews * 0.3 : 0)), comments: Math.floor(baseViews * 0.025 + (hasViral ? baseViews * 0.02 : 0)), shares: Math.floor(baseViews * 0.012 + (hasViral ? baseViews * 0.02 : 0)), saves: Math.floor(baseViews * 0.01 + (hasViral ? baseViews * 0.01 : 0)) },
        { window: '7d', views: Math.floor(baseViews * 1.5 + (hasViral ? baseViews * 3 : 0)), likes: Math.floor(baseViews * 0.35 + (hasViral ? baseViews * 0.4 : 0)), comments: Math.floor(baseViews * 0.04 + (hasViral ? baseViews * 0.02 : 0)), shares: Math.floor(baseViews * 0.02 + (hasViral ? baseViews * 0.03 : 0)), saves: Math.floor(baseViews * 0.015 + (hasViral ? baseViews * 0.02 : 0)) },
      ],
      baselines: { cohortSize: 500 + Math.floor(Math.random() * 500), zScore: zScore, percentile: pct, creator30d: { views: 100000 + Math.floor(Math.random() * 500000), er: 0.08, velocity: 1.1 } },
      script: { transcript: '', patterns: [], hookType: 'question', ctaType: 'follow' },
      features: {},
      prediction: { probability: Math.min(1, Math.max(0, 0.5 + zScore / 4)), confidence: 0.8 },
      validation48h: { label: hasViral ? 'viral' : 'nonviral' },
      template: { id: `tpl-${i % 7}`, successRate: 0.5 + Math.random() * 0.4, state: (['HOT', 'COOLING', 'NEW'] as const)[i % 3] },
      crossPlatform: { reposts: [], cascadeLagSec: 0, crossPlatformScore: 0 },
      ops: { duplicateOf: null },
      commerce: { skuIds: [], estRevenueLift: 0, actualRevenue: 0 },
      vitVersion: '1.0.0',
      extra: {},
    };
    items.push(vit);
  }
  return items;
}

export function ensureFixtures() {
  const dir = path.join(process.cwd(), 'fixtures');
  ensureDir(dir);

  const videosPath = path.join(dir, 'videos.json');
  if (!fs.existsSync(videosPath)) {
    const items = generateVITFixtures(150);
    fs.writeFileSync(videosPath, JSON.stringify(items, null, 2), 'utf8');
  }

  const calibrationPath = path.join(dir, 'calibration.json');
  if (!fs.existsSync(calibrationPath)) {
    const bins = Array.from({ length: 10 }, (_, i) => {
      const mean = 0.05 + i * 0.095;
      const noise = (Math.random() - 0.5) * 0.05;
      const emp = Math.max(0, Math.min(1, mean + noise));
      return { bin: i, meanPred: Number(mean.toFixed(2)), empRate: Number(emp.toFixed(2)) };
    });
    fs.writeFileSync(calibrationPath, JSON.stringify(bins, null, 2), 'utf8');
  }

  const weatherPath = path.join(dir, 'weather.json');
  if (!fs.existsSync(weatherPath)) {
    const weather = { status: 'Stable', lastChange: new Date().toISOString() };
    fs.writeFileSync(weatherPath, JSON.stringify(weather, null, 2), 'utf8');
  }

  const tilesPath = path.join(dir, 'proof_tiles.json');
  if (!fs.existsSync(tilesPath)) {
    const titles = [
      'Automated 24/7 Pipeline',
      'Template Discovery',
      'Prediction Engine',
      'Calibration Reliability',
      'Weather Monitoring',
      'Recipe Book API',
      'Studio Live Feed',
      'Cross-Platform Cascade',
      'Baseline Cohorts',
      'Script Patterns',
      'Commerce Tracking',
      'Validation 48h',
      'Admin Observability',
    ];
    const tiles = titles.map((title, idx) => ({
      id: idx + 1,
      title,
      target: 'OK',
      value: 'OK (mock)',
      passed: idx % 5 !== 0,
      updatedAt: new Date().toISOString(),
    }));
    fs.writeFileSync(tilesPath, JSON.stringify(tiles, null, 2), 'utf8');
  }
}



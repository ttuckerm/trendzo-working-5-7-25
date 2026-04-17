import { classifyAudioContent } from '@/lib/services/audio-classifier';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIR = join(process.cwd(), 'data', 'raw_videos');
// Hand-picked unique files (deduped by md5)
const files = [
  'kai_1774214914655.mp4',
  'kai_1773510816306.mp4',
  'kai_1773509972011.mp4',
  'kai_1773516516226.mp4',
  'kai_1774120162165.mp4',
].map(f => ({ f }));

(async () => {
  for (const { f } of files) {
    const path = join(DIR, f);
    console.log(`\n=== ${f} ===`);
    const r = await classifyAudioContent(path);
    console.log(`  success:          ${r.success}`);
    console.log(`  audioType:        ${r.audioType}`);
    console.log(`  musicRatio:       ${r.musicRatio}`);
    console.log(`  speechRatio:      ${r.speechRatio}`);
    console.log(`  energyVarianceN:  ${r.energyVarianceNormalized}`);
    console.log(`  windowCount:      ${r.windowCount}`);
    console.log(`  avgRmsEnergy:     ${r.avgRmsEnergy}`);
    console.log(`  zeroCrossingAvg:  ${r.zeroCrossingRateAvg}`);
    console.log(`  latencyMs:        ${r.latencyMs}`);
    if (r.error) console.log(`  ERROR: ${r.error}`);
  }
})().catch(e => { console.error(e); process.exit(1); });

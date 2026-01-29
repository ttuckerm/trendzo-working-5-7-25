const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function verifyClassifications() {
  console.log('🔍 Verifying DPS classifications match thresholds...\n');

  // Get only today's calculations
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('dps_calculations')
    .select('video_id, viral_score, classification, calculated_at')
    .gte('calculated_at', `${today}T00:00:00`)
    .order('calculated_at', { ascending: false });

  if (error) {
    console.error('❌ Query failed:', error.message);
    return;
  }

  console.log(`Found ${data.length} calculations from today (${today})\n`);

  const latest = data;

  // Group by classification
  const groups = {
    'mega-viral': [],
    'viral': [],
    'normal': []
  };

  latest.forEach(calc => {
    groups[calc.classification].push(calc);
  });

  console.log('📊 Classification Summary:\n');

  for (const [classification, items] of Object.entries(groups)) {
    if (items.length === 0) continue;

    const scores = items.map(i => i.viral_score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    console.log(`${classification.toUpperCase()}:`);
    console.log(`  Count: ${items.length}`);
    console.log(`  Min Score: ${min.toFixed(2)}`);
    console.log(`  Max Score: ${max.toFixed(2)}`);
    console.log(`  Avg Score: ${avg.toFixed(2)}`);
    console.log('');
  }

  // Verify thresholds
  console.log('🎯 Threshold Verification:\n');

  let allPass = true;

  // Mega-viral should be >= 80
  const megaViral = groups['mega-viral'];
  if (megaViral.length > 0) {
    const minMegaViral = Math.min(...megaViral.map(i => i.viral_score));
    const pass = minMegaViral >= 80;
    console.log(`${pass ? '✅' : '❌'} Mega-viral min score: ${minMegaViral.toFixed(2)} ${pass ? '>=' : '<'} 80`);
    allPass = allPass && pass;
  }

  // Viral should be >= 70 and < 80
  const viral = groups['viral'];
  if (viral.length > 0) {
    const minViral = Math.min(...viral.map(i => i.viral_score));
    const maxViral = Math.max(...viral.map(i => i.viral_score));
    const passMin = minViral >= 70;
    const passMax = maxViral < 80;
    console.log(`${passMin ? '✅' : '❌'} Viral min score: ${minViral.toFixed(2)} ${passMin ? '>=' : '<'} 70`);
    console.log(`${passMax ? '✅' : '❌'} Viral max score: ${maxViral.toFixed(2)} ${passMax ? '<' : '>='} 80`);
    allPass = allPass && passMin && passMax;
  }

  // Normal should be < 70
  const normal = groups['normal'];
  if (normal.length > 0) {
    const maxNormal = Math.max(...normal.map(i => i.viral_score));
    const pass = maxNormal < 70;
    console.log(`${pass ? '✅' : '❌'} Normal max score: ${maxNormal.toFixed(2)} ${pass ? '<' : '>='} 70`);
    allPass = allPass && pass;
  }

  console.log('');
  console.log(`${allPass ? '✅ ALL THRESHOLDS PASS' : '❌ SOME THRESHOLDS FAILED'}`);
  console.log('');

  return allPass;
}

verifyClassifications().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

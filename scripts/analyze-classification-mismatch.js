require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function analyzeClassificationMismatch() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 BACKEND CLASSIFICATION THRESHOLD INVESTIGATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Get latest calculation per video
  const { data: allCalcs } = await supabase
    .from('dps_calculations')
    .select('video_id, viral_score, percentile_rank, classification, calculated_at')
    .order('calculated_at', { ascending: false });

  // Get unique latest per video
  const latestByVideo = {};
  allCalcs?.forEach(calc => {
    if (!latestByVideo[calc.video_id] ||
        new Date(calc.calculated_at) > new Date(latestByVideo[calc.video_id].calculated_at)) {
      latestByVideo[calc.video_id] = calc;
    }
  });

  const latest = Object.values(latestByVideo);

  console.log('1️⃣  CURRENT CLASSIFICATION DISTRIBUTION:\n');

  const byClass = {
    'mega-viral': [],
    'hyper-viral': [],
    'viral': [],
    'normal': []
  };

  latest.forEach(calc => {
    if (byClass[calc.classification]) {
      byClass[calc.classification].push(calc);
    }
  });

  Object.entries(byClass).forEach(([cls, videos]) => {
    if (videos.length > 0) {
      const scores = videos.map(v => v.viral_score);
      const percentiles = videos.map(v => v.percentile_rank);
      const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
      const avgPercentile = (percentiles.reduce((a, b) => a + b, 0) / percentiles.length).toFixed(2);
      const minScore = Math.min(...scores).toFixed(2);
      const maxScore = Math.max(...scores).toFixed(2);
      const minPercentile = Math.min(...percentiles).toFixed(2);
      const maxPercentile = Math.max(...percentiles).toFixed(2);

      console.log(`   ${cls.toUpperCase()}: ${videos.length} videos`);
      console.log(`     Viral Scores: avg=${avgScore}, range=[${minScore}-${maxScore}]`);
      console.log(`     Percentiles:  avg=${avgPercentile}, range=[${minPercentile}-${maxPercentile}]`);
      console.log('');
    }
  });

  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('2️⃣  THRESHOLD ANALYSIS:\n');

  console.log('   CURRENT BACKEND THRESHOLDS (percentile-based):');
  console.log('     mega-viral:  percentile >= 99.9  (Top 0.1%)');
  console.log('     hyper-viral: percentile >= 99.0  (Top 1%)');
  console.log('     viral:       percentile >= 95.0  (Top 5%)');
  console.log('     normal:      percentile <  95.0  (Below 95th percentile)');
  console.log('');

  console.log('   EXPECTED THRESHOLDS (score-based - from documentation):');
  console.log('     mega-viral:  viral_score >= 80');
  console.log('     viral:       viral_score >= 70 AND < 80');
  console.log('     normal:      viral_score <  70');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('3️⃣  MISMATCH IDENTIFICATION:\n');

  console.log('   🚨 ROOT CAUSE: Classification uses PERCENTILE, not VIRAL_SCORE!\n');
  console.log('   Code location: src/lib/services/dps/dps-calculation-engine.ts:444');
  console.log('   Current code:');
  console.log('     const percentileRank = zScoreToPercentile(zScore);');
  console.log('     const classification = classifyVirality(percentileRank); // ❌ Uses percentile\n');

  // Show examples of misclassification
  const megaViralLowScore = byClass['mega-viral'].filter(v => v.viral_score < 80);
  const viralWrongRange = byClass['viral'].filter(v => v.viral_score < 70 || v.viral_score >= 80);
  const normalHighScore = byClass['normal'].filter(v => v.viral_score >= 70);

  console.log('   MISCLASSIFIED VIDEOS:\n');
  console.log(`   mega-viral with score < 80: ${megaViralLowScore.length} videos`);
  if (megaViralLowScore.length > 0) {
    megaViralLowScore.slice(0, 3).forEach(v => {
      console.log(`     • ${v.video_id}: score=${v.viral_score}, percentile=${v.percentile_rank}`);
    });
  }

  console.log(`\n   viral with score outside [70-80): ${viralWrongRange.length} videos`);
  if (viralWrongRange.length > 0) {
    viralWrongRange.slice(0, 3).forEach(v => {
      console.log(`     • ${v.video_id}: score=${v.viral_score}, percentile=${v.percentile_rank}`);
    });
  }

  console.log(`\n   normal with score >= 70: ${normalHighScore.length} videos`);
  if (normalHighScore.length > 0) {
    normalHighScore.slice(0, 3).forEach(v => {
      console.log(`     • ${v.video_id}: score=${v.viral_score}, percentile=${v.percentile_rank}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  console.log('4️⃣  PROPOSED FIX:\n');

  console.log('   FILE: src/lib/services/dps/dps-calculation-engine.ts\n');

  console.log('   OPTION A: Change classification to use viral_score (RECOMMENDED)\n');
  console.log('   Replace lines 226-231 with:\n');
  console.log('   export function classifyVirality(viralScore: number): ... {');
  console.log('     if (viralScore >= 80) return "mega-viral";');
  console.log('     if (viralScore >= 70) return "viral";');
  console.log('     return "normal";');
  console.log('   }\n');
  console.log('   And line 444:');
  console.log('     const classification = classifyVirality(viralScore); // ✅ Use score\n');

  console.log('   OPTION B: Keep percentile-based but adjust thresholds\n');
  console.log('   Keep current logic but document that it\'s intentionally percentile-based\n');

  console.log('\n═══════════════════════════════════════════════════════════\n');

  console.log('5️⃣  IMPACT ANALYSIS:\n');

  // Calculate what would change with score-based thresholds
  let willChange = 0;
  const changes = [];

  latest.forEach(calc => {
    const currentClass = calc.classification;
    let newClass = 'normal';
    if (calc.viral_score >= 80) newClass = 'mega-viral';
    else if (calc.viral_score >= 70) newClass = 'viral';

    if (currentClass !== newClass) {
      willChange++;
      changes.push({
        video_id: calc.video_id,
        score: calc.viral_score,
        percentile: calc.percentile_rank,
        old: currentClass,
        new: newClass
      });
    }
  });

  console.log(`   Videos that will change classification: ${willChange} out of ${latest.length}\n`);

  if (changes.length > 0) {
    console.log('   Sample changes (first 10):');
    changes.slice(0, 10).forEach(c => {
      console.log(`     ${c.video_id}: ${c.old} → ${c.new} (score=${c.score}, pct=${c.percentile})`);
    });
    if (changes.length > 10) console.log(`     ... and ${changes.length - 10} more`);
  }

  console.log('\n   FEAT-003 Pattern Extraction Impact:');
  console.log('     - Pattern extraction filters on classification');
  console.log('     - If thresholds change, patterns may change');
  console.log('     - RECOMMENDATION: Re-run pattern extraction after fix');

  console.log('\n═══════════════════════════════════════════════════════════\n');

  console.log('6️⃣  USER INTERFACE CONFIRMATION:\n');

  console.log('   ✅ Fixing backend thresholds will NOT expose scores to users');
  console.log('   ✅ Users will still only see classification labels');
  console.log('   ✅ No frontend changes required');
  console.log('   ✅ This is purely a backend classification logic fix');

  console.log('\n═══════════════════════════════════════════════════════════\n');

  console.log('📋 SUMMARY:\n');
  console.log('   Current: Classification based on PERCENTILE RANK');
  console.log('   Expected: Classification based on VIRAL SCORE');
  console.log('   Fix: Change classifyVirality() to use viralScore instead of percentile');
  console.log(`   Impact: ${willChange} videos will get different classifications`);
  console.log('   User Impact: None (labels only, no scores exposed)');
  console.log('   Action Required: Re-run pattern extraction after fix');

  console.log('\n═══════════════════════════════════════════════════════════');
}

analyzeClassificationMismatch().catch(console.error);

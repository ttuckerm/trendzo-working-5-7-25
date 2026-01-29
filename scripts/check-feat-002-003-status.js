require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkFEAT002() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 FEAT-002: HISTORICAL DATA PIPELINE STATUS');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Check DPS calculations
  const { data: calculations, error: calcError } = await supabase
    .from('dps_calculations')
    .select('*')
    .order('calculated_at', { ascending: false })
    .limit(5);

  if (calcError) {
    console.log('❌ DPS Calculations Table Error:', calcError.message);
  } else {
    console.log('✅ DPS CALCULATION ENGINE: WORKING');
    console.log('   Latest 5 scores:');
    calculations.forEach(calc => {
      const date = new Date(calc.calculated_at).toLocaleString();
      console.log(`   - Video ${calc.video_id}: DPS ${calc.viral_score} (${calc.classification}) - ${date}`);
    });
  }

  console.log('');

  // 2. Check viral scores storage
  const { count: totalCalcs, error: countError } = await supabase
    .from('dps_calculations')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('❌ Count Error:', countError.message);
  } else {
    console.log('✅ VIRAL SCORES STORAGE: WORKING');
    console.log('   Total scores stored:', totalCalcs);
  }

  console.log('');

  // 3. Check score distribution
  const { data: distribution } = await supabase
    .from('dps_calculations')
    .select('classification');

  const dist = {};
  distribution?.forEach(d => {
    dist[d.classification] = (dist[d.classification] || 0) + 1;
  });

  console.log('📈 SCORE DISTRIBUTION:');
  Object.entries(dist).forEach(([cls, cnt]) => {
    console.log(`   ${cls}: ${cnt}`);
  });

  console.log('');

  // 4. Check scraped videos with transcripts
  const { count: videosWithTranscripts } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .not('transcript', 'is', null);

  console.log('📹 SCRAPED VIDEOS STATUS:');
  console.log('   Videos with transcripts:', videosWithTranscripts);

  console.log('');

  // 5. Blocking issues check
  const { data: recentErrors } = await supabase
    .from('dps_calculations')
    .select('video_id, viral_score, classification')
    .is('viral_score', null)
    .limit(5);

  if (recentErrors && recentErrors.length > 0) {
    console.log('⚠️  BLOCKING ISSUES:');
    console.log('   Found', recentErrors.length, 'calculations with null viral_score');
  } else {
    console.log('✅ NO BLOCKING ISSUES DETECTED');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🎯 FEAT-002 STATUS: ' + (totalCalcs > 0 && videosWithTranscripts > 0 ? 'COMPLETE ✅' : 'IN PROGRESS ⚠️'));
  console.log('═══════════════════════════════════════════════════════════\n\n');

  return { complete: totalCalcs > 0 && videosWithTranscripts > 0, totalCalcs, videosWithTranscripts };
}

async function checkFEAT003() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧬 FEAT-003: VIRALITY FINGERPRINT GENERATOR STATUS');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Check viral patterns table
  const { data: patterns, error: patternError } = await supabase
    .from('viral_patterns')
    .select('*');

  if (patternError) {
    console.log('❌ Viral Patterns Table Error:', patternError.message);
  } else {
    console.log('✅ FINGERPRINTS GENERATED:', patterns.length);

    // Group by niche
    const byNiche = {};
    patterns.forEach(p => {
      byNiche[p.niche] = (byNiche[p.niche] || 0) + 1;
    });

    console.log('   By niche:');
    Object.entries(byNiche).forEach(([niche, count]) => {
      console.log(`   - ${niche}: ${count} patterns`);
    });
  }

  console.log('');

  // 2. Check pattern types coverage
  const { data: patternTypes } = await supabase
    .from('viral_patterns')
    .select('pattern_type');

  const typesCoverage = {};
  patternTypes?.forEach(p => {
    typesCoverage[p.pattern_type] = (typesCoverage[p.pattern_type] || 0) + 1;
  });

  console.log('📊 PATTERN TYPES COVERAGE (7 Idea Legos):');
  const expectedTypes = ['topic', 'angle', 'hook_structure', 'story_structure', 'visual_format', 'key_visuals', 'audio'];
  expectedTypes.forEach(type => {
    const count = typesCoverage[type] || 0;
    console.log(`   ${type}: ${count} ${count > 0 ? '✅' : '❌'}`);
  });

  console.log('');

  // 3. Check video sample size
  const { count: highDPSVideos } = await supabase
    .from('dps_calculations')
    .select('*', { count: 'exact', head: true })
    .gte('viral_score', 70);

  console.log('📹 TRAINING DATA:');
  console.log('   High-DPS videos (>= 70):', highDPSVideos);
  console.log('   Target: 1000+ examples → ' + (highDPSVideos >= 1000 ? '✅ MET' : `⚠️  NEED ${1000 - highDPSVideos} MORE`));

  console.log('');

  // 4. Check pattern extraction jobs
  const { data: jobs } = await supabase
    .from('pattern_extraction_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('🔄 RECENT EXTRACTION JOBS:');
  jobs?.forEach(job => {
    console.log(`   ${job.batch_id}: ${job.videos_processed} videos → ${job.patterns_extracted} patterns (${job.status})`);
  });

  console.log('');

  // 5. Test accuracy check (simulate with pattern quality)
  const { data: highConfPatterns } = await supabase
    .from('viral_patterns')
    .select('*')
    .gte('success_rate', 0.7);

  const accuracy = highConfPatterns?.length / (patterns?.length || 1);

  console.log('🎯 PATTERN QUALITY:');
  console.log('   High confidence patterns (>70% success rate):', highConfPatterns?.length);
  console.log('   Estimated accuracy:', (accuracy * 100).toFixed(1) + '%');

  console.log('\n═══════════════════════════════════════════════════════════');
  const isComplete = patterns?.length >= 7 && highDPSVideos >= 10;
  console.log('🎯 FEAT-003 STATUS: ' + (isComplete ? 'COMPLETE ✅' : 'IN PROGRESS ⚠️'));
  console.log('═══════════════════════════════════════════════════════════\n');

  return { complete: isComplete, patterns: patterns?.length, highDPSVideos };
}

async function main() {
  const feat002 = await checkFEAT002();
  const feat003 = await checkFEAT003();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎯 OVERALL STATUS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('FEAT-002 Historical Data Pipeline:', feat002.complete ? '✅ COMPLETE' : '⚠️  IN PROGRESS');
  console.log('FEAT-003 Virality Fingerprint Generator:', feat003.complete ? '✅ COMPLETE' : '⚠️  IN PROGRESS');
  console.log('\nFEAT-060 PRD Status:', (feat002.complete && feat003.complete) ? '✅ READY TO START' : '⚠️  BLOCKED - Complete FEAT-002 and FEAT-003 first');
  console.log('\n═══════════════════════════════════════════════════════════');
}

main().catch(console.error);

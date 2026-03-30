/**
 * Comprehensive System Health Check Script
 * Runs all diagnostic checks and reports findings
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const results = {
  section1: {},
  section2: {},
  section3: {},
  section4: {},
  section5: {},
  issues: [],
  warnings: [],
  passes: []
};

// ═══════════════════════════════════════════════════
// SECTION 1: DATABASE INTEGRITY CHECK
// ═══════════════════════════════════════════════════

async function check1_1_rowCounts() {
  console.log('\n═══ 1.1 ROW COUNTS ═══');
  try {
    const sv = await supabase.from('scraped_videos').select('*', { count: 'exact', head: true });
    const dps = await supabase.from('dps_calculations').select('*', { count: 'exact', head: true });
    const vf = await supabase.from('virality_fingerprints').select('*', { count: 'exact', head: true });

    console.log('scraped_videos:', sv.count);
    console.log('dps_calculations:', dps.count);
    console.log('virality_fingerprints:', vf.count);

    results.section1.rowCounts = {
      scraped_videos: sv.count,
      dps_calculations: dps.count,
      virality_fingerprints: vf.count
    };

    if (sv.count === 0) {
      results.issues.push('❌ FAIL 1.1: No scraped videos in database');
    } else {
      results.passes.push('✅ PASS 1.1: Scraped videos table has data');
    }

    return { sv: sv.count, dps: dps.count, vf: vf.count };
  } catch (error) {
    console.error('Error:', error.message);
    results.issues.push(`❌ FAIL 1.1: Database connection error - ${error.message}`);
    return null;
  }
}

async function check1_2_dataQuality() {
  console.log('\n═══ 1.2 DATA QUALITY ═══');
  try {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('transcript, views_count, dps_score');

    if (error) {
      throw error;
    }

    const stats = {
      total_videos: data.length,
      videos_with_transcript: data.filter(v => v.transcript).length,
      videos_with_views: data.filter(v => v.views_count != null).length,
      videos_with_zero_views: data.filter(v => v.views_count === 0).length,
      videos_missing_dps: data.filter(v => v.dps_score == null).length
    };

    console.log(stats);
    results.section1.dataQuality = stats;

    if (stats.videos_missing_dps > 0) {
      results.warnings.push(`⚠️  WARNING 1.2: ${stats.videos_missing_dps} videos missing DPS scores`);
    }

    if (stats.videos_with_zero_views > stats.total_videos * 0.1) {
      results.warnings.push(`⚠️  WARNING 1.2: ${stats.videos_with_zero_views} videos have zero views (${((stats.videos_with_zero_views/stats.total_videos)*100).toFixed(1)}%)`);
    }

    if (stats.videos_with_transcript === stats.total_videos) {
      results.passes.push('✅ PASS 1.2: All videos have transcripts');
    } else {
      results.warnings.push(`⚠️  WARNING 1.2: ${stats.total_videos - stats.videos_with_transcript} videos missing transcripts`);
    }

    return stats;
  } catch (error) {
    console.error('Error:', error.message);
    results.issues.push(`❌ FAIL 1.2: ${error.message}`);
    return null;
  }
}

async function check1_3_dpsDistribution() {
  console.log('\n═══ 1.3 DPS DISTRIBUTION ═══');
  try {
    const { data, error } = await supabase
      .from('dps_calculations')
      .select('video_id, viral_score, classification, calculated_at')
      .order('calculated_at', { ascending: false });

    if (error) throw error;

    // Get latest per video
    const latest = new Map();
    data.forEach(d => {
      if (!latest.has(d.video_id)) {
        latest.set(d.video_id, d);
      }
    });

    const byClass = {};
    latest.forEach(d => {
      if (!byClass[d.classification]) {
        byClass[d.classification] = [];
      }
      byClass[d.classification].push(d.viral_score);
    });

    const distribution = {};
    Object.keys(byClass).forEach(cls => {
      const scores = byClass[cls];
      distribution[cls] = {
        count: scores.length,
        min: Math.min(...scores).toFixed(2),
        max: Math.max(...scores).toFixed(2),
        avg: (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2)
      };
      console.log(`${cls}: count=${distribution[cls].count}, min=${distribution[cls].min}, max=${distribution[cls].max}, avg=${distribution[cls].avg}`);
    });

    results.section1.dpsDistribution = distribution;

    // Validate thresholds
    if (distribution['mega-viral']) {
      const megaMin = parseFloat(distribution['mega-viral'].min);
      if (megaMin < 80) {
        results.issues.push(`❌ FAIL 1.3: mega-viral videos have scores below 80 (min=${megaMin})`);
      } else {
        results.passes.push('✅ PASS 1.3: mega-viral classification thresholds correct');
      }
    }

    if (distribution['viral']) {
      const viralMin = parseFloat(distribution['viral'].min);
      const viralMax = parseFloat(distribution['viral'].max);
      if (viralMin < 70 || viralMax >= 80) {
        results.issues.push(`❌ FAIL 1.3: viral videos outside 70-80 range (min=${viralMin}, max=${viralMax})`);
      } else {
        results.passes.push('✅ PASS 1.3: viral classification thresholds correct');
      }
    }

    if (distribution['normal']) {
      const normalMax = parseFloat(distribution['normal'].max);
      if (normalMax >= 70) {
        results.issues.push(`❌ FAIL 1.3: normal videos have scores >= 70 (max=${normalMax})`);
      } else {
        results.passes.push('✅ PASS 1.3: normal classification thresholds correct');
      }
    }

    return distribution;
  } catch (error) {
    console.error('Error:', error.message);
    results.issues.push(`❌ FAIL 1.3: ${error.message}`);
    return null;
  }
}

async function check1_4_testContamination() {
  console.log('\n═══ 1.4 TEST DATA CONTAMINATION ═══');
  try {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('video_id')
      .like('video_id', 'test-%');

    if (error) throw error;

    console.log('Test video count:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('Test video IDs:', data.map(d => d.video_id).join(', '));
      results.warnings.push(`⚠️  WARNING 1.4: ${data.length} test videos found in production data`);
    } else {
      results.passes.push('✅ PASS 1.4: No test data contamination');
    }

    results.section1.testContamination = data?.length || 0;
    return data?.length || 0;
  } catch (error) {
    console.error('Error:', error.message);
    results.issues.push(`❌ FAIL 1.4: ${error.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════
// SECTION 2: FEATURE COMPLETION VALIDATION
// ═══════════════════════════════════════════════════

async function check2_1_scraperStatus() {
  console.log('\n═══ 2.1 FEAT-001: SCRAPER STATUS ═══');
  try {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    console.log('Last scrape:', data?.[0]?.scraped_at || 'No data');

    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('scraped_videos')
      .select('*', { count: 'exact', head: true })
      .gte('scraped_at', today);

    console.log('Videos scraped today:', count || 0);

    results.section2.scraperStatus = {
      lastScrape: data?.[0]?.scraped_at,
      todayCount: count || 0
    };

    if (!data?.[0]?.scraped_at) {
      results.issues.push('❌ FAIL 2.1: No scraping activity detected');
    } else {
      const lastScrapeDate = new Date(data[0].scraped_at);
      const daysSinceLastScrape = (new Date() - lastScrapeDate) / (1000 * 60 * 60 * 24);

      if (daysSinceLastScrape > 7) {
        results.warnings.push(`⚠️  WARNING 2.1: Last scrape was ${daysSinceLastScrape.toFixed(1)} days ago`);
      } else {
        results.passes.push('✅ PASS 2.1: Recent scraping activity detected');
      }
    }

    return results.section2.scraperStatus;
  } catch (error) {
    console.error('Error:', error.message);
    results.issues.push(`❌ FAIL 2.1: ${error.message}`);
    return null;
  }
}

async function check2_3_patternExtraction() {
  console.log('\n═══ 2.3 FEAT-003: PATTERN EXTRACTION ═══');
  try {
    const { data, error } = await supabase
      .from('virality_fingerprints')
      .select('pattern_type, success_rate, avg_dps_score')
      .eq('niche', 'personal-finance');

    if (error) throw error;

    const byType = {};
    data?.forEach(d => {
      if (!byType[d.pattern_type]) {
        byType[d.pattern_type] = { count: 0, success_rates: [], dps_scores: [] };
      }
      byType[d.pattern_type].count++;
      if (d.success_rate) byType[d.pattern_type].success_rates.push(d.success_rate);
      if (d.avg_dps_score) byType[d.pattern_type].dps_scores.push(d.avg_dps_score);
    });

    const patternStats = {};
    Object.keys(byType).forEach(type => {
      const stats = byType[type];
      const avgSuccess = stats.success_rates.length > 0 ? stats.success_rates.reduce((a,b)=>a+b,0)/stats.success_rates.length : 0;
      const avgDps = stats.dps_scores.length > 0 ? stats.dps_scores.reduce((a,b)=>a+b,0)/stats.dps_scores.length : 0;
      patternStats[type] = { count: stats.count, avgSuccess, avgDps };
      console.log(`${type}: count=${stats.count}, avg_success=${avgSuccess.toFixed(3)}, avg_dps=${avgDps.toFixed(2)}`);
    });

    results.section2.patternExtraction = patternStats;

    const patternTypeCount = Object.keys(byType).length;
    if (patternTypeCount === 0) {
      results.issues.push('❌ FAIL 2.3: No virality patterns extracted');
    } else if (patternTypeCount < 7) {
      results.warnings.push(`⚠️  WARNING 2.3: Only ${patternTypeCount} pattern types found (expected 7)`);
    } else {
      results.passes.push('✅ PASS 2.3: Pattern extraction complete with all expected types');
    }

    return patternStats;
  } catch (error) {
    console.error('Error:', error.message);
    results.issues.push(`❌ FAIL 2.3: ${error.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════
// SECTION 4: CRITICAL BLOCKERS IDENTIFICATION
// ═══════════════════════════════════════════════════

async function check4_1_dependencies() {
  console.log('\n═══ 4.1 MISSING DEPENDENCIES ═══');
  const requiredDeps = [
    '@anthropic-ai/sdk',
    'openai',
    '@google/generative-ai',
    '@supabase/supabase-js'
  ];

  const missing = [];
  requiredDeps.forEach(dep => {
    try {
      require.resolve(dep);
      console.log(`✅ ${dep}`);
    } catch (e) {
      console.log(`❌ ${dep} - MISSING`);
      missing.push(dep);
    }
  });

  results.section4.dependencies = { missing, required: requiredDeps };

  if (missing.length > 0) {
    results.issues.push(`❌ FAIL 4.1: Missing dependencies: ${missing.join(', ')}`);
  } else {
    results.passes.push('✅ PASS 4.1: All required dependencies installed');
  }

  return missing;
}

async function check4_2_envVars() {
  console.log('\n═══ 4.2 ENVIRONMENT VARIABLES ═══');
  const requiredVars = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GOOGLE_AI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY'
  ];

  const missing = [];
  const masked = {};

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      console.log(`❌ ${varName} - MISSING`);
      missing.push(varName);
      masked[varName] = null;
    } else {
      console.log(`✅ ${varName} - Set (${value.substring(0, 8)}...)`);
      masked[varName] = `${value.substring(0, 8)}...`;
    }
  });

  results.section4.envVars = { missing, masked };

  if (missing.length > 0) {
    results.issues.push(`❌ FAIL 4.2: Missing environment variables: ${missing.join(', ')}`);
  } else {
    results.passes.push('✅ PASS 4.2: All required environment variables set');
  }

  return missing;
}

// ═══════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════

async function runAllChecks() {
  console.log('═══════════════════════════════════════════════════');
  console.log('COMPREHENSIVE SYSTEM HEALTH CHECK');
  console.log('═══════════════════════════════════════════════════');

  // Section 1: Database Integrity
  console.log('\n\n═══ SECTION 1: DATABASE INTEGRITY CHECK ═══');
  await check1_1_rowCounts();
  await check1_2_dataQuality();
  await check1_3_dpsDistribution();
  await check1_4_testContamination();

  // Section 2: Feature Completion
  console.log('\n\n═══ SECTION 2: FEATURE COMPLETION VALIDATION ═══');
  await check2_1_scraperStatus();
  await check2_3_patternExtraction();

  // Section 4: Critical Blockers
  console.log('\n\n═══ SECTION 4: CRITICAL BLOCKERS IDENTIFICATION ═══');
  await check4_1_dependencies();
  await check4_2_envVars();

  // Final Report
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('FINAL REPORT');
  console.log('═══════════════════════════════════════════════════');

  console.log('\n✅ PASSES:');
  results.passes.forEach(p => console.log(p));

  console.log('\n⚠️  WARNINGS:');
  if (results.warnings.length === 0) {
    console.log('None');
  } else {
    results.warnings.forEach(w => console.log(w));
  }

  console.log('\n❌ CRITICAL ISSUES:');
  if (results.issues.length === 0) {
    console.log('None - System is healthy!');
  } else {
    results.issues.forEach(i => console.log(i));
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total Passes: ${results.passes.length}`);
  console.log(`Total Warnings: ${results.warnings.length}`);
  console.log(`Total Critical Issues: ${results.issues.length}`);

  // Export results
  console.log('\n\nFull results object:');
  console.log(JSON.stringify(results, null, 2));
}

runAllChecks().catch(console.error);

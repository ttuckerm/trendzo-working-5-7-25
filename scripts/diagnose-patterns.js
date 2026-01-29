const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function diagnosePatterns() {
  console.log('📊 Diagnosing Pattern Data Quality...\n');

  const { data: patterns, error } = await supabase
    .from('viral_patterns')
    .select('niche, pattern_type, pattern_description, avg_dps_score, frequency_count, success_rate, viral_videos_count');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Manual aggregation
  const stats = {};
  patterns.forEach(p => {
    const key = `${p.niche}|${p.pattern_type}`;
    if (!stats[key]) {
      stats[key] = {
        niche: p.niche,
        pattern_type: p.pattern_type,
        total: 0,
        null_patterns: 0,
        missing_dps: 0,
        min_dps: Infinity,
        max_dps: -Infinity
      };
    }
    stats[key].total++;
    if (!p.pattern_description || p.pattern_description === '') stats[key].null_patterns++;
    if (p.avg_dps_score === null) stats[key].missing_dps++;
    else {
      stats[key].min_dps = Math.min(stats[key].min_dps, p.avg_dps_score);
      stats[key].max_dps = Math.max(stats[key].max_dps, p.avg_dps_score);
    }
  });

  console.log('Niche | Pattern Type | Total | Null Values | Missing DPS | Min DPS | Max DPS');
  console.log('─'.repeat(90));
  Object.values(stats).forEach(s => {
    console.log(`${s.niche} | ${s.pattern_type} | ${s.total} | ${s.null_patterns} | ${s.missing_dps} | ${s.min_dps === Infinity ? 'N/A' : s.min_dps.toFixed(1)} | ${s.max_dps === -Infinity ? 'N/A' : s.max_dps.toFixed(1)}`);
  });

  // Overall stats
  const totalPatterns = patterns.length;
  const nullPatterns = patterns.filter(p => !p.pattern_description || p.pattern_description === '').length;
  const missingDPS = patterns.filter(p => p.avg_dps_score === null).length;

  console.log('\n📈 SUMMARY:');
  console.log(`Total patterns: ${totalPatterns}`);
  console.log(`Patterns with NULL/empty values: ${nullPatterns} (${(nullPatterns/totalPatterns*100).toFixed(1)}%)`);
  console.log(`Patterns with missing DPS: ${missingDPS} (${(missingDPS/totalPatterns*100).toFixed(1)}%)`);

  // Check which niches have patterns
  const nicheStats = {};
  patterns.forEach(p => {
    if (!nicheStats[p.niche]) nicheStats[p.niche] = 0;
    nicheStats[p.niche]++;
  });

  console.log('\n📊 PATTERNS BY NICHE:');
  Object.entries(nicheStats).sort((a, b) => b[1] - a[1]).forEach(([niche, count]) => {
    console.log(`${niche}: ${count} patterns`);
  });
}

diagnosePatterns();

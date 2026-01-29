const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function verifyPatternQuality() {
  console.log('🔍 Verifying pattern quality metrics...\n');

  const { data, error } = await supabase
    .from('viral_patterns')
    .select('pattern_type, avg_dps_score, success_rate, frequency_count, viral_videos_count, total_videos_analyzed')
    .eq('niche', 'personal-finance')
    .order('avg_dps_score', { ascending: false });

  if (error) {
    console.error('❌ Query failed:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.error('❌ No patterns found!');
    return;
  }

  console.log('📊 Pattern Quality Summary:\n');
  console.log('Pattern Type'.padEnd(20) + 'Count'.padEnd(10) + 'Avg DPS'.padEnd(12) + 'Success Rate'.padEnd(15) + 'Viral Videos');
  console.log('-'.repeat(75));

  data.forEach(pattern => {
    const type = pattern.pattern_type.padEnd(20);
    const count = pattern.frequency_count.toString().padEnd(10);
    const avgDPS = pattern.avg_dps_score?.toFixed(2).padEnd(12) || 'N/A'.padEnd(12);
    const successRate = (pattern.success_rate * 100).toFixed(1).padEnd(12) + '%';
    const viralCount = `${pattern.viral_videos_count}/${pattern.total_videos_analyzed}`;

    console.log(`${type}${count}${avgDPS}${successRate}${viralCount}`);
  });

  // Calculate overall metrics
  const avgDPS = data.reduce((sum, p) => sum + (p.avg_dps_score || 0), 0) / data.length;
  const avgSuccessRate = data.reduce((sum, p) => sum + (p.success_rate || 0), 0) / data.length;

  console.log('\n📈 Overall Metrics:');
  console.log(`  Average DPS Score: ${avgDPS.toFixed(2)}`);
  console.log(`  Average Success Rate: ${(avgSuccessRate * 100).toFixed(1)}%`);
  console.log(`  Pattern Types: ${data.length}`);
  console.log(`  Total Patterns: ${data.reduce((sum, p) => sum + p.frequency_count, 0)}`);

  // Verify thresholds
  console.log('\n🎯 Quality Thresholds:');
  const dpsPass = avgDPS >= 70;
  const successPass = avgSuccessRate >= 0.6;

  console.log(`  ${dpsPass ? '✅' : '❌'} Avg DPS >= 70: ${avgDPS.toFixed(2)}`);
  console.log(`  ${successPass ? '✅' : '❌'} Success Rate >= 60%: ${(avgSuccessRate * 100).toFixed(1)}%`);

  const allPass = dpsPass && successPass;
  console.log(`\n${allPass ? '✅ ALL QUALITY CHECKS PASS' : '❌ SOME QUALITY CHECKS FAILED'}\n`);

  return allPass;
}

verifyPatternQuality().catch(console.error);

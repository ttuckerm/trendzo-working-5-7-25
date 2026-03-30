/**
 * Onboard @sidehustlereview - Build Real Baseline
 */

async function main() {
  console.log('=== ONBOARDING @sidehustlereview ===\n');

  const response = await fetch('http://localhost:3000/api/creator/onboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tiktok_username: 'sidehustlereview',
      scrape_limit: 50
    })
  });

  const data = await response.json();

  if (data.success) {
    console.log('✅ Onboarding Complete!\n');
    console.log('Profile ID:', data.profile_id);
    console.log('Username:', data.tiktok_username);
    console.log('Videos Analyzed:', data.videos_analyzed);
    console.log('Baseline DPS:', data.baseline_dps);
    console.log('Average Views:', data.avg_views?.toLocaleString());
    console.log('\nDPS Percentiles:');
    console.log('  25th:', data.dps_percentiles?.p25);
    console.log('  50th:', data.dps_percentiles?.p50);
    console.log('  75th:', data.dps_percentiles?.p75);
    console.log('  90th:', data.dps_percentiles?.p90);
    console.log('\nApify Run ID:', data.apify_run_id);
  } else {
    console.error('❌ Onboarding Failed:', data.error);
  }
}

main().catch(console.error);

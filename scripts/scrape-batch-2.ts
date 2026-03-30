/**
 * One-off script: Second batch hashtag scrape to expand side-hustle cohort.
 * Calls POST /api/training/scrape-hashtags on localhost:3000.
 *
 * Usage: npx tsx scripts/scrape-batch-2.ts
 */

const ENDPOINT = 'http://127.0.0.1:3001/api/training/scrape-hashtags';

const BODY = {
  hashtags: [
    'onlinebusiness',
    'hustleculture',
    'freelancing',
    'workfromhome',
    'dropshipping',
    'affiliatemarketing',
    'extraincome',
  ],
  resultsPerPage: 500,
  niche: 'side-hustles',
  source: 'hashtag_scrape_training',
  dryRun: false,
};

async function main() {
  console.log(`Sending ${BODY.hashtags.length} hashtags × ${BODY.resultsPerPage} results each`);
  console.log(`Hashtags: ${BODY.hashtags.join(', ')}`);
  console.log(`Endpoint: ${ENDPOINT}\n`);

  const start = Date.now();

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(BODY),
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`HTTP ${res.status}: ${text}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log('--- Full Response ---');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n--- Summary ---');
  console.log(`Total scraped:    ${data.totalScraped}`);
  console.log(`New inserts:      ${data.totalInserted}`);
  console.log(`Duplicates:       ${data.totalDupes}`);
  console.log(`Errors:           ${data.totalErrors}`);
  console.log(`DPS recomputed:   ${data.dpsUpdated}`);
  console.log(`Cohort size:      ${data.cohortSize}`);
  console.log(`Elapsed:          ${elapsed}s`);

  if (data.perHashtag) {
    console.log('\n--- Per Hashtag ---');
    for (const [tag, count] of Object.entries(data.perHashtag)) {
      console.log(`  #${tag}: ${count}`);
    }
  }

  if (data.tierBreakdown && Object.keys(data.tierBreakdown).length > 0) {
    console.log('\n--- Tier Breakdown ---');
    for (const [tier, count] of Object.entries(data.tierBreakdown)) {
      console.log(`  ${tier}: ${count}`);
    }
  }
}

main().catch((err) => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
